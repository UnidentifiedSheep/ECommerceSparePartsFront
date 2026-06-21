<template>
  <el-dialog
    v-model="isOpen"
    width="min(1320px, calc(100vw - 32px))"
    top="5vh"
    class="edit-sale-dialog"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-heading">
        <div class="min-w-0">
          <div class="dialog-kicker">{{ t('sales.editKicker') }}</div>
          <h2>{{ t('sales.editTitle', { date: sale ? formatDate(sale.saleDatetime) : '' }) }}</h2>
          <p>{{ t('sales.editDescription') }}</p>
        </div>
        <el-button :icon="Close" circle text @click="isOpen = false" />
      </div>
    </template>

    <div class="sale-dialog-body">
      <aside class="sale-summary">
        <div class="summary-total">
          <span>{{ t('sales.payable') }}</span>
          <strong>{{ formatCurrency(saleTotal, selectedCurrency?.currencySign) }}</strong>
        </div>

        <div class="summary-grid">
          <div>
            <span>{{ t('sales.itemLines') }}</span>
            <strong>{{ form.items.length }}</strong>
          </div>
          <div>
            <span>{{ t('sales.products') }}</span>
            <strong>{{ totalItemCount }}</strong>
          </div>
          <div>
            <span>{{ t('sales.discount') }}</span>
            <strong>{{ formatCurrency(totalDiscount, selectedCurrency?.currencySign) }}</strong>
          </div>
          <div>
            <span>{{ t('sales.buyer') }}</span>
            <strong>{{ buyerName }}</strong>
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

      <el-form label-position="top" class="sale-form">
        <section class="sale-section sale-section--main">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('sales.parameters') }}</div>
              <div class="section-subtitle">{{ t('sales.editParametersHint') }}</div>
            </div>
          </div>

          <div class="form-grid">
            <el-form-item :label="t('sales.buyer')" class="span-4">
              <el-input :model-value="buyerName" disabled />
            </el-form-item>

            <el-form-item :label="t('sales.writeOffStorage')" class="span-4">
              <el-input :model-value="sale?.storage ?? ''" disabled />
            </el-form-item>

            <el-form-item :label="t('sales.saleDate')" class="span-4">
              <el-date-picker
                v-model="form.saleDateTime"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS"
                class="w-full"
              />
            </el-form-item>

            <el-form-item :label="t('common.labels.currency')" class="span-3">
              <el-select v-model="form.currencyId" class="w-full" :placeholder="t('sales.selectCurrency')">
                <el-option
                  v-for="currency in currencies"
                  :key="currency.id"
                  :label="`${currency.name} (${currency.currencySign})`"
                  :value="currency.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('sales.userDiscount')" class="span-3">
              <div class="discount-control">
                <div v-if="!isDiscountLoading" class="discount-editor">
                  <el-input-number
                    v-if="isDiscountEditing"
                    v-model="discountDraftPercent"
                    :min="0"
                    :max="99"
                    :precision="2"
                    :controls="false"
                    class="discount-percent-input"
                    @blur="commitSaleDiscount"
                    @keyup.enter="commitSaleDiscount"
                  />
                  <button
                    v-else
                    type="button"
                    class="discount-value"
                    :class="{ 'discount-value--custom': hasCustomSaleDiscount }"
                    @click="startEditSaleDiscount"
                  >
                    {{ saleDiscountText }}
                  </button>
                  <el-tooltip
                    v-if="isDiscountEditing && hasCustomSaleDiscount"
                    :content="t('sales.resetUserDiscount')"
                    placement="top"
                  >
                    <el-button
                      :icon="RefreshRight"
                      circle
                      text
                      @mousedown.prevent
                      @click="resetSaleDiscount"
                    />
                  </el-tooltip>
                </div>
                <span v-else>{{ t('sales.loading') }}</span>
                <el-switch
                  v-model="form.applyUserDiscountToAll"
                  :disabled="isDiscountLoading"
                  :active-text="t('sales.forAll')"
                />
              </div>
            </el-form-item>

            <el-form-item :label="t('common.labels.comment')" class="span-12">
              <el-input v-model="form.comment" type="textarea" :rows="2" :placeholder="t('sales.saleCommentPlaceholder')" />
            </el-form-item>
          </div>
        </section>

        <section class="sale-section">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('sales.salePositions') }}</div>
              <div class="section-subtitle">{{ itemsSummary }}</div>
            </div>
            <el-button :icon="Plus" type="primary" @click="productSelectorOpen = true">
              {{ t('sales.addProduct') }}
            </el-button>
          </div>

          <div v-if="form.items.length === 0" class="empty-items">
            <div class="text-base font-semibold text-slate-900">{{ t('sales.noPositions') }}</div>
            <div class="mt-1 text-sm text-slate-500">{{ t('sales.editNoPositionsHint') }}</div>
          </div>

          <div v-else class="items-list">
            <article
              v-for="(item, index) in form.items"
              :key="item.id ?? `new-${index}`"
              class="sale-item"
            >
              <div class="sale-item-main">
                <div class="item-product">
                  <div class="item-index">{{ index + 1 }}</div>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-slate-950">{{ item.product.name }}</div>
                    <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span class="sku-pill">{{ item.product.sku || '—' }}</span>
                      <span :class="stockColorClass(availableProductStock(item))">
                        {{ t('sales.available') }}:
                        {{ isStockLoading ? t('sales.loading') : availableProductStock(item).toLocaleString(locale) }}
                      </span>
                      <span>{{ t('sales.selected') }}: {{ selectedProductCount(item).toLocaleString(locale) }}</span>
                    </div>
                    <div v-if="hasStockError(item)" class="stock-error">
                      {{ t('sales.stockExceeded') }}
                    </div>
                  </div>
                </div>

                <div class="item-controls">
                  <label>
                    <span>{{ t('common.labels.count') }}</span>
                    <el-input-number
                      v-model="item.count"
                      :min="1"
                      :max="availableStockForItem(item)"
                      :precision="0"
                      :controls="false"
                      class="w-full"
                    />
                  </label>
                  <label>
                    <span>{{ t('common.labels.price') }}</span>
                    <el-input-number v-model="item.price" :min="0" :precision="2" :controls="false" class="w-full" />
                  </label>
                  <label>
                    <span>{{ t('sales.priceWithDiscount') }}</span>
                    <el-input-number
                      v-model="item.priceWithDiscount"
                      :min="0"
                      :max="item.price"
                      :precision="2"
                      :controls="false"
                      :disabled="item.discountMode !== 'Manual'"
                      :placeholder="item.discountMode === 'Manual' ? t('sales.defaultPrice') : t('sales.auto')"
                      class="w-full"
                    />
                  </label>
                  <label>
                    <span>{{ t('sales.amount') }}</span>
                    <div class="item-sum">
                      {{ formatCurrency(item.count * effectivePriceWithDiscount(item), selectedCurrency?.currencySign) }}
                    </div>
                  </label>
                </div>
              </div>

              <div class="item-footer">
                <el-input v-model="item.comment" :placeholder="t('sales.itemCommentPlaceholder')" clearable />
                <el-radio-group
                  v-model="item.discountMode"
                  size="small"
                  class="discount-mode"
                  @change="onItemDiscountModeChange(item)"
                >
                  <el-radio-button label="Manual">{{ t('sales.manual') }}</el-radio-button>
                  <el-radio-button label="User" :disabled="isDiscountLoading">{{ t('sales.useDiscount') }}</el-radio-button>
                </el-radio-group>
                <span v-if="itemDiscount(item) > 0" class="discount-note">
                  {{ t('sales.discount') }}: {{ formatCurrency(itemDiscount(item), selectedCurrency?.currencySign) }}
                </span>
                <el-button class="remove-item-button" :icon="Delete" text type="danger" @click="removeItem(index)" />
              </div>
            </article>
          </div>
        </section>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-total">
          <span>{{ t('sales.payable') }}</span>
          <strong>{{ formatCurrency(saleTotal, selectedCurrency?.currencySign) }}</strong>
        </div>
        <div class="footer-actions">
          <el-button size="large" @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
          <el-button size="large" type="primary" :disabled="!canSave" :loading="isSaving" @click="save()">
            {{ t('common.actions.save') }}
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProduct" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { Check, Close, Delete, Plus, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import { ApiError } from '@/models/errorModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { SaleContentModel, SaleModel } from '@/models/saleModel.ts'
import { getProductStock } from '@/services/api/products.ts'
import { editSale } from '@/services/api/sales.ts'
import { getUserDiscount } from '@/services/api/users.ts'
import { formatLocalDateTime, toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

type DiscountMode = 'Manual' | 'User'

interface EditSaleProductForm {
  id: number
  sku: string
  name: string
  stock: number
  producerName?: string
}

interface EditSaleItemForm {
  id?: number | null
  product: EditSaleProductForm
  count: number
  price: number
  priceWithDiscount?: number
  discountMode: DiscountMode
  comment: string
}

interface SaleConfirmationData {
  confirmationCode: string
  reserved: Record<string, number>
}

const props = defineProps<{
  sale?: SaleModel
  content: SaleContentModel[]
  currencies: CurrencyModel[]
}>()

const { locale, t } = useI18n()
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  updated: [saleId: string]
}>()

