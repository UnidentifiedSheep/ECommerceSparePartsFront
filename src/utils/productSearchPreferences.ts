import type { SkuSearchMode } from '@/services/api/search.ts'

export type ProductSearchMode = 'all' | 'sku'

export interface ProductSearchPreferences {
  searchMode: ProductSearchMode
  skuSearchMode: SkuSearchMode
}

export const productPageSearchPreferencesKey = 'products.search.preferences.page'
export const productDialogSearchPreferencesKey = 'products.search.preferences.dialog'

const skuSearchModes: SkuSearchMode[] = ['Full', 'Exact', 'StartsWith', 'Contains', 'Fuzzy']
const defaultPreferences: ProductSearchPreferences = {
  searchMode: 'all',
  skuSearchMode: 'Full',
}

export function loadProductSearchPreferences(key: string): ProductSearchPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<ProductSearchPreferences>
    return {
      searchMode: stored.searchMode === 'sku' ? 'sku' : 'all',
      skuSearchMode: skuSearchModes.includes(stored.skuSearchMode as SkuSearchMode)
        ? stored.skuSearchMode as SkuSearchMode
        : 'Full',
    }
  } catch {
    return { ...defaultPreferences }
  }
}

export function saveProductSearchPreferences(key: string, preferences: ProductSearchPreferences) {
  try {
    localStorage.setItem(key, JSON.stringify(preferences))
  } catch {
    // Search remains usable when browser storage is unavailable.
  }
}
