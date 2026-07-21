<template>
  <el-dialog v-model="isOpen" :title="t('products.details.editStockTitle')" width="520">
    <el-form label-position="top">
      <el-form-item :label="t('common.labels.storage')">
        <el-input :model-value="item.storageName" disabled />
      </el-form-item>
      <div class="grid grid-cols-2 gap-3">
        <el-form-item :label="t('storages.contentPanel.quantity')">
          <el-input-number v-model="form.count" :min="0" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.buyPrice')">
          <el-input-number v-model="form.buyPrice" :min="0" :precision="2" :controls="false" class="w-full" />
        </el-form-item>
      </div>
      <el-form-item :label="t('common.labels.currency')">
        <el-select v-model="form.currencyId" :loading="loadingCurrencies" filterable class="w-full">
          <el-option
            v-for="currency in currencies"
            :key="currency.id"
            :label="`${currency.name} (${currency.currencySign})`"
            :value="currency.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('storages.contentPanel.purchaseDate')">
        <el-date-picker v-model="form.purchaseDatetime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss.SSS" class="w-full" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('common.actions.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { editStorageContent } from '@/services/api/storages.ts'
import { toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{ item: StorageContentModel }>()
const emit = defineEmits<{ saved: [] }>()
const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const currencies = ref<CurrencyModel[]>([])
const loadingCurrencies = ref(false)
const saving = ref(false)
const form = reactive({
  count: 0,
  buyPrice: 0,
  currencyId: undefined as number | undefined,
  purchaseDatetime: toLocalDateTimeInputValue(),
})

async function save() {
  if (!form.currencyId) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.selectCurrency'),
      type: 'warning',
    })
    return
  }
  saving.value = true
  try {
    await editStorageContent({
      id: props.item.id,
      rowVersion: props.item.rowVersion,
      count: form.count,
      buyPrice: form.buyPrice,
      currencyId: form.currencyId,
      purchaseDatetime: form.purchaseDatetime,
    })
    ElNotification({
      title: t('products.details.stockUpdatedTitle'),
      message: t('products.details.stockUpdatedMessage'),
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
  form.count = props.item.count
  form.buyPrice = props.item.buyPrice
  form.currencyId = props.item.currency?.id
  form.purchaseDatetime = toLocalDateTimeInputValue(new Date(props.item.purchaseDatetime))
  loadingCurrencies.value = true
  try {
    currencies.value = (await getCurrencies()).currencies
  } finally {
    loadingCurrencies.value = false
  }
})
</script>