const productSelectorOpen = ref(false)
const isSaving = ref(false)
const isStockLoading = ref(false)
const isDiscountLoading = ref(false)
const backendUserDiscount = ref(0)
const saleDiscount = ref(0)
const isDiscountEditing = ref(false)
const discountDraftPercent = ref<number>()
const initialCountsByProductId = ref<Record<number, number>>({})
let discountRequestId = 0
let stockRequestId = 0

const form = reactive({
  currencyId: undefined as number | undefined,
  saleDateTime: toLocalDateTimeInputValue(new Date()),
  comment: '',
  applyUserDiscountToAll: false,
  items: [] as EditSaleItemForm[],
})

const selectedCurrency = computed(() => (
  props.currencies.find((currency) => currency.id === form.currencyId)
))

const buyerName = computed(() => {
  if (!props.sale) return '—'
  return `${props.sale.buyer.surname} ${props.sale.buyer.name}`.trim()
})

const saleTotal = computed(() => (
  form.items.reduce((sum, item) => sum + item.count * effectivePriceWithDiscount(item), 0)
))

const totalWithoutDiscount = computed(() => (
  form.items.reduce((sum, item) => sum + item.count * item.price, 0)
))

const totalDiscount = computed(() => (
  Math.max(totalWithoutDiscount.value - saleTotal.value, 0)
))

