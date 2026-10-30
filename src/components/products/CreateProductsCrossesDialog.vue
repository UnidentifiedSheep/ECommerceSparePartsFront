<template>
  <el-dialog
    v-model="isOpen"
    :before-close="closeGuard.beforeClose"
    :title="t(canCreateProducts && canCreateCrosses ? 'products.crossesWizard.title' : canCreateProducts ? 'products.createProduct' : 'products.addCrosses')"
    width="min(1000px, calc(100vw - 24px))"
    top="5vh"
    class="create-products-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="!isBusy"
    :show-close="!isBusy"
  >
    <div v-if="canImportGroups" class="creation-toolbar__actions">
      <el-button :disabled="isBusy" @click="importOpen = true">{{ t('products.groupImport.title') }}</el-button>
    </div>
    <nav v-if="canCreateProducts && canCreateCrosses" class="creation-tabs" :aria-label="t('products.crossesWizard.title')">
      <button type="button" :class="{ 'is-active': activeStep === 0 }" :aria-current="activeStep === 0 ? 'step' : undefined" :disabled="isBusy" @click="activeStep = 0">
        {{ t('products.crossesWizard.products') }}
        <span v-if="productRows.length" class="creation-tabs__count">{{ productRows.length }}</span>
      </button>
      <button type="button" :class="{ 'is-active': activeStep === 1 }" :aria-current="activeStep === 1 ? 'step' : undefined" :disabled="isBusy" @click="activeStep = 1">
        {{ t('products.crossesWizard.crosses') }}
        <span v-if="crossRows.length" class="creation-tabs__count">{{ crossRows.length }}</span>
      </button>
    </nav>

    <div class="creation-body" :inert="isBusy" :aria-busy="isBusy">
      <div v-if="createdProducts.length" class="creation-success" role="status">
        <el-icon><CircleCheck /></el-icon>
        {{ t('products.crossesWizard.createdProductsSummary', { count: createdProducts.length }) }}
      </div>
      <el-alert v-if="saveError" class="creation-error" :title="saveError" type="error" :closable="false" show-icon />

      <section v-show="activeStep === 0 && canCreateProducts" data-creation-step="0" :aria-label="t('products.crossesWizard.newProducts')">
        <div class="creation-toolbar">
          <div>
            <h3>{{ t('products.crossesWizard.newProducts') }}</h3>
            <p>{{ t('products.crossesWizard.requiredHint') }}</p>
          </div>
          <div class="creation-toolbar__actions">
            <span class="creation-count">{{ productRows.length }} / 100</span>
            <el-button v-if="productRows.length" :icon="Plus" :disabled="productRows.length >= 100" @click="addProductRow">{{ t('products.crossesWizard.addProduct') }}</el-button>
          </div>
        </div>

        <div v-if="!productRows.length" class="creation-empty">
          <el-icon class="creation-empty__icon"><Box /></el-icon>
          <h4>{{ t('products.crossesWizard.noProducts') }}</h4>
          <p>{{ t('products.crossesWizard.limitHint') }}</p>
          <el-button :icon="Plus" type="primary" @click="addProductRow">{{ t('products.crossesWizard.addProduct') }}</el-button>
        </div>
        <el-form v-else label-position="top" :disabled="isBusy" class="creation-rows">
          <article v-for="(row, index) in productRows" :key="row.key" class="product-draft">
            <div class="draft-heading">
              <strong>{{ t('products.crossesWizard.product') }} {{ index + 1 }}</strong>
              <el-button :icon="Delete" text type="danger" :aria-label="t('products.crossesWizard.removeProduct', { number: index + 1 })" @click="removeProductRow(row)" />
            </div>
            <div class="product-draft__fields">
              <el-form-item :label="t('products.sku')" required :error="productError(row, 'sku')">
                <el-input v-model="row.sku" :placeholder="t('products.crossesWizard.enterSku')" :aria-invalid="Boolean(productError(row, 'sku'))" />
              </el-form-item>
              <el-form-item :label="t('common.labels.name')" required :error="productError(row, 'name')">
                <el-input v-model="row.name" :placeholder="t('products.crossesWizard.enterName')" :aria-invalid="Boolean(productError(row, 'name'))" />
              </el-form-item>
              <el-form-item :label="t('common.labels.producer')" required :error="productError(row, 'producerId')">
                <ProducerSelector v-model="row.producerId" allow-create :aria-invalid="Boolean(productError(row, 'producerId'))" />
              </el-form-item>
            </div>
            <details class="product-draft__details">
              <summary>{{ t('products.crossesWizard.additionalFields') }}</summary>
              <div class="product-draft__optional">
                <el-form-item :label="t('products.productGroup')"><ProductGroupSelector v-model="row.groupId" /></el-form-item>
                <el-form-item :label="t('products.crossesWizard.color')"><el-color-picker v-model="row.indicator" show-alpha /></el-form-item>
                <el-form-item :label="t('common.labels.description')" class="product-draft__description">
                  <el-input v-model="row.description" type="textarea" :rows="2" maxlength="255" show-word-limit :placeholder="t('products.crossesWizard.enterDescription')" />
                </el-form-item>
              </div>
            </details>
          </article>
        </el-form>
        <div v-if="productRows.length" class="creation-list-footer">
          <span>{{ t('products.crossesWizard.limitHint') }}</span>
          <el-button text type="danger" @click="clearProductRows">{{ t('products.crossesWizard.clearAll') }}</el-button>
        </div>
      </section>

      <section v-show="activeStep === 1 && canCreateCrosses" data-creation-step="1" :aria-label="t('products.crossesWizard.crosses')">
        <div class="creation-toolbar">
          <div><h3>{{ t('products.crossesWizard.crosses') }}</h3><p>{{ t('products.crossesWizard.crossHint') }}</p></div>
          <div class="creation-toolbar__actions">
            <el-button v-if="canLinkCreated" :icon="Link" @click="addCreatedProductsAsCrosses">{{ t('products.crossesWizard.linkCreated') }}</el-button>
            <el-button v-if="crossRows.length" :icon="Plus" @click="addCrossRow">{{ t('products.crossesWizard.addCross') }}</el-button>
          </div>
        </div>
        <div v-if="!crossRows.length" class="creation-empty">
          <el-icon class="creation-empty__icon"><Link /></el-icon>
          <h4>{{ t('products.crossesWizard.noCrosses') }}</h4><p>{{ t('products.crossesWizard.crossHint') }}</p>
          <el-button :icon="Plus" type="primary" @click="addCrossRow">{{ t('products.crossesWizard.addCross') }}</el-button>
        </div>
        <div v-else class="creation-rows">
          <article v-for="(row, index) in crossRows" :key="row.key" class="cross-draft" :class="{ 'has-error': crossError(row) }">
            <div class="draft-heading">
              <strong>{{ t('products.crossesWizard.cross') }} {{ index + 1 }}</strong>
              <el-button :icon="Delete" text type="danger" :aria-label="t('products.crossesWizard.removeCross', { number: index + 1 })" @click="removeCrossRow(index)" />
            </div>
            <div class="cross-draft__pair">
              <div v-for="field in crossFields" :key="field" class="creation-field">
                <span :id="`${row.key}-${field}-label`">{{ t(field === 'product' ? 'products.crossesWizard.product' : 'products.crossesWizard.cross') }}</span>
                <div class="cross-selection" :class="{ 'is-selected': field === 'product' ? row.productId : row.crossProductId }">
                  <button type="button" class="cross-selection__pick" :aria-labelledby="`${row.key}-${field}-label ${row.key}-${field}-value`" @click="openProductSelector(index, field)">
                    <el-icon><Search /></el-icon>
                    <span :id="`${row.key}-${field}-value`">{{ (field === 'product' ? row.productLabel : row.crossProductLabel) || t('products.crossesWizard.pickProduct') }}</span>
                  </button>
                  <el-button v-if="field === 'product' ? row.productId : row.crossProductId" :icon="Close" text :aria-label="t('products.clear')" @click="clearCrossProduct(row, field)" />
                </div>
              </div>
            </div>
            <div class="cross-draft__options">
              <label :for="`${row.key}-linkage`">{{ t('products.crossesWizard.linkageType') }}</label>
              <el-select :id="`${row.key}-linkage`" v-model="row.linkageType">
                <el-option v-for="option in linkageTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </div>
            <p v-if="crossError(row)" class="field-error" role="alert">{{ crossError(row) }}</p>
          </article>
        </div>
        <div v-if="crossRows.length" class="creation-list-footer">
          <span>{{ t('products.crossesWizard.totalRows', { count: crossRows.length }) }}</span>
          <el-button text type="danger" @click="clearCrossRows">{{ t('products.crossesWizard.clearAll') }}</el-button>
        </div>
      </section>
    </div>
    <template #footer>
      <div class="creation-footer">
        <el-button :disabled="isBusy" @click="closeGuard.requestClose">{{ t(createdProducts.length ? 'common.actions.close' : 'common.actions.cancel') }}</el-button>
        <div class="creation-footer__actions">
          <template v-if="activeStep === 0 && canCreateProducts">
            <el-button v-if="canCreateCrosses" :disabled="isBusy" @click="activeStep = 1">{{ t('products.crossesWizard.onlyCrosses') }}</el-button>
            <el-button type="primary" :loading="isSavingProducts" :disabled="!productRows.length || isSavingCrosses" @click="saveProducts">
              {{ t(canCreateCrosses ? 'products.crossesWizard.createAndNext' : 'common.actions.create') }}
            </el-button>
          </template>
          <template v-else-if="canCreateCrosses">
            <el-button v-if="canCreateProducts" :disabled="isBusy" @click="activeStep = 0">{{ t('products.crossesWizard.back') }}</el-button>
            <el-button v-if="crossRows.length" :disabled="isBusy" @click="saveCrosses">{{ t('products.crossesWizard.saveCrosses') }}</el-button>
            <el-button type="primary" :loading="isSavingCrosses" :disabled="isSavingProducts" @click="saveCrossesAndClose">
              {{ t(crossRows.length ? 'products.crossesWizard.saveAndClose' : 'common.actions.close') }}
            </el-button>
          </template>
        </div>
      </div>
    </template>
    <ProductSelectorDialog v-model="productSelectorOpen" @select="selectProduct" />
  </el-dialog>
  <ProductGroupImportDialog v-if="canImportGroups" v-model="importOpen" @saved="emit('saved')" />
