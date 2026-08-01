import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import { getBaseCurrency } from '@/services/api/currencies.ts'

export const useCurrencyStore = defineStore('currency', () => {
  const baseCurrency = ref<CurrencyModel>()
  const baseCurrencyLoading = ref(false)
  let baseCurrencyRequest: Promise<CurrencyModel | undefined> | undefined

  async function loadBaseCurrency(): Promise<CurrencyModel | undefined> {
    if (baseCurrency.value) return baseCurrency.value
    if (baseCurrencyRequest) return baseCurrencyRequest

    baseCurrencyLoading.value = true
    baseCurrencyRequest = getBaseCurrency()
      .then((response) => {
        baseCurrency.value = response.currency
        return response.currency
      })
      .catch(() => undefined)
      .finally(() => {
        baseCurrencyLoading.value = false
        baseCurrencyRequest = undefined
      })

    return baseCurrencyRequest
  }

  return {
    baseCurrency,
    baseCurrencyLoading,
    loadBaseCurrency,
  }
})
