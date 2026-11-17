import { onScopeDispose, ref, type Ref } from 'vue'
import { getAnalyticsRuns, type AnalyticsRun, type AnalyticsRunCursor, type AnalyticsRunsFilters } from '@/services/api/analytics'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'

export function useAnalyticsRuns(filters: () => AnalyticsRunsFilters, enabled: Ref<boolean>) {
  const runs = ref<AnalyticsRun[]>([])
  const loading = ref(false)
  const hasMore = ref(false)
  const error = ref<DataLoadErrorKind | null>(null)
  const retryReset = ref(true)
  let cursor: AnalyticsRunCursor | null = null
  let generation = 0
  let disposed = false
  let controller: AbortController | undefined
  const size = 20

  onScopeDispose(() => { disposed = true; ++generation; controller?.abort() })

  async function load(reset = true) {
    if (disposed || (!reset && (loading.value || !hasMore.value))) return
    const request = ++generation
    controller?.abort()
    if (reset) { runs.value = []; cursor = null; hasMore.value = false }
    error.value = null
    loading.value = false
    if (!enabled.value) return
    loading.value = true
    controller = new AbortController()
    try {
      const result = await getAnalyticsRuns({ ...filters() }, cursor, size, controller.signal)
      if (disposed || request !== generation) return
      const ids = new Set(runs.value.map(run => run.id))
      const added = result.filter(run => !ids.has(run.id))
      runs.value = [...runs.value, ...added]
      const last = result[result.length - 1]
      if (last) cursor = { id: last.id, createdAt: last.createdAt }
      hasMore.value = result.length === size && added.length > 0
    } catch (cause) {
      if (disposed || request !== generation) return
      error.value = classifyDataLoadError(cause)
      retryReset.value = reset
    } finally { if (!disposed && request === generation) loading.value = false }
  }

  return { runs, loading, hasMore, error, load, retry: () => load(retryReset.value) }
}