</template>

<script setup lang="ts">
import { useDialogGuard } from '@/composables/useDialogGuard'
import { computed, nextTick, ref, watch } from 'vue'
import { Box, CircleCheck, Close, Delete, Link, Plus, Search } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import ProductGroupSelector from '@/components/selectors/ProductGroupSelector.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import ProductGroupImportDialog from '@/components/products/ProductGroupImportDialog.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import {
  createProductCrosses,
  createProducts,
  type ProductLinkageType,
} from '@/services/api/products.ts'
import { useI18n } from '@/i18n'

interface ProductRow {
  key: string
  sku: string
  name: string
  producerId?: number
  groupId?: number
  description: string
  indicator: string | null
}

interface CreatedProduct {
  id: number
  sku: string
  name: string
}

interface CrossRow {
  key: string
  productId?: number
  productLabel: string
  crossProductId?: number
  crossProductLabel: string
  linkageType: ProductLinkageType
}

const props = defineProps<{
  initialProductId?: number
  initialProductLabel?: string
}>()

const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const emit = defineEmits<{
  saved: []
}>()

const activeStep = ref(0)
const productRows = ref<ProductRow[]>([])
const crossRows = ref<CrossRow[]>([])
const createdProducts = ref<CreatedProduct[]>([])
const isSavingProducts = ref(false)
const isSavingCrosses = ref(false)
const productSelectorOpen = ref(false)
const productSelectorTarget = ref<{ key: string; field: 'product' | 'cross' }>()
const isBusy = computed(() => isSavingProducts.value || isSavingCrosses.value)
const attemptedProducts = ref(false)
const attemptedCrosses = ref(false)
const saveError = ref('')
const crossFields = ['product', 'cross'] as const
const canLinkCreated = computed(() => createdProducts.value.length >= 2 || Boolean(props.initialProductId && createdProducts.value.length))
let productRowCounter = 0
let crossRowCounter = 0
const { hasPermission } = usePermissions()
const canImportGroups = computed(() => hasPermission('ARTICLES_GET_MAIN') && hasPermission('ARTICLES_CREATE', 'ARTICLE_CROSSES_CREATE'))
const importOpen = ref(false)
const canCreateProducts = computed(() => hasPermission('ARTICLES_CREATE'))
const canCreateCrosses = computed(() => hasPermission('ARTICLE_CROSSES_CREATE'))

