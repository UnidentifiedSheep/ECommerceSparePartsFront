<template>
  <el-dialog
    v-model="isOpen"
    width="min(1280px, calc(100vw - 32px))"
    top="4vh"
    class="create-purchase-dialog"
    :show-close="false"
    :before-close="closeGuard.beforeClose"
  >
    <template #header>
      <div class="dialog-heading">
        <div class="min-w-0">
          <div class="dialog-kicker">{{ t('purchases.newPurchase') }}</div>
          <h2>{{ t('purchases.createTitle') }}</h2>
          <p>{{ t('purchases.createDescription') }}</p>
        </div>
        <div class="purchase-heading-actions">
          <el-dropdown v-if="canImportJson" trigger="click" placement="bottom-end">
            <el-button :icon="MoreFilled" :disabled="isSaving || jsonImportOpen" :aria-label="t('common.labels.actions')" circle text />
            <template #dropdown><el-dropdown-menu><el-dropdown-item :disabled="!form.currencyId || !form.storageCode" @click="jsonImportOpen = true">{{ t('purchases.jsonImport.title') }}</el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
          <el-button :icon="Close" :disabled="isSaving || jsonImportOpen" :aria-label="t('common.actions.close')" circle text @click="closeGuard.requestClose" />
        </div>
      </div>
    </template>

    <div ref="lineNavigationRoot" class="purchase-dialog-body" @keydown="lineNavigation.onKeydown">
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

      <el-form label-position="top" class="purchase-form" :disabled="isSaving">
        <section class="purchase-section purchase-section--main">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('purchases.parameters') }}</div>
              <div class="section-subtitle">{{ t('purchases.parametersHint') }}</div>
            </div>
          </div>

          <div class="form-grid">
            <el-form-item :label="t('purchases.supplier')" class="span-4">
              <OrganizationSelector
                v-model="form.supplier"
                :placeholder="t('purchases.selectSupplier')"
                :clearable="false"
              />
            </el-form-item>

            <el-form-item :label="t('purchases.arrivalStorage')" class="span-4">
              <el-select v-model="form.storageCode" filterable class="w-full" :placeholder="t('purchases.selectStorage')">
                <el-option
                  v-for="storage in storages"
                  :key="storage.code"
                  :label="storage.code"
                  :value="storage.code"
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

            <el-form-item :label="t('common.labels.currency')" class="span-4">
              <el-select v-model="form.currencyId" class="w-full" :placeholder="t('purchases.selectCurrency')">
                <el-option
                  v-for="currency in currencies"
                  :key="currency.id"
                  :label="`${currency.name} (${currency.currencySign})`"
                  :value="currency.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="t('purchases.paid')" class="span-4">
              <el-input-number v-model="form.payedSum" :min="0" :precision="2" :controls="false" class="w-full" />
            </el-form-item>

            <el-form-item :label="t('common.labels.comment')" class="span-12">
              <el-input v-model="form.comment" type="textarea" :rows="2" :placeholder="t('purchases.commentPlaceholder')" />
            </el-form-item>
          </div>
        </section>

        <section class="purchase-section document-positions">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('purchases.positions') }}</div>
              <div class="section-subtitle">{{ itemsSummary }}</div>
            </div>
            <el-button data-add-product :icon="Plus" type="primary" @click="productSelectorOpen = true">
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
              :data-line-index="index"
            >
              <div class="item-product">
                <div class="item-index">{{ index + 1 }}</div>
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-slate-950">{{ item.product?.name }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span class="sku-pill">{{ item.product?.sku || '—' }}</span>
                  </div>
                </div>
              </div>

              <div class="item-controls">
                <label>
                  <span>{{ t('common.labels.count') }}</span>
                  <el-input-number v-model="item.count" data-line-field="count" :min="1" :precision="0" :controls="false" class="w-full" />
                </label>
                <label>
                  <span>{{ t('common.labels.price') }}</span>
                  <el-input-number v-model="item.price" data-line-field="price" :min="0" :precision="2" :controls="false" class="w-full" />
                </label>
                <label>
                  <span>{{ t('purchases.amount') }}</span>
                  <div class="item-sum">{{ formatCurrency(item.count * item.price, selectedCurrency?.currencySign) }}</div>
                </label>
              </div>

              <div class="item-comment">
                <el-input v-model="item.comment" :placeholder="t('purchases.itemCommentPlaceholder')" />
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
          <el-button size="large" :disabled="isSaving" @click="closeGuard.requestClose">{{ t('common.actions.cancel') }}</el-button>
          <el-button size="large" type="primary" :disabled="!canSave || jsonImportOpen" :loading="isSaving" @click="save">
            {{ t('purchases.create') }}
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProduct" @closed="lineNavigation.focusPending" />
    <PurchaseJsonImportDialog v-model="jsonImportOpen" :storage-code="form.storageCode" :currency="selectedCurrency" @import="addImportedItems" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useDocumentLineNavigation } from '@/composables/useDocumentLineNavigation'
