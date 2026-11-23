<template>
  <el-dialog
    v-model="isOpen"
    width="min(1280px, calc(100vw - 32px))"
    top="4vh"
    class="edit-purchase-dialog"
    :show-close="false"
    :before-close="closeGuard.beforeClose"
  >
    <template #header>
      <div class="dialog-heading">
        <div class="min-w-0">
          <div class="dialog-kicker">{{ t('purchases.editKicker') }}</div>
          <h2>{{ t('purchases.editTitle', { date: purchase ? formatDate(purchase.purchaseDatetime) : '' }) }}</h2>
          <p>{{ t('purchases.editDescription') }}</p>
        </div>
        <el-button :icon="Close" :disabled="isSaving" :aria-label="t('common.actions.close')" circle text @click="closeGuard.requestClose" />
      </div>
    </template>

    <DocumentChangeNotice :change="conflict.change.value" :loading="reloadingDocument" @reload="reloadDocument" />
    <div ref="lineNavigationRoot" class="purchase-dialog-body" @keydown="lineNavigation.onKeydown">
      <aside class="purchase-summary">
        <div class="summary-total">
          <span>{{ t('purchases.total') }}</span>
          <strong>{{ formatCurrency(editPurchaseTotal, selectedCurrency?.currencySign) }}</strong>
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
            <span>{{ t('purchases.supplier') }}</span>
            <strong>{{ supplierName }}</strong>
          </div>
          <div>
            <span>{{ t('common.labels.storage') }}</span>
            <strong>{{ purchase?.storageCode ?? '—' }}</strong>
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

      <el-form label-position="top" class="purchase-form" :disabled="isSaving || reloadingDocument">
        <section class="purchase-section purchase-section--main">
          <div class="section-header">
            <div>
              <div class="section-title">{{ t('purchases.parameters') }}</div>
              <div class="section-subtitle">{{ t('purchases.parametersHint') }}</div>
            </div>
          </div>

          <div class="form-grid">
            <el-form-item :label="t('purchases.supplier')" class="span-4">
              <el-input :model-value="supplierName" disabled />
            </el-form-item>

            <el-form-item :label="t('purchases.arrivalStorage')" class="span-4">
      <el-input :model-value="purchase?.storageCode ?? ''" disabled />
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
            <div class="mt-1 text-sm text-slate-500">{{ t('purchases.editNoPositionsHint') }}</div>
          </div>

          <div v-else class="items-list">
            <article
              v-for="(item, index) in form.items"
              :key="item.id ?? `new-${index}`"
              class="purchase-item"
              :data-line-index="index"
            >
              <div class="item-product">
                <div class="item-index">{{ index + 1 }}</div>
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-slate-950">{{ item.product.name }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span class="sku-pill">{{ item.product.sku || '—' }}</span>
                    <span v-if="item.product.producerName">{{ item.product.producerName }}</span>
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
          <strong>{{ formatCurrency(editPurchaseTotal, selectedCurrency?.currencySign) }}</strong>
        </div>
        <div class="footer-actions">
          <el-button size="large" :disabled="isSaving" @click="closeGuard.requestClose">{{ t('common.actions.cancel') }}</el-button>
          <el-button size="large" type="primary" :disabled="!canSave" :loading="isSaving" @click="save">
            {{ t('common.actions.save') }}
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProduct" @closed="lineNavigation.focusPending" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useDocumentLineNavigation } from '@/composables/useDocumentLineNavigation'
import { Check, Close, Delete, Plus } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { PurchaseContentModel, PurchaseModel } from '@/models/purchaseModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { editPurchase, getPurchase, getPurchaseContent } from '@/services/api/purchases.ts'
import { ElMessage, ElMessageBox } from 'element-plus'
import DocumentChangeNotice from '@/components/common/DocumentChangeNotice.vue'
import { useDocumentEditConflict } from '@/composables/useDocumentEditConflict'
import { formatLocalDateTime, toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { resolveDefaultCurrencyId } from '@/utils/defaultCurrency.ts'
import { useI18n } from '@/i18n'
import { useDialogGuard } from '@/composables/useDialogGuard.ts'

interface EditPurchaseProductForm {
  id: number
  sku: string
  name: string
  producerName?: string
}

interface EditPurchaseItemForm {
  id?: number | null
  product: EditPurchaseProductForm
  count: number
  price: number
  comment: string
}

const props = defineProps<{
  purchase?: PurchaseModel
  content: PurchaseContentModel[]
  currencies: CurrencyModel[]
  storages: StorageModel[]
}>()

const { locale, t } = useI18n()
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  updated: [purchaseId: string]
  reloaded: [purchase: PurchaseModel, content: PurchaseContentModel[]]
}>()

