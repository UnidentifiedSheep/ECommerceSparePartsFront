import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, shallowRef } from 'vue'
import { getProductRecommendedPrice, type PriceRecommendationModel, type PriceRecommendationRequest } from '@/services/api/priceRecommendation'
import { usePriceRecommendation } from './usePriceRecommendation'

vi.mock('@/services/api/priceRecommendation', () => ({ getProductRecommendedPrice: vi.fn() }))
const base = { productId: 42, storageCode: 'Main_Warehouse', currencyId: 1, quantity: 1, selectionKey: 0 }
const result: PriceRecommendationModel = { quantity: 1, currencyId: 1, missingQuantity: 0, unitPrice: 4650, totalPrice: 4650 }
type Context = PriceRecommendationRequest & { selectionKey?: number }
const scopes: ReturnType<typeof effectScope>[] = []
function setup(initial: Context | undefined = base) {
  const scope = effectScope()
  scopes.push(scope)
  const context = shallowRef<Context | undefined>(initial)
  return { scope, context, ...scope.run(() => usePriceRecommendation(() => context.value))! }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (value: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
beforeEach(() => { vi.useFakeTimers(); vi.mocked(getProductRecommendedPrice).mockReset() })
afterEach(() => { scopes.splice(0).forEach(scope => scope.stop()); vi.useRealTimers() })

describe('selected sale price recommendation', () => {
  it('debounces held-key selection changes and quantity edits into one request for the final context', async () => {
    vi.mocked(getProductRecommendedPrice).mockResolvedValue({ ...result, quantity: 10 })
    const state = setup()
    for (let i = 1; i <= 10; i++) {
      state.context.value = { ...base, productId: i, quantity: i }
      await vi.advanceTimersByTimeAsync(30)
    }
    expect(getProductRecommendedPrice).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(350)
    expect(getProductRecommendedPrice).toHaveBeenCalledExactlyOnceWith({ productId: 10, currencyId: 1, storageCode: 'Main_Warehouse', quantity: 10 })
    expect(state.recommendation.value?.quantity).toBe(10)
    expect(state.loading.value).toBe(false)
  })

  it('clears stale prices immediately and ignores a late response for another warehouse, currency and row', async () => {
    const old = deferred<PriceRecommendationModel>()
    const current = deferred<PriceRecommendationModel>()
    vi.mocked(getProductRecommendedPrice).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
    const state = setup()
    await vi.advanceTimersByTimeAsync(350)
    state.context.value = { ...base, currencyId: 2, storageCode: 'SECOND', selectionKey: 1 }
    expect(state.recommendation.value).toBeUndefined()
    await vi.advanceTimersByTimeAsync(350)
    current.resolve({ ...result, currencyId: 2, unitPrice: 20 })
    await vi.advanceTimersByTimeAsync(0)
    old.resolve(result)
    await vi.advanceTimersByTimeAsync(0)
    expect(state.recommendation.value).toMatchObject({ currencyId: 2, unitPrice: 20 })
  })

  it('cancels pending work on close and discards an in-flight error after closing', async () => {
    const pending = deferred<PriceRecommendationModel>()
    vi.mocked(getProductRecommendedPrice).mockReturnValue(pending.promise)
    const state = setup()
    state.context.value = undefined
    await vi.advanceTimersByTimeAsync(350)
    expect(getProductRecommendedPrice).not.toHaveBeenCalled()
    state.context.value = base
    await vi.advanceTimersByTimeAsync(350)
    state.context.value = undefined
    pending.reject(new Error('Late failure'))
    await vi.advanceTimersByTimeAsync(0)
    expect(state.error.value).toBeUndefined()
    expect(state.loading.value).toBe(false)
    expect(state.recommendation.value).toBeUndefined()
  })

  it('preserves insufficient-offer results and supports retry after a failed calculation', async () => {
    const failure = new Error('Unavailable')
    vi.mocked(getProductRecommendedPrice).mockRejectedValueOnce(failure).mockResolvedValueOnce({ ...result, missingQuantity: 1, unitPrice: null, totalPrice: null })
    const state = setup()
    await vi.advanceTimersByTimeAsync(350)
    expect(state.error.value).toBe(failure)
    const retry = state.refresh()
    expect(state.error.value).toBeUndefined()
    await vi.advanceTimersByTimeAsync(350)
    await retry
    expect(state.recommendation.value).toMatchObject({ missingQuantity: 1, unitPrice: null, totalPrice: null })
  })

  it('never fetches a pending request after component disposal', async () => {
    const state = setup()
    state.scope.stop()
    await vi.advanceTimersByTimeAsync(500)
    expect(getProductRecommendedPrice).not.toHaveBeenCalled()
  })
})