const linkageTypeOptions = computed<{ value: ProductLinkageType; label: string }[]>(() => [
  { value: 'SingleCross', label: t('products.crossesWizard.linkageTypes.regular') },
  { value: 'FullCross', label: t('products.crossesWizard.linkageTypes.fullGroup') },
  { value: 'FullLeftToRightCross', label: t('products.crossesWizard.linkageTypes.productCrossesToCross') },
  { value: 'FullRightToLeftCross', label: t('products.crossesWizard.linkageTypes.productToSelectedCrosses') },
])

function emptyProductRow(): ProductRow {
  productRowCounter += 1
  return {
    key: `product-row-${productRowCounter}`,
    sku: '',
    name: '',
    producerId: undefined,
    groupId: undefined,
    description: '',
    indicator: null,
  }
}

function emptyCrossRow(): CrossRow {
  crossRowCounter += 1
  return {
    key: `cross-row-${crossRowCounter}`,
    productId: props.initialProductId ?? createdProducts.value[0]?.id,
    productLabel: props.initialProductLabel ?? (createdProducts.value[0] ? productLabel(createdProducts.value[0]) : ''),
    crossProductId: undefined,
    crossProductLabel: '',
    linkageType: 'SingleCross',
  }
}

const closeGuard = useDialogGuard(isOpen, isBusy, () => ({ products: productRows.value, crosses: crossRows.value }))