const totalItemCount = computed(() => (
  form.items.reduce((sum, item) => sum + item.count, 0)
))

const saleDiscountText = computed(() => `${(saleDiscount.value * 100).toLocaleString(locale.value, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})}%`)

const hasCustomSaleDiscount = computed(() => Math.abs(saleDiscount.value - backendUserDiscount.value) > 0.000001)

const completionSteps = computed(() => [
  { label: t('sales.buyer'), done: !!props.sale?.buyer },
  { label: t('common.labels.storage'), done: !!props.sale?.storage },
  { label: t('common.labels.currency'), done: !!form.currencyId },
  { label: t('sales.positions'), done: form.items.length > 0 },
])

const itemsSummary = computed(() => {
  return form.items.length === 0
    ? t('sales.addItemsHint')
    : t('sales.itemsSummary', { positions: form.items.length, count: totalItemCount.value })
})

const canSave = computed(() => (
  !!props.sale
  && props.sale.state !== 'Deleted'
  && !!form.currencyId
  && form.saleDateTime !== ''
  && form.items.length > 0
  && form.items.every((item) => (
    item.product.id > 0
    && item.count > 0
    && !hasStockError(item)
    && item.price > 0
    && effectivePriceWithDiscount(item) > 0
    && effectivePriceWithDiscount(item) <= item.price
  ))
))

function resetForm() {
  form.currencyId = props.sale?.currency.id ?? props.currencies[0]?.id
  form.saleDateTime = props.sale
    ? toLocalDateTimeInputValue(new Date(props.sale.saleDatetime))
    : toLocalDateTimeInputValue(new Date())
  form.comment = props.sale?.comment ?? ''
  form.applyUserDiscountToAll = false
  initialCountsByProductId.value = props.content.reduce<Record<number, number>>((acc, item) => {
    if (item.product.id === undefined) return acc
    acc[item.product.id] = (acc[item.product.id] ?? 0) + item.count
    return acc
  }, {})
  form.items = props.content
    .filter((item) => item.product.id !== undefined)
    .map((item) => {
      const priceWithDiscount = roundMoney(item.price * (1 - item.discount))
      return {
        id: item.id,
        product: {
          id: item.product.id!,
          sku: item.product.sku ?? '',
          name: item.product.name ?? t('sales.unnamed'),
          producerName: item.product.producerName,
          stock: 0,
        },
        count: item.count,
        price: item.price,
        priceWithDiscount,
        discountMode: 'Manual',
        comment: item.comment ?? '',
      }
    })
  backendUserDiscount.value = 0
  saleDiscount.value = 0
  isDiscountEditing.value = false
  discountDraftPercent.value = undefined
  void loadBuyerDiscount()
  void loadCurrentProductStocks()
}

