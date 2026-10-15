<template>
  <div class="product-criteria">
    <div class="product-criteria__toolbar">
      <span>{{ t('products.criteria.title') }}</span>
      <el-button v-if="countProductCriteria(criteria) > 0" size="small" text @click="criteria = emptyProductCriteria()">
        {{ t('products.clear') }}
      </el-button>
    </div>
    <div class="product-criteria__section">
      <strong>{{ t('products.criteria.stock') }}</strong>
      <CriteriaRangeFields v-model="criteria.stock" :label="t('products.criteria.stock')" :precision="0" hide-label />
    </div>

    <div class="product-criteria__section">
      <div class="product-criteria__heading">
        <strong>{{ t('products.criteria.weight') }}</strong>
        <el-select v-model="criteria.weight.unit" class="product-criteria__unit" :aria-label="t('products.criteria.weightUnit')">
          <el-option v-for="unit in weightUnits" :key="unit" :label="weightUnitLabel(unit)" :value="unit" />
        </el-select>
      </div>
      <CriteriaRangeFields v-model="criteria.weight" :label="t('products.criteria.weight')" hide-label />
    </div>

    <div class="product-criteria__section">
      <div class="product-criteria__heading">
        <strong>{{ t('products.criteria.dimensions') }}</strong>
        <el-select v-model="criteria.dimensions.unit" class="product-criteria__unit" :aria-label="t('products.criteria.dimensionUnit')">
          <el-option v-for="unit in dimensionUnits" :key="unit" :label="dimensionMeasureUnitLabel(unit)" :value="unit" />
        </el-select>
      </div>
      <CriteriaRangeFields v-for="field in dimensionFields" :key="field.key" v-model="criteria.dimensions[field.key]" :label="t(field.label)" />
    </div>

    <div v-if="canViewCharacteristics" class="product-criteria__section">
      <div class="product-criteria__heading">
        <strong>{{ t('products.criteria.characteristics') }}</strong>
        <el-button size="small" plain @click="addCharacteristic">{{ t('common.actions.add') }}</el-button>
      </div>
      <div v-for="(row, index) in criteria.characteristics" :key="index" class="product-criteria__characteristic">
        <CharacteristicSelector v-model="row.characteristicId" />
        <el-select v-model="row.operation" class="product-criteria__operation" :aria-label="t('products.criteria.operation')">
          <el-option value="values" :label="t('products.criteria.values')" />
          <el-option value="range" :label="t('products.criteria.numberRange')" />
          <el-option value="exists" :label="t('products.criteria.presence')" />
        </el-select>
        <el-input v-if="row.operation === 'values'" v-model="row.values" :placeholder="t('products.criteria.valuesPlaceholder')" maxlength="1024" />
        <CriteriaRangeFields v-else-if="row.operation === 'range'" :model-value="row" :label="t('products.criteria.value')" @update:model-value="Object.assign(row, $event)" />
        <el-select v-else v-model="row.exists" class="product-criteria__operation" :aria-label="t('products.criteria.presence')">
          <el-option :value="true" :label="t('products.criteria.hasValue')" />
          <el-option :value="false" :label="t('products.criteria.noValue')" />
        </el-select>
        <el-button :icon="Delete" text type="danger" :aria-label="t('common.actions.delete')" @click="criteria.characteristics.splice(index, 1)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'
import type { DimensionUnit, WeightUnit } from '@/graphql/generated/graphql.ts'
import { countProductCriteria, emptyCharacteristicCriteria, emptyProductCriteria, type ProductCriteriaDraft } from '@/models/productCriteriaModel.ts'
import { dimensionMeasureUnitLabel, weightUnitLabel } from '@/utils/measurementUnits.ts'
import CriteriaRangeFields from '@/components/products/CriteriaRangeFields.vue'
import CharacteristicSelector from '@/components/selectors/CharacteristicSelector.vue'
import { useI18n } from '@/i18n'

defineProps<{ canViewCharacteristics: boolean }>()
const criteria = defineModel<ProductCriteriaDraft>({ required: true })
const { t } = useI18n()
const weightUnits: WeightUnit[] = ['GRAM', 'KILOGRAM', 'TONNE']
const dimensionUnits: DimensionUnit[] = ['MILLIMETER', 'CENTIMETER', 'METER']
const dimensionFields = [
  { key: 'length', label: 'products.criteria.length' },
  { key: 'width', label: 'products.criteria.width' },
  { key: 'height', label: 'products.criteria.height' },
  { key: 'volume', label: 'products.criteria.volume' },
] as const

function addCharacteristic() {
  if (criteria.value.characteristics.length >= 100) return
  criteria.value.characteristics.push(emptyCharacteristicCriteria())
}
</script>

<style scoped>
.product-criteria { display: grid; border-top: 1px solid #e2e8f0; }
.product-criteria__toolbar { display: flex; min-height: 36px; align-items: center; justify-content: space-between; gap: 8px; padding-top: 6px; color: #475569; font-size: 12px; font-weight: 650; }
.product-criteria__section { display: grid; gap: 8px; min-width: 0; padding: 10px 0 12px; }
.product-criteria__section + .product-criteria__section { border-top: 1px solid #edf0f2; }
.product-criteria__section > strong, .product-criteria__heading strong { color: #475569; font-size: 12px; font-weight: 650; }
.product-criteria__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.product-criteria__unit { width: 115px; flex: 0 0 auto; }
.product-criteria__characteristic { display: flex; min-width: 0; flex-direction: column; align-items: stretch; gap: 8px; border-top: 1px solid #edf0f2; padding-top: 10px; }
.product-criteria__characteristic > .el-select-v2,
.product-criteria__characteristic > .el-input,
.product-criteria__operation { width: 100%; min-width: 0; }
.product-criteria__characteristic > .el-button:last-child { align-self: flex-end; }
</style>
