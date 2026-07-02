<template>
  <div class="product-page">
    <PageHeader :title="t('products.title')" :description="t('products.description')">
      <template #actions>
        <el-button v-if="canCreateProducts" type="primary" @click="createDialogOpen = true">{{ t('products.createProducts') }}</el-button>
      </template>
    </PageHeader>

    <div class="product-content">
      <section class="product-panel product-search-panel">
        <div class="product-panel__body">
          <div class="product-search-toolbar">
            <div class="product-search-toolbar__mode">
              <label class="product-field-label">{{ t('products.searchMode') }}</label>
              <el-select v-model="form.searchMode" size="large" class="w-full" @change="applyFilters">
                <el-option :label="t('products.searchAll')" value="all" />
                <el-option :label="t('products.searchSku')" value="sku" />
              </el-select>
            </div>

            <div class="product-search-toolbar__query">
              <label class="product-field-label">{{ t('common.labels.search') }}</label>
              <el-input
                v-model="form.query"
                clearable
                size="large"
                :placeholder="searchPlaceholder"
                @keyup.enter="applyFilters"
              />
            </div>

            <div class="product-search-toolbar__producer">
              <label class="product-field-label">{{ t('common.labels.producer') }}</label>
              <ProducerSelector v-model="form.producerId" :placeholder="t('products.allProducers')" />
            </div>

            <el-badge
              v-if="form.searchMode === 'all'"
              class="product-search-toolbar__action"
              :value="dimensionFiltersCount"
              :hidden="dimensionFiltersCount === 0"
            >
              <el-button size="large" plain @click="filtersDrawerOpen = true">{{ t('products.filters') }}</el-button>
            </el-badge>

            <el-button class="product-search-toolbar__action product-search-toolbar__button" size="large" type="primary" @click="applyFilters">{{ t('products.find') }}</el-button>
            <el-button class="product-search-toolbar__action product-search-toolbar__button" size="large" plain @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
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
              <div class="product-filter-section__title">
                <span>{{ t('products.dimensions') }}</span>
                <el-tooltip :content="t('products.dimensionsHint')" placement="top">
                  <el-icon class="cursor-help text-slate-400"><InfoFilled /></el-icon>
                </el-tooltip>
              </div>

              <el-form label-position="top">
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
            </section>

            <section class="product-filter-section">
              <div class="product-filter-section__title">{{ t('products.length') }}</div>
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
            </section>

            <section class="product-filter-section">
              <div class="product-filter-section__title">{{ t('products.width') }}</div>
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
            </section>

            <section class="product-filter-section">
              <div class="product-filter-section__title">{{ t('products.height') }}</div>
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
            </section>
          </div>

          <div class="product-filter-drawer__footer">
            <div class="flex justify-end gap-3">
              <el-button @click="clearDimensionFilters">{{ t('products.clear') }}</el-button>
              <el-button type="primary" @click="applyFilters">{{ t('purchases.apply') }}</el-button>
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
          <div class="product-results-meta">
            {{ products.length.toLocaleString(locale) }}
          </div>
        </header>

        <el-table
          v-loading="isLoading"
          :data="products"
          class="products-table"
          @sort-change="handleSortChange"
          @row-dblclick="(row: ProductSearchModel) => openCrosses(row.id)"
        >
          <el-table-column prop="sku" :label="t('products.sku')" min-width="160" sortable="custom">
            <template #default="{ row }">
              <ProductSkuCell :sku="row.sku" :indicator="row.indicator" />
            </template>
          </el-table-column>
          <el-table-column prop="name" :label="t('common.labels.name')" min-width="260" />
          <el-table-column prop="producerId" :label="t('common.labels.producer')" min-width="180" sortable="custom">
            <template #default="{ row }">
              {{ producerName(row.producerId) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" :label="t('products.stock')" min-width="150" sortable="custom">
            <template #default="{ row }">
              <ProductStockCell :stock="row.stock" />
            </template>
          </el-table-column>
          <el-table-column prop="volume" :label="t('products.dimensions')" min-width="220" sortable="custom">
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
          <el-table-column fixed="right" label="" width="64" align="right">
            <template #default="{ row }">
              <ActionIconButton :label="t('products.crosses')" :icon="Link" @click="openCrosses(row.id)" />
            </template>
          </el-table-column>
        </el-table>

        <footer class="product-results-footer">
          <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" />
        </footer>
      </section>
    </div>

    <CreateProductsCrossesDialog v-if="canCreateProducts" v-model="createDialogOpen" @saved="loadProducts" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { InfoFilled, Link } from '@element-plus/icons-vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CreateProductsCrossesDialog from '@/components/products/CreateProductsCrossesDialog.vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { getProducer } from '@/services/api/producers.ts'
import { searchProducts, searchProductsBySku } from '@/services/api/search.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import {
  dimensionMeasureUnitLabel,
  dimensionSearchUnitOptions,
  dimensionUnitLabel,
  weightMeasureUnitLabel,
} from '@/utils/measurementUnits.ts'
import { useI18n } from '@/i18n'

type ProductSearchMode = 'all' | 'sku'

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
const { hasPermission } = usePermissions()
const canCreateProducts = computed(() => hasPermission('ARTICLES_CREATE'))

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
  return form.searchMode === 'sku' ? t('products.enterSku') : t('products.enterQuery')
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

function formatDimension(value: number) {
  return value.toLocaleString(locale.value)
}

function producerName(id: number) {
  return producerNames.value[id] ?? '—'
}

function openCrosses(productId: number) {
  router.push({
    name: 'product-details',
    params: { id: productId },
  })
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

async function applyFilters() {
  if (filtersDrawerOpen.value) {
    skipNextDrawerCloseApply.value = true
  }

  filtersDrawerOpen.value = false
  await router.push({
    name: 'products',
    query: buildRouteQuery(true),
  })
}

async function resetFilters() {
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
}

async function clearFilter(key: keyof ProductSearchForm) {
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
  if (isLoading.value) return

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

    products.value = resp.products
    hasNext.value = resp.products.length === size.value
    await loadProducerNames(resp.products)
    await ensureProducerName(form.producerId)
  } finally {
    isLoading.value = false
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
})
</script>

<style scoped>
.product-page {
  min-height: calc(100vh - 56px);
  background: #f7f8fa;
}

.product-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.product-panel {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.product-panel__body {
  padding: 16px;
}

.product-field-label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.product-active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.product-active-filters__label {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.product-results-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.product-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 16px;
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
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #f8fafc;
  padding: 4px 9px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.product-results-footer {
  border-top: 1px solid #e2e8f0;
  padding: 12px 16px;
}

.products-table {
  flex: 1;
}

.products-table :deep(.el-table__header th) {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
}

.products-table :deep(.el-table__row) {
  cursor: default;
}

.products-table :deep(.el-table__cell) {
  padding-top: 11px;
  padding-bottom: 11px;
}

:deep(.product-filters-drawer .el-drawer__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #e2e8f0;
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
  padding: 10px 20px 24px;
}

.product-filter-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.product-filter-section + .product-filter-section {
  margin-top: 14px;
}

.product-filter-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  color: #334155;
  font-size: 15px;
  font-weight: 600;
}

.dimension-range-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dimension-range-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.dimension-range-field > span {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
}

.product-filter-drawer__footer {
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 14px 20px;
}

:deep(.product-filters-drawer .el-form-item) {
  margin-bottom: 0;
}

.product-search-toolbar {
  display: grid;
  grid-template-columns: 220px minmax(280px, 1fr) minmax(220px, 300px) max-content max-content max-content;
  align-items: end;
  gap: 12px;
}

.product-search-toolbar__mode,
.product-search-toolbar__query,
.product-search-toolbar__producer {
  min-width: 0;
}

.product-search-toolbar__action {
  align-self: end;
}

.product-search-toolbar__button {
  min-width: 104px;
}

@media (max-width: 640px) {
  .product-content {
    padding: 12px;
  }

  .product-panel__body {
    padding: 12px;
  }

  .product-results-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .product-results-footer {
    padding: 12px;
  }

  .product-search-toolbar {
    grid-template-columns: 1fr;
  }

  .product-search-toolbar__action,
  .product-search-toolbar__button,
  .product-search-toolbar__action :deep(.el-button) {
    width: 100%;
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

  .dimension-range-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 641px) and (max-width: 1180px) {
  .product-search-toolbar {
    grid-template-columns: minmax(180px, 220px) minmax(260px, 1fr) minmax(220px, 280px);
  }

  .product-search-toolbar__action,
  .product-search-toolbar__button,
  .product-search-toolbar__action :deep(.el-button) {
    width: 100%;
  }
}
</style>