async function loadCurrentProductStocks() {
  const ids = [...new Set(form.items.map((item) => item.product.id))]
  const requestId = ++stockRequestId

  if (ids.length === 0 || !props.sale?.storage) return

  isStockLoading.value = true
  try {
    const results = await Promise.all(ids.map(async (id) => ({
      id,
      stock: (await getProductStock(id, props.sale?.storage)).stock,
    })))
    if (requestId !== stockRequestId) return

    const stocksById = new Map(results.map((product) => [product.id, product.stock]))
    form.items.forEach((item) => {
      item.product.stock = stocksById.get(item.product.id) ?? item.product.stock
    })
  } catch (error) {
    if (requestId === stockRequestId) {
      ElMessage.error(error instanceof Error ? error.message : t('sales.loadStockError'))
    }
  } finally {
    if (requestId === stockRequestId) {
      isStockLoading.value = false
    }
  }
}

async function addProduct(product: ProductSearchModel) {
  const storageStock = await loadProductStorageStock(product.id)
  if (storageStock <= 0) {
    ElMessage.warning(t('sales.noStock'))
    return
  }

  const selectedCount = selectedProductCountById(product.id)
  const initialCount = initialProductCountById(product.id)
  if (selectedCount >= storageStock + initialCount) {
    ElMessage.warning(t('sales.allStockAdded'))
    return
  }

  form.items.push({
    id: null,
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      stock: storageStock,
    },
    count: 1,
    price: 0,
    priceWithDiscount: undefined,
    discountMode: form.applyUserDiscountToAll ? 'User' : 'Manual',
    comment: '',
  })
  applyDiscountModesToItems()
}

