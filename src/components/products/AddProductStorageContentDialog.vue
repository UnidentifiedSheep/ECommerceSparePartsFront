<template>
  <el-dialog v-model="isOpen" :title="t('products.details.addStockTitle')" width="520">
    <el-form label-position="top">
      <el-form-item :label="t('common.labels.product')">
        <el-input :model-value="productLabel" disabled />
      </el-form-item>

      <el-form-item :label="t('common.labels.storage')">
        <el-select
          v-model="form.storageName"
          :loading="loadingStorages"
          filterable
          class="w-full"
          :placeholder="t('storages.selectStorage')"
        >
          <el-option v-for="storage in storages" :key="storage.name" :label="storage.name" :value="storage.name">
            <div class="flex min-w-0 flex-col py-1">
              <span class="truncate">{{ storage.name }}</span>
              <span class="truncate text-xs text-slate-500">
                {{ storage.location || storage.description || t('products.details.noDescription') }}
              </span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <div class="grid grid-cols-2 gap-3">
        <el-form-item :label="t('storages.contentPanel.quantity')">
          <el-input-number v-model="form.count" :min="1" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.buyPrice')">
          <el-input-number v-model="form.buyPrice" :min="0" :precision="2" :controls="false" class="w-full" />
        </el-form-item>
      </div>

      <el-form-item :label="t('common.labels.currency')">
        <el-select
          v-model="form.currencyId"
          :loading="loadingCurrencies"
          filterable
          class="w-full"
          :placeholder="t('currencies.selectCurrency')"
        >
          <el-option
            v-for="currency in currencies"
            :key="currency.id"
            :label="`${currency.name} (${currency.currencySign})`"
            :value="currency.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('storages.contentPanel.purchaseDate')">
        <el-date-picker v-model="form.purchaseDate" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSS" class="w-full" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('common.actions.add') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { addStorageContent, getStorages } from '@/services/api/storages.ts'
import { toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  productId: number
  productLabel: string
}>()
const emit = defineEmits<{ saved: [] }>()
const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const storages = ref<StorageModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const loadingStorages = ref(false)
const loadingCurrencies = ref(false)
const saving = ref(false)
const form = reactive({
  storageName: '',
  count: 1,
  buyPrice: 0,
  currencyId: undefined as number | undefined,
  purchaseDate: toLocalDateTimeInputValue(),
})

function reset() {
  form.storageName = storages.value[0]?.name ?? ''
  form.count = 1
  form.buyPrice = 0
  form.currencyId = currencies.value[0]?.id
  form.purchaseDate = toLocalDateTimeInputValue()
}

async function loadOptions() {
  loadingStorages.value = true
  loadingCurrencies.value = true
  try {
    const [storageResp, currencyResp] = await Promise.all([
      getStorages({ page: 0, limit: 100 }),
      getCurrencies(),
    ])
    storages.value = storageResp.storages
    currencies.value = currencyResp.currencies
    form.storageName ||= storages.value[0]?.name ?? ''
    form.currencyId ||= currencies.value[0]?.id
  } finally {
    loadingStorages.value = false
    loadingCurrencies.value = false
  }
}

async function save() {
  if (!form.storageName || !form.currencyId) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.selectStorageAndCurrency'),
      type: 'warning',
    })
    return
  }

  saving.value = true
  try {
    await addStorageContent({
      storageName: form.storageName,
      storageContent: [{
        productId: props.productId,
        count: form.count,
        buyPrice: form.buyPrice,
        currencyId: form.currencyId,
        purchaseDate: form.purchaseDate,
      }],
    })
    ElNotification({
      title: t('products.details.stockAddedTitle'),
      message: t('products.details.stockAddedMessage'),
      type: 'success',
    })
    isOpen.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

watch(isOpen, async (open) => {
  if (!open) return
  reset()
  await loadOptions()
})
</script>
