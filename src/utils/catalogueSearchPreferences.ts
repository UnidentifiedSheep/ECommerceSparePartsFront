import type { SearchMatchType, SearchTarget } from '@/services/api/search.ts'

export interface CatalogueSearchPreferences {
  targets: SearchTarget[]
  skuModes: SearchMatchType[]
  nameModes: SearchMatchType[]
  includeHighlights: boolean
}

export const catalogueSearchPreferencesKey = 'products.catalogue-search.preferences'

const targets: SearchTarget[] = ['Products', 'CatalogueCandidates']
const matchTypes: SearchMatchType[] = ['Exact', 'StartsWith', 'Contains', 'Fuzzy']
const defaults: CatalogueSearchPreferences = {
  targets: [...targets],
  skuModes: ['Exact', 'StartsWith', 'Contains'],
  nameModes: ['Exact', 'StartsWith', 'Fuzzy'],
  includeHighlights: true,
}

function validValues<T extends string>(values: unknown, allowed: T[]) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((value): value is T => allowed.includes(value as T)))]
}

export function loadCatalogueSearchPreferences(): CatalogueSearchPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(catalogueSearchPreferencesKey) ?? '{}') as Partial<CatalogueSearchPreferences>
    const storedTargets = validValues(stored.targets, targets)
    const skuModes = validValues(stored.skuModes, matchTypes)
    const nameModes = validValues(stored.nameModes, matchTypes)
    return {
      targets: storedTargets.length > 0 ? storedTargets : [...defaults.targets],
      skuModes: skuModes.length > 0 || nameModes.length > 0 ? skuModes : [...defaults.skuModes],
      nameModes: skuModes.length > 0 || nameModes.length > 0 ? nameModes : [...defaults.nameModes],
      includeHighlights: typeof stored.includeHighlights === 'boolean' ? stored.includeHighlights : defaults.includeHighlights,
    }
  } catch {
    return {
      targets: [...defaults.targets],
      skuModes: [...defaults.skuModes],
      nameModes: [...defaults.nameModes],
      includeHighlights: defaults.includeHighlights,
    }
  }
}

export function saveCatalogueSearchPreferences(preferences: CatalogueSearchPreferences) {
  try {
    localStorage.setItem(catalogueSearchPreferencesKey, JSON.stringify(preferences))
  } catch {
    // Search remains usable when browser storage is unavailable.
  }
}
