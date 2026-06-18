<template>
  <el-dialog
    v-model="isOpen"
    width="min(1280px, calc(100vw - 32px))"
    top="4vh"
    class="create-purchase-dialog"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-heading">
        <div class="min-w-0">
          <div class="dialog-kicker">{{ t('purchases.newPurchase') }}</div>
          <h2>{{ t('purchases.createTitle') }}</h2>
          <p>{{ t('purchases.createDescription') }}</p>
        </div>
        <el-button :icon="Close" circle text @click="isOpen = false" />
      </div>
    </template>

    <div class="purchase-dialog-body">
      <aside class="purchase-summary">
        <div class="summary-total">
          <span>{{ t('purchases.total') }}</span>
          <strong>{{ formatCurrency(createPurchaseTotal, selectedCurrency?.currencySign) }}</strong>
        </div>

        <div class="summary-grid">
          <div>
            <span>{{ t('purchases.itemLines') }}</span>
            <strong>{{ form.items.length }}</strong>
          </div>
          <div>
            <span>{{ t('purchases.products') }}</span>
            <strong>{{ totalItemCount }}</strong>
          </div>
          <div>
            <span>{{ t('purchases.paid') }}</span>
            <strong>{{ formatCurrency(form.payedSum ?? 0, selectedCurrency?.currencySign) }}</strong>
          </div>
          <div>
            <span>{{ t('purchases.remaining') }}</span>
            <strong>{{ formatCurrency(remainingPayment, selectedCurrency?.currencySign) }}</strong>
          </div>
        </div>

        <div class="summary-steps">
          <div
            v-for="step in completionSteps"
            :key="step.label"
            class="summary-step"
            :class="{ 'summary-step--done': step.done }"
          >
            <el-icon><Check /></el-icon>
            <span>{{ step.label }}</span>
          </div>
        </div>
      </aside>

      <el-form label-position="top" class="purchase-form">
        <section class="purchase-section purchase-section--main">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('purchases.parameters') }}</div>
              <div class="section-subtitle">{{ t('purchases.parametersHint') }}</div>
            </div>
          </div>

          <div class="form-grid">
            <el-form-item :label="t('purchases.supplier')" class="span-4">
              <UserSelector
                v-model:selected-user="form.supplier"
                :roles="['Supplier']"
                :place-holder="t('purchases.selectSupplier')"
                :clearable="false"
              />
            </el-form-item>

            <el-form-item :label="t('purchases.arrivalStorage')" class="span-4">
              <el-select v-model="form.storageName" filterable class="w-full" :placeholder="t('purchases.selectStorage')">
                <el-option
                  v-for="storage in storages"
                  :key="storage.name"
                  :label="storage.name"
                  :value="storage.name"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('purchases.purchaseDate')" class="span-4">
              <el-date-picker
                v-model="form.purchaseDate"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS"
                class="w-full"
              />
            </el-form-item>

            <el-form-item :label="t('common.labels.currency')" class="span-3">
              <el-select v-model="form.currencyId" class="w-full" :placeholder="t('purchases.selectCurrency')">
                <el-option
                  v-for="currency in currencies"
                  :key="currency.id"
                  :label="`${currency.name} (${currency.currencySign})`"
                  :value="currency.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('purchases.paid')" class="span-3">
              <el-input-number v-model="form.payedSum" :min="0" :precision="2" :controls="false" class="w-full" />
            </el-form-item>

            <el-form-item :label="t('purchases.logistics')" class="span-2">
              <div class="flex h-8 items-center">
                <el-switch v-model="form.withLogistics" :active-text="t('purchases.yes')" :inactive-text="t('purchases.no')" />
              </div>
            </el-form-item>

            <el-form-item v-if="form.withLogistics" :label="t('purchases.departureStorage')" class="span-4">
              <el-select v-model="form.storageFrom" filterable clearable class="w-full" :placeholder="t('purchases.selectStorage')">
                <el-option
                  v-for="storage in storages"
                  :key="storage.name"
                  :label="storage.name"
                  :value="storage.name"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('common.labels.comment')" class="span-12">
              <el-input v-model="form.comment" type="textarea" :rows="2" :placeholder="t('purchases.commentPlaceholder')" />
            </el-form-item>
          </div>
        </section>

        <section class="purchase-section">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('purchases.positions') }}</div>
              <div class="section-subtitle">{{ itemsSummary }}</div>
            </div>
            <el-button :icon="Plus" type="primary" @click="productSelectorOpen = true">
              {{ t('purchases.addProduct') }}
            </el-button>
          </div>

          <div v-if="form.items.length === 0" class="empty-items">
            <div class="text-base font-semibold text-slate-900">{{ t('purchases.noPositions') }}</div>
            <div class="mt-1 text-sm text-slate-500">{{ t('purchases.createNoPositionsHint') }}</div>
          </div>

          <div v-else class="items-list">
            <article
              v-for="(item, index) in form.items"
              :key="item.product?.id ?? index"
              class="purchase-item"
            >
              <div class="item-product">
                <div class="item-index">{{ index + 1 }}</div>
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-slate-950">{{ item.product?.name }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span class="sku-pill">{{ item.product?.sku || '—' }}</span>
                  </div>
                  <div v-if="form.withLogistics && item.calculateLogistics" class="item-logistics">
                    <template v-if="isCalculatingLogistics">{{ t('purchases.calculatingLogistics') }}</template>
                    <template v-else-if="item.logisticsSkipped">
                      {{ item.logisticsReasons?.join(', ') || t('purchases.logisticsNotCalculated') }}
                    </template>
                    <template v-else-if="item.logisticsCost !== undefined">
                      {{ t('purchases.logisticsCost', { value: formatCurrency(item.logisticsCost, logisticsCurrencySign) }) }}
                    </template>
                  </div>
                </div>
              </div>

              <div class="item-controls">
                <label>
                  <span>{{ t('common.labels.count') }}</span>
                  <el-input-number v-model="item.count" :min="1" :precision="0" :controls="false" class="w-full" />
                </label>
                <label>
                  <span>{{ t('common.labels.price') }}</span>
                  <el-input-number v-model="item.price" :min="0" :precision="2" :controls="false" class="w-full" />
                </label>
                <label>
                  <span>{{ t('purchases.amount') }}</span>
                  <div class="item-sum">{{ formatCurrency(item.count * item.price, selectedCurrency?.currencySign) }}</div>
                </label>
              </div>

              <div class="item-comment">
                <el-input v-model="item.comment" :placeholder="t('purchases.itemCommentPlaceholder')" />
                <el-checkbox v-model="item.calculateLogistics" :disabled="!form.withLogistics">
                  {{ t('purchases.calculateLogistics') }}
                </el-checkbox>
              </div>

              <el-button class="remove-item-button" :icon="Delete" text type="danger" @click="removeItem(index)" />
            </article>
          </div>
        </section>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-total">
          <span>{{ t('purchases.totalAmount') }}</span>
          <strong>{{ formatCurrency(createPurchaseTotal, selectedCurrency?.currencySign) }}</strong>
        </div>
        <div class="footer-actions">
          <el-button size="large" @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
          <el-button size="large" type="primary" :disabled="!canSave" :loading="isSaving" @click="save">
            {{ t('purchases.create') }}
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProduct" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Check, Close, Delete, Plus } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { PurchaseModel } from '@/models/purchaseModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { calculateDeliveryCost } from '@/services/api/logistics.ts'
import { createPurchase } from '@/services/api/purchases.ts'
import { toLocalDateTimeInputValue, toUtcDateTimeString } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

