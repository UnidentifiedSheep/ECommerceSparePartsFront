import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { jwt, flush, setupBrowser, cleanupBrowser } from '@/services/auth/testSupport'
const mocks = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), on: vi.fn(), onclose: vi.fn(), onreconnected: vi.fn(), options: {} as { accessTokenFactory: () => Promise<string> } }))
vi.mock('@microsoft/signalr', () => ({
  LogLevel: { Warning: 1 },
  HubConnectionBuilder: class {
    withUrl(_: string, options: typeof mocks.options) { mocks.options = options; return this }
    withAutomaticReconnect() { return this }
    configureLogging() { return this }
    build() { return { start: mocks.start, stop: mocks.stop, on: mocks.on, onclose: mocks.onclose, onreconnected: mocks.onreconnected } }
  },
}))
vi.mock('@/i18n', () => ({ getAcceptLanguage: () => 'en' }))
import { startJobHub } from './jobHub'
const stops: Array<() => Promise<void>> = []
beforeEach(() => {
  setupBrowser(); vi.useFakeTimers()
  mocks.start.mockReset().mockImplementation(async () => { await mocks.options.accessTokenFactory() })
  mocks.stop.mockReset().mockResolvedValue(undefined); mocks.on.mockReset(); mocks.onclose.mockReset(); mocks.onreconnected.mockReset()
  useAuthStore().login(jwt(), 'first')
})
afterEach(async () => { await Promise.all(stops.splice(0).map((stop) => stop())); vi.useRealTimers(); cleanupBrowser() })
describe('SignalR session lifecycle', () => {
  it('renews expired credentials before connecting and restarts after a later token update', async () => {
    const auth = useAuthStore(); auth.login(jwt('user-1', Date.now() - 1000), 'expired')
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt(), refreshToken: 'renewed' } })
    const connection = await startJobHub('main', vi.fn()); stops.push(() => connection.stop())
    expect(post).toHaveBeenCalledOnce()
    auth.refresh(auth.getSession()!, { token: jwt('user-1', Date.now() + 1800000), refreshToken: 'next' })
    await flush(); expect(mocks.stop).toHaveBeenCalledOnce(); expect(mocks.start).toHaveBeenCalledTimes(2)
  })
  it('retries a rejected handshake once using the shared refresh coordinator', async () => {
    mocks.start.mockRejectedValueOnce({ statusCode: 401 }).mockResolvedValueOnce(undefined)
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt(), refreshToken: 'second' } })
    const connection = await startJobHub('main', vi.fn()); stops.push(() => connection.stop())
    expect(post).toHaveBeenCalledOnce(); expect(mocks.start).toHaveBeenCalledTimes(2)
  })
  it('disposes the connection, token watcher, and timers on logout', async () => {
    const connection = await startJobHub('main', vi.fn()); stops.push(() => connection.stop())
    useAuthStore().logout(); await flush()
    expect(mocks.stop).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0)
    useAuthStore().login(jwt('user-2'), 'new-user'); await flush()
    expect(mocks.start).toHaveBeenCalledOnce()
  })
  it('keeps the session after a transient handshake error', async () => {
    mocks.start.mockRejectedValueOnce(new Error('offline'))
    await expect(startJobHub('main', vi.fn())).rejects.toThrow('offline')
    expect(useAuthStore().isAuthenticated).toBe(true); expect(vi.getTimerCount()).toBe(0)
  })
})
