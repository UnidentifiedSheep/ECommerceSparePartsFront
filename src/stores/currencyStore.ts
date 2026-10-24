import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import { getBaseCurrency } from '@/services/api/currencies.ts'

export const useCurrencyStore = defineStore('currency', () => {
  const baseCurrency = ref<CurrencyModel>()
  const baseCurrencyLoading = ref(false)
  let baseCurrencyRequest: Promise<CurrencyModel | undefined> | undefined

  let generation = 0

  function reset() {
    generation++
    baseCurrency.value = undefined
    baseCurrencyRequest = undefined
    baseCurrencyLoading.value = false
  }

  async function loadBaseCurrency(): Promise<CurrencyModel | undefined> {
    if (baseCurrency.value) return baseCurrency.value
    if (baseCurrencyRequest) return baseCurrencyRequest

    const currentGeneration = generation
    baseCurrencyLoading.value = true
    baseCurrencyRequest = getBaseCurrency()
      .then((response) => {
        if (currentGeneration !== generation) return undefined
        baseCurrency.value = response.currency
        return response.currency
      })
      .catch(() => undefined)
      .finally(() => {
        if (currentGeneration !== generation) return
        baseCurrencyLoading.value = false
        baseCurrencyRequest = undefined
      })

    return baseCurrencyRequest
  }

  return {
    baseCurrency,
    baseCurrencyLoading,
    loadBaseCurrency,
    reset,
  }
})
