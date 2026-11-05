import { computed, onScopeDispose, ref, watch } from 'vue'
import { getProductRecommendedPrice, type PriceRecommendationModel, type PriceRecommendationRequest } from '@/services/api/priceRecommendation'
import { useSelectionDebounce } from './useSelectionDebounce'

export function usePriceRecommendation(getContext: () => (PriceRecommendationRequest & { selectionKey?: number }) | undefined) {
  const recommendation = ref<PriceRecommendationModel>()
  const loading = ref(false)
  const error = ref<unknown>()
  const context = computed(getContext)
  const debounce = useSelectionDebounce(350)
  let requestId = 0

  async function refresh() {
    const currentId = ++requestId
    const selected = context.value
    recommendation.value = undefined
    error.value = undefined
    debounce.cancel()
    loading.value = Boolean(selected)
    if (!selected || !await debounce.wait() || currentId !== requestId) return
    try {
      const result = await getProductRecommendedPrice({ productId: selected.productId, currencyId: selected.currencyId, storageCode: selected.storageCode, quantity: selected.quantity })
      if (currentId === requestId) recommendation.value = result
    } catch (cause) {
      if (currentId === requestId) error.value = cause
    } finally {
      if (currentId === requestId) loading.value = false
    }
  }

  watch(context, () => { void refresh() }, { immediate: true, flush: 'sync' })
  onScopeDispose(() => { ++requestId; debounce.cancel() })
  return { recommendation, loading, error, refresh }
}
