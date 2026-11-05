import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gql } from '@apollo/client/core'
import { effectScope } from 'vue'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ClientOptions, Sink } from 'graphql-ws'
import type { ExecutionResult } from 'graphql'
import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { jwt, deferred, flush, setupBrowser, cleanupBrowser } from '@/services/auth/testSupport'
import type { TokenPair } from '@/services/auth/types'
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('graphql-ws', () => ({ createClient: mocks.createClient }))
vi.mock('./client', () => ({ graphqlUrl: 'http://localhost:8080/graphql' }))
vi.mock('@/i18n', () => ({ getAcceptLanguage: () => 'en', t: (key: string) => key }))
import { subscribeGraphql } from './subscriptions'
const document = gql`subscription SessionTest { changed }` as TypedDocumentNode<{ changed: boolean }, Record<string, never>>
const clients: Array<{ options: ClientOptions; dispose: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> }> = []
const stops: Array<() => void> = []
function start() {
  const callbacks = { next: vi.fn(), error: vi.fn(), connected: vi.fn(), disconnected: vi.fn() }
  stops.push(subscribeGraphql(document, {}, callbacks)); return callbacks
}
const sink = (operation = 0, client = 0) => clients[client]!.subscribe.mock.calls[operation]![1] as Sink<ExecutionResult<{ changed: boolean }>>
const connected = (client = 0) => clients[client]!.options.on!.connected!(null, undefined, false)
beforeEach(() => {
  setupBrowser(); vi.useFakeTimers(); clients.length = 0
  mocks.createClient.mockReset().mockImplementation((options) => {
    const client = { options, dispose: vi.fn(), subscribe: vi.fn(() => vi.fn()) }; clients.push(client); return client
  })
  useAuthStore().login(jwt(), 'first')
})
afterEach(() => { stops.splice(0).forEach((stop) => stop()); vi.useRealTimers(); cleanupBrowser() })
describe('GraphQL subscription sessions', () => {
  it('multiplexes subscriptions through one client and routes data to the matching operation only', () => {
    const one = start(); const two = start(); const three = start()
    expect(clients).toHaveLength(1)
    expect(clients[0]!.subscribe).toHaveBeenCalledTimes(3)
    connected()
    expect(one.connected).toHaveBeenCalledOnce(); expect(two.connected).toHaveBeenCalledOnce(); expect(three.connected).toHaveBeenCalledOnce()
    sink(1).next({ data: { changed: true } })
    expect(two.next).toHaveBeenCalledWith({ changed: true })
    expect(one.next).not.toHaveBeenCalled(); expect(three.next).not.toHaveBeenCalled()
    const late = start()
    expect(clients).toHaveLength(1)
    expect(late.connected).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(1)
  })

  it('unsubscribes one operation without closing the socket or notifying other subscribers', () => {
    const one = start(); const two = start()
    connected()
    const stopTwo = stops.pop()!
    stopTwo(); stopTwo()
    expect(clients[0]!.subscribe.mock.results[1]!.value).toHaveBeenCalledOnce()
    expect(clients[0]!.dispose).not.toHaveBeenCalled()
    expect(one.disconnected).not.toHaveBeenCalled()
    sink(1).next({ data: { changed: true } })
    sink(0).next({ data: { changed: true } })
    expect(two.next).not.toHaveBeenCalled(); expect(one.next).toHaveBeenCalledOnce()
    stops.pop()!()
    expect(clients[0]!.dispose).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('isolates a terminal operation error from unrelated subscriptions', () => {
    const one = start(); const two = start()
    connected()
    sink(1).error([{ message: 'No permission', extensions: { code: 'FORBIDDEN' } }])
    expect(two.error).toHaveBeenCalledOnce(); expect(two.disconnected).toHaveBeenCalledOnce()
    expect(one.error).not.toHaveBeenCalled(); expect(one.disconnected).not.toHaveBeenCalled()
    expect(clients[0]!.dispose).not.toHaveBeenCalled()
    sink(0).next({ data: { changed: true } })
    expect(one.next).toHaveBeenCalledOnce()
  })

  it('completes only the operation that the server finished', () => {
    const one = start(); const two = start()
    connected()
    sink(1).complete()
    expect(two.disconnected).toHaveBeenCalledOnce()
    expect(one.disconnected).not.toHaveBeenCalled()
    expect(clients[0]!.dispose).not.toHaveBeenCalled()
    sink(0).next({ data: { changed: true } })
    expect(one.next).toHaveBeenCalledOnce()
  })

  it('refreshes once for all operations and resubscribes only the operations still active', async () => {
    const pending = deferred<{ data: TokenPair }>()
    const post = vi.spyOn(axios, 'post').mockReturnValue(pending.promise)
    const one = start(); const two = start(); const three = start()
    connected()
    clients[0]!.options.on!.closed!({ code: 4403 })
    sink(1).error([{ message: 'Expired', extensions: { code: 'UNAUTHENTICATED' } }])
    await flush()
    stops.pop()!()
    pending.resolve({ data: { token: jwt('user-1', Date.now() + 1800000), refreshToken: 'second' } })
    await flush()
    expect(post).toHaveBeenCalledOnce(); expect(clients).toHaveLength(2)
    expect(clients[1]!.subscribe).toHaveBeenCalledTimes(2)
    connected(1)
    expect(one.connected).toHaveBeenCalledTimes(2); expect(two.connected).toHaveBeenCalledTimes(2)
    expect(three.connected).toHaveBeenCalledOnce()
    sink(0, 0).next({ data: { changed: true } })
    expect(one.next).not.toHaveBeenCalled()
  })

  it('uses one renewal timer for every subscription on the session socket', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt('user-1', Date.now() + 1800000), refreshToken: 'second' } })
    start(); start(); start(); connected()
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(895001)
    await flush()
    expect(post).toHaveBeenCalledOnce(); expect(clients).toHaveLength(2)
    expect(clients[1]!.subscribe).toHaveBeenCalledTimes(3)
  })

  it('renews all operations once when another request rotates the session token', () => {
    const one = start(); start(); connected()
    const auth = useAuthStore()
    const token = jwt('user-1', Date.now() + 1800000)
    auth.refresh(auth.getSession()!, { token, refreshToken: 'external' })
    expect(clients).toHaveLength(2)
    expect(clients[1]!.subscribe).toHaveBeenCalledTimes(2)
    expect(clients[1]!.options.connectionParams).toBeTypeOf('function')
    expect((clients[1]!.options.connectionParams as () => unknown)()).toMatchObject({ authorization: `Bearer ${token}` })
    sink(0).next({ data: { changed: true } })
    expect(one.next).not.toHaveBeenCalled()
  })

  it('keeps a single replacement client if a disconnect callback starts another subscription', () => {
    const callbacks = start(); connected()
    callbacks.disconnected.mockImplementationOnce(() => start())
    const auth = useAuthStore()
    auth.refresh(auth.getSession()!, { token: jwt('user-1', Date.now() + 1800000), refreshToken: 'rotated' })
    expect(clients).toHaveLength(2)
    expect(clients[1]!.subscribe).toHaveBeenCalledTimes(2)
  })

  it('keeps token renewal alive after the component that first created the shared client unmounts', () => {
    const component = effectScope()
    component.run(() => start())
    start()
    component.stop()
    stops.shift()!()
    const auth = useAuthStore()
    auth.refresh(auth.getSession()!, { token: jwt('user-1', Date.now() + 1800000), refreshToken: 'rotated' })
    expect(clients).toHaveLength(2)
    expect(clients[1]!.subscribe).toHaveBeenCalledOnce()
  })

  it('does not reopen a socket after the last subscriber leaves during refresh', async () => {
    const pending = deferred<{ data: TokenPair }>()
    vi.spyOn(axios, 'post').mockReturnValue(pending.promise)
    start(); start()
    clients[0]!.options.on!.closed!({ code: 4403 }); await flush()
    stops.splice(0).forEach(stop => stop())
    pending.resolve({ data: { token: jwt(), refreshToken: 'late' } }); await flush()
    expect(clients).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('creates a fresh connection for a new login without transferring old operations', () => {
    const old = start(); start(); connected()
    useAuthStore().logout()
    useAuthStore().login(jwt('user-2'), 'new-user')
    const fresh = start()
    expect(clients).toHaveLength(2)
    expect(clients[1]!.subscribe).toHaveBeenCalledOnce()
    sink(0).next({ data: { changed: true } }); sink(0, 1).next({ data: { changed: true } })
    expect(old.next).not.toHaveBeenCalled(); expect(fresh.next).toHaveBeenCalledOnce()
  })

  it('does not leave a renewal timer when a connected callback signs out', () => {
    const callbacks = start()
    callbacks.connected.mockImplementation(() => useAuthStore().logout())
    connected()
    expect(clients[0]!.dispose).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not schedule recovery after an error callback removes the last operation', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new AxiosError('offline'))
    useAuthStore().login(jwt('user-1', Date.now() - 1000), 'first')
    const callbacks = start()
    callbacks.error.mockImplementation(() => stops.pop()!())
    await flush()
    expect(clients).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reconnects with the refreshed credentials after an authentication rejection', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { token: jwt(), refreshToken: 'second' } })
    start(); clients[0]!.options.on!.closed!({ code: 4403 })
    await flush()
    expect(post).toHaveBeenCalledTimes(1); expect(clients).toHaveLength(2)
    expect(clients[0]!.dispose).toHaveBeenCalledOnce()
    expect(useAuthStore().refreshToken).toBe('second')
  })
  it('retries a transient refresh failure without ending the session', async () => {
    const post = vi.spyOn(axios, 'post').mockRejectedValueOnce(new AxiosError('offline'))
      .mockResolvedValueOnce({ data: { token: jwt(), refreshToken: 'second' } })
    // Expired tokens trigger refresh before opening a socket, including on retry.
    useAuthStore().login(jwt('user-1', Date.now() - 1000), 'first')
    const callbacks = start(); await flush()
    expect(callbacks.error).toHaveBeenCalledOnce(); expect(useAuthStore().isAuthenticated).toBe(true)
    await vi.advanceTimersByTimeAsync(1000); await flush()
    expect(post).toHaveBeenCalledTimes(2); expect(clients).toHaveLength(1)
  })
  it('does not resurrect a socket when an old refresh finishes after a new login', async () => {
    const pending = deferred<{ data: TokenPair }>()
    vi.spyOn(axios, 'post').mockReturnValue(pending.promise)
    start(); clients[0]!.options.on!.closed!({ code: 4403 }); await flush()
    useAuthStore().logout(); useAuthStore().login(jwt('user-2'), 'new-user')
    expect(clients).toHaveLength(1)
    pending.resolve({ data: { token: jwt(), refreshToken: 'late' } }); await flush()
    expect(clients).toHaveLength(1); expect(useAuthStore().user?.id).toBe('user-2')
  })
  it('stops on logout and removes renewal/recovery timers on disposal', async () => {
    start(); useAuthStore().logout()
    expect(clients[0]!.dispose).toHaveBeenCalledOnce()
    stops.pop()!(); expect(vi.getTimerCount()).toBe(0)
  })
})