interface CreatePurchaseItemForm {
  product?: ProductSearchModel
  count: number
  price: number
  calculateLogistics: boolean
  comment: string
  logisticsCost?: number
  logisticsSkipped?: boolean
  logisticsReasons?: string[] | null
}

const props = defineProps<{
  currencies: CurrencyModel[]
  storages: StorageModel[]
}>()

const { locale, t } = useI18n()
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  created: [purchase: PurchaseModel]
}>()

const productSelectorOpen = ref(false)
const isSaving = ref(false)
const isCalculatingLogistics = ref(false)
const logisticsCurrencyId = ref<number>()
let logisticsRequestId = 0

const form = reactive({
  supplier: undefined as UserModel | undefined,
  currencyId: undefined as number | undefined,
  storageName: undefined as string | undefined,
  purchaseDate: toLocalDateTimeInputValue(new Date()),
  comment: '',
  payedSum: undefined as number | undefined,
  withLogistics: false,
  storageFrom: undefined as string | undefined,
  items: [] as CreatePurchaseItemForm[],
})

const selectedCurrency = computed(() => (
  props.currencies.find((currency) => currency.id === form.currencyId)
))

const logisticsCurrencySign = computed(() => (
  props.currencies.find((currency) => currency.id === logisticsCurrencyId.value)?.currencySign
  ?? selectedCurrency.value?.currencySign
))

const createPurchaseTotal = computed(() => (
  form.items.reduce((sum, item) => sum + item.count * item.price, 0)
))

const totalItemCount = computed(() => (
  form.items.reduce((sum, item) => sum + item.count, 0)
))

const remainingPayment = computed(() => (
  Math.max(createPurchaseTotal.value - (form.payedSum ?? 0), 0)
))

const completionSteps = computed(() => [
  { label: t('purchases.supplier'), done: !!form.supplier },
  { label: t('common.labels.storage'), done: !!form.storageName },
  { label: t('common.labels.currency'), done: !!form.currencyId },
  { label: t('purchases.positions'), done: form.items.length > 0 },
  ...(form.withLogistics ? [{
    label: t('purchases.logistics'),
    done: !!form.storageFrom && !isCalculatingLogistics.value && !hasSkippedLogistics.value,
  }] : []),
])

