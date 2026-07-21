<template>
  <div class="product-data-panel">
    <div class="product-data-panel__toolbar">
      <div class="text-sm text-slate-500">{{ summary }}</div>
      <el-button v-if="canCreate" :icon="Plus" type="primary" plain @click="emit('create')">
        {{ t('common.actions.add') }}
      </el-button>
    </div>

    <el-table v-loading="loading" :data="characteristics" :empty-text="t('products.details.noCharacteristics')">
      <el-table-column prop="name" :label="t('common.labels.name')" min-width="180" show-overflow-tooltip />
      <el-table-column prop="value" :label="t('common.labels.value')" min-width="260" show-overflow-tooltip />
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
import type { ProductCharacteristicModel } from '@/models/productModel.ts'
import { useI18n } from '@/i18n'

defineProps<{
  characteristics: ProductCharacteristicModel[]
  loading: boolean
  summary: string
  hasNext: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  create: []
  edit: [item: ProductCharacteristicModel]
  delete: [item: ProductCharacteristicModel]
}>()

const page = defineModel<number>('page', { required: true })
const size = defineModel<number>('size', { required: true })
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
</style>
