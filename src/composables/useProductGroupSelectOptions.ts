import { computed, ref, useId, watch, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { searchProductGroups } from '@/services/api/search.ts'
import { getProductGroupsByIdsGraphql } from '@/services/graphql/products.ts'
import { useSelectInfiniteScroll } from '@/composables/useSelectInfiniteScroll.ts'

const pageSize = 100

export function useProductGroupSelectOptions(selectedIds: Readonly<Ref<number[]>>) {
  const groups = ref<Array<{ id: number; name: string }>>([])
  const knownNames = ref<Record<number, string>>({})
  const loading = ref(false)
  const loadError = ref(false)
  const hasMore = ref(true)
  const nextPage = ref(0)
  const activeQuery = ref('')
  const popperClass = `product-group-select-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  let requestId = 0
  const { attach, detach } = useSelectInfiniteScroll(popperClass, loadMore)

  const options = computed(() => {
    const values = new Map<number, { value: number; label: string }>()
    selectedIds.value.forEach((id) => values.set(id, { value: id, label: knownNames.value[id] ?? `#${id}` }))
    groups.value.forEach((group) => values.set(group.id, { value: group.id, label: group.name }))
    return [...values.values()]
  })

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    const currentRequest = requestId
    const page = nextPage.value
    loading.value = true
    loadError.value = false
    try {
      const response = await searchProductGroups({ searchTerm: activeQuery.value || undefined, page, size: pageSize })
      if (currentRequest !== requestId) return
      const existingIds = new Set(groups.value.map((group) => group.id))
      groups.value = [...groups.value, ...response.filter((group) => !existingIds.has(group.id))]
      nextPage.value = page + 1
      hasMore.value = response.length === pageSize
      knownNames.value = {
        ...knownNames.value,
        ...Object.fromEntries(response.map((group) => [group.id, group.name])),
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
    if (normalizedQuery === activeQuery.value && groups.value.length > 0) return
    requestId += 1
    activeQuery.value = normalizedQuery
    groups.value = []
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
      const selected = await getProductGroupsByIdsGraphql(missing)
      knownNames.value = {
        ...knownNames.value,
        ...Object.fromEntries(selected.map((group) => [group.id, group.name])),
      }
    } catch {
      // Keep selected IDs visible if their labels cannot be loaded.
    }
  }

  function onVisibleChange(open: boolean) {
    if (open) {
      void attach()
      if (groups.value.length === 0 && !loading.value) void loadMore()
    } else {
      detach()
    }
  }

  watch(selectedIds, (ids) => { void ensureSelectedNames(ids) }, { immediate: true })
  return {
    options,
    loading: computed(() => loading.value && nextPage.value === 0),
    loadError,
    search,
    onVisibleChange,
    popperClass,
    loadMore,
    canRetry: computed(() => loadError.value && groups.value.length > 0),
  }
}
