<template>
  <div class="criteria-range">
    <span v-if="!hideLabel" class="criteria-range__label">{{ label }}</span>
    <el-input-number v-model="range.min" size="small" :controls="false" :precision="precision" :placeholder="t('products.criteria.from')" :aria-label="`${label}: ${t('products.criteria.from')}`" />
    <span class="criteria-range__separator" aria-hidden="true">—</span>
    <el-input-number v-model="range.max" size="small" :controls="false" :precision="precision" :placeholder="t('products.criteria.to')" :aria-label="`${label}: ${t('products.criteria.to')}`" />
  </div>
</template>

<script setup lang="ts">
import type { CriteriaRangeDraft } from '@/models/productCriteriaModel.ts'
import { useI18n } from '@/i18n'

defineProps<{ label: string; precision?: number; hideLabel?: boolean }>()
const range = defineModel<CriteriaRangeDraft>({ required: true })
const { t } = useI18n()
</script>

<style scoped>
.criteria-range { display: grid; min-width: 0; grid-template-columns: minmax(0, 1fr) 8px minmax(0, 1fr); align-items: center; gap: 6px; }
.criteria-range__label { grid-column: 1 / -1; color: #475569; font-size: 12px; font-weight: 600; }
.criteria-range__separator { color: #94a3b8; font-size: 12px; text-align: center; }
.criteria-range .el-input-number { width: 100%; min-width: 0; }
</style>
