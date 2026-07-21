import { ref } from 'vue'

const PRODUCT_SEARCH_HISTORY_KEY = 'products.searchHistory.v1'
const searchHistory = ref<string[]>([])
let initialized = false

function loadSearchHistory() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  try {
    const stored = JSON.parse(window.localStorage.getItem(PRODUCT_SEARCH_HISTORY_KEY) ?? '[]')
    searchHistory.value = Array.isArray(stored)
      ? stored.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).slice(0, 10)
      : []
  } catch {
    searchHistory.value = []
  }
}

export function useProductSearchHistory() {
  loadSearchHistory()

  function rememberSearch(query: string, locale: string) {
    const value = query.trim()
    if (!value) return

    searchHistory.value = [
      value,
      ...searchHistory.value.filter((item) => (
        item.toLocaleLowerCase(locale) !== value.toLocaleLowerCase(locale)
      )),
    ].slice(0, 10)

    try {
      window.localStorage.setItem(PRODUCT_SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
    } catch {
      // Keep the shared in-memory history when browser storage is unavailable.
    }
  }

  return {
    searchHistory,
    rememberSearch,
  }
}
