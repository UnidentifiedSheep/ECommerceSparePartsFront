import type { SearchMatchType } from '@/services/api/search.ts'

export interface ProductSearchPreferences {
  skuModes: SearchMatchType[]
  nameModes: SearchMatchType[]
  includeHighlights: boolean
}

export const productDialogSearchPreferencesKey = 'products.search.preferences.dialog'

const matchTypes: SearchMatchType[] = ['Exact', 'StartsWith', 'Contains', 'Fuzzy']
const defaults: ProductSearchPreferences = {
  skuModes: ['Exact', 'StartsWith', 'Contains'],
  nameModes: ['Exact', 'StartsWith', 'Fuzzy'],
  includeHighlights: true,
}

function validModes(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((mode): mode is SearchMatchType => matchTypes.includes(mode as SearchMatchType)))]
}

export function loadProductSearchPreferences(key: string): ProductSearchPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<ProductSearchPreferences>
    const skuModes = validModes(stored.skuModes)
    const nameModes = validModes(stored.nameModes)
    return {
      skuModes: skuModes.length > 0 || nameModes.length > 0 ? skuModes : [...defaults.skuModes],
      nameModes: skuModes.length > 0 || nameModes.length > 0 ? nameModes : [...defaults.nameModes],
      includeHighlights: typeof stored.includeHighlights === 'boolean' ? stored.includeHighlights : defaults.includeHighlights,
    }
  } catch {
    return {
      skuModes: [...defaults.skuModes],
      nameModes: [...defaults.nameModes],
      includeHighlights: defaults.includeHighlights,
    }
  }
}

export function saveProductSearchPreferences(key: string, preferences: ProductSearchPreferences) {
  try {
    localStorage.setItem(key, JSON.stringify(preferences))
  } catch {
    // Search remains usable when browser storage is unavailable.
  }
}
