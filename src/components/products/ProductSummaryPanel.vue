<template>
  <section class="product-summary-panel">
    <dl class="product-summary-panel__details">
      <dt>{{ t('products.sku') }}</dt>
      <dd><ProductSkuCell :sku="product.sku" :indicator="product.indicator" /></dd>

      <template v-if="canViewEans">
        <dt>EAN</dt>
        <dd class="product-summary-panel__eans">
          <div v-for="ean in product.eans ?? []" :key="ean" class="product-summary-panel__ean-row">
            <span class="product-summary-panel__ean-code">{{ ean }}</span>
            <el-button
              v-if="canEditEans"
              :icon="Delete"
              size="small"
              text
              type="danger"
              :disabled="eanBusy"
              :aria-label="t('products.details.deleteEan', { ean })"
              @click="emit('delete-ean', ean)"
            />
          </div>
          <span v-if="!product.eans?.length && !showEanInput" class="text-slate-500">—</span>
          <form v-if="showEanInput" class="product-summary-panel__ean-form" @submit.prevent="submitEan">
            <el-input
              v-model="newEan"
              size="small"
              maxlength="14"
              :placeholder="t('products.details.eanPlaceholder')"
              :disabled="eanBusy"
              autofocus
            />
            <el-button size="small" type="primary" native-type="submit" :loading="eanBusy" :disabled="!canSubmitEan">
              {{ t('common.actions.add') }}
            </el-button>
            <el-button size="small" text :disabled="eanBusy" @click="closeEanInput">
              {{ t('common.actions.cancel') }}
            </el-button>
          </form>
          <el-button v-else-if="canEditEans" size="small" text type="primary" :disabled="eanBusy" @click="showEanInput = true">
            {{ t('products.details.addEan') }}
          </el-button>
        </dd>
      </template>

      <dt>{{ t('common.labels.producer') }}</dt>
      <dd>{{ product.producerName || '-' }}</dd>

      <dt>{{ t('products.productGroup') }}</dt>
      <dd>{{ product.group?.name || '-' }}</dd>

      <dt>{{ t('common.labels.name') }}</dt>
      <dd>{{ product.name || '-' }}</dd>

      <dt>{{ t('common.labels.description') }}</dt>
      <dd class="whitespace-pre-wrap">{{ product.description || '-' }}</dd>

      <dt>{{ t('products.details.size') }}</dt>
      <dd class="product-summary-panel__editable-value">
        <span>{{ sizeText }}</span>
        <el-button v-if="canManageSize" size="small" text type="primary" @click="emit('manage-size')">
          {{ sizeActionText }}
        </el-button>
      </dd>

      <dt>{{ t('products.details.volume') }}</dt>
      <dd>{{ volumeText }}</dd>

      <dt>{{ t('products.weight') }}</dt>
      <dd class="product-summary-panel__editable-value">
        <span>{{ weightText }}</span>
        <el-button v-if="canManageWeight" size="small" text type="primary" @click="emit('manage-weight')">
          {{ weightActionText }}
        </el-button>
      </dd>

      <dt>{{ t('products.details.indicator') }}</dt>
      <dd>
        <span
          v-if="product.indicator"
          class="product-summary-panel__indicator"
          :style="{ backgroundColor: product.indicator }"
        />
        <span v-else>-</span>
      </dd>

      <dt>{{ t('products.stock') }}</dt>
      <dd><ProductStockCell :stock="product.stock" /></dd>
    </dl>

    <div class="product-summary-panel__pair">
      <div class="product-summary-panel__pair-header">
        <span class="text-sm font-semibold text-slate-900">{{ t('products.details.pairProduct') }}</span>
        <div v-if="canEditProduct" class="flex items-center gap-1">
          <el-button size="small" plain @click="emit('select-pair')">
            {{ pair ? t('products.details.changePair') : t('products.details.setPair') }}
          </el-button>
          <el-button v-if="pair" size="small" text type="danger" @click="emit('clear-pair')">
            {{ t('common.actions.delete') }}
          </el-button>
        </div>
      </div>

      <div v-if="pair" class="product-summary-panel__pair-product">
        <ProductSkuCell :sku="pair.sku" :indicator="pair.indicator" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold text-slate-900">{{ pair.name }}</div>
          <div class="truncate text-xs text-slate-500">{{ pair.producerName || '-' }}</div>
        </div>
        <el-button
          :icon="View"
          size="small"
          text
          :aria-label="t('common.actions.open')"
          @click="emit('open-pair', pair.id)"
        />
      </div>
      <div v-else class="py-3 text-sm text-slate-500">{{ t('products.details.noPair') }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Delete, View } from '@element-plus/icons-vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import type { ProductModel, ProductSizeModel, ProductWeightModel } from '@/models/productModel.ts'
