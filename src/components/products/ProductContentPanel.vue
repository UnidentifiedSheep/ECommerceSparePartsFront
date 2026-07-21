<template>
  <div class="product-data-panel">
    <div class="product-data-panel__toolbar">
      <div class="text-sm text-slate-500">{{ summary }}</div>
      <el-button v-if="canCreate" :icon="Plus" type="primary" plain @click="emit('create')">
        {{ t('common.actions.add') }}
      </el-button>
    </div>

    <el-table v-loading="loading" :data="content" :empty-text="t('products.details.noContent')">
      <el-table-column :label="t('common.labels.product')" min-width="260">
        <template #default="{ row }">
          <div class="flex min-w-0 items-center gap-3">
            <ProductSkuCell :sku="row.product.sku" :indicator="row.product.indicator" />
            <div class="min-w-0">
              <div class="truncate font-semibold text-slate-900">{{ row.product.name }}</div>
              <div class="truncate text-xs text-slate-500">{{ row.product.producerName || '-' }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="quantity" :label="t('common.labels.count')" width="120" align="right" />
      <el-table-column v-if="canEdit || canDelete" label="" width="96" align="right">
        <template #default="{ row }">
          <div class="flex justify-end gap-1">
            <el-button
              v-if="canEdit"
              :icon="Edit"
              size="small"
              text
              :aria-label="t('common.actions.edit')"
              @click="emit('edit', row)"
            />
            <el-button
              v-if="canDelete"
              :icon="Delete"
              size="small"
              text
              type="danger"
              :aria-label="t('common.actions.delete')"
              @click="emit('delete', row)"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import type { ProductContentModel } from '@/models/productModel.ts'
import { useI18n } from '@/i18n'

defineProps<{
  content: ProductContentModel[]
  loading: boolean
  summary: string
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  create: []
  edit: [item: ProductContentModel]
  delete: [item: ProductContentModel]
}>()

const { t } = useI18n()
</script>

<style scoped>
.product-data-panel__toolbar {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0 12px;
}

:deep(.el-table__header th) {
  background: rgb(248 250 252);
  color: rgb(71 85 105);
  font-weight: 700;
}
</style>