const productSelectorOpen = ref(false)
const lineNavigation = useDocumentLineNavigation(() => productSelectorOpen.value)
const lineNavigationRoot = lineNavigation.root
const isSaving = ref(false)
const reloadingDocument = ref(false)
const conflict = useDocumentEditConflict('purchase', () => isOpen.value ? props.purchase?.id : undefined, () => isSaving.value)

const form = reactive({
  currencyId: undefined as number | undefined,
  purchaseDate: '',
  comment: '',
  items: [] as EditPurchaseItemForm[],
})

const selectedCurrency = computed(() => (
  props.currencies.find((currency) => currency.id === form.currencyId)
))

const supplierName = computed(() => {
  if (!props.purchase) return '—'
  const memberName = `${props.purchase.supplier.surname} ${props.purchase.supplier.name}`.trim()
  return `${props.purchase.supplierOrganization.name} · ${memberName}`
})

const editPurchaseTotal = computed(() => (
  form.items.reduce((sum, item) => sum + item.count * item.price, 0)
))

const totalItemCount = computed(() => (
  form.items.reduce((sum, item) => sum + item.count, 0)
))

const completionSteps = computed(() => [
  { label: t('common.labels.currency'), done: !!form.currencyId },
  { label: t('common.labels.date'), done: form.purchaseDate !== '' },
  { label: t('purchases.positions'), done: form.items.length > 0 },
])

const itemsSummary = computed(() => {
  return form.items.length === 0
    ? t('purchases.addItemsHint')
    : t('purchases.itemsSummary', { positions: form.items.length, count: totalItemCount.value })
})

const canSave = computed(() => (
  !conflict.change.value && !reloadingDocument.value &&
  !!props.purchase
  && !!form.currencyId
  && form.purchaseDate !== ''
  && form.items.length > 0
  && form.items.every((item) => item.product.id > 0 && item.count > 0 && item.price >= 0)
))
const closeGuard = useDialogGuard(isOpen, computed(() => isSaving.value || reloadingDocument.value), () => ({ ...form, items: form.items.map(({ product, count, price, comment }) => ({ productId: product.id, count, price, comment })) }))

function resetForm() {
  form.currencyId = props.purchase?.currency.id ?? resolveDefaultCurrencyId(props.currencies)
  form.purchaseDate = props.purchase
    ? toLocalDateTimeInputValue(new Date(props.purchase.purchaseDatetime))
    : toLocalDateTimeInputValue(new Date())
  form.comment = props.purchase?.comment ?? ''
  form.items = props.content
    .filter((item) => item.product.id !== undefined)
    .map((item) => ({
      id: item.id,
      product: {
        id: item.product.id!,
        sku: item.product.sku ?? '',
        name: item.product.name ?? t('purchases.unnamed'),
        producerName: item.product.producerName,
      },
      count: item.count,
      price: item.price,
      comment: item.comment ?? '',
    }))
}

function addProduct(product: ProductSearchModel) {
  form.items.push({
    id: null,
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
    },
    count: 1,
    price: 0,
    comment: '',
  })
  void lineNavigation.focusQuantity(form.items.length - 1)
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, t('purchases.noData'))
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

async function reloadDocument() {
  if (reloadingDocument.value || isSaving.value || !props.purchase || conflict.change.value === 'deleted') return
  try { await ElMessageBox.confirm(t('common.live.reloadConfirm'), t('common.messages.unsavedTitle'), { type: 'warning', confirmButtonText: t('common.live.reloadDocument'), cancelButtonText: t('common.actions.cancel') }) } catch { return }
  if (!isOpen.value || !props.purchase) return
  const id = props.purchase.id
  const version = conflict.version()
  reloadingDocument.value = true
  try {
    const [document, content] = await Promise.all([getPurchase(id), getPurchaseContent(id)])
    if (!isOpen.value || props.purchase?.id !== id) return
    emit('reloaded', document.purchase, content.content)
    await nextTick()
    resetForm()
    conflict.acknowledge(version)
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : t('purchases.loadContentError')) }
  finally { reloadingDocument.value = false }
}

async function save() {
  if (isSaving.value || !canSave.value || !props.purchase || !form.currencyId) return

  isSaving.value = true
  try {
    await editPurchase(props.purchase.id, {
      currencyId: form.currencyId,
      purchaseDateTime: form.purchaseDate,
      content: form.items.map((item) => ({
        id: item.id ?? null,
        productId: item.product.id,
        count: item.count,
        price: item.price,
        comment: item.comment.trim() || null,
      })),
      comment: form.comment.trim() || null,
    })

    ElNotification({
      title: t('common.labels.success'),
      message: t('purchases.updated'),
      type: 'success',
    })

    isOpen.value = false
    emit('updated', props.purchase.id)
  } finally {
    isSaving.value = false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
})

</script>

<style scoped src="@/assets/edit-purchase-dialog.css"></style>
<style scoped src="@/assets/document-positions.css"></style>