const hasSkippedLogistics = computed(() => (
  form.withLogistics
  && form.items.some((item) => item.calculateLogistics && item.logisticsSkipped)
))

const itemsSummary = computed(() => {
  return form.items.length === 0
    ? t('purchases.addItemsHint')
    : t('purchases.itemsSummary', { positions: form.items.length, count: totalItemCount.value })
})

const canSave = computed(() => (
  !!form.supplier
  && !!form.currencyId
  && !!form.storageName
  && form.purchaseDate !== ''
  && form.items.length > 0
  && form.items.every((item) => item.product && item.count > 0 && item.price >= 0)
  && (!form.withLogistics || !!form.storageFrom)
  && !isCalculatingLogistics.value
  && !hasSkippedLogistics.value
))

function resetForm() {
  form.supplier = undefined
  form.currencyId = props.currencies[0]?.id
  form.storageName = undefined
  form.purchaseDate = toLocalDateTimeInputValue(new Date())
  form.comment = ''
  form.payedSum = undefined
  form.withLogistics = false
  form.storageFrom = undefined
  form.items = []
  clearLogisticsPreview()
}

function addProduct(product: ProductSearchModel) {
  form.items.push({
    product,
    count: 1,
    price: 0,
    calculateLogistics: form.withLogistics,
    comment: '',
  })
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

function clearLogisticsPreview() {
  logisticsCurrencyId.value = undefined
  form.items.forEach((item) => {
    item.logisticsCost = undefined
    item.logisticsSkipped = undefined
    item.logisticsReasons = undefined
  })
}

const recalculateLogistics = useDebounceFn(async () => {
  const requestId = ++logisticsRequestId
  const itemsToCalculate = form.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.calculateLogistics && item.product && item.count > 0)

  form.items.forEach((item) => {
    if (!item.calculateLogistics) {
      item.logisticsCost = undefined
      item.logisticsSkipped = undefined
      item.logisticsReasons = undefined
    }
  })

  if (!form.withLogistics || !form.storageFrom || !form.storageName || itemsToCalculate.length === 0) {
    clearLogisticsPreview()
    return
  }

  isCalculatingLogistics.value = true
  try {
    const resp = await calculateDeliveryCost({
      storageFrom: form.storageFrom,
      storageTo: form.storageName,
      mode: 'Soft',
      items: itemsToCalculate.map(({ item }) => ({
        productId: item.product!.id,
        quantity: item.count,
      })),
    })

    if (requestId !== logisticsRequestId) return

    logisticsCurrencyId.value = resp.deliveryCost.currencyId
    itemsToCalculate.forEach(({ item }, index) => {
      const logisticsItem = resp.deliveryCost.items[index]
      item.logisticsCost = logisticsItem?.count ?? 0
      item.logisticsSkipped = logisticsItem?.skipped ?? true
      item.logisticsReasons = logisticsItem?.reasons ?? null
    })
  } finally {
    if (requestId === logisticsRequestId) {
      isCalculatingLogistics.value = false
    }
  }
}, 350)

async function save() {
  if (!canSave.value || !form.supplier || !form.currencyId || !form.storageName) return

  isSaving.value = true
  try {
    const resp = await createPurchase({
      supplierId: form.supplier.id,
      currencyId: form.currencyId,
      storageName: form.storageName,
      purchaseDate: toUtcDateTimeString(form.purchaseDate),
      purchaseContent: form.items.map((item) => ({
        productId: item.product!.id,
        count: item.count,
        price: item.price,
        calculateLogistics: form.withLogistics && item.calculateLogistics,
        comment: item.comment.trim() || null,
      })),
      withLogistics: form.withLogistics,
      comment: form.comment.trim() || null,
      payedSum: form.payedSum ?? null,
      storageFrom: form.withLogistics ? form.storageFrom ?? null : null,
    })

    ElNotification({
      title: t('common.labels.success'),
      message: t('purchases.created'),
      type: 'success',
    })

    isOpen.value = false
    emit('created', resp.purchase)
  } finally {
    isSaving.value = false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
})

watch(() => form.withLogistics, (enabled) => {
  if (!enabled) {
    form.storageFrom = undefined
    form.items.forEach((item) => {
      item.calculateLogistics = false
    })
    clearLogisticsPreview()
  }
})

watch(
  () => ({
    withLogistics: form.withLogistics,
    storageFrom: form.storageFrom,
    storageName: form.storageName,
    items: form.items.map((item) => ({
      productId: item.product?.id,
      count: item.count,
      calculateLogistics: item.calculateLogistics,
    })),
  }),
  () => recalculateLogistics(),
  { deep: true },
)
</script>

<style scoped src="@/assets/create-purchase-dialog.css"></style>
