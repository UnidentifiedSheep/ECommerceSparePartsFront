<template>
  <el-dialog
    v-model="isOpen"
    width="1180"
    top="3vh"
    class="create-products-dialog"
    :show-close="false"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-950">Создание продуктов и кроссов</h2>
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
            <div class="stepper-title">Продукты</div>
            <div class="stepper-subtitle">{{ activeStep > 0 ? productsStepSummary : 'Добавьте новые продукты' }}</div>
          </div>
        </div>
        <div v-if="canCreateCrosses" class="stepper-line" />
        <div v-if="canCreateCrosses" :class="['stepper-item', activeStep === 1 && 'is-active']">
          <div class="stepper-number">2</div>
          <div>
            <div class="stepper-title">Кроссы</div>
            <div class="stepper-subtitle">Настройте связи</div>
          </div>
        </div>
      </div>

      <section v-show="activeStep === 0 && canCreateProducts" class="dialog-stage space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-slate-950">Новые продукты</h3>
              <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {{ filledProductRowsCount }} из 100
              </span>
            </div>
            <p class="mt-1 text-sm text-slate-500">Можно создать до 100 продуктов за один запрос.</p>
          </div>

          <div class="flex items-center gap-2">
            <el-button :icon="Download" plain>Импорт из Excel</el-button>
            <el-button :icon="Plus" type="primary" @click="addProductRow">Добавить строку</el-button>
          </div>
        </div>

        <div class="overflow-hidden rounded-md border border-slate-200 bg-white">
          <el-table
            :data="visibleProductRows"
            class="product-create-table"
            row-key="key"
            empty-text="Строк нет"
          >
            <el-table-column width="36" align="center">
              <template #default>
                <el-icon class="cursor-grab text-slate-300"><Rank /></el-icon>
              </template>
            </el-table-column>
            <el-table-column label="Артикул" min-width="170">
              <template #default="{ row }">
                <el-input v-model="row.sku" placeholder="Введите артикул" />
              </template>
            </el-table-column>
            <el-table-column label="Название" min-width="220">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="Введите название" />
              </template>
            </el-table-column>
            <el-table-column label="Производитель" min-width="240">
              <template #default="{ row }">
                <ProducerSelector v-model="row.producerId" placeholder="Выберите производителя" />
              </template>
            </el-table-column>
            <el-table-column label="Цвет" width="130">
              <template #default="{ row }">
                <el-color-picker v-model="row.indicator" show-alpha />
              </template>
            </el-table-column>
            <el-table-column label="Описание" min-width="240">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="Введите описание" />
              </template>
            </el-table-column>
            <el-table-column label="Действия" width="96" align="center">
              <template #default="{ row }">
                <el-button
                  size="small"
                  text
                  type="danger"
                  :icon="Delete"
                  @click="removeProductRow(row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div class="flex items-center gap-6">
            <span class="text-slate-600">Всего строк: {{ productRows.length }}</span>
            <button class="text-red-500 hover:text-red-600" type="button" @click="clearProductRows">
              Очистить все
            </button>
          </div>

          <label class="flex items-center gap-2 text-slate-600">
            <span>Показать заполненные</span>
            <el-switch v-model="showFilledOnly" />
          </label>
        </div>

        <div v-if="createdProducts.length > 0" class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Созданы продукты: {{ createdProducts.map((product) => `${product.sku} #${product.id}`).join(', ') }}
        </div>
      </section>

      <section v-show="activeStep === 1 && canCreateCrosses" class="dialog-stage space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-950">Кроссы</h3>
            <p class="text-sm text-slate-500">Выберите пары товаров и тип связи.</p>
          </div>
          <div class="flex items-center gap-2">
            <el-button :icon="Link" plain @click="addCreatedProductsAsCrosses" :disabled="createdProducts.length === 0">
              Связать созданные
            </el-button>
            <el-button :icon="Plus" type="primary" @click="addCrossRow">Добавить строку</el-button>
          </div>
        </div>

        <div class="overflow-hidden rounded-md border border-slate-200 bg-white">
          <el-table :data="crossRows" class="product-cross-create-table" row-key="key">
          <el-table-column width="36" align="center">
            <template #default>
              <el-icon class="cursor-grab text-slate-300"><Rank /></el-icon>
            </template>
          </el-table-column>
          <el-table-column min-width="360">
            <template #header>
              <span class="inline-flex items-center gap-1">
                Товар
                <el-icon class="text-slate-400"><InfoFilled /></el-icon>
              </span>
            </template>
            <template #default="{ row, $index }">
              <ProductPickField
                :id="row.productId"
                :label="row.productLabel"
                @pick="openProductSelector($index, 'product')"
                @clear="clearCrossProduct(row, 'product')"
              />
            </template>
          </el-table-column>
          <el-table-column min-width="360">
            <template #header>
              <span class="inline-flex items-center gap-1">
                Кросс
                <el-icon class="text-slate-400"><InfoFilled /></el-icon>
              </span>
            </template>
            <template #default="{ row, $index }">
              <ProductPickField
                :id="row.crossProductId"
                :label="row.crossProductLabel"
                @pick="openProductSelector($index, 'cross')"
                @clear="clearCrossProduct(row, 'cross')"
              />
            </template>
          </el-table-column>
          <el-table-column min-width="300">
            <template #header>
              <span class="inline-flex items-center gap-1">
                Тип связи
                <el-icon class="text-slate-400"><InfoFilled /></el-icon>
              </span>
            </template>
            <template #default="{ row }">
              <el-select v-model="row.linkageType" class="w-full">
                <el-option
                  v-for="option in linkageTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="" width="84" align="center">
            <template #default="{ $index }">
              <el-button
                size="small"
                text
                type="danger"
                :icon="Delete"
                @click="removeCrossRow($index)"
              />
            </template>
          </el-table-column>
          </el-table>
        </div>

        <div class="flex items-center gap-3 text-sm">
          <span class="text-slate-600">Всего строк: {{ crossRows.length }}</span>
          <el-button :icon="Delete" plain @click="clearCrossRows">Очистить все</el-button>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="isOpen = false">Отмена</el-button>
        <div class="flex gap-3">
          <el-button v-if="activeStep === 1" size="large" @click="activeStep = 0">Назад</el-button>
          <el-button v-if="activeStep === 0 && canCreateCrosses" size="large" plain @click="activeStep = 1">Пропустить</el-button>
          <el-button v-if="activeStep === 0 && canCreateProducts" size="large" type="primary" :loading="isSavingProducts" @click="saveProducts">
            {{ canCreateCrosses ? 'Создать и дальше' : 'Создать' }}
          </el-button>
          <el-button v-if="activeStep === 1" size="large" plain :loading="isSavingCrosses" @click="saveCrosses">
            Сохранить кроссы
          </el-button>
          <el-button v-if="activeStep === 1" size="large" type="primary" :loading="isSavingCrosses" @click="saveCrossesAndClose">
            Сохранить и завершить
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="selectProduct" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { Check, Close, Delete, Download, InfoFilled, Link, Plus, Rank, Search } from '@element-plus/icons-vue'
import { ElButton, ElNotification } from 'element-plus'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import {
  createProductCrosses,
  createProducts,
  type ProductLinkageType,
} from '@/services/api/products.ts'

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

