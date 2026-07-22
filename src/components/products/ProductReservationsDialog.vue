<template>
  <el-dialog
    v-model="isOpen"
    :title="title"
    width="min(1180px, calc(100vw - 24px))"
    class="product-reservations-dialog"
  >
    <ProductReservationsPanel
      :product-id="productId"
      :organization-id="organizationId"
      :title="panelTitle"
      :allow-create="false"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProductReservationsPanel from '@/components/products/ProductReservationsPanel.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  productId?: number
  organizationId?: string
  title?: string
}>()

const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const title = computed(() => props.title ?? t('reservations.title'))
const panelTitle = computed(() => props.productId ? t('reservations.productReservations') : t('reservations.organizationReservations'))
</script>

<style scoped>
:deep(.product-reservations-dialog .el-dialog__body) {
  max-height: calc(100dvh - 150px);
  overflow: auto;
  padding: 12px 20px 20px;
}

@media (max-width: 640px) {
  :deep(.product-reservations-dialog) {
    margin-top: 10px;
  }

  :deep(.product-reservations-dialog .el-dialog__body) {
    padding: 10px 12px 14px;
  }
}
</style>
