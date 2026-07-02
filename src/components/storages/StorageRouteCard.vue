<template>
  <article class="route-card">
    <div class="route-card__top">
      <div class="route-card__path">
        <div class="route-point">
          <span>{{ t('storages.routesPanel.from') }}</span>
          <strong>{{ route.fromStorageName }}</strong>
        </div>
        <div class="route-arrow">→</div>
        <div class="route-point">
          <span>{{ t('storages.routesPanel.to') }}</span>
          <strong>{{ route.toStorageName }}</strong>
        </div>
      </div>

      <div class="route-actions">
        <el-tag :type="route.isActive ? 'success' : 'info'" effect="light">
          {{ route.isActive ? t('storages.routesPanel.active') : t('storages.routesPanel.inactive') }}
        </el-tag>
        <el-button size="small" plain @click="$emit('toggle', route)">
          {{ route.isActive ? t('storages.routesPanel.disable') : t('storages.routesPanel.enable') }}
        </el-button>
        <ActionIconButton :label="t('common.actions.edit')" :icon="Edit" @click="$emit('edit', route)" />
        <ActionIconButton :label="t('common.actions.delete')" :icon="Delete" tone="danger" @click="$emit('remove', route)" />
      </div>
    </div>

    <div class="route-details">
      <div>
        <span>{{ t('common.labels.type') }}</span>
        <strong>{{ routeTypeToText(route.routeType) }}</strong>
      </div>
      <div>
        <span>{{ t('storages.routesPanel.distance') }}</span>
        <strong>{{ formatDistance(route.distanceM) }}</strong>
      </div>
      <div>
        <span>{{ t('storages.routesPanel.time') }}</span>
        <strong>{{ formatDuration(route.deliveryTimeMinutes) }}</strong>
      </div>
      <div>
        <span>{{ t('storages.routesPanel.tariff') }}</span>
        <strong>{{ pricingTypeToText(route.pricingModel) }}</strong>
      </div>
      <div>
        <span>{{ t('purchases.perKg') }}</span>
        <strong>{{ formatMoney(route.pricePerKg) }}</strong>
      </div>
      <div>
        <span>{{ t('purchases.perM3') }}</span>
        <strong>{{ formatMoney(route.pricePerM3) }}</strong>
      </div>
      <div>
        <span>{{ t('purchases.perOrder') }}</span>
        <strong>{{ formatMoney(route.pricePerOrder) }}</strong>
      </div>
      <div>
        <span>{{ t('purchases.minimumPrice') }}</span>
        <strong>{{ route.minimumPrice ? formatMoney(route.minimumPrice) : t('purchases.notSet') }}</strong>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Delete, Edit } from '@element-plus/icons-vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import type { StorageRouteModel } from '@/models/storageRouteModel.ts'
import { pricingTypeToText } from '@/enums/logisticPricingType.ts'
import { routeTypeToText } from '@/enums/routeType.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  route: StorageRouteModel
}>()

const { locale, t } = useI18n()

defineEmits<{
  toggle: [route: StorageRouteModel]
  edit: [route: StorageRouteModel]
  remove: [route: StorageRouteModel]
}>()

function formatDistance(value: number) {
  if (value >= 1000) return `${(value / 1000).toLocaleString(locale.value, { maximumFractionDigits: 1 })} ${t('storages.routesPanel.kilometer')}`
  return `${value.toLocaleString(locale.value)} ${t('storages.routesPanel.meter')}`
}

function formatDuration(value: number) {
  if (value < 60) return `${value.toLocaleString(locale.value)} ${t('storages.routesPanel.minute')}`

  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return minutes > 0
    ? `${hours.toLocaleString(locale.value)} ${t('storages.routesPanel.hour')} ${minutes.toLocaleString(locale.value)} ${t('storages.routesPanel.minute')}`
    : `${hours.toLocaleString(locale.value)} ${t('storages.routesPanel.hour')}`
}

function formatMoney(value: number) {
  return `${value.toLocaleString(locale.value)} ${props.route.currency.currencySign}`.trim()
}
</script>

<style scoped>
.route-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}

.route-card:hover {
  border-color: #cbd5e1;
}

.route-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.route-card__path {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 24px minmax(120px, 1fr);
  flex: 1;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.route-point {
  min-width: 0;
}

.route-point span,
.route-details span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.route-point strong {
  display: block;
  overflow: hidden;
  color: #0f172a;
  font-size: 15px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-arrow {
  color: #002fa7;
  font-size: 18px;
  font-weight: 750;
  text-align: center;
}

.route-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 320px;
}

.route-actions :deep(.el-button) {
  margin-left: 0;
}

.route-details {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.route-details div {
  min-width: 0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
}

.route-details div:nth-child(4n) {
  border-right: 0;
}

.route-details div:nth-last-child(-n + 4) {
  border-bottom: 0;
}

.route-details strong {
  display: block;
  overflow: hidden;
  margin-top: 5px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .route-card__top {
    flex-direction: column;
  }

  .route-actions {
    justify-content: flex-start;
    max-width: none;
  }

  .route-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .route-details div:nth-child(2n) {
    border-right: 0;
  }

  .route-details div:nth-last-child(-n + 4) {
    border-bottom: 1px solid #e2e8f0;
  }

  .route-details div:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
}
</style>
