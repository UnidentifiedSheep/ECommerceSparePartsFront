import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { searchProducers } from '@/services/api/search.ts'
import { getProducersByIds } from '@/services/api/producers.ts'
import { useProducerSelectOptions } from './useProducerSelectOptions.ts'

vi.mock('vue', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue')>(),
  onMounted: vi.fn(),
  useId: () => 'test-producer-selector',
}))
vi.mock('@/services/api/search.ts', () => ({ searchProducers: vi.fn() }))
vi.mock('@/services/api/producers.ts', () => ({ getProducersByIds: vi.fn() }))
vi.mock('@/composables/useSelectInfiniteScroll.ts', () => ({
  useSelectInfiniteScroll: () => ({ attach: vi.fn(), detach: vi.fn() }),
}))

const scopes: EffectScope[] = []
function setup() {
  const ids = ref<number[]>([])
  const scope = effectScope()
  scopes.push(scope)
  return { ids, ...scope.run(() => useProducerSelectOptions(ids))! }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(searchProducers).mockReset().mockResolvedValue({ producers: [] })
  vi.mocked(getProducersByIds).mockReset().mockResolvedValue([])
})
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('producer creation eligibility', () => {
  it('waits for the debounced search result before offering creation', async () => {
    const selector = setup()
    selector.search(' New producer ')
    expect(selector.query.value).toBe('New producer')
    expect(selector.canCreateForQuery.value).toBe(false)
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.canCreateForQuery.value).toBe(true)
  })

  it('keeps similar options visible but suppresses an existing name regardless of case', async () => {
    vi.mocked(searchProducers).mockResolvedValueOnce({ producers: [{ id: 1, name: 'ACME Parts' }] })
    const selector = setup()
    selector.search('acme')
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.canCreateForQuery.value).toBe(true)
    expect(selector.options.value).toContainEqual({ value: 1, label: 'ACME Parts' })
    vi.mocked(searchProducers).mockResolvedValueOnce({ producers: [{ id: 2, name: ' ACME ' }] })
    selector.search('ACME')
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.canCreateForQuery.value).toBe(false)
  })

  it('does not mistake failed or incomplete searches for a missing producer', async () => {
    const selector = setup()
    vi.mocked(searchProducers).mockRejectedValueOnce(new Error('offline'))
    selector.search('Missing producer')
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.canCreateForQuery.value).toBe(false)
    vi.mocked(searchProducers).mockResolvedValueOnce({
      producers: Array.from({ length: 100 }, (_, index) => ({ id: index + 1, name: `Similar ${index}` })),
    })
    await selector.loadMore()
    expect(selector.canCreateForQuery.value).toBe(false)
    await selector.loadMore()
    expect(selector.canCreateForQuery.value).toBe(true)
  })

  it('ignores a stale response when the query changes', async () => {
    let resolveOld!: (value: { producers: Array<{ id: number; name: string }> }) => void
    vi.mocked(searchProducers).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
    const selector = setup()
    selector.search('Old query')
    vi.advanceTimersByTime(250)
    selector.search('New query')
    await vi.advanceTimersByTimeAsync(250)
    resolveOld({ producers: [{ id: 1, name: 'New query' }] })
    await Promise.resolve()
    await nextTick()
    expect(selector.query.value).toBe('New query')
    expect(selector.options.value).toEqual([])
    expect(selector.canCreateForQuery.value).toBe(true)
  })

  it('selects the created producer using its returned name without waiting for search indexing', async () => {
    const selector = setup()
    selector.search('New producer')
    await vi.advanceTimersByTimeAsync(250)
    selector.rememberProducer({ id: 7, name: 'New producer' })
    selector.ids.value = [7]
    await nextTick()
    expect(selector.options.value).toContainEqual({ value: 7, label: 'New producer' })
    expect(getProducersByIds).not.toHaveBeenCalled()
    expect(selector.canCreateForQuery.value).toBe(false)
  })

  it.each(['', 'A', 'A'.repeat(65)])('does not offer creation for an invalid name: %s', async (query) => {
    const selector = setup()
    selector.search(query)
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.canCreateForQuery.value).toBe(false)
  })
})

describe('producer automatic selection', () => {
  it('selects a sole search result after the debounce, excluding a pinned previous selection', async () => {
    const selector = setup()
    selector.ids.value = [99]
    selector.rememberProducer({ id: 99, name: 'Previous' })
    vi.mocked(searchProducers).mockResolvedValueOnce({ producers: [{ id: 1, name: 'ACME Parts' }] })
    selector.search('ACM')
    expect(selector.autoSelectId.value).toBeUndefined()
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.autoSelectId.value).toBe(1)
    expect(selector.options.value).toContainEqual({ value: 99, label: 'Previous' })
  })
  it('prefers a unique exact name ignoring surrounding spaces and case', async () => {
    const selector = setup()
    vi.mocked(searchProducers).mockResolvedValueOnce({ producers: [{ id: 1, name: 'ACME Parts' }, { id: 2, name: ' ACME ' }] })
    selector.search(' acme ')
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.autoSelectId.value).toBe(2)
  })
  it('does not auto-select on initial load, ambiguous results or failed search', async () => {
    const selector = setup()
    vi.mocked(searchProducers).mockResolvedValueOnce({ producers: [{ id: 1, name: 'Only' }] })
    await selector.loadMore()
    expect(selector.autoSelectId.value).toBeUndefined()
    vi.mocked(searchProducers).mockResolvedValueOnce({ producers: [{ id: 1, name: 'ACME One' }, { id: 2, name: 'ACME Two' }] })
    selector.search('acme')
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.autoSelectId.value).toBeUndefined()
    vi.mocked(searchProducers).mockRejectedValueOnce(new Error('offline'))
    selector.search('other')
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.autoSelectId.value).toBeUndefined()
  })
  it('keeps duplicate exact names ambiguous instead of selecting an arbitrary id', async () => {
    const selector = setup()
    vi.mocked(searchProducers).mockResolvedValueOnce({ producers: [{ id: 1, name: 'ACME' }, { id: 2, name: 'acme' }] })
    selector.search('ACME')
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.autoSelectId.value).toBeUndefined()
  })
  it('ignores a stale sole result when a newer search is pending', async () => {
    let resolve!: (value: { producers: Array<{ id: number; name: string }> }) => void
    const selector = setup()
    vi.mocked(searchProducers).mockImplementationOnce(() => new Promise(done => { resolve = done }))
    selector.search('old')
    await vi.advanceTimersByTimeAsync(250)
    selector.search('new')
    resolve({ producers: [{ id: 1, name: 'old' }] })
    await nextTick()
    expect(selector.autoSelectId.value).toBeUndefined()
    await vi.advanceTimersByTimeAsync(250)
    expect(selector.autoSelectId.value).toBeUndefined()
  })
})
