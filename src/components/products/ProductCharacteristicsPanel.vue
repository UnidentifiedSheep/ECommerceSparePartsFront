<template>
  <div class="product-characteristics-panel">
    <div class="product-characteristics-panel__header">
      <h2>{{ t('products.details.characteristics') }}</h2>
      <el-button v-if="canCreate" size="small" text type="primary" @click="emit('create')">
        {{ t('common.actions.add') }}
      </el-button>
    </div>

    <dl v-if="characteristics.length" class="product-characteristics-panel__list">
      <div v-for="item in characteristics" :key="item.characteristicId" class="product-characteristics-panel__row">
        <dt>{{ item.name }}</dt>
        <dd>{{ item.value }}</dd>
        <div v-if="canEdit || canDelete" class="product-characteristics-panel__actions">
          <el-button
            v-if="canEdit"
            :icon="Edit"
            size="small"
            text
            :aria-label="`${t('common.actions.edit')}: ${item.name}`"
            @click="emit('edit', item)"
          />
          <el-button
            v-if="canDelete"
            :icon="Delete"
            size="small"
            text
            type="danger"
            :aria-label="`${t('common.actions.delete')}: ${item.name}`"
            @click="emit('delete', item)"
          />
        </div>
      </div>
    </dl>
    <p v-else class="product-characteristics-panel__empty">{{ t('products.details.noCharacteristics') }}</p>
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit } from '@element-plus/icons-vue'
import type { ProductCharacteristicModel } from '@/models/productModel.ts'
import { useI18n } from '@/i18n'

defineProps<{
  characteristics: ProductCharacteristicModel[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  create: []
  edit: [item: ProductCharacteristicModel]
  delete: [item: ProductCharacteristicModel]
}>()

const { t } = useI18n()
</script>

<style scoped>
.product-characteristics-panel__header {
  display: flex;
  min-height: 24px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-characteristics-panel__header h2 {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 14px;
  font-weight: 600;
}

.product-characteristics-panel__list {
  max-height: 320px;
  overflow-y: auto;
  margin: 8px 0 0;
}

.product-characteristics-panel__row {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  border-bottom: 1px solid rgb(241 245 249);
  padding: 4px 0;
  font-size: 13px;
}

.product-characteristics-panel__row:last-child {
  border-bottom: 0;
}

.product-characteristics-panel__row dt,
.product-characteristics-panel__row dd {
  min-width: 0;
  overflow-wrap: anywhere;
}

.product-characteristics-panel__row dt {
  color: rgb(100 116 139);
}

.product-characteristics-panel__row dd {
  margin: 0;
  color: rgb(15 23 42);
  font-weight: 500;
}

.product-characteristics-panel__actions {
  display: flex;
  align-items: center;
}

.product-characteristics-panel__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.product-characteristics-panel__empty {
  margin: 10px 0 0;
  color: rgb(100 116 139);
  font-size: 13px;
}
</style>
