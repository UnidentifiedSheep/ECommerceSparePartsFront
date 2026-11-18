import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { useAnalysisResult } from './useAnalysisResult'
import { getAnalyticsRun, getAnalysisDefinition, getAbcXyzItems } from '@/services/api/analytics'
vi.mock('@/services/api/analytics', () => ({ getAnalyticsRun: vi.fn(), getAnalysisDefinition: vi.fn(), getAbcXyzItems: vi.fn() }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
const point = { productId: 1, rank: 1, value: 10, share: 1, cumulativeShare: 1, abc: 'A' as const, xyz: null, quantity: 1, revenue: 10, coefficientOfVariation: null, periodsCount: 1 }
const summary = { productsCount: 1, periodsCount: 1, totalValue: 10, cells: [{ abc: 'A', productsCount: 1, value: 10 }] }
const run = (id: string) => ({ id, analysisType: 'AbcXyz', schemaVersion: 1, createdAt: '2026-11-17T00:00:00Z', periodStart: null, periodEnd: null, itemsCount: 1, isPinned: false, jobId: null, parameters: {}, summary })
let scope: EffectScope
function setup(enabled = true) {
  const id = ref<string | undefined>('run-1'), active = ref(enabled), products = ref(true)
  scope = effectScope()
  return { ...scope.run(() => useAnalysisResult(id, active, products))!, id, active, canReadProducts: products }
}
async function flush() { for (let i = 0; i < 20; i++) await nextTick() }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getAnalyticsRun).mockImplementation(async id => run(id))
  vi.mocked(getAnalysisDefinition).mockResolvedValue({ systemName: 'AbcXyz', name: 'ABC/XYZ', description: '', lrtSystemName: 'AbcXyzCalculationLrt', itemsChartSystemName: 'Items', schemaVersion: 1, parametersSchema: { version: 1, fields: [] }, summarySchema: { version: 1, fields: [] }, segmentsSchema: { version: 1, fields: [] }, dataSchema: { version: 1, fields: [] } })
  vi.mocked(getAbcXyzItems).mockResolvedValue({ points: [point], products: [{ id: 1, sku: 'SKU', name: 'Product', producer: { name: 'MAN' } }], nextCursor: 1, referencesUnavailable: false })
})
afterEach(() => scope.stop())
describe('selected analytics result', () => {
  it('loads only when open and uses product names from the same result', async () => {
    const state = setup(false)
    await flush()
    expect(getAnalyticsRun).not.toHaveBeenCalled()
    state.active.value = true
    await flush()
    expect(getAnalyticsRun).toHaveBeenCalledTimes(1)
    expect(getAbcXyzItems).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getAbcXyzItems).mock.calls[0]?.[3]).toBe(true)
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
  it('keeps rows without references and retries a failed page with the same cursor', async () => {
    vi.mocked(getAbcXyzItems).mockResolvedValueOnce({ points: [point], products: [], nextCursor: 1, referencesUnavailable: true })
    const state = setup()
    await flush()
    expect(state.points.value).toHaveLength(1)
    expect(state.productsError.value).toBe(true)
    vi.mocked(getAbcXyzItems).mockRejectedValueOnce(new Error('page request failed'))
    await state.loadItems(false)
    expect(state.points.value).toHaveLength(1)
    expect(state.itemsError.value).toBe('failed')
    vi.mocked(getAbcXyzItems).mockResolvedValueOnce({ points: [{ ...point, productId: 2, rank: 2 }], products: [], nextCursor: null, referencesUnavailable: false })
    await state.loadItems(false)
    expect(vi.mocked(getAbcXyzItems).mock.calls[2]?.[1].cursor).toBe(1)
    expect(state.points.value).toHaveLength(2)
  })
  it('does not request or show product names without permission', async () => {
    const state = setup(false)
    state.canReadProducts.value = false
    state.active.value = true
    await flush()
    expect(vi.mocked(getAbcXyzItems).mock.calls[0]?.[3]).toBe(false)
    expect(state.products.value).toEqual({})
    expect(state.points.value).toHaveLength(1)
  })
  it('keeps the old v1 matrix available with a v2 analysis definition', async () => {
    vi.mocked(getAnalysisDefinition).mockResolvedValue({ ...(await getAnalysisDefinition('AbcXyz'))!, schemaVersion: 2 })
    const state = setup()
    await flush()
    expect(state.supported.value).toBe(true)
    expect(state.points.value).toHaveLength(1)
    expect(vi.mocked(getAbcXyzItems).mock.calls[0]?.[1]).not.toHaveProperty('pattern')
  })
  it('loads v2 and sends demand pattern filters, resetting the rank cursor', async () => {
    vi.mocked(getAnalyticsRun).mockImplementation(async id => ({ ...run(id), schemaVersion: 2 }))
    vi.mocked(getAnalysisDefinition).mockResolvedValue({ ...(await getAnalysisDefinition('AbcXyz'))!, schemaVersion: 2 })
    const state = setup()
    await flush()
    expect(state.supported.value).toBe(true)
    state.pattern.value = 'Unclassified'
    await flush()
    expect(vi.mocked(getAbcXyzItems).mock.calls[1]?.[1]).toMatchObject({ pattern: 'Unclassified', cursor: undefined })
    state.pattern.value = 'Lumpy'
    await flush()
    expect(vi.mocked(getAbcXyzItems).mock.calls[2]?.[1]).toMatchObject({ pattern: 'Lumpy', cursor: undefined })
  })
  it('leaves unknown versions for the generic schema viewer', async () => {
    vi.mocked(getAnalyticsRun).mockImplementation(async id => ({ ...run(id), schemaVersion: 3 }))
    const state = setup()
    await flush()
    expect(state.supported.value).toBe(false)
    expect(getAbcXyzItems).not.toHaveBeenCalled()
  })
})