function resetForm() {
  activeStep.value = canCreateCrosses.value && (props.initialProductId || !canCreateProducts.value) ? 1 : 0
  productRows.value = []
  crossRows.value = []
  createdProducts.value = []
  attemptedProducts.value = false
  attemptedCrosses.value = false
  saveError.value = ''
  productSelectorOpen.value = false
  productSelectorTarget.value = undefined
}

async function addProductRow() {
  if (productRows.value.length >= 100) return
  productRows.value.push(emptyProductRow())
  await nextTick()
  document.querySelector<HTMLInputElement>('.create-products-dialog .product-draft:last-child input')?.focus()
}

function removeProductRow(row: ProductRow) {
  productRows.value = productRows.value.filter((item) => item.key !== row.key)
}

async function confirmClear() {
  try {
    await ElMessageBox.confirm(t('products.crossesWizard.clearRowsConfirm'), t('products.crossesWizard.clearAll'), {
      type: 'warning',
      confirmButtonText: t('products.crossesWizard.clearAll'),
      cancelButtonText: t('common.actions.cancel'),
    })
    return true
  } catch { return false }
}

async function clearProductRows() {
  if (await confirmClear()) productRows.value = []
}

function addCrossRow() {
  crossRows.value.push(emptyCrossRow())
}

function removeCrossRow(index: number) {
  crossRows.value.splice(index, 1)
}

async function clearCrossRows() {
  if (await confirmClear()) crossRows.value = []
}

function openProductSelector(index: number, field: 'product' | 'cross') {
  const row = crossRows.value[index]
  if (!row) return
  productSelectorTarget.value = { key: row.key, field }
  productSelectorOpen.value = true
}

