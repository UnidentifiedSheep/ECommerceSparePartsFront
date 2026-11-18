import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { useAnalysisResult } from './useAnalysisResult'
import { getAnalyticsRun, getAnalysisDefinition, getAbcXyzItems, getAnalysisProducts } from '@/services/api/analytics'
vi.mock('@/services/api/analytics', () => ({ getAnalyticsRun: vi.fn(), getAnalysisDefinition: vi.fn(), getAbcXyzItems: vi.fn(), getAnalysisProducts: vi.fn() }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
const point = { productId: 1, rank: 1, value: 10, share: 1, cumulativeShare: 1, abc: 'A' as const, xyz: null, quantity: 1, revenue: 10, coefficientOfVariation: null, periodsCount: 1 }
const summary = { productsCount: 1, periodsCount: 1, totalValue: 10, cells: [{ abc: 'A', productsCount: 1, value: 10 }] }
const run = (id: string) => ({ id, analysisType: 'AbcXyz', schemaVersion: 1, createdAt: '2026-11-17T00:00:00Z', periodStart: null, periodEnd: null, itemsCount: 1, isPinned: false, jobId: null, parameters: {}, summary })
let scope: EffectScope
function setup(enabled = true) {
  const id = ref<string | undefined>('run-1'), active = ref(enabled), products = ref(true)
  scope = effectScope()
  return { ...scope.run(() => useAnalysisResult(id, active, products))!, id, active }
}
async function flush() { for (let i = 0; i < 20; i++) await nextTick() }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getAnalyticsRun).mockImplementation(async id => run(id))
  vi.mocked(getAnalysisDefinition).mockResolvedValue({ systemName: 'AbcXyz', name: 'ABC/XYZ', description: '', lrtSystemName: 'AbcXyzCalculationLrt', itemsChartSystemName: 'Items', schemaVersion: 1, parametersSchema: { version: 1, fields: [] }, summarySchema: { version: 1, fields: [] }, segmentsSchema: { version: 1, fields: [] }, dataSchema: { version: 1, fields: [] } })
  vi.mocked(getAbcXyzItems).mockResolvedValue({ points: [point], nextCursor: 1 })
  vi.mocked(getAnalysisProducts).mockResolvedValue([{ id: 1, sku: 'SKU', name: 'Product', producer: { name: 'MAN' } }])
})
afterEach(() => scope.stop())
describe('selected analytics result', () => {
  it('loads only when open and fetches product names in a batch after the selected run', async () => {
    const state = setup(false)
    await flush()
    expect(getAnalyticsRun).not.toHaveBeenCalled()
    state.active.value = true
    await flush()
    expect(getAnalyticsRun).toHaveBeenCalledTimes(1)
    expect(getAnalysisProducts).toHaveBeenCalledWith([1], expect.any(AbortSignal))
    expect(state.products.value[1]?.sku).toBe('SKU')
    state.active.value = false
    await flush()
    expect(state.points.value).toEqual([])
  })
  it('uses Unclassified and resets the cursor when the matrix filter changes', async () => {
    const state = setup()
    await flush()
    state.abc.value = 'B'; state.xyz.value = 'Unclassified'
    await flush()
    expect(vi.mocked(getAbcXyzItems).mock.calls[1]?.[1]).toMatchObject({ abc: 'B', xyz: 'Unclassified', cursor: undefined })
    state.abc.value = undefined; state.xyz.value = undefined
    await flush()
    expect(vi.mocked(getAbcXyzItems).mock.calls[2]?.[1]).toMatchObject({ abc: undefined, xyz: undefined, cursor: undefined })
  })
  it('ignores old run responses after selecting a different run', async () => {
    let resolve!: (value: ReturnType<typeof run>) => void
    vi.mocked(getAnalyticsRun).mockReturnValueOnce(new Promise(done => { resolve = done }))
    const state = setup()
    await flush()
    state.id.value = 'run-2'
    await flush()
    resolve(run('run-1'))
    await flush()
    expect(state.run.value?.id).toBe('run-2')
    expect(getAbcXyzItems).toHaveBeenCalledTimes(1)
  })
  it('keeps analytics rows when product loading fails and retries a failed page with the same cursor', async () => {
    vi.mocked(getAnalysisProducts).mockRejectedValue(new Error('product request failed'))
    const state = setup()
    await flush()
    expect(state.points.value).toHaveLength(1)
    expect(state.productsError.value).toBe(true)
    vi.mocked(getAbcXyzItems).mockRejectedValueOnce(new Error('page request failed'))
    await state.loadItems(false)
    expect(state.points.value).toHaveLength(1)
    expect(state.itemsError.value).toBe('failed')
    vi.mocked(getAbcXyzItems).mockResolvedValueOnce({ points: [{ ...point, productId: 2, rank: 2 }], nextCursor: null })
    await state.loadItems(false)
    expect(vi.mocked(getAbcXyzItems).mock.calls[2]?.[1].cursor).toBe(1)
    expect(state.points.value).toHaveLength(2)
  })
})
