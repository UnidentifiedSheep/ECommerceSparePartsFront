<template>
  <el-dialog v-model="isOpen" :title="t('storages.routesPanel.createTitle')" width="760">
    <el-form :model="form" label-position="top">
      <section class="route-dialog-section">
        <div class="section-title">{{ t('storages.routesPanel.direction') }}</div>
        <div class="form-grid">
          <el-form-item :label="t('storages.routesPanel.from')">
            <StorageSelector v-model="form.storageFrom" :placeholder="t('storages.routesPanel.fromStoragePlaceholder')" />
          </el-form-item>

          <el-form-item :label="t('storages.routesPanel.to')">
            <StorageSelector v-model="form.storageTo" disabled :placeholder="t('storages.routesPanel.toStoragePlaceholder')" />
          </el-form-item>

          <el-form-item :label="t('purchases.routeType')">
            <el-select v-model="form.routeType" class="w-full">
              <el-option v-for="option in routeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('purchases.pricing')">
            <el-select v-model="form.pricingType" class="w-full">
              <el-option v-for="option in pricingOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('storages.routesPanel.carrier')" class="span-2">
            <UserSelector
              v-model:selected-user="form.carrier"
              :place-holder="t('storages.routesPanel.notSelected')"
              clearable
            />
          </el-form-item>
        </div>
      </section>

      <section class="route-dialog-section">
        <div class="section-title">{{ t('storages.routesPanel.priceAndTime') }}</div>
        <div class="form-grid">
          <el-form-item :label="t('storages.routesPanel.distanceM')">
            <el-input-number v-model="form.distance" :min="1" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item :label="t('storages.routesPanel.timeMinutes')">
            <el-input-number v-model="form.deliveryTime" :min="1" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item :label="t('storages.routesPanel.priceKg')">
            <el-input-number v-model="form.priceKg" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('storages.routesPanel.priceM3')">
            <el-input-number v-model="form.priceM3" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item :label="t('storages.routesPanel.pricePerOrder')">
            <el-input-number v-model="form.pricePerOrder" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('storages.routesPanel.minimumPrice')">
            <el-input-number v-model="form.minimumPrice" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item :label="t('common.labels.currency')" class="span-2">
            <el-select v-model="form.currencyId" class="w-full">
              <el-option
                v-for="currency in currencies"
                :key="currency.id"
                :label="`${currency.name} (${currency.currencySign})`"
                :value="currency.id"
              />
            </el-select>
          </el-form-item>
        </div>
      </section>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="create">{{ t('common.actions.create') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import StorageSelector from '@/components/selectors/StorageSelector.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import { getCurrencies } from '@/services/api/currencies.ts'
import { LogisticPricingType, pricingTypeToText } from '@/enums/logisticPricingType.ts'
import { RouteType, routeTypeToText } from '@/enums/routeType.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { createStorageRoute } from '@/services/api/storages.ts'
import { useI18n } from '@/i18n'

const isOpen = defineModel<boolean>('is-open')
const { t } = useI18n()

const props = defineProps<{
  storage?: StorageModel
}>()

const emit = defineEmits<{
  created: []
}>()

const currencies = ref<CurrencyModel[]>([])

const form = reactive({
  storageFrom: '',
  storageTo: '',
  distance: 1,
  routeType: RouteType.IntraCity,
  pricingType: LogisticPricingType.PerOrder,
  deliveryTime: 1,
  priceKg: 0,
  priceM3: 0,
  currencyId: 0,
  pricePerOrder: 0,
  minimumPrice: 0,
  carrier: undefined as UserModel | undefined,
})

const routeOptions = computed(() => [
  { value: RouteType.IntraCity, label: routeTypeToText(RouteType.IntraCity) },
  { value: RouteType.InterCity, label: routeTypeToText(RouteType.InterCity) },
  { value: RouteType.International, label: routeTypeToText(RouteType.International) },
])

const pricingOptions = computed(() => [
  { value: LogisticPricingType.None, label: pricingTypeToText(LogisticPricingType.None) },
  { value: LogisticPricingType.PerOrder, label: pricingTypeToText(LogisticPricingType.PerOrder) },
  { value: LogisticPricingType.PerArea, label: pricingTypeToText(LogisticPricingType.PerArea) },
  { value: LogisticPricingType.PerWeight, label: pricingTypeToText(LogisticPricingType.PerWeight) },
  { value: LogisticPricingType.PerAreaAndWeight, label: pricingTypeToText(LogisticPricingType.PerAreaAndWeight) },
  { value: LogisticPricingType.PerAreaOrWeight, label: pricingTypeToText(LogisticPricingType.PerAreaOrWeight) },
])

watch([() => isOpen.value, () => props.storage], ([open, storage]) => {
  if (!open || !storage) return
  form.storageFrom = ''
  form.storageTo = storage.name
  form.carrier = undefined
})

async function loadCurrencies() {
  const resp = await getCurrencies()
  currencies.value = resp.currencies
  const firstCurrency = resp.currencies[0]
  if (!form.currencyId && firstCurrency) {
    form.currencyId = firstCurrency.id
  }
}

async function create() {
  await createStorageRoute({
    storageFrom: form.storageFrom,
    storageTo: form.storageTo,
    distance: form.distance,
    routeType: form.routeType,
    pricingType: form.pricingType,
    deliveryTime: form.deliveryTime,
    priceKg: form.priceKg,
    priceM3: form.priceM3,
    currencyId: form.currencyId,
    pricePerOrder: form.pricePerOrder,
    minimumPrice: form.minimumPrice || undefined,
    carrierId: form.carrier?.id,
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('storages.routesPanel.created'),
    type: 'success',
  })

  emit('created')
  isOpen.value = false
}

onMounted(loadCurrencies)
</script>

<style scoped>
.route-dialog-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.route-dialog-section + .route-dialog-section {
  margin-top: 14px;
}

.section-title {
  margin-bottom: 14px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 750;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.span-2 {
  grid-column: span 2;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }
}
</style>
