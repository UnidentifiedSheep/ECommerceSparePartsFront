<template>
  <el-dialog
    v-model="isOpen"
    width="min(1100px, calc(100vw - 24px))"
    top="3vh"
    class="create-products-dialog"
    :show-close="false"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-950">{{ t('products.crossesWizard.title') }}</h2>
        <el-button :icon="Close" circle text @click="isOpen = false" />
      </div>
    </template>

    <div class="dialog-body">
      <div class="stepper">
        <div :class="['stepper-item', activeStep === 0 && 'is-active', activeStep > 0 && 'is-done']">
          <div class="stepper-number">
            <el-icon v-if="activeStep > 0"><Check /></el-icon>
            <span v-else>1</span>
          </div>
          <div>
            <div class="stepper-title">{{ t('products.crossesWizard.products') }}</div>
            <div class="stepper-subtitle">{{ activeStep > 0 ? productsStepSummary : t('products.crossesWizard.addProducts') }}</div>
          </div>
        </div>
        <div v-if="canCreateCrosses" class="stepper-line" />
        <div v-if="canCreateCrosses" :class="['stepper-item', activeStep === 1 && 'is-active']">
          <div class="stepper-number">2</div>
          <div>
            <div class="stepper-title">{{ t('products.crossesWizard.crosses') }}</div>
            <div class="stepper-subtitle">{{ t('products.crossesWizard.setupLinks') }}</div>
          </div>
        </div>
      </div>

      <section v-show="activeStep === 0 && canCreateProducts" class="dialog-stage space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-950">{{ t('products.crossesWizard.newProducts') }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ t('products.crossesWizard.limitHint') }}</p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-slate-500">
              {{ filledProductRowsCount }} {{ t('products.crossesWizard.of') }} 100
            </span>
            <el-button :icon="Plus" type="primary" @click="addProductRow">{{ t('products.crossesWizard.addRow') }}</el-button>
          </div>
        </div>

        <div class="product-row-list">
          <div v-if="visibleProductRows.length === 0" class="empty-state">
            <div class="empty-state__title">{{ t('products.crossesWizard.noRows') }}</div>
            <el-button :icon="Plus" type="primary" plain @click="addProductRow">{{ t('products.crossesWizard.addRow') }}</el-button>
          </div>

          <article v-for="row in visibleProductRows" :key="row.key" class="product-edit-row">
            <div class="product-edit-row__header">
              <div class="product-edit-row__title">
                <span>{{ t('products.crossesWizard.product') }}</span>
                <strong>{{ productRows.indexOf(row) + 1 }}</strong>
              </div>
              <el-button
                :icon="Delete"
                size="small"
                text
                type="danger"
                @click="removeProductRow(row)"
              />
            </div>

            <div class="product-edit-grid">
              <label class="form-field form-field--sku">
                <span>{{ t('products.sku') }}</span>
                <el-input v-model="row.sku" :placeholder="t('products.crossesWizard.enterSku')" />
              </label>

              <label class="form-field form-field--name">
                <span>{{ t('common.labels.name') }}</span>
                <el-input v-model="row.name" :placeholder="t('products.crossesWizard.enterName')" />
              </label>

              <label class="form-field form-field--producer">
                <span>{{ t('common.labels.producer') }}</span>
                <ProducerSelector v-model="row.producerId" :placeholder="t('products.selectProducer')" />
              </label>

              <label class="form-field form-field--color">
                <span>{{ t('products.crossesWizard.color') }}</span>
                <el-color-picker v-model="row.indicator" show-alpha />
              </label>

              <label class="form-field form-field--description">
                <span>{{ t('common.labels.description') }}</span>
                <el-input
                  v-model="row.description"
                  type="textarea"
                  :autosize="{ minRows: 1, maxRows: 3 }"
                  :placeholder="t('products.crossesWizard.enterDescription')"
                />
              </label>
            </div>
          </article>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div class="flex items-center gap-6">
            <span class="text-slate-600">{{ t('products.crossesWizard.totalRows', { count: productRows.length }) }}</span>
            <button class="text-red-500 hover:text-red-600" type="button" @click="clearProductRows">
              {{ t('products.crossesWizard.clearAll') }}
            </button>
          </div>

          <label class="flex items-center gap-2 text-slate-600">
            <span>{{ t('products.crossesWizard.showFilled') }}</span>
            <el-switch v-model="showFilledOnly" />
          </label>
        </div>

        <div v-if="createdProducts.length > 0" class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {{ t('products.crossesWizard.createdProducts', { value: createdProducts.map((product) => `${product.sku} #${product.id}`).join(', ') }) }}
        </div>
      </section>

      <section v-show="activeStep === 1 && canCreateCrosses" class="dialog-stage space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-950">{{ t('products.crossesWizard.crosses') }}</h3>
            <p class="text-sm text-slate-500">{{ t('products.crossesWizard.crossHint') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <el-button :icon="Link" plain @click="addCreatedProductsAsCrosses" :disabled="createdProducts.length === 0">
              {{ t('products.crossesWizard.linkCreated') }}
            </el-button>
            <el-button :icon="Plus" type="primary" @click="addCrossRow">{{ t('products.crossesWizard.addRow') }}</el-button>
          </div>
        </div>

        <div class="cross-row-list">
          <div v-if="crossRows.length === 0" class="empty-state">
            <div class="empty-state__title">{{ t('products.crossesWizard.noRows') }}</div>
            <el-button :icon="Plus" type="primary" plain @click="addCrossRow">{{ t('products.crossesWizard.addRow') }}</el-button>
          </div>

          <article v-for="(row, index) in crossRows" :key="row.key" class="cross-edit-row">
            <div class="cross-edit-row__main">
              <div class="cross-pick">
                <div class="cross-pick__label">{{ t('products.crossesWizard.product') }}</div>
                <div class="cross-pick__box">
                  <div class="cross-pick__value">
                    <strong>{{ row.productLabel || t('products.crossesWizard.pickProduct') }}</strong>
                    <span v-if="row.productId">ID {{ row.productId }}</span>
                  </div>
                  <div class="cross-pick__actions">
                    <el-button size="small" @click="openProductSelector(index, 'product')">{{ t('products.pick') }}</el-button>
                    <el-button v-if="row.productId" size="small" text type="danger" @click="clearCrossProduct(row, 'product')">
                      {{ t('products.clear') }}
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="cross-arrow" aria-hidden="true">→</div>

              <div class="cross-pick">
                <div class="cross-pick__label">{{ t('products.crossesWizard.cross') }}</div>
                <div class="cross-pick__box">
                  <div class="cross-pick__value">
                    <strong>{{ row.crossProductLabel || t('products.crossesWizard.pickProduct') }}</strong>
                    <span v-if="row.crossProductId">ID {{ row.crossProductId }}</span>
                  </div>
                  <div class="cross-pick__actions">
                    <el-button size="small" @click="openProductSelector(index, 'cross')">{{ t('products.pick') }}</el-button>
                    <el-button v-if="row.crossProductId" size="small" text type="danger" @click="clearCrossProduct(row, 'cross')">
                      {{ t('products.clear') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="cross-edit-row__side">
              <label class="form-field">
                <span>{{ t('products.crossesWizard.linkageType') }}</span>
                <el-select v-model="row.linkageType" class="w-full">
                  <el-option
                    v-for="option in linkageTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </label>

              <el-button
                :icon="Delete"
                size="small"
                text
                type="danger"
                @click="removeCrossRow(index)"
              />
            </div>
          </article>
        </div>

        <div class="flex items-center gap-3 text-sm">
          <span class="text-slate-600">{{ t('products.crossesWizard.totalRows', { count: crossRows.length }) }}</span>
          <el-button :icon="Delete" plain @click="clearCrossRows">{{ t('products.crossesWizard.clearAll') }}</el-button>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <div class="flex gap-3">
          <el-button v-if="activeStep === 1" size="large" @click="activeStep = 0">{{ t('products.crossesWizard.back') }}</el-button>
          <el-button v-if="activeStep === 0 && canCreateCrosses" size="large" plain @click="activeStep = 1">{{ t('products.crossesWizard.skip') }}</el-button>
          <el-button v-if="activeStep === 0 && canCreateProducts" size="large" type="primary" :loading="isSavingProducts" @click="saveProducts">
            {{ canCreateCrosses ? t('products.crossesWizard.createAndNext') : t('common.actions.create') }}
          </el-button>
          <el-button v-if="activeStep === 1" size="large" plain :loading="isSavingCrosses" @click="saveCrosses">
            {{ t('products.crossesWizard.saveCrosses') }}
          </el-button>
          <el-button v-if="activeStep === 1" size="large" type="primary" :loading="isSavingCrosses" @click="saveCrossesAndClose">
            {{ t('products.crossesWizard.saveAndClose') }}
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="selectProduct" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Close, Delete, Link, Plus } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
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
const productSelectorTarget = ref<{ index: number; field: 'product' | 'cross' }>()
const showFilledOnly = ref(false)
let productRowCounter = 0
let crossRowCounter = 0
const { hasPermission } = usePermissions()
const canCreateProducts = computed(() => hasPermission('ARTICLES_CREATE'))
const canCreateCrosses = computed(() => hasPermission('ARTICLE_CROSSES_CREATE'))

const linkageTypeOptions = computed<{ value: ProductLinkageType; label: string }[]>(() => [
  { value: 0, label: t('products.crossesWizard.linkageTypes.regular') },
  { value: 1, label: t('products.crossesWizard.linkageTypes.fullGroup') },
  { value: 2, label: t('products.crossesWizard.linkageTypes.productCrossesToCross') },
  { value: 3, label: t('products.crossesWizard.linkageTypes.productToSelectedCrosses') },
])

const filledProductRowsCount = computed(() => validProductRows().length)
const visibleProductRows = computed(() => {
  return showFilledOnly.value
    ? productRows.value.filter(isProductRowFilled)
    : productRows.value
})
const productsStepSummary = computed(() => {
  return createdProducts.value.length > 0
    ? t('products.crossesWizard.createdProductsSummary', { count: createdProducts.value.length })
    : t('products.crossesWizard.products')
})

function emptyProductRow(): ProductRow {
  productRowCounter += 1
  return {
    key: `product-row-${productRowCounter}`,
    sku: '',
    name: '',
    producerId: undefined,
    description: '',
    indicator: null,
  }
}

function emptyCrossRow(): CrossRow {
  crossRowCounter += 1
  return {
    key: `cross-row-${crossRowCounter}`,
    productId: props.initialProductId,
    productLabel: props.initialProductLabel ?? '',
    crossProductId: undefined,
    crossProductLabel: '',
    linkageType: 0,
  }
}

function resetForm() {
  activeStep.value = props.initialProductId ? 1 : 0
  productRows.value = props.initialProductId || !canCreateProducts.value ? [] : [emptyProductRow()]
  crossRows.value = props.initialProductId && canCreateCrosses.value ? [emptyCrossRow()] : []
  createdProducts.value = []
  showFilledOnly.value = false
}

function addProductRow() {
  if (productRows.value.length >= 100) return
  productRows.value.push(emptyProductRow())
}

function removeProductRow(row: ProductRow) {
  productRows.value = productRows.value.filter((item) => item.key !== row.key)
}

function clearProductRows() {
  productRows.value = []
}

function addCrossRow() {
  crossRows.value.push(emptyCrossRow())
}

function removeCrossRow(index: number) {
  crossRows.value.splice(index, 1)
}

function clearCrossRows() {
  crossRows.value = []
}

function openProductSelector(index: number, field: 'product' | 'cross') {
  productSelectorTarget.value = { index, field }
  productSelectorOpen.value = true
}

function selectProduct(product: ProductSearchModel) {
  const target = productSelectorTarget.value
  if (!target) return

  const row = crossRows.value[target.index]
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
      linkageType: 0 as ProductLinkageType,
    })))
  }

  if (createdProducts.value.length >= 2) {
    const [base, ...crosses] = createdProducts.value
    if (!base) return

    rows.push(...crosses.map((product) => ({
      key: `cross-row-${++crossRowCounter}`,
      productId: base.id,
      productLabel: productLabel(base),
      crossProductId: product.id,
      crossProductLabel: productLabel(product),
      linkageType: 1 as ProductLinkageType,
    })))
  }

  crossRows.value = rows
}

