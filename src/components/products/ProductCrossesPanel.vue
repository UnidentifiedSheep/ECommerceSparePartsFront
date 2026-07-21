<template>
  <div class="product-data-panel">
    <div class="product-data-panel__toolbar">
      <div class="text-sm text-slate-500">{{ summary }}</div>
      <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <el-input
          v-model="search"
          clearable
          :placeholder="t('products.details.crossSearchPlaceholder')"
          class="min-w-64 flex-1 sm:w-80"
        />
        <el-button v-if="canCreate" :icon="Plus" type="primary" plain @click="emit('create')">
          {{ t('products.addCrosses') }}
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="crosses"
      stripe
      :empty-text="t('products.details.noCrosses')"
      @sort-change="emit('sort-change', $event)"
    >
      <el-table-column prop="sku" :label="t('products.sku')" min-width="145" sortable="custom">
        <template #default="{ row }">
          <ProductSkuCell :sku="row.sku" :indicator="row.indicator" />
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="t('common.labels.name')" min-width="210" show-overflow-tooltip sortable="custom" />
      <el-table-column prop="producerName" :label="t('common.labels.producer')" min-width="130" sortable="custom">
        <template #default="{ row }">{{ row.producerName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="count" :label="t('products.stock')" width="128" align="right" sortable="custom">
        <template #default="{ row }"><ProductStockCell :stock="row.stock" /></template>
      </el-table-column>
      <el-table-column label="" width="72" align="right">
        <template #default="{ row }">
          <el-button
            :icon="View"
            size="small"
            text
            :aria-label="t('common.actions.open')"
            @click="emit('open', row.id)"
          />
        </template>
      </el-table-column>
    </el-table>

    <div class="product-data-panel__pagination">
      <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, View } from '@element-plus/icons-vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import type { ProductModel } from '@/models/productModel.ts'
import { useI18n } from '@/i18n'

defineProps<{
  crosses: ProductModel[]
  loading: boolean
  summary: string
  hasNext: boolean
  canCreate: boolean
}>()

const emit = defineEmits<{
  create: []
  open: [id: number]
  'sort-change': [event: { prop?: string; order?: 'ascending' | 'descending' | null }]
}>()

const search = defineModel<string>('search', { required: true })
const page = defineModel<number>('page', { required: true })
const size = defineModel<number>('size', { required: true })
const { t } = useI18n()
</script>

<style scoped>
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
