import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gql } from '@apollo/client/core'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ClientOptions } from 'graphql-ws'
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
beforeEach(() => {
  setupBrowser(); vi.useFakeTimers(); clients.length = 0
  mocks.createClient.mockReset().mockImplementation((options) => {
    const client = { options, dispose: vi.fn(), subscribe: vi.fn(() => vi.fn()) }; clients.push(client); return client
  })
  useAuthStore().login(jwt(), 'first')
})
afterEach(() => { stops.splice(0).forEach((stop) => stop()); vi.useRealTimers(); cleanupBrowser() })
describe('GraphQL subscription sessions', () => {
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
