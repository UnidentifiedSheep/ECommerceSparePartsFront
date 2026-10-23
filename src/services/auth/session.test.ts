import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosError } from 'axios'
import { useAuthStore, authStorageKey } from '@/stores/authStore'
import { refreshAuthSession, getValidSession } from './session'
import { SessionChangedError, type TokenPair } from './types'
import { jwt, deferred, flush, setupBrowser, cleanupBrowser } from './testSupport'
vi.mock('@/i18n', () => ({ getAcceptLanguage: () => 'en' }))
beforeEach(setupBrowser)
afterEach(() => { vi.useRealTimers(); cleanupBrowser() })
function signedIn() { const store = useAuthStore(); store.login(jwt(), 'refresh-1'); return store }
function failure(status?: number, title = 'ServerError') {
  return new AxiosError('refresh failed', undefined, undefined, undefined, status ? { status, statusText: '', headers: {}, config: {} as never, data: { title, status, detail: 'refresh rejected' } } : undefined)
}
describe('refresh coordinator', () => {
  it('shares the entire refresh lifecycle and persists before releasing the tab lock', async () => {
    const store = signedIn(), original = store.getSession()!, network = deferred<{ data: TokenPair }>()
    const post = vi.spyOn(axios, 'post').mockReturnValue(network.promise)
    vi.mocked(navigator.locks.request).mockImplementation((async (_: string, callback: () => Promise<unknown>) => {
      const result = await callback()
      expect(JSON.parse(localStorage.getItem(authStorageKey)!).refreshToken).toBe('refresh-2')
      return result
    }) as typeof navigator.locks.request)
    const first = refreshAuthSession(original), second = refreshAuthSession(original)
    await flush(); expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0]![1]).toEqual({ refreshToken: 'refresh-1' })
    network.resolve({ data: { token: original.token, refreshToken: 'refresh-2' } })
    expect((await first).refreshToken).toBe('refresh-2'); expect(await second).toEqual(await first)
    // Identical JWTs are valid; the rotated refresh token still proves a completed refresh.
    expect((await refreshAuthSession(original)).refreshToken).toBe('refresh-2')
    expect(post).toHaveBeenCalledTimes(1)
  })
  it('rechecks storage after waiting for another tab', async () => {
    const store = signedIn(), original = store.getSession()!
    const post = vi.spyOn(axios, 'post')
    vi.mocked(navigator.locks.request).mockImplementation((async (_: string, callback: () => Promise<unknown>) => {
      localStorage.setItem(authStorageKey, JSON.stringify({ ...original, refreshToken: 'other-tab' }))
      return await callback()
    }) as typeof navigator.locks.request)
    expect((await refreshAuthSession(original)).refreshToken).toBe('other-tab')
    expect(post).not.toHaveBeenCalled()
  })
  it.each(['logout', 'login'])('ignores a successful response after %s', async (action) => {
    const store = signedIn(), original = store.getSession()!, network = deferred<{ data: TokenPair }>()
    vi.spyOn(axios, 'post').mockReturnValue(network.promise)
    const result = refreshAuthSession(original); const rejection = expect(result).rejects.toBeInstanceOf(SessionChangedError)
    await flush(); store.logout(); if (action === 'login') store.login(jwt('user-2'), 'new-login')
    network.resolve({ data: { token: jwt(), refreshToken: 'late-response' } }); await rejection
    expect(store.refreshToken).toBe(action === 'login' ? 'new-login' : null)
  })
  it.each([undefined, 500, 503, 400])('preserves the session on a temporary or unrelated error (%s)', async (status) => {
    const store = signedIn(), original = store.getSession()!
    const post = vi.spyOn(axios, 'post').mockRejectedValueOnce(failure(status))
    await expect(refreshAuthSession(original)).rejects.toThrow()
    expect(store.getSession()).toEqual(original)
    post.mockResolvedValueOnce({ data: { token: jwt(), refreshToken: 'retry' } })
    expect((await refreshAuthSession(original)).refreshToken).toBe('retry')
  })
  it('ends the session for the exact backend invalid-token problem (400)', async () => {
    const store = signedIn(), original = store.getSession()!
    vi.spyOn(axios, 'post').mockRejectedValue(failure(400, 'InvalidTokenException'))
    await expect(refreshAuthSession(original)).rejects.toThrow('refresh rejected')
    expect(store.getSession()).toBeNull()
  })
  it('adopts a winning tab after a race without Web Locks', async () => {
    vi.useFakeTimers(); vi.stubGlobal('navigator', {})
    const store = signedIn(), original = store.getSession()!
    vi.spyOn(axios, 'post').mockRejectedValue(failure(400, 'InvalidTokenException'))
    const result = refreshAuthSession(original); await flush()
    localStorage.setItem(authStorageKey, JSON.stringify({ ...original, refreshToken: 'winner' }))
    window.dispatchEvent(Object.assign(new Event('storage'), { key: authStorageKey }))
    await flush()
    expect((await result).refreshToken).toBe('winner'); expect(store.isAuthenticated).toBe(true)
  })
  it('refreshes an expired JWT before opening a realtime connection', async () => {
    const store = useAuthStore(); store.login(jwt('user-1', Date.now() - 1000), 'expired')
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt(), refreshToken: 'renewed' } })
    expect((await getValidSession()).refreshToken).toBe('renewed'); expect(post).toHaveBeenCalledTimes(1)
  })
})
