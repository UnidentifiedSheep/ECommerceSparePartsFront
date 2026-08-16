import type { CurrencyModel } from '@/models/currencyModel.ts'

export const defaultCurrencyStorageKey = 'settings.defaultCurrencyId'

export function loadDefaultCurrencyId(): number | undefined {
  try {
    const storedValue = localStorage.getItem(defaultCurrencyStorageKey)
    if (!storedValue) return undefined

    const currencyId = Number(storedValue)
    return Number.isSafeInteger(currencyId) && currencyId > 0 ? currencyId : undefined
  } catch {
    return undefined
  }
}

export function saveDefaultCurrencyId(currencyId?: number | null) {
  try {
    if (currencyId) {
      localStorage.setItem(defaultCurrencyStorageKey, String(currencyId))
    } else {
      localStorage.removeItem(defaultCurrencyStorageKey)
    }
  } catch {
    // The application can continue with the first available currency when storage is unavailable.
  }
}

export function resolveDefaultCurrencyId(
  currencies: readonly Pick<CurrencyModel, 'id'>[],
): number | undefined {
  const configuredCurrencyId = loadDefaultCurrencyId()
  if (configuredCurrencyId && currencies.some((currency) => currency.id === configuredCurrencyId)) {
    return configuredCurrencyId
  }

  return currencies[0]?.id
}
