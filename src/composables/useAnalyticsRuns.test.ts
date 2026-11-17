import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref, type EffectScope } from 'vue'
import { getAnalyticsRuns, type AnalyticsRun, type AnalyticsRunsFilters } from '@/services/api/analytics'
import { useAnalyticsRuns } from './useAnalyticsRuns'

vi.mock('@/services/api/analytics', () => ({ getAnalyticsRuns: vi.fn() }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
const request = vi.mocked(getAnalyticsRuns)
const row = (id: number): AnalyticsRun => ({ id: `run-${id}`, createdAt: '2026-11-17T00:00:00Z', analysisType: 'AbcXyz', schemaVersion: 1, periodStart: null, periodEnd: null, itemsCount: 10, isPinned: false })
let scope: EffectScope
const setup = () => {
  const enabled = ref(true)
  const filters = ref<AnalyticsRunsFilters>({})
  scope = effectScope()
  return { ...scope.run(() => useAnalyticsRuns(() => filters.value, enabled))!, filters, enabled }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
beforeEach(() => { request.mockReset() })
afterEach(() => { scope.stop() })

describe('analytics run cursor list', () => {
  it('uses the last ID and createdAt cursor, blocks duplicate loads and deduplicates overlapping pages', async () => {
    const list = setup()
    request.mockResolvedValueOnce(Array.from({ length: 20 }, (_, index) => row(index)))
    await list.load()
    const next = deferred<AnalyticsRun[]>()
    request.mockReturnValueOnce(next.promise)
    const loading = list.load(false)
    await list.load(false)
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1]?.[1]).toEqual({ id: 'run-19', createdAt: row(19).createdAt })
    next.resolve([row(19), row(20)])
    await loading
    expect(list.runs.value).toHaveLength(21)
    expect(list.hasMore.value).toBe(false)
    await list.load(false)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('aborts old filters and ignores their late responses after resetting the cursor', async () => {
    const list = setup()
    const old = deferred<AnalyticsRun[]>()
    request.mockReturnValueOnce(old.promise).mockResolvedValueOnce([row(2)])
    const pending = list.load()
    list.filters.value = { isPinned: true }
    await list.load()
    expect(request.mock.calls[0]?.[3]?.aborted).toBe(true)
    expect(request.mock.calls[1]?.slice(0, 3)).toEqual([{ isPinned: true }, null, 20])
    old.resolve([row(1)])
    await pending
    expect(list.runs.value.map(run => run.id)).toEqual(['run-2'])
  })

  it('preserves existing rows and retries the same cursor after a page error', async () => {
    const list = setup()
    request.mockResolvedValueOnce(Array.from({ length: 20 }, (_, index) => row(index)))
    await list.load()
    request.mockRejectedValueOnce(new Error('network error'))
    await list.load(false)
    expect(list.runs.value).toHaveLength(20)
    expect(list.error.value).toBe('failed')
    request.mockResolvedValueOnce([row(20)])
    await list.retry()
    expect(request.mock.calls[2]?.[1]).toEqual(request.mock.calls[1]?.[1])
    expect(list.runs.value).toHaveLength(21)
  })

  it('stops after repeated pages, skips unauthorized requests and ignores results after disposal', async () => {
    const list = setup()
    const page = Array.from({ length: 20 }, (_, index) => row(index))
    request.mockResolvedValue(page)
    await list.load()
    await list.load(false)
    expect(list.hasMore.value).toBe(false)
    list.enabled.value = false
    await list.load()
    expect(list.runs.value).toEqual([])
    expect(request).toHaveBeenCalledTimes(2)
    list.enabled.value = true
    const pending = deferred<AnalyticsRun[]>()
    request.mockReturnValueOnce(pending.promise)
    const loading = list.load()
    scope.stop()
    expect(request.mock.calls[2]?.[3]?.aborted).toBe(true)
    pending.resolve([row(99)])
    await loading
    expect(list.runs.value).toEqual([])
  })
})