import { Check, Close, Delete, MoreFilled, Plus } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import PurchaseJsonImportDialog from '@/components/purchases/PurchaseJsonImportDialog.vue'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { PurchaseModel } from '@/models/purchaseModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { OrganizationSelection } from '@/models/organizationModel.ts'
import { createPurchase } from '@/services/api/purchases.ts'
import { toLocalDateTimeInputValue, toUtcDateTimeString } from '@/utils/dateTime.ts'
import { resolveDefaultCurrencyId } from '@/utils/defaultCurrency.ts'
import { useI18n } from '@/i18n'
import { useDialogGuard } from '@/composables/useDialogGuard.ts'
import { usePermissions } from '@/composables/usePermissions'

interface CreatePurchaseItemForm {
  product?: ProductSearchModel
  count: number
  price: number
  comment: string
}

const props = defineProps<{
  currencies: CurrencyModel[]
  storages: StorageModel[]
}>()

const { locale, t } = useI18n()
const { hasPermission } = usePermissions()
const canImportJson = computed(() => hasPermission('PURCHASE_CREATE') && hasPermission('ARTICLES_GET_MAIN'))
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  created: [purchase: PurchaseModel]
}>()

const productSelectorOpen = ref(false)
const lineNavigation = useDocumentLineNavigation(() => productSelectorOpen.value)
const lineNavigationRoot = lineNavigation.root
const jsonImportOpen = ref(false)
const isSaving = ref(false)

const form = reactive({
  supplier: undefined as OrganizationSelection | undefined,
  currencyId: undefined as number | undefined,
  storageCode: undefined as string | undefined,
  purchaseDate: toLocalDateTimeInputValue(new Date()),
  comment: '',
  payedSum: undefined as number | undefined,
  items: [] as CreatePurchaseItemForm[],
})

const selectedCurrency = computed(() => (
  props.currencies.find((currency) => currency.id === form.currencyId)
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
  { label: t('common.labels.storage'), done: !!form.storageCode },
  { label: t('common.labels.currency'), done: !!form.currencyId },
  { label: t('purchases.positions'), done: form.items.length > 0 },
])

const itemsSummary = computed(() => {
  return form.items.length === 0
    ? t('purchases.addItemsHint')
    : t('purchases.itemsSummary', { positions: form.items.length, count: totalItemCount.value })
})

const canSave = computed(() => (
  !!form.supplier
  && !!form.currencyId
  && !!form.storageCode
  && form.purchaseDate !== ''
  && form.items.length > 0
  && form.items.every((item) => item.product && item.count > 0 && item.price >= 0)
))
const closeGuard = useDialogGuard(isOpen, computed(() => isSaving.value || jsonImportOpen.value), () => ({ ...form, items: form.items.map(({ product, count, price, comment }) => ({ productId: product?.id, count, price, comment })) }))

function addImportedItems(rows: Array<{ product: ProductSearchModel; count: number; price: number }>) {
  if (isSaving.value || !canImportJson.value || !form.currencyId || !form.storageCode) return
  form.items.push(...rows.map(row => ({ product: row.product, count: row.count, price: row.price, comment: '' })))
}

function resetForm() {
  form.supplier = undefined
  form.currencyId = resolveDefaultCurrencyId(props.currencies)
  form.storageCode = props.storages.length === 1 ? props.storages[0]!.code : undefined
  form.purchaseDate = toLocalDateTimeInputValue(new Date())
  form.comment = ''
  form.payedSum = undefined
  form.items = []
}

function addProduct(product: ProductSearchModel) {
  form.items.push({
    product,
    count: 1,
    price: 0,
    comment: '',
  })
  void lineNavigation.focusQuantity(form.items.length - 1)
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

async function save() {
  if (isSaving.value || !canSave.value || !form.supplier?.member || !form.currencyId || !form.storageCode) return

  isSaving.value = true
  try {
    const resp = await createPurchase({
      supplierUserId: form.supplier.member.user.id,
      supplierOrganizationId: form.supplier.organization.id,
      currencyId: form.currencyId,
      storageCode: form.storageCode,
      purchaseDate: toUtcDateTimeString(form.purchaseDate),
      purchaseContent: form.items.map((item) => ({
        productId: item.product!.id,
        count: item.count,
        price: item.price,
        comment: item.comment.trim() || null,
      })),
      comment: form.comment.trim() || null,
      payedSum: form.payedSum ?? null,
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

watch(() => props.storages.length, () => {
  if (isOpen.value && !form.storageCode && props.storages.length === 1) {
    form.storageCode = props.storages[0]!.code
  }
})

</script>

<style scoped src="@/assets/create-purchase-dialog.css"></style>
<style scoped src="@/assets/document-positions.css"></style>
<style scoped>
.purchase-heading-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
</style>
