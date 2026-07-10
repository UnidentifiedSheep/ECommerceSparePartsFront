import { ref } from 'vue'
import type { StorageModel } from '@/models/storageModel.ts'
import { getStorages } from '@/services/api/storages.ts'

interface StorageEntityOptionsConfig {
  pageSize?: number
  onError?: (error: unknown) => void
}

export function useStorageEntityOptions(config: StorageEntityOptionsConfig = {}) {
  const storages = ref<StorageModel[]>([])
  const storageQuery = ref('')
  const storagePage = ref(0)
  const storagesHaveMore = ref(true)
  const isStoragesLoading = ref(false)
  const pageSize = config.pageSize ?? 50
  let requestVersion = 0

  async function loadStorages(query = storageQuery.value, reset = true) {
    if (!reset && (isStoragesLoading.value || !storagesHaveMore.value)) return

    if (reset) {
      requestVersion += 1
      storageQuery.value = query
      storagePage.value = 0
      storagesHaveMore.value = true
      storages.value = []
    }

    const version = requestVersion
    isStoragesLoading.value = true
    try {
      const response = await getStorages({
        page: storagePage.value,
        limit: pageSize,
        searchTerm: storageQuery.value.trim() || undefined,
      })
      if (version !== requestVersion) return

      const existingNames = new Set(storages.value.map((storage) => storage.name))
      storages.value.push(...response.storages.filter((storage) => !existingNames.has(storage.name)))
      storagesHaveMore.value = response.storages.length === pageSize
      storagePage.value += 1
    } catch (error) {
      if (version === requestVersion) config.onError?.(error)
    } finally {
      if (version === requestVersion) isStoragesLoading.value = false
    }
  }

  async function loadStoragesIfNeeded() {
    if (storages.value.length > 0 || isStoragesLoading.value) return
    await loadStorages('', true)
  }

  function searchStorages(query: string) {
    void loadStorages(query, true)
  }

  async function loadMoreStorages() {
    await loadStorages(storageQuery.value, false)
  }

  return {
    storages,
    isStoragesLoading,
    loadStoragesIfNeeded,
    searchStorages,
    loadMoreStorages,
  }
}
