<template>
  <div class="criteria-range">
    <span v-if="!hideLabel" class="criteria-range__label">{{ label }}</span>
    <el-input-number v-model="range.min" :controls="false" :precision="precision" :placeholder="t('products.criteria.from')" :aria-label="`${label}: ${t('products.criteria.from')}`" />
    <el-input-number v-model="range.max" :controls="false" :precision="precision" :placeholder="t('products.criteria.to')" :aria-label="`${label}: ${t('products.criteria.to')}`" />
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
.criteria-range { display: grid; min-width: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.criteria-range__label { grid-column: 1 / -1; font-size: 12px; color: #475569; }
.criteria-range .el-input-number { width: 100%; min-width: 0; }
</style>
