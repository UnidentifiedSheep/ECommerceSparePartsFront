<template>
  <div ref="pickerRoot" class="product-cross-picker">
    <div class="product-cross-picker__heading">
      <el-button class="product-cross-picker__back" :icon="ArrowLeft" plain @click="emit('back')">{{ t('products.crossPicker.back') }}</el-button>
      <div class="product-cross-picker__identity">
        <strong>{{ t('products.crossPicker.title', { sku: product.sku }) }}</strong>
        <span>{{ [product.producerName, product.name].filter(Boolean).join(' · ') }}</span>
      </div>
    </div>
    <div class="product-cross-picker__summary">
      <span v-if="!isLoading && !loadError">{{ t('products.shownCount', { count: crosses.length.toLocaleString(locale) }) }}</span>
      <span>{{ t('products.multiSortHint') }}</span>
    </div>
    <DataLoadError v-if="loadError" :error="loadError" @retry="loadCrosses" />
    <el-table
      v-else
      v-loading="isLoading"
      :data="crosses"
      :row-class-name="productRowClass"
      height="min(420px, calc(100dvh - 330px))"
      :empty-text="t('products.details.noCrosses')"
      @row-click="selectedProductId = $event.id"
      @row-dblclick="selectProduct"
    >
      <el-table-column prop="sku" min-width="170">
        <template #header><SortableColumnHeader :label="t('products.sku')" field="sku" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="toggleSort" /></template>
        <template #default="{ row }"><ProductSkuCell :sku="row.sku" :indicator="row.indicator" /></template>
      </el-table-column>
      <el-table-column prop="name" min-width="250" show-overflow-tooltip>
        <template #header><SortableColumnHeader :label="t('common.labels.name')" field="name" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="toggleSort" /></template>
      </el-table-column>
      <el-table-column prop="producerName" min-width="160">
        <template #header><SortableColumnHeader :label="t('common.labels.producer')" field="producerName" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="toggleSort" /></template>
      </el-table-column>
      <el-table-column prop="stock" min-width="120" align="right">
        <template #header>
          <span v-if="storageCode">{{ t('sales.available') }} · {{ storageCode }}</span>
          <SortableColumnHeader v-else :label="t('products.stock')" field="count" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="toggleSort" />
        </template>
        <template #default="{ row }"><ProductStockCell :stock="storageCode ? row.availableStock ?? 0 : row.stock" /></template>
      </el-table-column>
      <el-table-column fixed="right" label="" width="104" align="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain :disabled="isLoading" @click.stop="selectProduct(row)" @dblclick.stop>{{ t('products.pick') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <ZeroPagination v-if="!loadError" v-model:page="page" v-model:size="size" :has-next="hasNext && !isLoading" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import SortableColumnHeader from '@/components/common/SortableColumnHeader.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import DataLoadError from '@/components/common/DataLoadError.vue'
import { nextSortValues } from '@/composables/useMultiSort'
import { getProductCrosses } from '@/services/api/products'
import { loadSelectionStock } from '@/services/productSelection'
import type { ProductSearchModel } from '@/models/productSearchModel'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'
import { useI18n } from '@/i18n'

const props = defineProps<{ product: ProductSearchModel; storageCode?: string }>()
const emit = defineEmits<{ back: []; select: [product: ProductSearchModel] }>()
const { locale, t } = useI18n()
const pickerRoot = ref<HTMLElement>()
const crosses = ref<ProductSearchModel[]>([])
const page = ref(0)
const size = ref(20)
const sortBy = ref<string[]>(['-count'])
const selectedProductId = ref<number>()
const hasNext = ref(false)
const isLoading = ref(false)
const loadError = ref<DataLoadErrorKind | null>(null)
let requestId = 0

function toggleSort(field: string, event: MouseEvent) {
  sortBy.value = nextSortValues(sortBy.value, field, event.shiftKey)
}

function productRowClass({ row }: { row: ProductSearchModel }) {
  return row.id === selectedProductId.value ? 'product-cross-picker__selected' : ''
}

function selectProduct(product: ProductSearchModel) {
  if (!isLoading.value && !loadError.value) emit('select', product)
}

async function loadCrosses() {
  const currentRequestId = ++requestId
  isLoading.value = true
  loadError.value = null
  selectedProductId.value = undefined
  try {
    const response = await getProductCrosses({
      productId: props.product.id,
      page: page.value,
      size: size.value,
      sortBy: [...sortBy.value, 'id'],
    })
    if (currentRequestId !== requestId) return
    const items = response.crosses.map(({ id, sku, name, producerId, producerName, indicator, stock }) => (
      { id, sku, name, producerId, producerName, indicator, stock }
    ))
    const stockedItems = await loadSelectionStock(items, props.storageCode)
    if (currentRequestId !== requestId) return
    crosses.value = stockedItems
    hasNext.value = crosses.value.length === size.value
  } catch (error) {
    if (currentRequestId === requestId) loadError.value = classifyDataLoadError(error)
  } finally {
    if (currentRequestId === requestId) isLoading.value = false
  }
}

watch([page, size, sortBy], ([currentPage, currentSize, currentSort], [, previousSize, previousSort]) => {
  if (currentPage !== 0 && (currentSize !== previousSize || currentSort !== previousSort)) {
    page.value = 0
    return
  }
  void loadCrosses()
})
watch(() => props.storageCode, () => { void loadCrosses() })
onMounted(() => {
  pickerRoot.value?.querySelector<HTMLButtonElement>('.product-cross-picker__back')?.focus()
  void loadCrosses()
})
onBeforeUnmount(() => { requestId += 1 })
</script>

<style scoped>
.product-cross-picker { display: grid; gap: 12px; min-width: 0; }
.product-cross-picker__heading { display: flex; align-items: center; gap: 16px; min-width: 0; }
.product-cross-picker__identity { display: grid; gap: 3px; min-width: 0; color: var(--el-text-color-primary); }
.product-cross-picker__identity strong, .product-cross-picker__identity span { overflow-wrap: anywhere; }
.product-cross-picker__identity span { color: var(--el-text-color-regular); font-size: 12px; }
.product-cross-picker__summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; color: var(--el-text-color-regular); font-size: 12px; }
:deep(.el-table__header th) { background: var(--app-surface-muted, #f7f9fa); }
:deep(.el-table__row) { cursor: pointer; }
:deep(.product-cross-picker__selected > td.el-table__cell) { background: var(--app-primary-soft); }
@media (max-width: 760px) {
  .product-cross-picker__heading { align-items: flex-start; flex-direction: column; gap: 10px; }
}
</style>
