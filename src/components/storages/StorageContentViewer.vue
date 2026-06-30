<template>
  <div class="flex h-full flex-col">
    <div v-if="storage" class="flex items-center justify-between pb-3">
      <div>
        <div class="text-lg font-semibold">{{ t('storages.contentPanel.title') }}</div>
        <div class="text-sm text-gray-500">{{ t('storages.contentPanel.source') }}</div>
      </div>
      <el-button type="primary" @click="openCreateDialog">{{ t('storages.contentPanel.add') }}</el-button>
    </div>

    <div class="pb-3">
      <el-form inline>
        <el-form-item :label="t('storages.contentPanel.showZero')">
          <el-switch v-model="showZeroContent" />
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="content" stripe height="100%">
      <el-table-column prop="productId" label="Product ID" min-width="110" />
      <el-table-column prop="count" :label="t('storages.contentPanel.quantity')" min-width="100" />
      <el-table-column :label="t('storages.contentPanel.buyPrice')" min-width="140">
        <template #default="{ row }">
          {{ row.buyPrice }} {{ row.currency.currencySign }}
        </template>
      </el-table-column>
      <el-table-column :label="t('storages.contentPanel.purchaseDate')" min-width="170">
        <template #default="{ row }">
          {{ formatDate(row.purchaseDatetime) }}
        </template>
      </el-table-column>
      <el-table-column fixed="right" :label="t('common.labels.actions')" min-width="180">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button size="small" type="danger" @click="removeItem(row)">{{ t('common.actions.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createOpen" :title="t('storages.contentPanel.addTitle')" width="560">
      <el-form label-position="top">
        <el-form-item label="Product ID">
          <el-input-number v-model="createForm.productId" :min="1" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.quantity')">
          <el-input-number v-model="createForm.count" :min="1" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.buyPrice')">
          <el-input-number v-model="createForm.buyPrice" :min="0" :precision="2" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('common.labels.currency')">
          <el-select v-model="createForm.currencyId" class="w-full">
            <el-option
              v-for="currency in currencies"
              :key="currency.id"
              :label="`${currency.name} (${currency.currencySign})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.purchaseDate')">
          <el-date-picker
            v-model="createForm.purchaseDate"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS"
            class="w-full"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="createItem">{{ t('common.actions.add') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editOpen" :title="t('storages.contentPanel.editTitle')" width="560">
      <el-form label-position="top">
        <el-form-item label="Product ID">
          <el-input :model-value="editingItem?.productId" disabled />
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.quantity')">
          <el-input-number v-model="editForm.count" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.buyPrice')">
          <el-input-number v-model="editForm.buyPrice" :min="0" :precision="2" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('common.labels.currency')">
          <el-select v-model="editForm.currencyId" class="w-full">
            <el-option
              v-for="currency in currencies"
              :key="currency.id"
              :label="`${currency.name} (${currency.currencySign})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('storages.contentPanel.purchaseDate')">
          <el-date-picker
            v-model="editForm.purchaseDatetime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS"
            class="w-full"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="saveEdit">{{ t('common.actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { addStorageContent, deleteStorageContent, editStorageContent, getStorageContent } from '@/services/api/storages.ts'
import { formatLocalDateTime, toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const storage = defineModel<StorageModel | undefined>('storage')

const content = ref<StorageContentModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const showZeroContent = ref(true)
const createOpen = ref(false)
const editOpen = ref(false)
const editingItem = ref<StorageContentModel>()

const createForm = reactive({
  productId: 1,
  count: 1,
  buyPrice: 0,
  currencyId: 0,
  purchaseDate: toLocalDateTimeInputValue(),
})

const editForm = reactive({
  count: 0,
  buyPrice: 0,
  currencyId: 0,
  purchaseDatetime: toLocalDateTimeInputValue(),
})

function formatDate(value: string) {
  return formatLocalDateTime(value)
}

async function loadContent() {
  if (!storage.value) {
    content.value = []
    return
  }

  const resp = await getStorageContent({
    storageName: storage.value.name,
    page: 0,
    size: 50,
    showZeroContent: showZeroContent.value,
  })

  content.value = resp.contents
}

async function loadCurrencies() {
  const resp = await getCurrencies()
  currencies.value = resp.currencies

  const firstCurrency = resp.currencies[0]
  if (!createForm.currencyId && firstCurrency) {
    createForm.currencyId = firstCurrency.id
  }
  if (!editForm.currencyId && firstCurrency) {
    editForm.currencyId = firstCurrency.id
  }
}

function openCreateDialog() {
  createForm.productId = 1
  createForm.count = 1
  createForm.buyPrice = 0
  createForm.purchaseDate = toLocalDateTimeInputValue()
  createOpen.value = true
}

function openEditDialog(item: StorageContentModel) {
  editingItem.value = item
  editForm.count = item.count
  editForm.buyPrice = item.buyPrice
  editForm.currencyId = item.currency.id
  editForm.purchaseDatetime = item.purchaseDatetime
  editOpen.value = true
}

async function createItem() {
  if (!storage.value) return

  await addStorageContent({
    storageName: storage.value.name,
    storageContent: [
      {
        productId: createForm.productId,
        count: createForm.count,
        buyPrice: createForm.buyPrice,
        currencyId: createForm.currencyId,
        purchaseDate: createForm.purchaseDate,
      },
    ],
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('storages.contentPanel.added'),
    type: 'success',
  })

  createOpen.value = false
  await loadContent()
}

async function saveEdit() {
  if (!editingItem.value) return

  await editStorageContent({
    id: editingItem.value.id,
    rowVersion: editingItem.value.rowVersion,
    count: editForm.count,
    buyPrice: editForm.buyPrice,
    currencyId: editForm.currencyId,
    purchaseDatetime: editForm.purchaseDatetime,
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('storages.contentPanel.updated'),
    type: 'success',
  })

  editOpen.value = false
  await loadContent()
}

async function removeItem(item: StorageContentModel) {
  await deleteStorageContent(item.id, item.rowVersion)

  ElNotification({
    title: t('common.labels.success'),
    message: t('storages.contentPanel.removed'),
    type: 'success',
  })

  await loadContent()
}

watch(storage, loadContent, { immediate: true })
watch(showZeroContent, loadContent)
onMounted(loadCurrencies)
</script>