function productLabel(product: CreatedProduct) {
  return `${product.sku} - ${product.name}`
}

function isProductRowFilled(row: ProductRow) {
  return Boolean(row.sku.trim() || row.name.trim() || row.producerId || row.description.trim() || row.indicator)
}

function validProductRows() {
  return productRows.value
    .map((row) => ({
      ...row,
      sku: row.sku.trim(),
      name: row.name.trim(),
      description: row.description.trim(),
    }))
    .filter(isProductRowFilled)
}

async function saveProducts() {
  const rows = validProductRows()

  if (rows.length === 0) {
    if (canCreateCrosses.value) {
      activeStep.value = 1
    } else {
      isOpen.value = false
    }
    return
  }

  const invalid = rows.some((row) => row.sku.length < 3 || !row.name || !row.producerId)
  if (invalid) {
    ElNotification({
      title: t('products.crossesWizard.checkProductsTitle'),
      message: t('products.crossesWizard.checkProductsMessage'),
      type: 'warning',
    })
    return
  }

  isSavingProducts.value = true
  try {
    const resp = await createProducts({
      newProducts: rows.map((row) => ({
        sku: row.sku,
        name: row.name,
        producerId: row.producerId!,
        description: row.description || null,
        indicator: row.indicator || null,
        categoryId: null,
      })),
    })

    createdProducts.value = resp.createdIds.map((id, index) => ({
      id,
      sku: rows[index]?.sku ?? String(id),
      name: rows[index]?.name ?? '',
    }))

    addCreatedProductsAsCrosses()

    ElNotification({
      title: t('products.crossesWizard.productsCreatedTitle'),
      message: t('products.crossesWizard.createdCount', { count: createdProducts.value.length }),
      type: 'success',
    })

    activeStep.value = 1
    emit('saved')
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
  const rows = crossRows.value.filter((row) => row.productId || row.crossProductId)

  if (rows.length === 0) {
    if (closeAfterSave) isOpen.value = false
    return
  }

  const invalid = rows.some((row) => !row.productId || !row.crossProductId || row.productId === row.crossProductId)
  if (invalid) {
    ElNotification({
      title: t('products.crossesWizard.checkCrossesTitle'),
      message: t('products.crossesWizard.checkCrossesMessage'),
      type: 'warning',
    })
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

    emit('saved')
    if (closeAfterSave) isOpen.value = false
  } finally {
    isSavingCrosses.value = false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
})
</script>

<style scoped>
.dialog-body {
  max-height: min(72vh, 720px);
  overflow: auto;
  border-top: 1px solid rgb(226 232 240);
  border-bottom: 1px solid rgb(226 232 240);
  padding: 0 28px 24px;
}

.dialog-stage {
  border-radius: 8px;
  padding: 0;
}

.stepper {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: max-content 40px max-content;
  align-items: center;
  gap: 14px;
  margin: 0 -28px 22px;
  border-bottom: 1px solid rgb(226 232 240);
  padding: 16px 28px;
  background: white;
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgb(71 85 105);
}

.stepper-number {
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(203 213 225);
  border-radius: 7px;
  background: white;
  color: rgb(71 85 105);
  font-size: 13px;
  font-weight: 600;
}

.stepper-item.is-active .stepper-number {
  border-color: rgb(15 23 42);
  background: rgb(15 23 42);
  color: white;
}

.stepper-title {
  color: rgb(15 23 42);
  font-size: 14px;
  font-weight: 700;
}

.stepper-subtitle {
  margin-top: 2px;
  color: rgb(100 116 139);
  font-size: 13px;
}

.stepper-line {
  height: 1px;
  background: rgb(226 232 240);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
}

:deep(.create-products-dialog .el-dialog__header) {
  padding: 22px 28px 18px;
}

:deep(.create-products-dialog .el-dialog__body) {
  padding: 0;
}

:deep(.create-products-dialog .el-dialog__footer) {
  padding: 18px 28px 22px;
}

.product-row-list,
.cross-row-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-edit-row,
.cross-edit-row,
.empty-state {
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: white;
}

.product-edit-row {
  padding: 14px;
}

.product-edit-row__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.product-edit-row__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgb(71 85 105);
  font-size: 13px;
}

