<template>
  <span class="sale-price">
    <span v-if="hasDiscount" class="sale-price__original"><span class="sr-only">{{ t('common.labels.price') }}: </span><del>{{ money(originalPrice) }}</del></span>
    <strong class="sale-price__final"><span class="sr-only">{{ t('sales.priceWithDiscount') }}: </span>{{ money(discountedPrice) }}</strong>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'
const props = defineProps<{ originalPrice: number; discountedPrice: number; currencySign?: string }>()
const { t, locale } = useI18n()
const hasDiscount = computed(() => Number.isFinite(props.originalPrice) && props.originalPrice > props.discountedPrice)
function money(value: number) {
  return `${value.toLocaleString(locale.value, { maximumFractionDigits: 2 })} ${props.currencySign ?? ''}`.trim()
}
</script>

<style scoped>
.sale-price { display: inline-flex; flex-wrap: wrap; align-items: baseline; justify-content: flex-end; gap: 3px 8px; max-width: 100%; }
.sale-price__original { color: var(--app-text-muted, #64748b); font-size: .85em; white-space: nowrap; }
.sale-price__final { color: var(--app-text, #0f172a); font-weight: 700; white-space: nowrap; }
</style>
