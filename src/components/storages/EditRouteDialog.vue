<template>
  <el-dialog v-model="isOpen" title="Редактировать маршрут" width="760">
    <el-form :model="form" label-position="top">
      <section class="route-dialog-section">
        <div class="section-title">Параметры маршрута</div>
        <div class="form-grid">
          <el-form-item label="Дистанция (м)">
            <el-input-number v-model="form.distanceM" :min="1" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item label="Время (мин)">
            <el-input-number v-model="form.deliveryTimeMinutes" :min="1" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item label="Тип маршрута">
            <el-select v-model="form.routeType" class="w-full">
              <el-option v-for="option in routeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="Тарификация">
            <el-select v-model="form.pricingModel" class="w-full">
              <el-option v-for="option in pricingOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
        </div>
      </section>

      <section class="route-dialog-section">
        <div class="section-title">Стоимость</div>
        <div class="form-grid">
          <el-form-item label="Цена за кг">
            <el-input-number v-model="form.priceKg" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item label="Цена за м³">
            <el-input-number v-model="form.pricePerM3" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item label="Цена за заказ">
            <el-input-number v-model="form.pricePerOrder" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item label="Минимальная цена">
            <el-input-number v-model="form.minimumPrice" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item label="Валюта" class="span-2">
            <el-select v-model="form.currencyId" class="w-full">
              <el-option
                v-for="currency in currencies"
                :key="currency.id"
                :label="`${currency.name} (${currency.currencySign})`"
                :value="currency.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Перевозчик" class="span-2">
            <UserSelector
              v-model:selected-user="form.carrier"
              place-holder="Не выбран"
              clearable
            />
          </el-form-item>
        </div>
      </section>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="isOpen = false">Отмена</el-button>
        <el-button type="primary" :loading="isSaving" @click="save">Сохранить</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import UserSelector from '@/components/selectors/UserSelector.vue'
import { GeneralSearchStrategy } from '@/enums/generalSearchStrategy.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageRouteModel } from '@/models/storageRouteModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { LogisticPricingType, pricingTypeToText } from '@/enums/logisticPricingType.ts'
import { RouteType, routeTypeToText } from '@/enums/routeType.ts'
import { editStorageRoute } from '@/services/api/storages.ts'
import { getUsers } from '@/services/api/users.ts'

const isOpen = defineModel<boolean>({ required: true })

const props = defineProps<{
  route?: StorageRouteModel
  currencies: CurrencyModel[]
}>()

const emit = defineEmits<{
  saved: []
}>()

const isSaving = ref(false)

const form = reactive({
  distanceM: 1,
  routeType: RouteType.IntraCity,
  pricingModel: LogisticPricingType.PerOrder,
  deliveryTimeMinutes: 1,
  priceKg: 0,
  pricePerM3: 0,
  pricePerOrder: 0,
  minimumPrice: 0,
  currencyId: 0,
  carrier: undefined as UserModel | undefined,
})

const routeOptions = [
  { value: RouteType.IntraCity, label: routeTypeToText(RouteType.IntraCity) },
  { value: RouteType.InterCity, label: routeTypeToText(RouteType.InterCity) },
  { value: RouteType.International, label: routeTypeToText(RouteType.International) },
]

const pricingOptions = [
  { value: LogisticPricingType.None, label: pricingTypeToText(LogisticPricingType.None) },
  { value: LogisticPricingType.PerOrder, label: pricingTypeToText(LogisticPricingType.PerOrder) },
  { value: LogisticPricingType.PerArea, label: pricingTypeToText(LogisticPricingType.PerArea) },
  { value: LogisticPricingType.PerWeight, label: pricingTypeToText(LogisticPricingType.PerWeight) },
  { value: LogisticPricingType.PerAreaAndWeight, label: pricingTypeToText(LogisticPricingType.PerAreaAndWeight) },
  { value: LogisticPricingType.PerAreaOrWeight, label: pricingTypeToText(LogisticPricingType.PerAreaOrWeight) },
]

async function fillForm(route: StorageRouteModel) {
  form.distanceM = route.distanceM
  form.routeType = route.routeType
  form.pricingModel = route.pricingModel
  form.deliveryTimeMinutes = route.deliveryTimeMinutes
  form.priceKg = route.pricePerKg
  form.pricePerM3 = route.pricePerM3
  form.pricePerOrder = route.pricePerOrder
  form.minimumPrice = route.minimumPrice ?? 0
  form.currencyId = route.currency.id
  form.carrier = undefined

  if (route.carrierId) {
    const resp = await getUsers({
      id: route.carrierId,
      page: 0,
      limit: 1,
      searchMethod: GeneralSearchStrategy.General,
    })
    form.carrier = resp.users[0]
  }
}

async function save() {
  if (!props.route) return

  isSaving.value = true
  try {
    await editStorageRoute({
      id: props.route.id,
      distanceM: form.distanceM,
      routeType: form.routeType,
      pricingModel: form.pricingModel,
      deliveryTimeMinutes: form.deliveryTimeMinutes,
      priceKg: form.priceKg,
      pricePerM3: form.pricePerM3,
      pricePerOrder: form.pricePerOrder,
      minimumPrice: form.minimumPrice,
      currencyId: form.currencyId,
      carrierId: form.carrier?.id ?? null,
    })

    ElNotification({
      title: 'Успех',
      message: 'Маршрут обновлён',
      type: 'success',
    })

    isOpen.value = false
    emit('saved')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => [isOpen.value, props.route] as const,
  ([open, route]) => {
    if (open && route) {
      fillForm(route)
    }
  },
)
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