import { dimensionMeasureUnitLabel, weightMeasureUnitLabel } from '@/utils/measurementUnits.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  product: ProductModel
  pair: ProductModel | null
  productSize: ProductSizeModel | null
  productWeight: ProductWeightModel | null
  canEditProduct: boolean
  canSetSize: boolean
  canDeleteSize: boolean
  canSetWeight: boolean
  canDeleteWeight: boolean
  canViewEans: boolean
  canEditEans: boolean
  eanBusy: boolean
}>()

const emit = defineEmits<{
  'manage-size': []
  'manage-weight': []
  'select-pair': []
  'clear-pair': []
  'open-pair': [id: number]
  'add-ean': [ean: string]
  'delete-ean': [ean: string]
}>()

const { locale, t } = useI18n()
const newEan = ref('')
const showEanInput = ref(false)
const canSubmitEan = computed(() => {
  const ean = newEan.value.trim()
  return Boolean(ean) && !(props.product.eans ?? []).includes(ean) && !props.eanBusy
})

function submitEan() {
  if (!canSubmitEan.value) return
  emit('add-ean', newEan.value.trim())
}

function closeEanInput() {
  newEan.value = ''
  showEanInput.value = false
}

watch(() => props.product.eans, (eans) => {
  if (newEan.value && eans?.includes(newEan.value.trim())) closeEanInput()
})
const canManageSize = computed(() => props.canSetSize || Boolean(props.productSize && props.canDeleteSize))
const canManageWeight = computed(() => props.canSetWeight || Boolean(props.productWeight && props.canDeleteWeight))
const sizeActionText = computed(() => props.canSetSize
  ? (props.productSize ? t('products.details.change') : t('products.details.set'))
  : t('common.actions.delete'))
const weightActionText = computed(() => props.canSetWeight
  ? (props.productWeight ? t('products.details.change') : t('products.details.set'))
  : t('common.actions.delete'))

const sizeText = computed(() => {
  if (!props.productSize) return '-'
  const value = props.productSize
  return [value.length, value.width, value.height]
    .map((part) => part.toLocaleString(locale.value))
    .join(' x ') + ` ${dimensionMeasureUnitLabel(value.unit)}`
})

const volumeText = computed(() => props.productSize
  ? `${props.productSize.volumeM3.toLocaleString(locale.value)} ${t('purchases.m3')}`
  : '-')

const weightText = computed(() => props.productWeight
  ? `${props.productWeight.weight.toLocaleString(locale.value)} ${weightMeasureUnitLabel(props.productWeight.unit, props.productWeight.weight)}`
  : '-')
</script>

<style scoped>
.product-summary-panel {
  min-width: 0;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: white;
  padding: 16px;
}

.product-summary-panel__details {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px 16px;
  margin: 0;
  font-size: 14px;
}

.product-summary-panel__details dt {
  color: rgb(100 116 139);
}

.product-summary-panel__details dd {
  min-width: 0;
  margin: 0;
  color: rgb(15 23 42);
  font-weight: 500;
}

.product-summary-panel__editable-value {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.product-summary-panel__eans {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.product-summary-panel__ean-row,
.product-summary-panel__ean-form {
  display: flex;
  align-items: center;
  gap: 6px;
}

.product-summary-panel__ean-code {
  font-variant-numeric: tabular-nums;
}

.product-summary-panel__ean-form {
  flex-wrap: wrap;
  max-width: 100%;
}

.product-summary-panel__ean-form .el-input {
  width: 190px;
  max-width: 100%;
}

.product-summary-panel__indicator {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 1px solid rgb(203 213 225);
  border-radius: 4px;
}

.product-summary-panel__pair {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgb(226 232 240);
}

.product-summary-panel__pair-header,
.product-summary-panel__pair-product {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.product-summary-panel__pair-product {
  margin-top: 10px;
  padding: 10px 0 0;
}

@media (max-width: 520px) {
  .product-summary-panel__details {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .product-summary-panel__details dd {
    margin-bottom: 8px;
  }
}
</style>