function selectProduct(product: ProductSearchModel) {
  const target = productSelectorTarget.value
  if (!target) return

  const row = crossRows.value.find((item) => item.key === target.key)
  if (!row) return

  if (target.field === 'product') {
    row.productId = product.id
    row.productLabel = `${product.sku} - ${product.name}`
  } else {
    row.crossProductId = product.id
    row.crossProductLabel = `${product.sku} - ${product.name}`
  }
}

function clearCrossProduct(row: CrossRow, field: 'product' | 'cross') {
  if (field === 'product') {
    row.productId = undefined
    row.productLabel = ''
  } else {
    row.crossProductId = undefined
    row.crossProductLabel = ''
  }
}

function addCreatedProductsAsCrosses() {
  if (createdProducts.value.length === 0) return

  const rows: CrossRow[] = []

  if (props.initialProductId) {
    rows.push(...createdProducts.value.map((product) => ({
      key: `cross-row-${++crossRowCounter}`,
      productId: props.initialProductId,
      productLabel: props.initialProductLabel ?? `#${props.initialProductId}`,
      crossProductId: product.id,
      crossProductLabel: productLabel(product),
      linkageType: 'SingleCross' as const,
    })))
  }

  if (!props.initialProductId && createdProducts.value.length >= 2) {
    const [base, ...crosses] = createdProducts.value
    if (!base) return

    rows.push(...crosses.map((product) => ({
      key: `cross-row-${++crossRowCounter}`,
      productId: base.id,
      productLabel: productLabel(base),
      crossProductId: product.id,
      crossProductLabel: productLabel(product),
      linkageType: 'FullCross' as const,
    })))
  }

  for (const row of rows) {
    if (row.productId === row.crossProductId) continue
    if (!crossRows.value.some((existing) => existing.productId === row.productId && existing.crossProductId === row.crossProductId)) {
      crossRows.value.push(row)
    }
  }
}

function productLabel(product: CreatedProduct) {
  return `${product.sku} - ${product.name}`
}

function productError(row: ProductRow, field: 'sku' | 'name' | 'producerId') {
  if (!attemptedProducts.value) return ''
  if (field === 'sku' && row.sku.trim().length < 3) return t('products.crossesWizard.skuError')
  if (field === 'name' && !row.name.trim()) return t('products.crossesWizard.nameError')
  if (field === 'producerId' && !row.producerId) return t('products.crossesWizard.producerError')
  return ''
}

function crossError(row: CrossRow) {
  if (!attemptedCrosses.value) return ''
  if (!row.productId || !row.crossProductId) return t('products.crossesWizard.pairError')
  if (row.productId === row.crossProductId) return t('products.crossesWizard.sameProductError')
  return ''
}

async function focusFirstError() {
  await nextTick()
  const section = document.querySelector(`[data-creation-step="${activeStep.value}"]`)
  const field = section?.querySelector<HTMLElement>('.is-error input, .cross-draft.has-error .cross-selection:not(.is-selected) .cross-selection__pick')
    ?? section?.querySelector<HTMLElement>('.cross-draft.has-error .cross-selection__pick')
  field?.focus()
  field?.scrollIntoView({ block: 'nearest' })
}

async function saveProducts() {
  if (isBusy.value || !canCreateProducts.value || !productRows.value.length) return
  attemptedProducts.value = true
  saveError.value = ''
  if (productRows.value.some((row) => productError(row, 'sku') || productError(row, 'name') || productError(row, 'producerId'))) {
    await focusFirstError()
    return
  }
  const rows = productRows.value.map((row) => ({
    ...row, sku: row.sku.trim(), name: row.name.trim(), description: row.description.trim(),
  }))

  isSavingProducts.value = true
  try {
    const resp = await createProducts({
      newProducts: rows.map((row) => ({
        sku: row.sku,
        name: row.name,
        producerId: row.producerId!,
        description: row.description || null,
        indicator: row.indicator || null,
        groupId: row.groupId ?? null,
      })),
    })

    createdProducts.value.push(...resp.products)
    productRows.value = []
    attemptedProducts.value = false

    ElNotification({
      title: t('products.crossesWizard.productsCreatedTitle'),
      message: t('products.crossesWizard.createdCount', { count: resp.products.length }),
      type: 'success',
    })

    emit('saved')
    if (canCreateCrosses.value) activeStep.value = 1
    else isOpen.value = false
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : t('products.crossesWizard.saveError')
  } finally {
    isSavingProducts.value = false
  }
}

