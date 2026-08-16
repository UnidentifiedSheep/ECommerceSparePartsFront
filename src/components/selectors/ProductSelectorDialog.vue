<template>
  <el-dialog
    v-model="isOpen"
    append-to-body
    :title="t('products.selectorTitle')"
    width="min(1040px, calc(100vw - 24px))"
    class="product-selector-dialog"
  >
    <div class="product-selector-layout">
      <form class="product-selector-search" @submit.prevent="loadProducts(true)">
        <div class="product-selector-field product-selector-field--query">
          <label>{{ t('common.labels.search') }}</label>
          <el-input
            v-model="query"
            :prefix-icon="Search"
            clearable
            :placeholder="t('products.catalogueSearchPlaceholder')"
          />
        </div>

        <div class="product-selector-field product-selector-field--producer">
          <label>{{ t('common.labels.producer') }}</label>
          <ProducerMultiSelector
            v-if="canUseCatalogueSearch"
            v-model="producerIds"
            :placeholder="t('products.allProducers')"
          />
          <ProducerSelector
            v-else
            :model-value="producerIds[0]"
            :placeholder="t('products.allProducers')"
            @update:model-value="setSingleProducer"
          />
        </div>

        <div class="product-selector-actions">
          <el-button native-type="submit" type="primary" :disabled="Boolean(searchValidationMessage)">
            {{ t('products.find') }}
          </el-button>
          <el-tooltip :content="t('common.actions.reset')" placement="top">
            <el-button :icon="RefreshLeft" :aria-label="t('common.actions.reset')" @click="resetFilters" />
          </el-tooltip>
        </div>
      </form>

      <button
        v-if="canUseCatalogueSearch"
        class="product-selector-settings-toggle"
        type="button"
        :aria-expanded="searchSettingsOpen"
        @click="searchSettingsOpen = !searchSettingsOpen"
      >
        <span>
          <strong>{{ t('products.searchSettings') }}</strong>
          <em>{{ searchSettingsSummary }}</em>
        </span>
        <el-icon :class="{ 'is-open': searchSettingsOpen }"><ArrowDown /></el-icon>
      </button>

      <div v-if="canUseCatalogueSearch" v-show="searchSettingsOpen" class="product-selector-settings">
        <div class="product-selector-presets">
          <span>{{ t('products.searchPreset') }}</span>
          <div role="group" :aria-label="t('products.searchPreset')">
            <button
              v-for="preset in searchPresetOptions"
              :key="preset.value"
              type="button"
              :class="{ 'is-active': currentSearchPreset === preset.value }"
              @click="applySearchPreset(preset.value)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <fieldset class="product-selector-mode-group">
          <legend>{{ t('products.skuMatching') }}</legend>
          <el-checkbox-group v-model="skuModes" @change="handleModesChanged">
            <el-checkbox
              v-for="mode in matchTypeOptions"
              :key="mode.value"
              :label="mode.value"
              :disabled="isLastSearchMode('sku', mode.value)"
            >
              {{ mode.label }}
            </el-checkbox>
          </el-checkbox-group>
        </fieldset>

        <fieldset class="product-selector-mode-group">
          <legend>{{ t('products.nameMatching') }}</legend>
          <el-checkbox-group v-model="nameModes" @change="handleModesChanged">
            <el-checkbox
              v-for="mode in matchTypeOptions"
              :key="mode.value"
              :label="mode.value"
              :disabled="isLastSearchMode('name', mode.value)"
            >
              {{ mode.label }}
            </el-checkbox>
          </el-checkbox-group>
        </fieldset>
      </div>

      <p v-if="searchValidationMessage" class="product-selector-validation">{{ searchValidationMessage }}</p>

      <div class="product-selector-results-header">
        <span>{{ t(hasExactTotal ? 'products.foundCount' : 'products.shownCount', { count: total.toLocaleString(locale) }) }}</span>
        <div class="product-selector-results-tools">
          <div class="product-highlight-toggle">
            <span class="product-highlight-toggle__sample" aria-hidden="true">Aa</span>
            <span>{{ t('products.displayHighlights') }}</span>
            <el-switch
              v-model="includeHighlights"
              size="small"
              :aria-label="t('products.includeHighlights')"
              @change="handleHighlightSettingChanged"
            />
          </div>
          <span><kbd>Shift</kbd> + {{ t('products.multiSortShort') }}</span>
        </div>
      </div>

      <el-table
        v-loading="isLoading"
        :data="products"
        :row-class-name="productRowClass"
        class="product-selector-results"
        height="min(420px, calc(100dvh - 330px))"
        :empty-text="t('products.notFound')"
        @row-click="selectedProductId = $event.id"
        @row-dblclick="selectProduct"
      >
        <el-table-column prop="sku" :label="t('products.sku')" min-width="180">
          <template #header>
            <button class="product-selector-sort" type="button" :title="t('products.multiSortHint')" @click="toggleSort('sku', $event)">
              {{ t('products.sku') }}
              <span v-if="sortDirection('sku')">{{ sortDirection('sku') === 'asc' ? '↑' : '↓' }}{{ sortPriority('sku') }}</span>
            </button>
          </template>
          <template #default="{ row }">
            <ProductSkuCell :sku="row.sku" :indicator="row.indicator" :highlight="highlightedSku(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="name" :label="t('common.labels.name')" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <SearchHighlightedText :text="highlightedValue(row, 'name', row.name)" />
          </template>
        </el-table-column>
        <el-table-column prop="producerId" :label="t('common.labels.producer')" min-width="180">
          <template #header>
            <button class="product-selector-sort" type="button" :title="t('products.multiSortHint')" @click="toggleSort('producerId', $event)">
              {{ t('common.labels.producer') }}
              <span v-if="sortDirection('producerId')">{{ sortDirection('producerId') === 'asc' ? '↑' : '↓' }}{{ sortPriority('producerId') }}</span>
            </button>
          </template>
          <template #default="{ row }">
            {{ producerName(row.producerId) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" :label="t('products.stock')" min-width="140">
          <template #header>
            <button class="product-selector-sort" type="button" :title="t('products.multiSortHint')" @click="toggleSort('stock', $event)">
              {{ t('products.stock') }}
              <span v-if="sortDirection('stock')">{{ sortDirection('stock') === 'asc' ? '↑' : '↓' }}{{ sortPriority('stock') }}</span>
            </button>
          </template>
          <template #default="{ row }">
            <ProductStockCell :stock="row.stock" />
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="" width="96" align="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click.stop="selectProduct(row)">{{ t('products.pick') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowDown, RefreshLeft, Search } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import SearchHighlightedText from '@/components/common/SearchHighlightedText.vue'
import ProducerMultiSelector from '@/components/selectors/ProducerMultiSelector.vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { getProducersByIds } from '@/services/api/producers.ts'
import {
  type SearchMatchType,
  searchCatalogue,
  searchProducts,
  searchProductsBySku,
} from '@/services/api/search.ts'
import { useI18n } from '@/i18n'
import {
  loadProductSearchPreferences,
  productDialogSearchPreferencesKey,
  saveProductSearchPreferences,
} from '@/utils/productSearchPreferences.ts'
import { resolveSkuHighlight } from '@/utils/searchHighlights.ts'

type SearchPreset = 'Exact' | 'Normal' | 'Broad'

const { locale, t } = useI18n()
const { hasPermission } = usePermissions()
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  select: [product: ProductSearchModel]
}>()

const canUseCatalogueSearch = computed(() => hasPermission('CATALOGUE_CANDIDATES_REVIEW'))
const products = ref<ProductSearchModel[]>([])
const producerNames = ref<Record<number, string>>({})
const query = ref('')
const producerIds = ref<number[]>([])
const sortBy = ref<string[]>([])
const page = ref(0)
const size = ref(20)
const total = ref(0)
const hasExactTotal = ref(false)
const hasNext = ref(false)
const isLoading = ref(false)
const searchSettingsOpen = ref(false)
const selectedProductId = ref<number>()
let productsRequestId = 0
let isResetting = false
let searchPreferences = loadProductSearchPreferences(productDialogSearchPreferencesKey)
const skuModes = ref<SearchMatchType[]>([...searchPreferences.skuModes])
const nameModes = ref<SearchMatchType[]>([...searchPreferences.nameModes])
const includeHighlights = ref(searchPreferences.includeHighlights)

const searchMatchTypes: SearchMatchType[] = ['Exact', 'StartsWith', 'Contains', 'Fuzzy']
const searchPresets: Record<SearchPreset, { sku: SearchMatchType[]; name: SearchMatchType[] }> = {
  Exact: { sku: ['Exact'], name: ['Exact'] },
  Normal: { sku: ['Exact', 'StartsWith', 'Contains'], name: ['Exact', 'StartsWith', 'Fuzzy'] },
  Broad: { sku: [...searchMatchTypes], name: [...searchMatchTypes] },
}
const matchTypeOptions = computed(() => searchMatchTypes.map((value) => ({
  value,
  label: t(`products.skuSearchModes.${value}`),
})))
const searchPresetOptions = computed<{ value: SearchPreset; label: string }[]>(() => [
  { value: 'Exact', label: t('products.searchPresets.Exact') },
  { value: 'Normal', label: t('products.searchPresets.Normal') },
  { value: 'Broad', label: t('products.searchPresets.Broad') },
])
const currentSearchPreset = computed<SearchPreset | 'Custom'>(() => {
  const preset = (Object.entries(searchPresets) as [SearchPreset, (typeof searchPresets)[SearchPreset]][])
    .find(([, modes]) => sameModes(skuModes.value, modes.sku) && sameModes(nameModes.value, modes.name))
  return preset?.[0] ?? 'Custom'
})
const searchSettingsSummary = computed(() => t('products.searchSettingsSummary', {
  preset: t(`products.searchPresets.${currentSearchPreset.value}`),
  sku: skuModes.value.length,
  name: nameModes.value.length,
}))
const searchValidationMessage = computed(() => {
  if (skuModes.value.length === 0 && nameModes.value.length === 0) return t('products.selectSearchField')
  const selectedModes = [...skuModes.value, ...nameModes.value]
  if (query.value.trim().length > 0 && query.value.trim().length < 4 && selectedModes.every((mode) => mode === 'Fuzzy')) {
    return t('products.fuzzyMinimum')
  }
  return ''
})

const searchProductsDebounced = useDebounceFn(async () => {
  if (!searchValidationMessage.value) await loadProducts(true)
}, 350)

function sameModes(left: SearchMatchType[], right: SearchMatchType[]) {
  return left.length === right.length && right.every((mode) => left.includes(mode))
}

function producerName(id: number) {
  return producerNames.value[id] ?? '—'
}

function highlightedValue(product: ProductSearchModel, field: string, fallback: string) {
  return product.highlights?.[field]?.find(Boolean) ?? fallback
}

function highlightedSku(product: ProductSearchModel) {
  return resolveSkuHighlight(
    product.sku,
    product.highlights?.sku ?? product.highlights?.normalizedSku,
  )
}

function setSingleProducer(producerId?: number) {
  producerIds.value = producerId ? [producerId] : []
}

function selectProduct(product: ProductSearchModel) {
  emit('select', product)
  isOpen.value = false
}

function productRowClass({ row }: { row: ProductSearchModel }) {
  return row.id === selectedProductId.value ? 'product-selector-row--selected' : ''
}

function sortField(value: string) {
  return value.endsWith('_desc') ? value.slice(0, -5) : value
}

function sortDirection(field: string): 'asc' | 'desc' | undefined {
  const value = sortBy.value.find((item) => sortField(item) === field)
  if (!value) return undefined
  return value.endsWith('_desc') ? 'desc' : 'asc'
}

function sortPriority(field: string) {
  const index = sortBy.value.findIndex((item) => sortField(item) === field)
  return index >= 0 && sortBy.value.length > 1 ? index + 1 : ''
}

async function toggleSort(field: string, event: MouseEvent) {
  const current = sortBy.value.find((item) => sortField(item) === field)
  const next = !current ? field : current.endsWith('_desc') ? undefined : `${field}_desc`
  const remaining = sortBy.value.filter((item) => sortField(item) !== field)
  sortBy.value = event.shiftKey
    ? next ? [...remaining, next] : remaining
    : next ? [next] : []
  await loadProducts(true)
}

function isLastSearchMode(field: 'sku' | 'name', mode: SearchMatchType) {
  const modes = field === 'sku' ? skuModes.value : nameModes.value
  return modes.includes(mode) && skuModes.value.length + nameModes.value.length === 1
}

async function applySearchPreset(preset: SearchPreset) {
  skuModes.value = [...searchPresets[preset].sku]
  nameModes.value = [...searchPresets[preset].name]
  rememberSearchPreferences()
  await loadProducts(true)
}

async function handleModesChanged() {
  rememberSearchPreferences()
  await loadProducts(true)
}

async function handleHighlightSettingChanged() {
  rememberSearchPreferences()
  await loadProducts(true)
}

function rememberSearchPreferences() {
  searchPreferences = {
    skuModes: [...skuModes.value],
    nameModes: [...nameModes.value],
    includeHighlights: includeHighlights.value,
  }
  saveProductSearchPreferences(productDialogSearchPreferencesKey, searchPreferences)
}

function resetSelectorState() {
  isResetting = true
  productsRequestId += 1
  query.value = ''
  producerIds.value = []
  sortBy.value = []
  page.value = 0
  size.value = 20
  total.value = 0
  hasExactTotal.value = false
  products.value = []
  selectedProductId.value = undefined
  searchSettingsOpen.value = false
  searchPreferences = loadProductSearchPreferences(productDialogSearchPreferencesKey)
  skuModes.value = [...searchPreferences.skuModes]
  nameModes.value = [...searchPreferences.nameModes]
  includeHighlights.value = searchPreferences.includeHighlights
  queueMicrotask(() => {
    isResetting = false
  })
}

async function resetFilters() {
  isResetting = true
  query.value = ''
  producerIds.value = []
  sortBy.value = []
  page.value = 0
  selectedProductId.value = undefined
  queueMicrotask(async () => {
    isResetting = false
    await loadProducts(true)
  })
}

async function loadProducts(resetPage: boolean) {
  if (!isOpen.value || searchValidationMessage.value) return
  if (resetPage) page.value = 0

  const requestId = ++productsRequestId
  isLoading.value = true
  try {
    const normalizedQuery = query.value.trim()
    if (canUseCatalogueSearch.value) {
      const response = await searchCatalogue({
        query: normalizedQuery || undefined,
        targets: ['Products'],
        fields: {
          sku: skuModes.value,
          name: nameModes.value,
        },
        producerIds: producerIds.value,
        includeHighlights: includeHighlights.value && Boolean(normalizedQuery),
        page: page.value,
        size: size.value,
        sortBy: {
          products: sortBy.value,
          catalogueCandidates: [],
        },
      })
      if (requestId !== productsRequestId) return
      products.value = response.products.items
      total.value = response.products.total
      hasExactTotal.value = true
    } else {
      const useSkuSearch = nameModes.value.length === 0 && skuModes.value.length > 0
      const response = useSkuSearch
        ? await searchProductsBySku({
            sku: normalizedQuery,
            producerId: producerIds.value[0],
            searchMode: skuModes.value.length === 1 ? skuModes.value[0] : 'Full',
            page: page.value,
            size: size.value,
            sortBy: sortBy.value,
          })
        : await searchProducts({
            query: normalizedQuery || undefined,
            producerId: producerIds.value[0],
            page: page.value,
            size: size.value,
            sortBy: sortBy.value,
          })
      if (requestId !== productsRequestId) return
      products.value = response.products
      total.value = response.total ?? response.products.length
      hasExactTotal.value = response.total !== undefined
    }

    selectedProductId.value = undefined
    hasNext.value = hasExactTotal.value
      ? (page.value + 1) * size.value < total.value
      : products.value.length === size.value
    await loadProducerNames(products.value)
  } finally {
    if (requestId === productsRequestId) isLoading.value = false
  }
}

async function loadProducerNames(items: ProductSearchModel[]) {
  const ids = [...new Set(items.map((product) => product.producerId))]
    .filter((id) => !producerNames.value[id])
  const producers = await getProducersByIds(ids)
  producers.forEach((producer) => {
    producerNames.value[producer.id] = producer.name
  })
}

watch(isOpen, async (open) => {
  if (!open) return
  resetSelectorState()
  await loadProducts(true)
})
watch(page, async () => {
  if (!isResetting) await loadProducts(false)
})
watch(size, async () => {
  if (!isResetting) await loadProducts(true)
})
watch(producerIds, async () => {
  if (!isResetting) await loadProducts(true)
}, { deep: true })
watch(query, () => {
  if (!isResetting) searchProductsDebounced()
})

onMounted(async () => {
  if (isOpen.value) await loadProducts(true)
})
</script>

<style scoped>
:deep(.product-selector-dialog .el-dialog__header) {
  padding: 18px 20px 12px;
}

:deep(.product-selector-dialog .el-dialog__body) {
  padding: 10px 20px 18px;
}

.product-selector-layout {
  display: grid;
  gap: 10px;
}

.product-selector-search {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(240px, 320px) auto;
  align-items: end;
  gap: 12px;
}

.product-selector-field {
  min-width: 0;
}

.product-selector-field > label {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.product-selector-actions {
  display: flex;
  gap: 8px;
}

.product-selector-settings-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0;
  border-top: 1px solid #e2e8f0;
  background: transparent;
  padding: 9px 0 0;
  color: #334155;
  text-align: left;
  cursor: pointer;
}

.product-selector-settings-toggle > span {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.product-selector-settings-toggle strong {
  font-size: 12px;
  font-weight: 650;
}

.product-selector-settings-toggle em {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-selector-settings-toggle > .el-icon {
  transition: transform 140ms ease;
}

.product-selector-settings-toggle > .el-icon.is-open {
  transform: rotate(180deg);
}

.product-selector-settings-toggle:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: 2px;
}

.product-selector-settings {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 16px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.product-selector-presets > span,
.product-selector-mode-group legend {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 650;
}

.product-selector-presets > div {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
}

.product-selector-presets button {
  border: 0;
  border-right: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 5px 9px;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
}

.product-selector-presets button:last-child {
  border-right: 0;
}

.product-selector-presets button:hover,
.product-selector-presets button:focus-visible {
  background: #f8fafc;
  color: #0f172a;
}

.product-selector-presets button.is-active {
  background: #eef6f1;
  color: #047857;
  font-weight: 650;
}

.product-selector-mode-group {
  min-width: 0;
  margin: 0;
  border: 0;
  border-left: 1px solid #e2e8f0;
  padding: 0 0 0 16px;
}

.product-selector-mode-group :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 12px;
}

.product-selector-mode-group :deep(.el-checkbox) {
  height: 24px;
  margin-right: 0;
}

.product-selector-mode-group :deep(.el-checkbox__label) {
  padding-left: 5px;
  font-size: 12px;
}

.product-selector-validation {
  margin: 0;
  color: #b42318;
  font-size: 12px;
  font-weight: 600;
}

.product-selector-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
  color: #64748b;
  font-size: 11px;
}

.product-selector-results-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.product-highlight-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  white-space: nowrap;
}