.product-edit-row__title strong {
  color: rgb(15 23 42);
  font-size: 14px;
}

.product-edit-grid {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(220px, 1.35fr) minmax(220px, 1.15fr) 92px;
  gap: 12px;
}

.form-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.form-field > span,
.cross-pick__label {
  color: rgb(51 65 85);
  font-size: 13px;
  font-weight: 600;
}

.form-field--description {
  grid-column: 1 / -1;
}

.form-field--color :deep(.el-color-picker) {
  width: 100%;
}

.cross-edit-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 14px;
  padding: 14px;
}

.cross-edit-row__main {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr);
  align-items: end;
  gap: 10px;
}

.cross-edit-row__side {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  align-items: end;
  gap: 8px;
}

.cross-pick {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.cross-pick__box {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  border: 1px solid rgb(226 232 240);
  border-radius: 7px;
  padding: 6px 8px 6px 10px;
  background: rgb(248 250 252);
}

.cross-pick__value {
  min-width: 0;
}

.cross-pick__value strong {
  display: block;
  overflow: hidden;
  color: rgb(15 23 42);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cross-pick__value span {
  display: block;
  margin-top: 2px;
  color: rgb(100 116 139);
  font-size: 12px;
}

.cross-pick__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}

.cross-arrow {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  color: rgb(100 116 139);
}

.empty-state {
  display: flex;
  min-height: 128px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  background: rgb(248 250 252);
}

.empty-state__title {
  color: rgb(100 116 139);
  font-size: 14px;
}

@media (max-width: 720px) {
  .dialog-body {
    padding: 0 16px 20px;
  }

  .stepper {
    grid-template-columns: 1fr;
    gap: 10px;
    margin: 0 -16px 20px;
    padding: 14px 16px;
  }

  .stepper-line {
    display: none;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .dialog-footer > div {
    flex-wrap: wrap;
  }

  .product-edit-grid,
  .cross-edit-row,
  .cross-edit-row__main,
  .cross-edit-row__side {
    grid-template-columns: 1fr;
  }

  .cross-arrow {
    display: none;
  }

  .cross-pick__box {
    align-items: stretch;
    flex-direction: column;
  }

  .cross-pick__actions {
    justify-content: flex-end;
  }

  :deep(.create-products-dialog .el-dialog__header) {
    padding: 18px 16px 14px;
  }

  :deep(.create-products-dialog .el-dialog__body) {
    padding: 0;
  }

  :deep(.create-products-dialog .el-dialog__footer) {
    padding: 16px;
  }
}
</style>
