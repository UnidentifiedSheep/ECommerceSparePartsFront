import { describe, expect, it, vi } from 'vitest'
import { subscribeGraphql } from '@/services/graphql/subscriptions'
import { startJobUpdates } from './jobUpdates'
vi.mock('@/services/graphql/subscriptions', () => ({ subscribeGraphql: vi.fn(() => vi.fn()) }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn() } }))
vi.mock('@/services/api/api', () => ({ default: {}, clampPageSize: (x: number) => x }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
describe('GraphQL job updates', () => {
  it('uses the shared WS manager, maps the full job and releases its operation', async () => {
    vi.mocked(subscribeGraphql).mockClear()
    const callback = vi.fn(), connected = vi.fn(), unavailable = vi.fn()
    const lease = await startJobUpdates('main', callback, connected, unavailable)
    const callbacks = vi.mocked(subscribeGraphql).mock.calls[0]![2]
    callbacks.next({ onJobUpdated: { job: { id: 'j', isStep: false, stepKey: null, inputInitialized: true, multiStepJob: null, info: null, status: 'SUCCEEDED', attempts: 1, maxAttempts: 3, errorMessage: null, lockedAt: null, createdAt: '', updatedAt: '', createdBy: null } } } as never)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'j', status: 'Succeeded', job: expect.objectContaining({ inputInitialized: true }) }))
    callbacks.connected(); callbacks.disconnected()
    expect(connected).toHaveBeenCalledOnce(); expect(unavailable).toHaveBeenCalledOnce()
    const stop = vi.mocked(subscribeGraphql).mock.results[0]!.value
    await lease.stop()
    expect(stop).toHaveBeenCalledOnce()
  })
})