async function saveCrosses() {
  await persistCrosses(false)
}

async function saveCrossesAndClose() {
  await persistCrosses(true)
}

async function persistCrosses(closeAfterSave: boolean) {
  if (isBusy.value || !canCreateCrosses.value) return
  const rows = [...crossRows.value]
  attemptedCrosses.value = true
  saveError.value = ''

  if (rows.length === 0) {
    if (closeAfterSave) isOpen.value = false
    return
  }

  if (rows.some((row) => crossError(row))) {
    await focusFirstError()
    return
  }

  isSavingCrosses.value = true
  try {
    await createProductCrosses({
      linkages: rows.map((row) => ({
        productId: row.productId!,
        crossProductId: row.crossProductId!,
        linkageType: row.linkageType,
      })),
    })

    ElNotification({
      title: t('products.crossesWizard.crossesSavedTitle'),
      message: t('products.crossesWizard.crossesCreatedCount', { count: rows.length }),
      type: 'success',
    })

    crossRows.value = []
    attemptedCrosses.value = false
    emit('saved')
    if (closeAfterSave) isOpen.value = false
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : t('products.crossesWizard.saveError')
  } finally {
    isSavingCrosses.value = false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
}, { immediate: true })
watch(activeStep, () => { saveError.value = '' })
</script>

