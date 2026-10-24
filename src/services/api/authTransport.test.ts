import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import api from './api'
import { useAuthStore } from '@/stores/authStore'
import { SessionChangedError, type TokenPair } from '@/services/auth/types'
import { jwt, deferred, flush, setupBrowser, cleanupBrowser } from '@/services/auth/testSupport'
vi.mock('@/i18n', () => ({ getAcceptLanguage: () => 'en' }))
function ok(config: InternalAxiosRequestConfig, data = {}) { return { config, data, status: 200, statusText: 'OK', headers: {} } }
function unauthorized(config: InternalAxiosRequestConfig) { return new AxiosError('Unauthorized', undefined, config, undefined, { ...ok(config), status: 401 }) }
beforeEach(() => { setupBrowser(); useAuthStore().login(jwt(), 'first') })
afterEach(() => { delete api.defaults.headers.common.Authorization; cleanupBrowser() })
describe('REST auth transport', () => {
  it('retries parallel 401s with one shared refresh and current credentials', async () => {
    const seen: string[] = [], pending = deferred<{ data: TokenPair }>()
    const post = vi.spyOn(axios, 'post').mockReturnValue(pending.promise)
    api.defaults.adapter = async (config) => {
      seen.push(config.headers.get('Authorization') as string)
      if (useAuthStore().refreshToken === 'first') throw unauthorized(config)
      return ok(config)
    }
    const first = api.get('/main/users'), second = api.get('/main/storages')
    await flush(); expect(post).toHaveBeenCalledTimes(1)
    const newToken = jwt('user-1', Date.now() + 1800000)
    pending.resolve({ data: { token: newToken, refreshToken: 'second' } })
    await Promise.all([first, second]); expect(seen.slice(-2)).toEqual([`Bearer ${newToken}`, `Bearer ${newToken}`])
  })
  it('does not refresh or attach a bearer token to a failed login', async () => {
    const post = vi.spyOn(axios, 'post')
    api.defaults.adapter = async (config) => { expect(config.headers.has('Authorization')).toBe(false); throw unauthorized(config) }
    await expect(api.post('/main/auth/login', { login: 'test', password: 'wrong' })).rejects.toThrow()
    expect(post).not.toHaveBeenCalled(); expect(useAuthStore().isAuthenticated).toBe(true)
  })
  it('limits retries and logs out when the replacement credentials are rejected', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt(), refreshToken: 'second' } })
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => { throw unauthorized(config) }); api.defaults.adapter = adapter
    await expect(api.get('/main/users')).rejects.toThrow()
    expect(adapter).toHaveBeenCalledTimes(2); expect(post).toHaveBeenCalledTimes(1); expect(useAuthStore().isAuthenticated).toBe(false)
  })
  it('does not send a stale default Authorization header after logout', async () => {
    api.defaults.headers.common.Authorization = 'Bearer stale'
    useAuthStore().logout()
    api.defaults.adapter = async (config) => { expect(config.headers.has('Authorization')).toBe(false); return ok(config) }
    await api.get('/main/auth/usernames/test/availability')
  })
  it.each([200, 401])('discards a late %i response without retrying as the newly signed-in user', async (status) => {
    const response = deferred<AxiosResponse>(), post = vi.spyOn(axios, 'post')
    let original!: InternalAxiosRequestConfig
    api.defaults.adapter = (config) => { original = config; return response.promise }
    const request = api.get('/main/users'); const rejection = expect(request).rejects.toBeInstanceOf(SessionChangedError)
    await flush(); useAuthStore().logout(); useAuthStore().login(jwt('user-2'), 'new-user')
    if (status === 200) response.resolve(ok(original)); else response.reject(unauthorized(original))
    await rejection; expect(post).not.toHaveBeenCalled(); expect(useAuthStore().user?.id).toBe('user-2')
  })
})