const linkageTypeOptions: { value: ProductLinkageType; label: string }[] = [
  { value: 0, label: 'Обычная связь' },
  { value: 1, label: 'Полная связь групп' },
  { value: 2, label: 'Все кроссы товара -> кросс' },
  { value: 3, label: 'Товар -> все кроссы выбранного' },
]

const filledProductRowsCount = computed(() => validProductRows().length)
const visibleProductRows = computed(() => {
  return showFilledOnly.value
    ? productRows.value.filter(isProductRowFilled)
    : productRows.value
})
const productsStepSummary = computed(() => {
  return createdProducts.value.length > 0
    ? `Создано ${createdProducts.value.length} продуктов`
    : 'Продукты'
})

function ProductPickField(props: { id?: number; label: string; onPick: () => void; onClear: () => void }) {
  return h('div', { class: 'flex items-center gap-2' }, [
    props.id
      ? h('div', { class: 'product-pick-card' }, [
          h('div', { class: 'min-w-0' }, [
            h('div', { class: 'truncate font-medium text-slate-900' }, props.label || `#${props.id}`),
            h('div', { class: 'text-xs text-slate-500' }, `ID ${props.id}`),
          ]),
        ])
      : h('div', { class: 'product-pick-empty' }, [
          h(Search, { class: 'h-4 w-4 text-slate-400' }),
          h('span', {}, 'Выберите товар'),
        ]),
    h(ElButton, { onClick: props.onPick }, () => 'Выбрать'),
    props.id ? h(ElButton, { text: true, type: 'danger', onClick: props.onClear }, () => 'Очистить') : null,
  ])
}

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
  productRows.value = []
  crossRows.value = []
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
      title: 'Проверьте продукты',
      message: 'Для каждой заполненной строки нужны артикул от 3 символов, название и производитель.',
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
      title: 'Продукты созданы',
      message: `Создано: ${createdProducts.value.length}`,
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
      title: 'Проверьте кроссы',
      message: 'В каждой заполненной строке должны быть два разных товара.',
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
      title: 'Кроссы сохранены',
      message: `Создано связей: ${rows.length}`,
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
  margin: 0 -28px;
  border-top: 1px solid rgb(226 232 240);
  border-bottom: 1px solid rgb(226 232 240);
  padding: 0 36px 32px;
}

.dialog-stage {
  border-radius: 8px;
  padding: 4px 0 0;
}

.stepper {
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;
  gap: 28px;
  margin: 0 -36px 28px;
  border-bottom: 1px solid rgb(226 232 240);
  padding: 30px 72px;
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgb(71 85 105);
}

.stepper-number {
  display: flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(203 213 225);
  border-radius: 999px;
  background: white;
  color: rgb(71 85 105);
  font-weight: 700;
}

.stepper-item.is-active .stepper-number {
  border-color: rgb(37 99 235);
  background: rgb(37 99 235);
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
  background: rgb(203 213 225);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
}

:deep(.create-products-dialog .el-dialog__header) {
  padding: 26px 36px 22px;
}

:deep(.create-products-dialog .el-dialog__body) {
  padding: 0 36px;
}

:deep(.create-products-dialog .el-dialog__footer) {
  padding: 24px 36px 28px;
}

:deep(.product-create-table .el-table__header th) {
  background: rgb(248 250 252);
  color: rgb(71 85 105);
  font-weight: 700;
}

:deep(.product-create-table .el-table__cell),
:deep(.product-cross-create-table .el-table__cell) {
  vertical-align: middle;
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