<style scoped>
:global(.create-products-dialog.el-dialog) { display: flex; flex-direction: column; max-height: 90dvh; margin-bottom: 5vh; padding: 0; border-radius: 10px; overflow: hidden; }
:global(.create-products-dialog > .el-dialog__header) { flex: none; margin: 0; padding: 20px 52px 18px 24px; border-bottom: 1px solid var(--app-border); }
:global(.create-products-dialog > .el-dialog__body) { min-height: 0; display: flex; flex-direction: column; padding: 0; overflow: hidden; }
:global(.create-products-dialog > .el-dialog__footer) { flex: none; padding: 14px 24px; border-top: 1px solid var(--app-border); }
.creation-tabs { display: flex; flex: none; gap: 24px; padding: 0 24px; border-bottom: 1px solid var(--app-border); }
.creation-tabs button { display: inline-flex; align-items: center; gap: 8px; padding: 14px 0; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--app-text-muted); font: inherit; font-size: 13px; cursor: pointer; }
.creation-tabs button.is-active { border-bottom-color: var(--app-primary); color: var(--app-primary); font-weight: 600; }
.creation-tabs__count { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 5px; border-radius: 4px; background: var(--app-bg-soft); font-size: 12px; font-variant-numeric: tabular-nums; }
.creation-body { min-height: 0; overflow: auto; padding: 20px 24px; overscroll-behavior: contain; }
.creation-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.creation-toolbar h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--app-text); }
.creation-toolbar p, .creation-empty p { margin: 4px 0 0; font-size: 13px; color: var(--app-text-muted); }
.creation-toolbar__actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.creation-toolbar__actions :deep(.el-button + .el-button) { margin-left: 0; }
.creation-count { font-size: 12px; color: var(--app-text-muted); font-variant-numeric: tabular-nums; }
.creation-rows { display: grid; gap: 12px; }
.product-draft, .cross-draft { min-width: 0; border: 1px solid var(--app-border); border-radius: 6px; padding: 14px 16px; }
.draft-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.draft-heading strong { font-size: 12px; font-weight: 600; color: var(--app-text-muted); }
.draft-heading :deep(.el-button) { height: 24px; padding: 4px; }
.product-draft__fields { display: grid; grid-template-columns: minmax(140px, .85fr) minmax(200px, 1.4fr) minmax(180px, 1fr); gap: 14px; }
.creation-rows :deep(.el-form-item) { min-width: 0; margin-bottom: 0; }
.creation-rows :deep(.el-form-item__label) { height: auto; margin-bottom: 6px; color: var(--app-text); font-size: 12px; font-weight: 500; line-height: 1.5; }
.creation-rows :deep(.el-form-item__error) { position: static; }
.product-draft__details { margin-top: 14px; border-top: 1px solid var(--app-border); padding-top: 10px; }
.product-draft__details summary { width: fit-content; color: var(--app-text-muted); font-size: 12px; cursor: pointer; }
.product-draft__optional { display: grid; grid-template-columns: minmax(180px, 1fr) 100px; gap: 14px; padding-top: 14px; }
.product-draft__description { grid-column: 1 / -1; }
.creation-list-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; color: var(--app-text-muted); font-size: 12px; }
.creation-empty { display: flex; min-height: 220px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border: 1px dashed var(--app-border); border-radius: 6px; padding: 24px; text-align: center; background: var(--app-bg-soft); }
.creation-empty__icon { color: var(--app-text-muted); font-size: 24px; }
.creation-empty h4 { margin: 0; font-size: 14px; color: var(--app-text); font-weight: 600; }
.creation-empty :deep(.el-button) { margin-top: 6px; }
.creation-success { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 10px 12px; border-radius: 6px; color: var(--app-primary); background: var(--app-primary-soft); font-size: 13px; }
.creation-error { margin-bottom: 16px; }
.creation-field { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.creation-field > span, .cross-draft__options > label { font-size: 12px; color: var(--app-text); font-weight: 500; }
.cross-draft__pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.cross-selection { display: flex; align-items: center; min-width: 0; border: 1px solid var(--app-border); border-radius: 4px; background: var(--app-bg-soft); }
.cross-selection.is-selected { background: var(--el-bg-color); }
.cross-selection:focus-within { outline: 2px solid var(--app-primary); outline-offset: 2px; }
.cross-selection__pick { display: flex; min-width: 0; flex: 1; align-items: center; gap: 10px; min-height: 46px; border: 0; padding: 10px 12px; background: transparent; text-align: left; font: inherit; color: var(--app-text-muted); font-size: 13px; cursor: pointer; }
.cross-selection__pick span { overflow-wrap: anywhere; }
.cross-selection__pick .el-icon { flex: none; }
.cross-selection.is-selected .cross-selection__pick { color: var(--app-text); }
.cross-selection > :deep(.el-button) { flex: none; padding: 8px; }
.cross-draft__options { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin-top: 14px; }
.cross-draft__options :deep(.el-select) { width: min(100%, 360px); }
.field-error { margin: 10px 0 0; font-size: 12px; color: var(--el-color-danger); line-height: 1.5; }
.cross-draft.has-error { border-color: var(--el-color-danger); }
.creation-footer, .creation-footer__actions { display: flex; align-items: center; gap: 8px; }
.creation-footer { justify-content: space-between; }
.creation-footer :deep(.el-button + .el-button) { margin-left: 0; }
@media (max-width: 760px) {
  .product-draft__fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .product-draft__fields > :nth-child(2) { grid-column: 1 / -1; grid-row: 2; }
  .creation-footer__actions { flex-wrap: wrap; justify-content: flex-end; }
}
@media (max-width: 520px) {
  :global(.create-products-dialog > .el-dialog__header) { padding: 16px 44px 14px 16px; }
  :global(.create-products-dialog > .el-dialog__footer) { padding: 12px 16px; }
  .creation-tabs { padding: 0 16px; gap: 20px; }
  .creation-body { padding: 16px; }
  .product-draft, .cross-draft { padding: 12px; }
  .product-draft__fields, .cross-draft__pair { grid-template-columns: minmax(0, 1fr); }
  .product-draft__optional { grid-template-columns: minmax(0, 1fr) 64px; }
  .product-draft__fields > :nth-child(2) { grid-row: auto; }
  .creation-footer { align-items: stretch; flex-direction: column-reverse; }
  .creation-footer__actions { flex-direction: column-reverse; align-items: stretch; }
  .creation-footer > :deep(.el-button) { align-self: flex-start; }
}
</style>
