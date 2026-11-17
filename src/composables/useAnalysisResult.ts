import { computed, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { getAnalyticsRun, getAnalysisDefinition, getAbcXyzItems, getAnalysisProducts, type AnalysisRunDetails, type AnalysisConfiguration, type AnalysisItemProduct } from '@/services/api/analytics'
import { parseAbcXyzSummary, analyticsParameters, type AbcClass, type XyzFilter, type AbcXyzSummary, type AbcXyzPoint } from '@/models/abcXyz'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'

export function useAnalysisResult(runId: Ref<string | undefined>, enabled: Ref<boolean>, canReadProducts: Ref<boolean>) {
  const run = shallowRef<AnalysisRunDetails | null>(null)
  const definition = shallowRef<AnalysisConfiguration | null>(null)
  const summary = shallowRef<AbcXyzSummary | null>(null)
  const parameters = shallowRef<Record<string, unknown>>({})
  const points = ref<AbcXyzPoint[]>([])
  const products = ref<Record<number, AnalysisItemProduct>>({})
  const loading = ref(false), itemsLoading = ref(false), hasMore = ref(false), notFound = ref(false)
  const error = ref<DataLoadErrorKind | null>(null), itemsError = ref<DataLoadErrorKind | null>(null), productsError = ref(false)
  const abc = ref<AbcClass>(), xyz = ref<XyzFilter>()
  const supported = computed(() => run.value?.analysisType === 'AbcXyz' && run.value.schemaVersion === 1 && definition.value?.schemaVersion === 1)
  let generation = 0, pageGeneration = 0, disposed = false
  let controller: AbortController | undefined, pageController: AbortController | undefined
  let cursor: number | undefined
  onScopeDispose(() => { disposed = true; ++generation; ++pageGeneration; controller?.abort(); pageController?.abort() })

  async function loadProducts(signal?: AbortSignal) {
    if (!canReadProducts.value) return
    const request = pageGeneration
    const ids = points.value.filter(point => !products.value[point.productId]).map(point => point.productId)
    productsError.value = false
    try {
      const result = await getAnalysisProducts(ids, signal)
      if (disposed || request !== pageGeneration || !canReadProducts.value) return
      for (const product of result) products.value[product.id] = product
    } catch {
      if (!disposed && request === pageGeneration) productsError.value = true
    }
  }

  async function loadItems(reset = true) {
    if (disposed || !enabled.value || !run.value || !definition.value || !supported.value || (!reset && (itemsLoading.value || !hasMore.value))) return
    const request = ++pageGeneration
    pageController?.abort()
    pageController = new AbortController()
    const signal = pageController.signal
    if (reset) { points.value = []; cursor = undefined; hasMore.value = false }
    const previousCursor = cursor
    itemsError.value = null
    itemsLoading.value = true
    try {
      const result = await getAbcXyzItems(definition.value.itemsChartSystemName, { runId: run.value.id, abc: abc.value || undefined, xyz: xyz.value || undefined, cursor, size: 40 }, signal)
      if (disposed || request !== pageGeneration) return
      const ids = new Set(points.value.map(point => point.productId))
      const added = result.points.filter(point => !ids.has(point.productId))
      points.value.push(...added)
      cursor = result.nextCursor ?? undefined
      hasMore.value = result.nextCursor !== null && cursor !== previousCursor && added.length > 0
      await loadProducts(signal)
    } catch (cause) {
      if (!disposed && request === pageGeneration) itemsError.value = classifyDataLoadError(cause)
    } finally { if (!disposed && request === pageGeneration) itemsLoading.value = false }
  }

  async function loadRun() {
    const request = ++generation
    ++pageGeneration
    controller?.abort(); pageController?.abort()
    run.value = null; definition.value = null; summary.value = null; parameters.value = {}; points.value = []; products.value = {}
    abc.value = undefined; xyz.value = undefined; cursor = undefined; hasMore.value = false; notFound.value = false
    error.value = null; itemsError.value = null; productsError.value = false; loading.value = false; itemsLoading.value = false
    if (!runId.value || !enabled.value || disposed) return
    controller = new AbortController()
    const signal = controller.signal
    loading.value = true
    try {
      const result = await getAnalyticsRun(runId.value, signal)
      if (disposed || request !== generation) return
      if (!result) { notFound.value = true; return }
      run.value = result
      const config = await getAnalysisDefinition(result.analysisType, signal)
      if (disposed || request !== generation) return
      definition.value = config
      if (supported.value) {
        parameters.value = analyticsParameters(result.parameters)
        summary.value = result.summary == null ? null : parseAbcXyzSummary(result.summary)
        await loadItems()
      }
    } catch (cause) {
      if (!disposed && request === generation) error.value = classifyDataLoadError(cause)
    } finally { if (!disposed && request === generation) loading.value = false }
  }
  watch([runId, enabled], () => { void loadRun() }, { immediate: true })
  watch([abc, xyz], () => { if (!loading.value) void loadItems() })
  return { run, definition, summary, parameters, points, products, loading, itemsLoading, hasMore, notFound, error, itemsError, productsError, abc, xyz, supported, loadRun, loadItems, loadProducts }
}