.product-highlight-toggle__sample {
  color: #047857;
  font-size: 12px;
  font-weight: 750;
}

.product-selector-results-header kbd {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
  padding: 1px 5px;
  color: #334155;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
}

.product-selector-results {
  width: 100%;
}

.product-selector-results :deep(.el-table__header th) {
  background: #f6f7f8;
  color: #475569;
  font-size: 12px;
}

.product-selector-results :deep(.el-table__row) {
  cursor: pointer;
}

.product-selector-results :deep(.product-selector-row--selected > td.el-table__cell) {
  background: #eef6f1;
}

.product-selector-sort {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.product-selector-sort span {
  color: #047857;
  font-weight: 750;
}

.product-selector-sort:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: 3px;
}

@media (max-width: 760px) {
  :deep(.product-selector-dialog) {
    margin-top: 12px;
  }

  :deep(.product-selector-dialog .el-dialog__header) {
    padding: 14px 14px 10px;
  }

  :deep(.product-selector-dialog .el-dialog__body) {
    padding: 10px 14px 14px;
  }

  .product-selector-search,
  .product-selector-settings {
    grid-template-columns: 1fr;
  }

  .product-selector-mode-group {
    border-top: 1px solid #e2e8f0;
    border-left: 0;
    padding: 8px 0 0;
  }

  .product-selector-settings-toggle > span {
    display: grid;
    gap: 2px;
  }
}
</style>
