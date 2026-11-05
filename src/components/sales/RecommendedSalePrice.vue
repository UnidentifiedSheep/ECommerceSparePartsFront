<template>
  <section class="recommended-price" :aria-label="t('sales.recommendation.title')" :aria-busy="loading">
    <div class="recommended-price__label">{{ t('sales.recommendation.title') }}</div>
    <div v-if="loading" class="recommended-price__message" role="status">{{ t('sales.recommendation.loading') }}</div>
    <div v-else-if="error" class="recommended-price__error" role="status">
      <span>{{ error instanceof ApiError ? error.message : t('sales.recommendation.loadError') }}</span>
      <el-button size="small" text @click="refresh">{{ t('common.actions.refresh') }}</el-button>
    </div>
    <div v-else-if="!context" class="recommended-price__message">{{ t('sales.recommendation.selectContext') }}</div>
    <template v-else-if="recommendation">
      <template v-if="hasPrice">
        <div class="recommended-price__row">
          <div class="recommended-price__value"><strong>{{ money(recommendation.unitPrice!) }}</strong><span>{{ t('sales.recommendation.perUnit') }}</span></div>
          <el-button size="small" type="primary" :disabled="disabled" @click="apply">{{ t('sales.recommendation.apply') }}</el-button>
        </div>
        <div class="recommended-price__message">{{ t('sales.recommendation.total', { count: recommendation.quantity.toLocaleString(locale), total: money(recommendation.totalPrice!) }) }}</div>
        <div v-if="applied && selectedPrice === recommendation.unitPrice" class="recommended-price__note" role="status">{{ t('sales.history.priceApplied') }}</div>
        <div v-else class="recommended-price__note">{{ t('sales.recommendation.basedOnOffers') }}</div>
      </template>
      <div v-else class="recommended-price__message" role="status">{{ recommendation.missingQuantity > 0 ? t('sales.recommendation.insufficient', { count: recommendation.missingQuantity.toLocaleString(locale) }) : t('sales.recommendation.unavailable') }}</div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/i18n'
import { ApiError } from '@/models/errorModel'
import { usePriceRecommendation } from '@/composables/usePriceRecommendation'
import type { AppliedPriceRecommendation } from '@/services/api/priceRecommendation'

const props = defineProps<{
  active: boolean
  productId: number
  storageCode?: string
  currencyId?: number
  currencySign?: string
  quantity?: number
  selectedPrice?: number
  selectionKey?: number
  disabled?: boolean
}>()
const emit = defineEmits<{ apply: [value: AppliedPriceRecommendation] }>()
const { t, locale } = useI18n()
const applied = ref(false)
const context = computed(() => props.active && props.productId > 0 && props.currencyId && props.storageCode?.trim()
  && Number.isSafeInteger(props.quantity) && props.quantity! > 0
  ? { productId: props.productId, currencyId: props.currencyId, storageCode: props.storageCode, quantity: props.quantity!, selectionKey: props.selectionKey }
  : undefined)
const { recommendation, loading, error, refresh } = usePriceRecommendation(() => context.value)
const hasPrice = computed(() => recommendation.value?.unitPrice != null && recommendation.value.totalPrice != null
  && Number.isFinite(recommendation.value.unitPrice) && recommendation.value.unitPrice >= 0
  && Number.isFinite(recommendation.value.totalPrice) && recommendation.value.missingQuantity === 0
  && recommendation.value.currencyId === context.value?.currencyId && recommendation.value.quantity === context.value?.quantity)
watch([context, recommendation], () => { applied.value = false }, { flush: 'sync' })

function money(value: number) {
  return `${value.toLocaleString(locale.value, { maximumFractionDigits: 2 })} ${props.currencySign ?? ''}`.trim()
}

function apply() {
  if (!context.value || !hasPrice.value || props.disabled || loading.value) return
  emit('apply', { ...context.value, unitPrice: recommendation.value!.unitPrice! })
  applied.value = true
}

defineExpose({ refresh })
</script>

<style scoped>
.recommended-price { flex: 0 0 auto; margin: 0 16px 12px; padding: 12px; border-radius: 4px; background: var(--app-primary-soft); }
.recommended-price__label { color: var(--app-text-muted); font-size: 12px; font-weight: 600; }
.recommended-price__row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin: 6px 0; }
.recommended-price__value { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; }
.recommended-price__value strong { color: var(--app-primary); font-size: 24px; font-variant-numeric: tabular-nums; line-height: 1.2; }
.recommended-price__value span, .recommended-price__message, .recommended-price__note { color: var(--app-text-muted); font-size: 12px; }
.recommended-price__message, .recommended-price__error { margin-top: 6px; overflow-wrap: anywhere; }
.recommended-price__note { border-top: 1px solid var(--app-border); padding-top: 8px; margin-top: 8px; }
.recommended-price__error { color: var(--el-color-danger); font-size: 12px; }
</style>
