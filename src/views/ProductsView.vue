<template>
  <div class="product-page">
    <PageHeader :title="t('products.title')" :description="t('products.description')">
      <template #actions>
        <el-button v-if="canCreateProducts" :icon="Plus" type="primary" @click="createDialogOpen = true">
          {{ t('products.createProducts') }}
        </el-button>
      </template>
    </PageHeader>

    <div class="product-content">
      <section class="product-panel product-search-panel">
        <button
          v-if="isMobileViewport && mobileSearchCollapsed"
          class="product-mobile-search-toggle"
          type="button"
          aria-expanded="false"
          :aria-label="t('products.showSearch')"
          @click="mobileSearchCollapsed = false"
        >
          <span>
            <strong>{{ t('products.searchAndFilters') }}</strong>
            <em>{{ mobileSearchSummary }}</em>
          </span>
          <el-icon><ArrowDown /></el-icon>
        </button>

        <div v-show="!isMobileViewport || !mobileSearchCollapsed" class="product-panel__body">
          <div class="product-search-toolbar">
            <div class="product-search-toolbar__mode">
              <label class="product-field-label">{{ t('products.searchMode') }}</label>
              <el-select v-model="form.searchMode" size="large" class="w-full" @change="applyFilters(true)">
                <el-option :label="t('products.searchAll')" value="all" />
                <el-option :label="t('products.searchSku')" value="sku" />
              </el-select>
            </div>

            <div class="product-search-toolbar__query">
              <label class="product-field-label">{{ t('common.labels.search') }}</label>
              <el-autocomplete
                v-model="form.query"
                :fetch-suggestions="querySearchHistory"
                :prefix-icon="Search"
                clearable
                size="large"
                value-key="value"
                class="w-full"
                :placeholder="searchPlaceholder"
                @select="selectSearchHistory"
                @keyup.enter="submitSearch"
              >
                <template #default="{ item }">
                  <div class="product-search-history-option">
                    <el-icon><Clock /></el-icon>
                    <span>{{ item.value }}</span>
                  </div>
                </template>
              </el-autocomplete>
            </div>

            <div class="product-search-toolbar__producer">
              <label class="product-field-label">{{ t('common.labels.producer') }}</label>
              <ProducerSelector v-model="form.producerId" :placeholder="t('products.allProducers')" />
            </div>

            <el-badge
              v-if="form.searchMode === 'all'"
              class="product-search-toolbar__action product-search-toolbar__filters"
              :value="dimensionFiltersCount"
              :hidden="dimensionFiltersCount === 0"
            >
              <el-button :icon="Filter" size="large" plain @click="filtersDrawerOpen = true">
                {{ t('products.filters') }}
              </el-button>
            </el-badge>

            <el-tooltip :content="t('common.actions.reset')" placement="top">
              <el-button
                class="product-search-toolbar__action product-search-toolbar__reset"
                :icon="RefreshLeft"
                size="large"
                plain
                :aria-label="t('common.actions.reset')"
                @click="resetFilters"
              />
            </el-tooltip>
          </div>

          <div v-if="activeFilters.length > 0" class="product-active-filters">
            <span class="product-active-filters__label">{{ t('products.active') }}</span>
            <el-tag
              v-for="filter in activeFilters"
              :key="filter.key"
              closable
              effect="plain"
              @close="clearFilter(filter.key)"
            >
              {{ filter.label }}
            </el-tag>
          </div>
        </div>
      </section>

      <el-drawer
        v-model="filtersDrawerOpen"
        :title="t('products.filtersTitle')"
        size="min(440px, 100vw)"
        class="product-filters-drawer"
      >
        <div class="product-filter-drawer">
          <div class="product-filter-drawer__body">
            <section class="product-filter-section">
              <div class="product-filter-section__header">
                <span>{{ t('products.dimensions') }}</span>
                <el-tooltip :content="t('products.dimensionsHint')" placement="top">
                  <el-icon class="cursor-help text-slate-400"><InfoFilled /></el-icon>
                </el-tooltip>
              </div>

              <el-form label-position="top" class="product-filter-unit">
                <el-form-item :label="t('products.measurementUnit')">
                  <el-select v-model="form.dimensionUnit" class="w-full">
                    <el-option
                      v-for="unit in dimensionSearchUnitOptions"
                      :key="unit.value"
                      :label="unit.label"
                      :value="unit.value"
                    />
                  </el-select>
                </el-form-item>
              </el-form>

              <div class="dimension-filter-list">
                <div class="dimension-filter-row">
                  <span class="dimension-filter-row__title">{{ t('products.length') }}</span>
                  <div class="dimension-range-grid">
                    <label class="dimension-range-field">
                      <span>{{ t('products.from') }}</span>
                      <el-input-number v-model="form.lengthMin" :min="0" :precision="2" :controls="false" class="w-full" />
                    </label>
                    <label class="dimension-range-field">
                      <span>{{ t('products.to') }}</span>
                      <el-input-number v-model="form.lengthMax" :min="0" :precision="2" :controls="false" class="w-full" />
                    </label>
                  </div>
                </div>

                <div class="dimension-filter-row">
                  <span class="dimension-filter-row__title">{{ t('products.width') }}</span>
                  <div class="dimension-range-grid">
                    <label class="dimension-range-field">
                      <span>{{ t('products.from') }}</span>
                      <el-input-number v-model="form.widthMin" :min="0" :precision="2" :controls="false" class="w-full" />
                    </label>
                    <label class="dimension-range-field">
                      <span>{{ t('products.to') }}</span>
                      <el-input-number v-model="form.widthMax" :min="0" :precision="2" :controls="false" class="w-full" />
                    </label>
                  </div>
                </div>

                <div class="dimension-filter-row">
                  <span class="dimension-filter-row__title">{{ t('products.height') }}</span>
                  <div class="dimension-range-grid">
                    <label class="dimension-range-field">
                      <span>{{ t('products.from') }}</span>
                      <el-input-number v-model="form.heightMin" :min="0" :precision="2" :controls="false" class="w-full" />
                    </label>
                    <label class="dimension-range-field">
                      <span>{{ t('products.to') }}</span>
                      <el-input-number v-model="form.heightMax" :min="0" :precision="2" :controls="false" class="w-full" />
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div class="product-filter-drawer__footer">
            <div class="flex justify-end gap-3">
              <el-button @click="clearDimensionFilters">{{ t('products.clear') }}</el-button>
              <el-button type="primary" @click="submitSearch">{{ t('purchases.apply') }}</el-button>
            </div>
          </div>
        </div>
      </el-drawer>

      <section class="product-panel product-results-panel">
        <header class="product-results-header">
          <div>
            <h2>{{ t('products.results') }}</h2>
            <p>{{ resultTitle }}</p>
          </div>
          <div class="product-results-meta">{{ t('products.shownCount', { count: products.length.toLocaleString(locale) }) }}</div>
        </header>

        <el-table
          v-loading="isLoading"
          :data="products"
          class="products-table products-table--desktop"
          height="100%"
          @sort-change="handleSortChange"
          @row-click="(row: ProductSearchModel) => openQuickView(row)"
          @row-dblclick="(row: ProductSearchModel) => openCrosses(row.id)"
        >
          <el-table-column prop="sku" :label="t('products.productColumn')" min-width="330" sortable="custom">
            <template #default="{ row }">
              <button class="product-identity" type="button" @click.stop="openQuickView(row)">
                <ProductSkuCell :sku="row.sku" :indicator="row.indicator" />
                <span class="product-identity__name">{{ row.name }}</span>
              </button>
            </template>
          </el-table-column>
          <el-table-column prop="producerId" :label="t('common.labels.producer')" min-width="170" sortable="custom">
            <template #default="{ row }">
              {{ producerName(row.producerId) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" :label="t('products.stock')" min-width="150" sortable="custom">
            <template #default="{ row }">
              <ProductStockCell :stock="row.stock" />
            </template>
          </el-table-column>
          <el-table-column prop="volume" :label="t('products.dimensions')" min-width="210" sortable="custom">
            <template #default="{ row }">
              <span v-if="row.dimensions">
                {{ formatDimension(row.dimensions.length) }} ×
                {{ formatDimension(row.dimensions.width) }} ×
                {{ formatDimension(row.dimensions.height) }}
                {{ dimensionMeasureUnitLabel(row.dimensions.unit) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="weight" :label="t('products.weight')" min-width="140" sortable="custom">
            <template #default="{ row }">
              <span v-if="row.weight">{{ row.weight.value }} {{ weightMeasureUnitLabel(row.weight.unit, row.weight.value) }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" :label="t('common.labels.actions')" width="104" align="right">
            <template #default="{ row }">
              <div class="flex justify-end gap-1" @click.stop>
                <ActionIconButton
                  v-if="canViewPriceOffers"
                  :label="t('priceOffers.open')"
                  :icon="Money"
                  @click="openPriceOffers(row)"
                />
                <ActionIconButton :label="t('products.openProduct')" :icon="View" @click="openCrosses(row.id)" />
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div v-loading="isLoading" class="products-mobile-list">
          <article
            v-for="row in products"
            :key="row.id"
            class="product-mobile-row"
            role="button"
            tabindex="0"
            @click="openQuickView(row)"
            @keydown.enter.prevent="openQuickView(row)"
            @keydown.space.prevent="openQuickView(row)"
          >
            <div class="product-mobile-row__header">
              <button class="product-identity" type="button" @click.stop="openQuickView(row)">
                <ProductSkuCell :sku="row.sku" :indicator="row.indicator" />
                <span class="product-identity__name">{{ row.name }}</span>
              </button>
              <div class="product-mobile-row__actions" @click.stop>
                <ActionIconButton
                  v-if="canViewPriceOffers"
                  :label="t('priceOffers.open')"
                  :icon="Money"
                  @click="openPriceOffers(row)"
                />
                <ActionIconButton :label="t('products.openProduct')" :icon="View" @click="openCrosses(row.id)" />
              </div>
            </div>

            <dl class="product-mobile-row__meta">
              <div>
                <dt>{{ t('common.labels.producer') }}</dt>
                <dd>{{ producerName(row.producerId) }}</dd>
              </div>
              <div>
                <dt>{{ t('products.stock') }}</dt>
                <dd><ProductStockCell :stock="row.stock" /></dd>
              </div>
              <div>
                <dt>{{ t('products.dimensions') }}</dt>
                <dd v-if="row.dimensions">
                  {{ formatDimension(row.dimensions.length) }} × {{ formatDimension(row.dimensions.width) }} ×
                  {{ formatDimension(row.dimensions.height) }} {{ dimensionMeasureUnitLabel(row.dimensions.unit) }}
                </dd>
                <dd v-else>—</dd>
              </div>
              <div>
                <dt>{{ t('products.weight') }}</dt>
                <dd v-if="row.weight">{{ row.weight.value }} {{ weightMeasureUnitLabel(row.weight.unit, row.weight.value) }}</dd>
                <dd v-else>—</dd>
              </div>
            </dl>
          </article>

          <el-empty v-if="!isLoading && products.length === 0" :description="t('products.notFound')" :image-size="64" />
        </div>

        <footer class="product-results-footer">
          <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" />
        </footer>
      </section>
    </div>

    <CreateProductsCrossesDialog v-if="canCreateProducts" v-model="createDialogOpen" @saved="loadProducts" />
    <ProductQuickViewDrawer
      v-model="quickViewOpen"
      :product="selectedQuickProduct"
      :producer-name="selectedQuickProduct ? producerName(selectedQuickProduct.producerId) : undefined"
      :can-view-price-offers="canViewPriceOffers"
      @open-product="openCrosses"
      @open-prices="openPricesFromQuickView"
    />
    <ProductPriceOffersDialog
      v-if="selectedPriceProduct && canViewPriceOffers"
      v-model="priceOffersDialogOpen"
      :product-id="selectedPriceProduct.id"
      :product-label="`${selectedPriceProduct.sku} - ${selectedPriceProduct.name}`"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Clock, Filter, InfoFilled, Money, Plus, RefreshLeft, Search, View } from '@element-plus/icons-vue'
import { useDebounceFn, useMediaQuery } from '@vueuse/core'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CreateProductsCrossesDialog from '@/components/products/CreateProductsCrossesDialog.vue'
import ProductQuickViewDrawer from '@/components/products/ProductQuickViewDrawer.vue'
import ProductPriceOffersDialog from '@/components/pricing/ProductPriceOffersDialog.vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { getProducer } from '@/services/api/producers.ts'
import { searchProducts, searchProductsBySku } from '@/services/api/search.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useProductSearchHistory } from '@/composables/useProductSearchHistory.ts'
import {
  dimensionMeasureUnitLabel,
  dimensionSearchUnitOptions,
  dimensionUnitLabel,
  weightMeasureUnitLabel,
} from '@/utils/measurementUnits.ts'
import { useI18n } from '@/i18n'

type ProductSearchMode = 'all' | 'sku'

interface ProductSearchHistoryItem {
  value: string
}

interface ProductSearchForm {
  query: string
  searchMode: ProductSearchMode
  producerId?: number
  lengthMin?: number
  lengthMax?: number
  widthMin?: number
  widthMax?: number
  heightMin?: number
  heightMax?: number
  dimensionUnit: string
}

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()

const products = ref<ProductSearchModel[]>([])
const page = ref(0)
const size = ref(20)
const sortBy = ref<string>()
const hasNext = ref(false)
const isLoading = ref(false)
const producerNames = ref<Record<number, string>>({})
const filtersDrawerOpen = ref(false)
const skipNextDrawerCloseApply = ref(false)
const createDialogOpen = ref(false)
const priceOffersDialogOpen = ref(false)
const selectedPriceProduct = ref<ProductSearchModel | null>(null)
const quickViewOpen = ref(false)
const selectedQuickProduct = ref<ProductSearchModel | null>(null)
const mobileSearchCollapsed = ref(false)
const isMobileViewport = useMediaQuery('(max-width: 760px)')
const { hasPermission } = usePermissions()
const canCreateProducts = computed(() => hasPermission('ARTICLES_CREATE'))
const canViewPriceOffers = computed(() => hasPermission('PRICES_GET_DETAILED'))
const { searchHistory, rememberSearch: rememberSearchInHistory } = useProductSearchHistory()
let productsRequestId = 0
let suspendAutoSearch = false

const form = reactive<ProductSearchForm>({
  query: '',
  searchMode: 'all',
  dimensionUnit: 'Meter',
})

const searchPlaceholder = computed(() => (
  form.searchMode === 'sku' ? t('products.skuPlaceholder') : t('products.searchPlaceholder')
))

const resultTitle = computed(() => {
  const query = form.query.trim()
  if (query) return form.searchMode === 'sku'
    ? t('products.skuSearchResult', { query })
    : t('products.queryResult', { query })
  if (form.searchMode === 'sku') return t('products.enterSku')
  return activeFilters.value.length > 0 ? t('products.filteredProducts') : t('products.allProducts')
})

const dimensionFiltersCount = computed(() => {
  if (form.searchMode === 'sku') return 0

  return [
    form.lengthMin,
    form.lengthMax,
    form.widthMin,
    form.widthMax,
    form.heightMin,
    form.heightMax,
    form.dimensionUnit !== 'Meter' ? form.dimensionUnit : undefined,
  ].filter((value) => value !== undefined && value !== null && value !== '').length
})

const activeFilters = computed(() => {
  const filters: { key: keyof ProductSearchForm; label: string }[] = []

  if (form.producerId) filters.push({ key: 'producerId', label: t('products.producerFilter', { value: producerName(form.producerId) }) })
  if (form.searchMode === 'sku') return filters

  if (form.dimensionUnit !== 'Meter') filters.push({ key: 'dimensionUnit', label: t('products.unitFilter', { value: dimensionUnitLabel(form.dimensionUnit) }) })
  if (form.lengthMin !== undefined) filters.push({ key: 'lengthMin', label: t('products.minFilter', { name: t('products.length'), value: formatDimension(form.lengthMin) }) })
  if (form.lengthMax !== undefined) filters.push({ key: 'lengthMax', label: t('products.maxFilter', { name: t('products.length'), value: formatDimension(form.lengthMax) }) })
  if (form.widthMin !== undefined) filters.push({ key: 'widthMin', label: t('products.minFilter', { name: t('products.width'), value: formatDimension(form.widthMin) }) })
  if (form.widthMax !== undefined) filters.push({ key: 'widthMax', label: t('products.maxFilter', { name: t('products.width'), value: formatDimension(form.widthMax) }) })
  if (form.heightMin !== undefined) filters.push({ key: 'heightMin', label: t('products.minFilter', { name: t('products.height'), value: formatDimension(form.heightMin) }) })
  if (form.heightMax !== undefined) filters.push({ key: 'heightMax', label: t('products.maxFilter', { name: t('products.height'), value: formatDimension(form.heightMax) }) })

  return filters
})

const mobileSearchSummary = computed(() => {
  const parts = [t(form.searchMode === 'sku' ? 'products.searchSku' : 'products.searchAll')]
  const query = form.query.trim()
  if (query) parts.push(query)
  if (activeFilters.value.length > 0) {
    parts.push(t('products.filterCount', { count: activeFilters.value.length }))
  }
  return parts.join(' · ')
})

const debouncedProductSearch = useDebounceFn(async () => {
  if (suspendAutoSearch) return

  const query = form.query.trim()
  if (query === (queryString('query') ?? '').trim()) return

  rememberSearch(query)
  await applyFilters(true)
}, 450)

function formatDimension(value: number) {
  return value.toLocaleString(locale.value)
}

function rememberSearch(query: string) {
  rememberSearchInHistory(query, locale.value)
}

function querySearchHistory(query: string, callback: (items: ProductSearchHistoryItem[]) => void) {
  const normalizedQuery = query.trim().toLocaleLowerCase(locale.value)
  const items = searchHistory.value
    .filter((item) => !normalizedQuery || item.toLocaleLowerCase(locale.value).includes(normalizedQuery))
    .map((value) => ({ value }))
  callback(items)
}

function selectSearchHistory(item: ProductSearchHistoryItem) {
  suspendAutoSearch = true
  form.query = item.value
  void submitSearch()
  void nextTick(() => {
    suspendAutoSearch = false
  })
}

function producerName(id: number) {
  return producerNames.value[id] ?? '—'
}

function openCrosses(productId: number) {
  quickViewOpen.value = false
  router.push({
    name: 'product-details',
    params: { id: productId },
  })
}

function openQuickView(product: ProductSearchModel) {
  selectedQuickProduct.value = product
  quickViewOpen.value = true
}

function openPriceOffers(product: ProductSearchModel) {
  selectedPriceProduct.value = product
  priceOffersDialogOpen.value = true
}

function openPricesFromQuickView(product: ProductSearchModel) {
  quickViewOpen.value = false
  openPriceOffers(product)
}

function queryString(name: string) {
  const value = route.query[name]
  return typeof value === 'string' ? value : undefined
}

function queryNumber(name: string) {
  const value = queryString(name)
  if (!value) return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function syncFormFromRoute() {
  form.query = queryString('query') ?? ''
  form.searchMode = queryString('searchMode') === 'sku' ? 'sku' : 'all'
  form.producerId = queryNumber('producerId')
  if (form.searchMode === 'sku') {
    clearDimensionFilters()
  } else {
    form.lengthMin = queryNumber('lengthMin')
    form.lengthMax = queryNumber('lengthMax')
    form.widthMin = queryNumber('widthMin')
    form.widthMax = queryNumber('widthMax')
    form.heightMin = queryNumber('heightMin')
    form.heightMax = queryNumber('heightMax')
    form.dimensionUnit = queryString('dimensionUnit') ?? 'Meter'
  }
  page.value = queryNumber('page') ?? 0
  size.value = queryNumber('size') ?? 20
  sortBy.value = queryString('sortBy')
}

function buildRouteQuery(resetPage: boolean) {
  const useDimensionFilters = form.searchMode === 'all'

  return {
    query: form.query.trim() || undefined,
    searchMode: form.searchMode === 'sku' ? form.searchMode : undefined,
    producerId: form.producerId,
    lengthMin: useDimensionFilters ? form.lengthMin : undefined,
    lengthMax: useDimensionFilters ? form.lengthMax : undefined,
    widthMin: useDimensionFilters ? form.widthMin : undefined,
    widthMax: useDimensionFilters ? form.widthMax : undefined,
    heightMin: useDimensionFilters ? form.heightMin : undefined,
    heightMax: useDimensionFilters ? form.heightMax : undefined,
    dimensionUnit: useDimensionFilters ? form.dimensionUnit || undefined : undefined,
    sortBy: sortBy.value,
    page: resetPage ? 0 : page.value,
    size: size.value,
  }
}

async function applyFilters(replaceRoute = false) {
  if (filtersDrawerOpen.value) {
    skipNextDrawerCloseApply.value = true
  }

  filtersDrawerOpen.value = false
  const navigate = replaceRoute ? router.replace : router.push
  await navigate({
    name: 'products',
    query: buildRouteQuery(true),
  })
}

async function submitSearch() {
  rememberSearch(form.query)
  await applyFilters()
  if (isMobileViewport.value) {
    mobileSearchCollapsed.value = true
  }
}

async function resetFilters() {
  suspendAutoSearch = true
  form.query = ''
  form.searchMode = 'all'
  form.producerId = undefined
  form.lengthMin = undefined
  form.lengthMax = undefined
  form.widthMin = undefined
  form.widthMax = undefined
  form.heightMin = undefined
  form.heightMax = undefined
  form.dimensionUnit = 'Meter'
  sortBy.value = undefined
  filtersDrawerOpen.value = false

  await router.push({
    name: 'products',
    query: { page: 0, size: size.value },
  })
  suspendAutoSearch = false
}

async function clearFilter(key: keyof ProductSearchForm) {
  suspendAutoSearch = true
  if (key === 'query') {
    form.query = ''
  } else if (key === 'searchMode') {
    form.searchMode = 'all'
  } else if (key === 'dimensionUnit') {
    form.dimensionUnit = 'Meter'
  } else {
    form[key] = undefined
  }

  await applyFilters()
  suspendAutoSearch = false
}

function clearDimensionFilters() {
  form.lengthMin = undefined
  form.lengthMax = undefined
  form.widthMin = undefined
  form.widthMax = undefined
  form.heightMin = undefined
  form.heightMax = undefined
  form.dimensionUnit = 'Meter'
}

async function handleSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) {
    sortBy.value = undefined
  } else {
    sortBy.value = event.order === 'descending'
      ? `${event.prop}_desc`
      : event.prop
  }

  await router.push({
    name: 'products',
    query: buildRouteQuery(true),
  })
}

async function loadProducts() {
  const currentRequestId = ++productsRequestId
  isLoading.value = true
  try {
    const query = form.query.trim()
    const resp = form.searchMode === 'sku'
      ? query
        ? await searchProductsBySku({
            sku: query,
            producerId: form.producerId,
            page: page.value,
            size: size.value,
            sortBy: sortBy.value,
          })
        : { products: [] }
      : await searchProducts({
          query: query || undefined,
          producerId: form.producerId,
          lengthMin: form.lengthMin,
          lengthMax: form.lengthMax,
          widthMin: form.widthMin,
          widthMax: form.widthMax,
          heightMin: form.heightMin,
          heightMax: form.heightMax,
          dimensionUnit: form.dimensionUnit,
          page: page.value,
          size: size.value,
          sortBy: sortBy.value,
        })

    if (currentRequestId !== productsRequestId) return

    products.value = resp.products
    hasNext.value = resp.products.length === size.value
    await loadProducerNames(resp.products)
    await ensureProducerName(form.producerId)
  } finally {
    if (currentRequestId === productsRequestId) {
      isLoading.value = false
    }
  }
}

async function ensureProducerName(id?: number) {
  if (!id || producerNames.value[id]) return

  const resp = await getProducer(id)
  producerNames.value[id] = resp.producer.name
}

async function loadProducerNames(items: ProductSearchModel[]) {
  const ids = [...new Set(items.map((product) => product.producerId))]
    .filter((id) => !producerNames.value[id])

  await Promise.all(ids.map(async (id) => {
    const resp = await getProducer(id)
    producerNames.value[id] = resp.producer.name
  }))
}

watch(
  () => route.query,
  async () => {
    syncFormFromRoute()
    await loadProducts()
  },
)

watch(() => form.query, (query) => {
  if (suspendAutoSearch || query === (queryString('query') ?? '')) return
  void debouncedProductSearch()
})

watch(() => form.producerId, (producerId) => {
  if (suspendAutoSearch || producerId === queryNumber('producerId')) return
  void applyFilters(true)
})

watch(filtersDrawerOpen, async (isOpen, wasOpen) => {
  if (isOpen || !wasOpen) return

  if (skipNextDrawerCloseApply.value) {
    skipNextDrawerCloseApply.value = false
    return
  }

  await applyFilters()
})

watch(page, async () => {
  await router.push({
    name: 'products',
    query: buildRouteQuery(false),
  })
})

watch(size, async () => {
  page.value = 0
  await router.push({
    name: 'products',
    query: buildRouteQuery(true),
  })
})

onMounted(async () => {
  syncFormFromRoute()
  await loadProducts()
  if (isMobileViewport.value && (
    form.query.trim()
    || form.producerId
    || form.searchMode === 'sku'
    || dimensionFiltersCount.value > 0
  )) {
    mobileSearchCollapsed.value = true
  }
})
</script>

<style scoped>
.product-page {
  display: flex;
  height: calc(100dvh - 56px);
  min-height: 560px;
  flex-direction: column;
  overflow: hidden;
  background: #f7f8fa;
}

.product-content {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.product-panel {
  overflow: hidden;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
  background: #ffffff;
}

.product-panel__body {
  padding: 14px 16px;
}

.product-mobile-search-toggle {
  display: none;
}

.product-field-label {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.product-active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  border-top: 1px solid #eceff2;
  padding-top: 10px;
}

.product-active-filters__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.product-results-panel {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.product-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #dfe3e8;
  padding: 12px 16px;
}

.product-results-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}

.product-results-header p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 13px;
}

.product-results-meta {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.product-results-footer {
  flex: 0 0 auto;
  border-top: 1px solid #dfe3e8;
  background: #fafafa;
  padding: 10px 16px;
}

.products-table {
  flex: 1;
  min-height: 0;
}

.products-table :deep(.el-table__header th) {
  height: 42px;
  background: #f6f7f8;
  color: #475569;
  font-size: 12px;
  font-weight: 650;
}

.products-table :deep(.el-table__row) {
  cursor: pointer;
}

.products-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: #fafbfc;
}

.products-table :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
  color: #1e293b;
}

:deep(.product-filters-drawer .el-drawer__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #dfe3e8;
  padding: 18px 20px;
}

:deep(.product-filters-drawer .el-drawer__body) {
  padding: 0;
}

.product-filter-drawer {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.product-filter-drawer__body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.product-filter-section {
  min-width: 0;
}

.product-filter-section__header {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #dfe3e8;
  padding-bottom: 12px;
  color: #1e293b;
  font-size: 15px;
  font-weight: 650;
}

.product-filter-unit {
  padding: 16px 0 18px;
}

.dimension-filter-list {
  border-top: 1px solid #eceff2;
}

.dimension-filter-row {
  display: grid;
  gap: 10px;
  border-bottom: 1px solid #eceff2;
  padding: 14px 0;
}

.dimension-filter-row__title {
  color: #1e293b;
  font-size: 13px;
  font-weight: 650;
}

.dimension-range-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dimension-range-field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.dimension-range-field > span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.product-filter-drawer__footer {
  border-top: 1px solid #dfe3e8;
  background: #fff;
  padding: 14px 20px;
}

:deep(.product-filters-drawer .el-form-item) {
  margin-bottom: 0;
}

.product-search-toolbar {
  display: grid;
  grid-template-columns: 190px minmax(340px, 1fr) minmax(210px, 280px) max-content 40px;
  align-items: end;
  gap: 10px;
}

.product-search-toolbar__mode,
.product-search-toolbar__query,
.product-search-toolbar__producer {
  min-width: 0;
}

.product-search-toolbar__action {
  align-self: end;
}

.product-search-toolbar__reset {
  width: 40px;
  padding: 0;
}

.product-search-history-option {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.product-search-history-option .el-icon {
  flex: 0 0 auto;
  color: #94a3b8;
}

.product-search-history-option span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-identity {
  display: grid;
  min-width: 0;
  max-width: 100%;
  gap: 4px;
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.product-identity:hover :deep(.product-sku__text),
.product-identity:focus-visible :deep(.product-sku__text) {
  color: #047857;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.product-identity:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: 3px;
}

.product-identity__name {
  overflow: hidden;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.products-mobile-list {
  display: none;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.product-mobile-row {
  border-bottom: 1px solid #eceff2;
  padding: 14px;
  cursor: pointer;
  transition: background-color 140ms ease;
}

.product-mobile-row:last-child {
  border-bottom: 0;
}

.product-mobile-row:hover {
  background: #fafbfc;
}

.product-mobile-row:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: -2px;
}

.product-mobile-row__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.product-mobile-row__header .product-identity {
  flex: 1;
}

.product-mobile-row__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.product-mobile-row__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 14px 0 0;
  border-top: 1px solid #eceff2;
  padding-top: 12px;
}

.product-mobile-row__meta div {
  min-width: 0;
}

.product-mobile-row__meta dt {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.product-mobile-row__meta dd {
  overflow: hidden;
  margin: 0;
  color: #1e293b;
  font-size: 13px;
  font-weight: 550;
  text-overflow: ellipsis;
}

@media (max-width: 760px) {
  .product-content {
    gap: 10px;
    padding: 12px;
  }

  .product-panel__body {
    padding: 12px;
  }

  .product-mobile-search-toggle {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 0;
    background: #ffffff;
    padding: 12px;
    color: #1e293b;
    text-align: left;
    cursor: pointer;
  }

  .product-mobile-search-toggle span {
    display: grid;
    min-width: 0;
    gap: 3px;
  }

  .product-mobile-search-toggle strong {
    font-size: 13px;
    font-weight: 650;
  }

  .product-mobile-search-toggle em {
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .product-mobile-search-toggle > .el-icon {
    flex: 0 0 auto;
    color: #64748b;
  }

  .product-search-panel .product-panel__body {
    border-top: 1px solid #eceff2;
  }

  .product-results-header {
    align-items: center;
    padding: 12px;
  }

  .product-results-footer {
    padding: 12px;
  }

  .product-search-toolbar {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px;
  }

  .product-search-toolbar__mode,
  .product-search-toolbar__query,
  .product-search-toolbar__producer {
    grid-column: 1 / -1;
  }

  .product-search-toolbar__action :deep(.el-button) {
    width: 100%;
  }

  .product-search-toolbar__filters {
    grid-column: 1 / 3;
  }

  .product-search-toolbar__reset {
    width: 40px;
  }

  .products-table--desktop {
    display: none;
  }

  .products-mobile-list {
    display: block;
  }

  .product-results-footer :deep(.flex) {
    flex-wrap: nowrap;
    gap: 8px;
  }

  .product-results-footer :deep(.page-size-select) {
    width: 60px;
    flex-basis: 60px;
  }

  .product-results-footer :deep(.min-w-24) {
    min-width: 76px;
    white-space: nowrap;
  }

  :deep(.product-filters-drawer .el-drawer__header) {
    padding: 16px 14px;
  }

  .product-filter-drawer__body {
    padding: 10px 14px 20px;
  }

  .product-filter-drawer__footer {
    padding: 12px 14px;
  }

}

@media (min-width: 761px) and (max-width: 1180px) {
  .product-search-toolbar {
    grid-template-columns: minmax(180px, 220px) minmax(260px, 1fr) minmax(220px, 280px);
  }

  .product-search-toolbar__action :deep(.el-button) {
    width: 100%;
  }

  .product-search-toolbar__reset {
    width: 40px;
  }

  .product-search-toolbar__filters {
    grid-column: 1 / 3;
  }
}
</style>
