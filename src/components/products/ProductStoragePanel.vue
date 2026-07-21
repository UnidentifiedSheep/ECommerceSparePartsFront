<template>
  <div class="product-data-panel">
    <div class="product-data-panel__toolbar">
      <div class="text-sm text-slate-500">{{ summary }}</div>
      <div class="flex items-center gap-2">
        <el-switch
          v-model="showZero"
          :active-text="t('products.details.zero')"
          :inactive-text="t('products.details.stocks')"
          inline-prompt
        />
        <el-button v-if="canCreate" :icon="Plus" type="primary" plain @click="emit('create')">
          {{ t('common.actions.add') }}
        </el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="contents" stripe :empty-text="t('products.details.noStocks')">
      <el-table-column prop="storageName" :label="t('common.labels.storage')" min-width="180" show-overflow-tooltip />
      <el-table-column prop="count" :label="t('common.labels.count')" width="140" align="right">
        <template #default="{ row }"><ProductStockCell :stock="row.count" /></template>
      </el-table-column>
      <el-table-column :label="t('products.details.purchase')" width="140" align="right">
        <template #default="{ row }">{{ formatMoney(row.buyPrice, row.currency?.currencySign) }}</template>
      </el-table-column>
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

    <div class="product-data-panel__pagination">
      <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" :sizes="[10, 20, 50]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import { useI18n } from '@/i18n'

defineProps<{
  contents: StorageContentModel[]
  loading: boolean
  summary: string
  hasNext: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  create: []
  edit: [item: StorageContentModel]
  delete: [item: StorageContentModel]
}>()

const page = defineModel<number>('page', { required: true })
const size = defineModel<number>('size', { required: true })
const showZero = defineModel<boolean>('showZero', { required: true })
const { locale, t } = useI18n()

function formatMoney(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}
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
