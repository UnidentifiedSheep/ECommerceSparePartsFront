import { computed, onMounted, ref, useId, watch, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { getProducersByIds } from '@/services/api/producers.ts'
import { searchProducers } from '@/services/api/search.ts'
import { useSelectInfiniteScroll } from '@/composables/useSelectInfiniteScroll.ts'

const pageSize = 100

export function useProducerSelectOptions(selectedIds: Readonly<Ref<number[]>>) {
  const producers = ref<Array<{ id: number; name: string }>>([])
  const knownNames = ref<Record<number, string>>({})
  const loading = ref(false)
  const loadError = ref(false)
  const hasMore = ref(true)
  const nextPage = ref(0)
  const activeQuery = ref('')
  const popperClass = `producer-select-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  let requestId = 0
  const { attach, detach } = useSelectInfiniteScroll(popperClass, loadMore)

  const options = computed(() => {
    const values = new Map<number, { value: number; label: string }>()
    selectedIds.value.forEach((id) => values.set(id, { value: id, label: knownNames.value[id] ?? `#${id}` }))
    producers.value.forEach((producer) => values.set(producer.id, { value: producer.id, label: producer.name }))
    return [...values.values()]
  })

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    const currentRequest = requestId
    const page = nextPage.value
    loading.value = true
    loadError.value = false
    try {
      const response = await searchProducers({
        query: activeQuery.value || undefined,
        page,
        size: pageSize,
      })
      if (currentRequest !== requestId) return
      const existingIds = new Set(producers.value.map((producer) => producer.id))
      producers.value = [
        ...producers.value,
        ...response.producers.filter((producer) => !existingIds.has(producer.id)),
      ]
      nextPage.value = page + 1
      hasMore.value = response.producers.length === pageSize
      knownNames.value = {
        ...knownNames.value,
        ...Object.fromEntries(response.producers.map((producer) => [producer.id, producer.name])),
      }
    } catch {
      if (currentRequest === requestId) loadError.value = true
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  const debouncedLoad = useDebounceFn(() => loadMore(), 250)

  function search(query: string) {
    const normalizedQuery = query.trim()
    if (normalizedQuery === activeQuery.value && producers.value.length > 0) return
    requestId += 1
    activeQuery.value = normalizedQuery
    producers.value = []
    nextPage.value = 0
    hasMore.value = true
    loading.value = false
    loadError.value = false
    void debouncedLoad()
  }

  async function ensureSelectedNames(ids: number[]) {
    const missing = ids.filter((id) => !knownNames.value[id])
    if (missing.length === 0) return
    try {
      const selected = await getProducersByIds(missing)
      knownNames.value = {
        ...knownNames.value,
        ...Object.fromEntries(selected.map((producer) => [producer.id, producer.name])),
      }
    } catch {
      // Keep selected IDs visible even when their labels cannot be loaded.
    }
  }

  function onVisibleChange(open: boolean) {
    if (open) {
      void attach()
      if (producers.value.length === 0 && !loading.value) void loadMore()
    } else {
      detach()
    }
  }

  watch(selectedIds, (ids) => { void ensureSelectedNames(ids) }, { immediate: true })
  onMounted(() => { void loadMore() })

  return {
    options,
    loading: computed(() => loading.value && nextPage.value === 0),
    loadError,
    search,
    onVisibleChange,
    popperClass,
    loadMore,
    canRetry: computed(() => loadError.value && producers.value.length > 0),
  }
}
