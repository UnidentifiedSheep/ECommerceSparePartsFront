<template>
  <el-dialog
    v-model="isOpen"
    width="min(1320px, calc(100vw - 32px))"
    top="5vh"
    class="create-sale-dialog"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-heading">
        <div class="min-w-0">
          <div class="dialog-kicker">{{ t('sales.newSale') }}</div>
          <h2>{{ t('sales.createTitle') }}</h2>
          <p>{{ t('sales.createDescription') }}</p>
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
            <span>{{ t('sales.remaining') }}</span>
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

      <el-form label-position="top" class="sale-form">
        <section class="sale-section sale-section--main">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('sales.parameters') }}</div>
              <div class="section-subtitle">{{ t('sales.parametersHint') }}</div>
            </div>
          </div>

          <div class="form-grid">
            <el-form-item :label="t('sales.buyer')" class="span-4">
              <UserSelector
                v-model:selected-user="form.buyer"
                :place-holder="t('sales.selectBuyer')"
                :clearable="false"
              />
            </el-form-item>

            <el-form-item :label="t('sales.writeOffStorage')" class="span-4">
              <StorageSelector v-model="form.storageName" :placeholder="t('sales.selectStorage')" />
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

            <el-form-item :label="t('sales.paid')" class="span-3">
              <el-input-number v-model="form.payedSum" :min="0" :precision="2" :controls="false" class="w-full" />
            </el-form-item>

            <el-form-item :label="t('sales.forcePayment')" class="span-3">
              <div class="force-payment-control">
                <el-switch v-model="form.forcePayment" size="small" />
                <el-tooltip :content="t('sales.forcePaymentHint')" placement="top">
                  <el-icon class="force-payment-help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </el-form-item>

            <el-form-item :label="t('sales.userDiscount')" class="span-3 sale-discount-field">
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
                <div class="discount-apply-all">
                  <span>{{ t('sales.forAll') }}</span>
                  <el-switch
                    v-model="form.applyUserDiscountToAll"
                    size="small"
                    :disabled="!form.buyer || isDiscountLoading"
                  />
                </div>
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
            <div class="mt-1 text-sm text-slate-500">{{ t('sales.noPositionsHint') }}</div>
          </div>

          <div v-else class="items-list">
            <article
              v-for="(item, index) in form.items"
              :key="`sale-item-${index}`"
              class="sale-item"
            >
              <div class="sale-item-main">
                <div class="item-product">
                  <div class="item-index">{{ index + 1 }}</div>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-slate-950">{{ item.product?.name }}</div>
                    <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span class="sku-pill">{{ item.product?.sku || '—' }}</span>
                      <button
                        type="button"
                        class="stock-badge"
                        :class="stockColorClass(item.product?.stock ?? 0)"
                        :disabled="!form.storageName || !item.product"
                        @click="openStorageBatches(item)"
                      >
                        {{ t('sales.available') }}:
                        {{ isStockLoading ? t('sales.loading') : (item.product?.stock ?? 0).toLocaleString(locale) }}
                      </button>
                      <span v-if="item.product">
                        {{ t('sales.selected') }}: {{ selectedProductCount(item).toLocaleString(locale) }}
                      </span>
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
                  <el-radio-button label="User" :disabled="!form.buyer || isDiscountLoading">{{ t('sales.useDiscount') }}</el-radio-button>
                </el-radio-group>
                <span v-if="itemDiscount(item) > 0" class="discount-note">
                  {{ t('sales.discount') }}: {{ formatCurrency(itemDiscount(item), selectedCurrency?.currencySign) }}
                </span>
                <el-dropdown trigger="click" placement="bottom-end">
                  <el-button class="item-actions-button" :icon="MoreFilled" text />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :disabled="!form.storageName || !item.product"
                        @click="openStorageBatches(item)"
                      >
                        {{ t('sales.storageBatches') }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
            {{ t('sales.create') }}
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProduct" />
    <StorageContentBatchesDialog
      v-model="storageBatchesOpen"
      :storage-name="form.storageName"
      :product-id="storageBatchesProduct?.id"
      :product-name="storageBatchesProduct?.name"
      :product-sku="storageBatchesProduct?.sku"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { Check, Close, Delete, MoreFilled, Plus, QuestionFilled, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import StorageContentBatchesDialog from '@/components/sales/StorageContentBatchesDialog.vue'
import StorageSelector from '@/components/selectors/StorageSelector.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { SaleModel } from '@/models/saleModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { ApiError } from '@/models/errorModel.ts'
import { getProductStock } from '@/services/api/products.ts'
import { createSale } from '@/services/api/sales.ts'
import { getUserDiscount } from '@/services/api/users.ts'
import { toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

interface SaleItemForm {
  product?: ProductSearchModel
  count: number
  price: number
  priceWithDiscount?: number
  discountMode: DiscountMode
  comment: string
}

type DiscountMode = 'Manual' | 'User'

interface SaleConfirmationData {
  confirmationCode: string
  reserved: Record<string, number>
}

const props = defineProps<{
  currencies: CurrencyModel[]
}>()

const { locale, t } = useI18n()
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  created: [sale: SaleModel]
}>()

const productSelectorOpen = ref(false)
const storageBatchesOpen = ref(false)
const storageBatchesProduct = ref<ProductSearchModel>()
const isSaving = ref(false)
const isStockLoading = ref(false)
const isDiscountLoading = ref(false)
const backendUserDiscount = ref(0)
const saleDiscount = ref(0)
const isDiscountEditing = ref(false)
const discountDraftPercent = ref<number>()
let discountRequestId = 0
let stockRequestId = 0

const form = reactive({
  buyer: undefined as UserModel | undefined,
  currencyId: undefined as number | undefined,
  storageName: undefined as string | undefined,
  saleDateTime: toLocalDateTimeInputValue(new Date()),
  comment: '',
  payedSum: undefined as number | undefined,
  forcePayment: false,
  applyUserDiscountToAll: false,
  items: [] as SaleItemForm[],
})

const selectedCurrency = computed(() => (
  props.currencies.find((currency) => currency.id === form.currencyId)
))

const saleTotal = computed(() => (
  form.items.reduce((sum, item) => sum + item.count * effectivePriceWithDiscount(item), 0)
))

const totalWithoutDiscount = computed(() => (
  form.items.reduce((sum, item) => sum + item.count * item.price, 0)
))

const totalDiscount = computed(() => (
  Math.max(totalWithoutDiscount.value - saleTotal.value, 0)
))

const saleDiscountText = computed(() => `${(saleDiscount.value * 100).toLocaleString(locale.value, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})}%`)

const hasCustomSaleDiscount = computed(() => Math.abs(saleDiscount.value - backendUserDiscount.value) > 0.000001)

const totalItemCount = computed(() => (
  form.items.reduce((sum, item) => sum + item.count, 0)
))

const remainingPayment = computed(() => (
  Math.max(saleTotal.value - (form.payedSum ?? 0), 0)
))

const completionSteps = computed(() => [
  { label: t('sales.buyer'), done: !!form.buyer },
  { label: t('common.labels.storage'), done: !!form.storageName },
  { label: t('common.labels.currency'), done: !!form.currencyId },
  { label: t('sales.positions'), done: form.items.length > 0 },
])

const itemsSummary = computed(() => {
  return form.items.length === 0
    ? t('sales.addItemsHint')
    : t('sales.itemsSummary', { positions: form.items.length, count: totalItemCount.value })
})

const canSave = computed(() => (
  !!form.buyer
  && !!form.currencyId
  && !!form.storageName
  && form.saleDateTime !== ''
  && form.items.length > 0
  && form.items.every((item) => (
    item.product
    && item.count > 0
    && !hasStockError(item)
    && item.price > 0
    && effectivePriceWithDiscount(item) > 0
    && effectivePriceWithDiscount(item) <= item.price
  ))
))

function resetForm() {
  form.buyer = undefined
  form.currencyId = props.currencies[0]?.id
  form.storageName = undefined
  form.saleDateTime = toLocalDateTimeInputValue(new Date())
  form.comment = ''
  form.payedSum = undefined
  form.forcePayment = false
  form.applyUserDiscountToAll = false
  form.items = []
  backendUserDiscount.value = 0
  saleDiscount.value = 0
  isDiscountEditing.value = false
  discountDraftPercent.value = undefined
}

async function addProduct(product: ProductSearchModel) {
  if (!form.storageName) {
    ElMessage.warning(t('sales.selectStorage'))
    return
  }

  const storageStock = await loadProductStorageStock(product.id)
  if (storageStock <= 0) {
    ElMessage.warning(t('sales.noStock'))
    return
  }

  const selectedCount = selectedProductCountById(product.id)
  if (selectedCount >= storageStock) {
    ElMessage.warning(t('sales.allStockAdded'))
    return
  }

  form.items.push({
    product: {
      ...product,
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
  if (!form.storageName) return 0

  try {
    const resp = await getProductStock(productId, form.storageName)
    return resp.stock
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadStockError'))
    return 0
  }
}

async function loadCurrentProductStocks() {
  const storageName = form.storageName
  const ids = [...new Set(form.items.map((item) => item.product?.id).filter((id): id is number => Boolean(id)))]
  const requestId = ++stockRequestId

  if (!storageName || ids.length === 0) {
    if (!storageName) {
      form.items.forEach((item) => {
        if (item.product) item.product.stock = 0
      })
    }
    return
  }

  isStockLoading.value = true
  try {
    const results = await Promise.all(ids.map(async (id) => ({
      id,
      stock: (await getProductStock(id, storageName)).stock,
    })))
    if (requestId !== stockRequestId) return

    const stocksById = new Map(results.map((product) => [product.id, product.stock]))
    form.items.forEach((item) => {
      if (!item.product) return
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

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function openStorageBatches(item: SaleItemForm) {
  if (!item.product || !form.storageName) return
  storageBatchesProduct.value = item.product
  storageBatchesOpen.value = true
}

function itemDiscount(item: SaleItemForm) {
  return Math.max((item.price - effectivePriceWithDiscount(item)) * item.count, 0)
}

function effectivePriceWithDiscount(item: SaleItemForm) {
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

function onItemDiscountModeChange(item: SaleItemForm) {
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

function selectedProductCount(item: SaleItemForm) {
  const productId = item.product?.id
  return productId ? selectedProductCountById(productId) : item.count
}

function selectedProductCountById(productId: number) {
  return form.items.reduce((sum, item) => (
    item.product?.id === productId ? sum + item.count : sum
  ), 0)
}

function otherItemsProductCount(item: SaleItemForm) {
  const productId = item.product?.id
  if (!productId) return 0

  return form.items.reduce((sum, current) => (
    current !== item && current.product?.id === productId ? sum + current.count : sum
  ), 0)
}

function availableStockForItem(item: SaleItemForm) {
  const stock = item.product?.stock ?? 0
  return Math.max(stock - otherItemsProductCount(item), 0)
}

function hasStockError(item: SaleItemForm) {
  return item.count > availableStockForItem(item)
}

function stockColorClass(stock: number) {
  if (stock <= 0) return 'stock-value stock-value--danger'
  if (stock <= 5) return 'stock-value stock-value--warning'
  return 'stock-value stock-value--ok'
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

async function save(confirmationCode?: string) {
  if (!canSave.value || !form.buyer || !form.currencyId || !form.storageName || isSaving.value) return

  fillMissingManualDiscountPrices()
  isSaving.value = true
  try {
    const resp = await createSale({
      buyerId: form.buyer.id,
      currencyId: form.currencyId,
      storageName: form.storageName,
      saleDateTime: form.saleDateTime,
      contents: form.items.map((item) => ({
        productId: item.product!.id,
        count: item.count,
        price: item.price,
        priceWithDiscount: effectivePriceWithDiscount(item),
        comment: item.comment.trim() || null,
      })),
      comment: form.comment.trim() || null,
      payedSum: form.payedSum ?? null,
      forcePayment: form.forcePayment,
      confirmationCode: confirmationCode ?? null,
    })

    ElNotification({
      title: t('common.labels.success'),
      message: t('sales.created'),
      type: 'success',
    })

    isOpen.value = false
    emit('created', resp.sale)
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

watch(() => form.buyer?.id, async (buyerId) => {
  const requestId = ++discountRequestId
  backendUserDiscount.value = 0
  saleDiscount.value = 0
  isDiscountEditing.value = false
  form.applyUserDiscountToAll = false
  form.items.forEach((item) => {
    if (item.discountMode === 'User') {
      item.discountMode = 'Manual'
    }
    item.priceWithDiscount = undefined
  })

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

watch(() => form.storageName, () => {
  storageBatchesOpen.value = false
  void loadCurrentProductStocks()
})

watch(
  () => form.items.map((item) => item.price),
  () => applyDiscountModesToItems(),
  { deep: true },
)

</script>

<style scoped src="@/assets/sale-dialog.css"></style>
