<template>
  <div class="stock-cell" :class="stateClass">
    <span class="stock-cell__rail">
      <span class="stock-cell__fill" :style="{ width: fillWidth }" />
    </span>
    <span class="stock-cell__value">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  stock: number
}>()

const { locale, t } = useI18n()

const normalizedStock = computed(() => Math.max(Number(props.stock) || 0, 0))

const label = computed(() => {
  const value = normalizedStock.value
  return value <= 0 ? t('products.outOfStock') : value.toLocaleString(locale.value)
})

const fillWidth = computed(() => {
  const value = normalizedStock.value
  if (value <= 0) return '0%'

  const scaled = Math.round((Math.log10(value + 1) / Math.log10(51)) * 100)
  return `${Math.min(100, Math.max(18, scaled))}%`
})

const stateClass = computed(() => {
  const value = normalizedStock.value
  if (value <= 0) return 'stock-cell--empty'
  if (value <= 5) return 'stock-cell--low'
  return 'stock-cell--ok'
})
</script>

<style scoped>
.stock-cell {
  display: inline-grid;
  grid-template-columns: 46px minmax(34px, auto);
  align-items: center;
  gap: 9px;
  min-width: 96px;
}

.stock-cell__rail {
  position: relative;
  display: block;
  width: 46px;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.stock-cell__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: currentColor;
}

.stock-cell__value {
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: currentColor;
}

.stock-cell--empty {
  color: #b91c1c;
}

.stock-cell--low {
  color: #b45309;
}

.stock-cell--ok {
  color: #047857;
}
</style>
