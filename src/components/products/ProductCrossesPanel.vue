<template>
  <div class="product-data-panel">
    <div class="product-data-panel__toolbar">
      <div class="text-sm text-slate-500">{{ summary }}</div>
      <el-button v-if="canCreate" :icon="Plus" type="primary" plain @click="emit('create')">
        {{ t('products.addCrosses') }}
      </el-button>
    </div>

    <form class="product-crosses-search" @submit.prevent="emit('search')">
      <el-input v-model="query" :prefix-icon="Search" clearable maxlength="200" :placeholder="t('products.crossPicker.searchPlaceholder')" :aria-label="t('products.crossPicker.searchPlaceholder')" />
      <el-button native-type="submit" type="primary">{{ t('products.find') }}</el-button>
    </form>

    <el-table
      v-loading="loading"
      :data="crosses"
      stripe
      :empty-text="t('products.details.noCrosses')"
    >
      <el-table-column prop="sku" min-width="145">
        <template #header><SortableColumnHeader :label="t('products.sku')" field="sku" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="forwardSortToggle" /></template>
        <template #default="{ row }">
          <ProductSkuCell :sku="row.sku" :indicator="row.indicator" />
        </template>
      </el-table-column>
      <el-table-column prop="name" min-width="210" show-overflow-tooltip>
        <template #header><SortableColumnHeader :label="t('common.labels.name')" field="name" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="forwardSortToggle" /></template>
      </el-table-column>
      <el-table-column prop="producerName" min-width="130">
        <template #header><SortableColumnHeader :label="t('common.labels.producer')" field="producerName" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="forwardSortToggle" /></template>
        <template #default="{ row }">{{ row.producerName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="count" width="128" align="right">
        <template #header><SortableColumnHeader :label="t('products.stock')" field="count" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="forwardSortToggle" /></template>
        <template #default="{ row }"><ProductStockCell :stock="row.stock" /></template>
      </el-table-column>
      <el-table-column label="" width="72" align="right">
        <template #default="{ row }">
          <el-button
            :icon="View"
            size="small"
            text
            :disabled="loading"
            :aria-label="t('common.actions.open')"
            @click="emit('open', row.id)"
          />
        </template>
      </el-table-column>
    </el-table>

    <div class="product-data-panel__pagination">
      <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext && !loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Search, View } from '@element-plus/icons-vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import SortableColumnHeader from '@/components/common/SortableColumnHeader.vue'
import type { ProductModel } from '@/models/productModel.ts'
import { useI18n } from '@/i18n'

defineProps<{
  crosses: ProductModel[]
  loading: boolean
  summary: string
  hasNext: boolean
  canCreate: boolean
  sortBy: string[]
}>()

const emit = defineEmits<{
  create: []
  open: [id: number]
  search: []
  'sort-toggle': [field: string, event: MouseEvent]
}>()

const page = defineModel<number>('page', { required: true })
const size = defineModel<number>('size', { required: true })
const query = defineModel<string>('query', { required: true })
const { t } = useI18n()

function forwardSortToggle(field: string, event: MouseEvent) {
  emit('sort-toggle', field, event)
}
</script>

<style scoped>
.product-crosses-search { display: flex; gap: 8px; min-width: 0; margin-bottom: 12px; }
.product-crosses-search .el-input { min-width: 0; }
.product-data-panel__toolbar {
  display: flex;
  min-height: 52px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0 12px;
}

.product-data-panel__pagination {
  display: flex;
  justify-content: flex-start;
  padding-top: 12px;
  border-top: 1px solid rgb(226 232 240);
}

:deep(.el-table__header th) {
  background: rgb(248 250 252);
  color: rgb(71 85 105);
  font-weight: 700;
}

:deep(.stock-cell) {
  justify-content: flex-end;
}
</style>