async function loadProductStorageStock(productId: number) {
  if (!props.sale?.storage) return 0

  try {
    const resp = await getProductStock(productId, props.sale.storage)
    return resp.stock
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadStockError'))
    return 0
  }
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function itemDiscount(item: EditSaleItemForm) {
  return Math.max((item.price - effectivePriceWithDiscount(item)) * item.count, 0)
}

function effectivePriceWithDiscount(item: EditSaleItemForm) {
  return item.priceWithDiscount ?? item.price
}

function calculateUserDiscountPrice(price: number) {
  if (price <= 0) return undefined
  return Math.max(roundMoney(price * (1 - saleDiscount.value)), 0)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function applyDiscountModesToItems() {
  form.items.forEach((item) => {
    if (item.discountMode === 'User') {
      item.priceWithDiscount = calculateUserDiscountPrice(item.price)
    }
  })
}

function fillMissingManualDiscountPrices() {
  form.items.forEach((item) => {
    if (item.priceWithDiscount === undefined) {
      item.priceWithDiscount = item.price
    }
  })
}

function onItemDiscountModeChange(item: EditSaleItemForm) {
  if (item.discountMode === 'User') {
    item.priceWithDiscount = calculateUserDiscountPrice(item.price)
    return
  }

  item.priceWithDiscount = undefined
}

function startEditSaleDiscount() {
  discountDraftPercent.value = roundMoney(saleDiscount.value * 100)
  isDiscountEditing.value = true
}

function commitSaleDiscount() {
  if (!isDiscountEditing.value) return

  const percent = Math.min(Math.max(discountDraftPercent.value ?? 0, 0), 99)
  saleDiscount.value = roundMoney(percent) / 100
  discountDraftPercent.value = roundMoney(percent)
  isDiscountEditing.value = false
  applyDiscountModesToItems()
}

function resetSaleDiscount() {
  saleDiscount.value = backendUserDiscount.value
  discountDraftPercent.value = roundMoney(backendUserDiscount.value * 100)
  applyDiscountModesToItems()
}

function selectedProductCount(item: EditSaleItemForm) {
  return selectedProductCountById(item.product.id)
}

function selectedProductCountById(productId: number) {
  return form.items.reduce((sum, item) => (
    item.product.id === productId ? sum + item.count : sum
  ), 0)
}

function initialProductCountById(productId: number) {
  return initialCountsByProductId.value[productId] ?? 0
}

function otherItemsProductCount(item: EditSaleItemForm) {
  return form.items.reduce((sum, current) => (
    current !== item && current.product.id === item.product.id ? sum + current.count : sum
  ), 0)
}

function availableProductStock(item: EditSaleItemForm) {
  return item.product.stock + initialProductCountById(item.product.id)
}

function availableStockForItem(item: EditSaleItemForm) {
  return Math.max(availableProductStock(item) - otherItemsProductCount(item), 0)
}

function hasStockError(item: EditSaleItemForm) {
  return item.count > availableStockForItem(item)
}

function stockColorClass(stock: number) {
  if (stock <= 0) return 'stock-value stock-value--danger'
  if (stock <= 5) return 'stock-value stock-value--warning'
  return 'stock-value stock-value--ok'
}

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, t('sales.noData'))
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

async function loadBuyerDiscount() {
  const buyerId = props.sale?.buyer.id
  const requestId = ++discountRequestId
  backendUserDiscount.value = 0
  saleDiscount.value = 0
  isDiscountEditing.value = false

  if (!buyerId) return

  isDiscountLoading.value = true
  try {
    const resp = await getUserDiscount(buyerId)
    if (requestId !== discountRequestId) return

    backendUserDiscount.value = resp.discount
    saleDiscount.value = resp.discount
  } catch (error) {
    if (requestId === discountRequestId) {
      ElMessage.error(error instanceof Error ? error.message : t('sales.loadDiscountError'))
    }
  } finally {
    if (requestId === discountRequestId) {
      isDiscountLoading.value = false
    }
  }
}

async function save(confirmationCode?: string) {
  if (!canSave.value || !props.sale || !form.currencyId || isSaving.value) return

  fillMissingManualDiscountPrices()
  isSaving.value = true
  try {
    await editSale(props.sale.id, props.sale.rowVersion, {
      currencyId: form.currencyId,
      saleDateTime: form.saleDateTime,
      content: form.items.map((item) => ({
        id: item.id ?? null,
        productId: item.product.id,
        count: item.count,
        price: item.price,
        priceWithDiscount: effectivePriceWithDiscount(item),
        comment: item.comment.trim() || null,
      })),
      comment: form.comment.trim() || null,
      confirmationCode: confirmationCode ?? null,
    })

    ElNotification({
      title: t('common.labels.success'),
      message: t('sales.updated'),
      type: 'success',
    })

    isOpen.value = false
    emit('updated', props.sale.id)
  } catch (error) {
    const confirmationData = getSaleConfirmationData(error)
    if (!confirmationData) throw error

    isSaving.value = false
    const confirmed = await confirmReservedSale(confirmationData)
    if (confirmed) {
      await save(confirmationData.confirmationCode)
    }
  } finally {
    isSaving.value = false
  }
}

function getSaleConfirmationData(error: unknown): SaleConfirmationData | null {
  if (!(error instanceof ApiError) || error.status !== 428) return null

  const data = error.errorRelatedData
  if (!isRecord(data)) return null

  const confirmationCode = stringValue(data.confirmationCode ?? data.ConfirmationCode)
  const reservedRaw = data.reserved ?? data.Reserved
  if (!confirmationCode || !isRecord(reservedRaw)) return null

  const reserved: Record<string, number> = {}
  Object.entries(reservedRaw).forEach(([key, value]) => {
    const count = Number(value)
    if (Number.isFinite(count) && count > 0) {
      reserved[key] = count
    }
  })

  return Object.keys(reserved).length > 0
    ? { confirmationCode, reserved }
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

async function confirmReservedSale(data: SaleConfirmationData) {
  try {
    await ElMessageBox.confirm(
      h('div', { class: 'reservation-confirmation' }, [
        h('p', t('sales.confirmationIntro')),
        h('ul', Object.entries(data.reserved).map(([key, count]) => (
          h('li', t('sales.confirmationItem', { key, count }))
        ))),
        h('p', t('sales.confirmationOutro')),
      ]),
      t('sales.confirmationTitle'),
      {
        confirmButtonText: t('sales.confirm'),
        cancelButtonText: t('common.actions.cancel'),
        type: 'warning',
      },
    )
    return true
  } catch {
    return false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
})

watch(() => form.applyUserDiscountToAll, (enabled) => {
  if (enabled) {
    form.items.forEach((item) => {
      item.discountMode = 'User'
    })
    applyDiscountModesToItems()
    return
  }

  form.items.forEach((item) => {
    if (item.discountMode === 'User') {
      item.discountMode = 'Manual'
      item.priceWithDiscount = undefined
    }
  })
})

watch(
  () => form.items.map((item) => item.price),
  () => applyDiscountModesToItems(),
  { deep: true },
)
</script>

<style scoped src="@/assets/sale-dialog.css"></style>
