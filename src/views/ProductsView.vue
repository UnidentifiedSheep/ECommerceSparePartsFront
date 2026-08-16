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
          <div class="catalogue-search-primary">
            <div class="catalogue-search-query">
              <label class="product-field-label">{{ t('common.labels.search') }}</label>
              <el-autocomplete
                v-model="form.query"
                :fetch-suggestions="querySearchHistory"
                :prefix-icon="Search"
                clearable
                size="large"
                value-key="value"
                class="w-full"
                :placeholder="t('products.catalogueSearchPlaceholder')"
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

            <div class="catalogue-search-producers">
              <label class="product-field-label">{{ t('common.labels.producer') }}</label>
              <ProducerMultiSelector
                v-if="canReviewCandidates"
                v-model="form.producerIds"
                :placeholder="t('products.allProducers')"
              />
              <ProducerSelector
                v-else
                :model-value="form.producerIds[0]"
                :placeholder="t('products.allProducers')"
                @update:model-value="setSingleProducer"
              />
            </div>

            <div class="catalogue-search-actions">
              <el-button type="primary" size="large" :disabled="Boolean(searchValidationMessage)" @click="submitSearch">
                {{ t('products.find') }}
              </el-button>
              <el-tooltip :content="t('common.actions.reset')" placement="top">
                <el-button
                  :icon="RefreshLeft"
                  size="large"
                  plain
                  :aria-label="t('common.actions.reset')"
                  @click="resetFilters"
                />
              </el-tooltip>
            </div>
          </div>

          <div v-if="canReviewCandidates" class="catalogue-search-toolbar">
            <fieldset class="catalogue-search-targets">
              <legend>{{ t('products.searchTargets') }}</legend>
              <el-checkbox-group v-model="form.targets" @change="applySearchConfiguration">
                <el-checkbox
                  v-for="target in targetOptions"
                  :key="target.value"
                  :label="target.value"
                  :disabled="form.targets.length === 1 && form.targets.includes(target.value)"
                >
                  {{ target.label }}
                  <span v-if="form.targets.includes(target.value)" class="catalogue-search-target-count">
                    {{ targetCount(target.value).toLocaleString(locale) }}
                  </span>
                </el-checkbox>
              </el-checkbox-group>
            </fieldset>

            <button
              class="catalogue-search-settings-toggle"
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
          </div>

          <div v-if="canReviewCandidates" v-show="searchSettingsOpen" class="catalogue-search-options">
            <div class="catalogue-search-presets">
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

            <fieldset class="catalogue-search-option-group">
              <legend>{{ t('products.skuMatching') }}</legend>
              <el-checkbox-group v-model="form.skuModes" @change="applySearchConfiguration">
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

            <fieldset class="catalogue-search-option-group">
              <legend>{{ t('products.nameMatching') }}</legend>
              <el-checkbox-group v-model="form.nameModes" @change="applySearchConfiguration">
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

          <p v-if="searchValidationMessage" class="catalogue-search-validation">{{ searchValidationMessage }}</p>
        </div>
      </section>

      <section class="product-panel product-results-panel">
        <header class="product-results-header">
          <div>
            <h2>{{ t('products.results') }}</h2>
            <p>{{ resultTitle }}</p>
          </div>
          <div class="product-results-aside">
            <div class="product-results-meta">
              {{ t(hasExactTotal ? 'products.foundCount' : 'products.shownCount', { count: totalResults.toLocaleString(locale) }) }}
            </div>
            <div class="product-results-tools">
              <div class="product-highlight-toggle">
                <span class="product-highlight-toggle__sample" aria-hidden="true">Aa</span>
                <span>{{ t('products.displayHighlights') }}</span>
                <el-switch
                  v-model="form.includeHighlights"
                  size="small"
                  :aria-label="t('products.includeHighlights')"
                  @change="applySearchConfiguration"
                />
              </div>
              <div class="product-sort-hint"><kbd>Shift</kbd> + {{ t('products.multiSortShort') }}</div>
            </div>
          </div>
        </header>

        <div
          ref="resultsScroll"
          v-loading="isLoading"
          class="catalogue-results-scroll"
          tabindex="0"
          :aria-label="t('products.results')"
          @focus="ensureSelectedResult"
          @keydown="handleResultsKeydown"
        >
        <el-table
          :data="catalogueResults"
          :row-class-name="catalogueResultRowClass"
          height="100%"
          class="products-table products-table--desktop"
          @row-click="openCatalogueResult"
          @row-dblclick="openCatalogueResultDetails"
        >
          <el-table-column prop="sku" :label="t('products.productColumn')" min-width="330">
            <template #header>
              <button class="sortable-column-header" type="button" :title="t('products.multiSortHint')" @click="toggleSort('sku', $event)">
                {{ t('products.productColumn') }}
                <span v-if="sortDirection('sku')">{{ sortDirection('sku') === 'asc' ? '↑' : '↓' }}{{ sortPriority('sku') }}</span>
              </button>
            </template>
            <template #default="{ row }">
              <button class="product-identity" type="button" @click.stop="openCatalogueResult(row)">
                <span class="product-identity__primary">
                  <ProductSkuCell
                    v-if="row.kind === 'product'"
                    :sku="row.sku"
                    :indicator="row.product.indicator"
                    :highlight="resultSkuHighlight(row)"
                  />
                  <strong v-else class="candidate-sku"><SearchHighlightedText :text="resultSkuHighlight(row)" /></strong>
                  <span v-if="row.kind === 'candidate'" class="catalogue-source-label catalogue-source-label--candidate">
                    {{ t('products.catalogueSourceCandidate') }}
                  </span>
                </span>
                <span class="product-identity__name">
                  <template v-for="(fragment, index) in resultNameFragments(row)" :key="`${fragment}-${index}`">
                    <span v-if="index > 0"> · </span><SearchHighlightedText :text="fragment" />
                  </template>
                </span>
              </button>
            </template>
          </el-table-column>
          <el-table-column prop="producerId" :label="t('common.labels.producer')" min-width="170">
            <template #header>
              <button class="sortable-column-header" type="button" :title="t('products.multiSortHint')" @click="toggleSort('producerId', $event)">
                {{ t('common.labels.producer') }}
                <span v-if="sortDirection('producerId')">{{ sortDirection('producerId') === 'asc' ? '↑' : '↓' }}{{ sortPriority('producerId') }}</span>
              </button>
            </template>
            <template #default="{ row }">
              {{ producerName(row.producerId) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" :label="t('products.stock')" min-width="150">
            <template #header>
              <button class="sortable-column-header" type="button" :title="t('products.multiSortHint')" :disabled="!form.targets.includes('Products')" @click="toggleSort('stock', $event)">
                {{ t('products.stock') }}
                <span v-if="sortDirection('stock')">{{ sortDirection('stock') === 'asc' ? '↑' : '↓' }}{{ sortPriority('stock') }}</span>
              </button>
            </template>
            <template #default="{ row }">
              <ProductStockCell v-if="row.kind === 'product'" :stock="row.product.stock" />
              <span v-else class="text-slate-400">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="volume" :label="t('products.dimensions')" min-width="210">
            <template #header>
              <button class="sortable-column-header" type="button" :title="t('products.multiSortHint')" :disabled="!form.targets.includes('Products')" @click="toggleSort('volume', $event)">
                {{ t('products.dimensions') }}
                <span v-if="sortDirection('volume')">{{ sortDirection('volume') === 'asc' ? '↑' : '↓' }}{{ sortPriority('volume') }}</span>
              </button>
            </template>
            <template #default="{ row }">
              <span v-if="row.kind === 'product' && row.product.dimensions">
                {{ formatDimension(row.product.dimensions.length) }} ×
                {{ formatDimension(row.product.dimensions.width) }} ×
                {{ formatDimension(row.product.dimensions.height) }}
                {{ dimensionMeasureUnitLabel(row.product.dimensions.unit) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="weight" :label="t('products.weight')" min-width="140">
            <template #header>
              <button class="sortable-column-header" type="button" :title="t('products.multiSortHint')" :disabled="!form.targets.includes('Products')" @click="toggleSort('weight', $event)">
                {{ t('products.weight') }}
                <span v-if="sortDirection('weight')">{{ sortDirection('weight') === 'asc' ? '↑' : '↓' }}{{ sortPriority('weight') }}</span>
              </button>
            </template>
            <template #default="{ row }">
              <span v-if="row.kind === 'product' && row.product.weight">{{ row.product.weight.value }} {{ weightMeasureUnitLabel(row.product.weight.unit, row.product.weight.value) }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" :label="t('common.labels.actions')" width="104" align="right">
            <template #default="{ row }">
              <div class="flex justify-end gap-1" @click.stop>
                <ActionIconButton
                  v-if="row.kind === 'product' && canViewPriceOffers"
                  :label="t('priceOffers.open')"
                  :icon="Money"
                  @click="openPriceOffers(row.product)"
                />
                <ActionIconButton :label="row.kind === 'product' ? t('products.openProduct') : t('products.openCandidate')" :icon="View" @click="openCatalogueResultDetails(row)" />
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="products-mobile-list">
          <article
            v-for="row in catalogueResults"
            :key="row.key"
            :class="[
              'product-mobile-row',
              {
                'product-mobile-row--candidate': row.kind === 'candidate',
                'product-mobile-row--selected': selectedResultKey === row.key,
              },
            ]"
            role="button"
            tabindex="0"
            @click="openCatalogueResult(row)"
            @keydown.enter.prevent="openCatalogueResult(row)"
            @keydown.space.prevent="openCatalogueResult(row)"
          >
            <div class="product-mobile-row__header">
              <button class="product-identity" type="button" @click.stop="openCatalogueResult(row)">
                <span class="product-identity__primary">
                <ProductSkuCell
                  v-if="row.kind === 'product'"
                  :sku="row.sku"
                  :indicator="row.product.indicator"
                  :highlight="resultSkuHighlight(row)"
                />
                <strong v-else class="candidate-sku"><SearchHighlightedText :text="resultSkuHighlight(row)" /></strong>
                  <span v-if="row.kind === 'candidate'" class="catalogue-source-label catalogue-source-label--candidate">
                    {{ t('products.catalogueSourceCandidate') }}
                  </span>
                </span>
                <span class="product-identity__name">
                  <template v-for="(fragment, index) in resultNameFragments(row)" :key="`${fragment}-${index}`">
                    <span v-if="index > 0"> · </span><SearchHighlightedText :text="fragment" />
                  </template>
                </span>
              </button>
              <div class="product-mobile-row__actions" @click.stop>
                <ActionIconButton
                  v-if="row.kind === 'product' && canViewPriceOffers"
                  :label="t('priceOffers.open')"
                  :icon="Money"
                  @click="openPriceOffers(row.product)"
                />
                <ActionIconButton :label="row.kind === 'product' ? t('products.openProduct') : t('products.openCandidate')" :icon="View" @click="openCatalogueResultDetails(row)" />
              </div>
            </div>

            <dl class="product-mobile-row__meta">
              <div>
                <dt>{{ t('common.labels.producer') }}</dt>
                <dd>{{ producerName(row.producerId) }}</dd>
              </div>
              <div>
                <dt>{{ t('products.stock') }}</dt>
                <dd><ProductStockCell v-if="row.kind === 'product'" :stock="row.product.stock" /><span v-else>—</span></dd>
              </div>
              <div>
                <dt>{{ t('products.dimensions') }}</dt>
                <dd v-if="row.kind === 'product' && row.product.dimensions">
                  {{ formatDimension(row.product.dimensions.length) }} × {{ formatDimension(row.product.dimensions.width) }} ×
                  {{ formatDimension(row.product.dimensions.height) }} {{ dimensionMeasureUnitLabel(row.product.dimensions.unit) }}
                </dd>
                <dd v-else>—</dd>
              </div>
              <div>
                <dt>{{ t('products.weight') }}</dt>
                <dd v-if="row.kind === 'product' && row.product.weight">{{ row.product.weight.value }} {{ weightMeasureUnitLabel(row.product.weight.unit, row.product.weight.value) }}</dd>
                <dd v-else>—</dd>
              </div>
            </dl>
          </article>

          <el-empty
            v-if="!isLoading && catalogueResults.length === 0"
            :description="t('products.notFound')"
            :image-size="64"
          />
        </div>

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
import { ArrowDown, Clock, Money, Plus, RefreshLeft, Search, View } from '@element-plus/icons-vue'
import { useDebounceFn, useMediaQuery } from '@vueuse/core'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import SearchHighlightedText from '@/components/common/SearchHighlightedText.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CreateProductsCrossesDialog from '@/components/products/CreateProductsCrossesDialog.vue'
import ProductQuickViewDrawer from '@/components/products/ProductQuickViewDrawer.vue'
import ProductPriceOffersDialog from '@/components/pricing/ProductPriceOffersDialog.vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import ProducerMultiSelector from '@/components/selectors/ProducerMultiSelector.vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { getProducersByIds } from '@/services/api/producers.ts'
import {
  type CatalogueCandidateSearchModel,
  type SearchMatchType,
  type SearchTarget,
  searchCatalogue,
  searchProducts,
  searchProductsBySku,
} from '@/services/api/search.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useProductSearchHistory } from '@/composables/useProductSearchHistory.ts'
import {
  dimensionMeasureUnitLabel,
  weightMeasureUnitLabel,
} from '@/utils/measurementUnits.ts'
import { useI18n } from '@/i18n'
import { loadCatalogueSearchPreferences, saveCatalogueSearchPreferences } from '@/utils/catalogueSearchPreferences.ts'
import { resolveSkuHighlight } from '@/utils/searchHighlights.ts'

interface ProductSearchHistoryItem {
  value: string
}

interface ProductSearchForm {
  query: string
  targets: SearchTarget[]
  skuModes: SearchMatchType[]
  nameModes: SearchMatchType[]
  includeHighlights: boolean
  producerIds: number[]
}

type SearchPreset = 'Exact' | 'Normal' | 'Broad'

type CatalogueResultRow =
  | {
      key: string
      kind: 'product'
      sku: string
      producerId: number
      product: ProductSearchModel
    }
  | {
      key: string
      kind: 'candidate'
      sku: string
      producerId: number
      candidate: CatalogueCandidateSearchModel
    }

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()

const products = ref<ProductSearchModel[]>([])
const catalogueCandidates = ref<CatalogueCandidateSearchModel[]>([])
const productsTotal = ref(0)
const candidatesTotal = ref(0)
const page = ref(0)
const size = ref(20)
const productSortBy = ref<string[]>([])
const candidateSortBy = ref<string[]>([])
const hasNext = ref(false)
const isLoading = ref(false)
const producerNames = ref<Record<number, string>>({})
const createDialogOpen = ref(false)
const priceOffersDialogOpen = ref(false)
const selectedPriceProduct = ref<ProductSearchModel | null>(null)
const quickViewOpen = ref(false)
const selectedQuickProduct = ref<ProductSearchModel | null>(null)
const mobileSearchCollapsed = ref(false)
const searchSettingsOpen = ref(false)
const selectedResultKey = ref<string | null>(null)
const resultsScroll = ref<HTMLElement | null>(null)
const isMobileViewport = useMediaQuery('(max-width: 760px)')
const { hasPermission } = usePermissions()
const canCreateProducts = computed(() => hasPermission('ARTICLES_CREATE'))
const canViewPriceOffers = computed(() => hasPermission('PRICES_GET_DETAILED'))
const canReviewCandidates = computed(() => hasPermission('CATALOGUE_CANDIDATES_REVIEW'))
const { searchHistory, rememberSearch: rememberSearchInHistory } = useProductSearchHistory()
let productsRequestId = 0
let suspendAutoSearch = false
let searchPreferences = loadCatalogueSearchPreferences()

const form = reactive<ProductSearchForm>({
  query: '',
  targets: [...searchPreferences.targets],
  skuModes: [...searchPreferences.skuModes],
  nameModes: [...searchPreferences.nameModes],
  includeHighlights: searchPreferences.includeHighlights,
  producerIds: [],
})

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
const targetOptions = computed<{ value: SearchTarget; label: string }[]>(() => [
  { value: 'Products', label: t('products.catalogueProducts') },
  { value: 'CatalogueCandidates', label: t('products.catalogueCandidates') },
])
const searchPresetOptions = computed<{ value: SearchPreset; label: string }[]>(() => [
  { value: 'Exact', label: t('products.searchPresets.Exact') },
  { value: 'Normal', label: t('products.searchPresets.Normal') },
  { value: 'Broad', label: t('products.searchPresets.Broad') },
])
const currentSearchPreset = computed<SearchPreset | 'Custom'>(() => {
  const preset = (Object.entries(searchPresets) as [SearchPreset, (typeof searchPresets)[SearchPreset]][])
    .find(([, modes]) => sameModes(form.skuModes, modes.sku) && sameModes(form.nameModes, modes.name))
  return preset?.[0] ?? 'Custom'
})
const searchSettingsSummary = computed(() => {
  const preset = t(`products.searchPresets.${currentSearchPreset.value}`)
  return t('products.searchSettingsSummary', {
    preset,
    sku: form.skuModes.length,
    name: form.nameModes.length,
  })
})
const catalogueResults = computed<CatalogueResultRow[]>(() => [
  ...(form.targets.includes('Products')
    ? products.value.map((product) => ({
        key: `product-${product.id}`,
        kind: 'product' as const,
        sku: product.sku,
        producerId: product.producerId,
        product,
      }))
    : []),
  ...(form.targets.includes('CatalogueCandidates')
    ? catalogueCandidates.value.map((candidate) => ({
        key: `candidate-${candidate.id}`,
        kind: 'candidate' as const,
        sku: candidate.sku,
        producerId: candidate.producerId,
        candidate,
      }))
    : []),
])
const totalResults = computed(() => (
  (form.targets.includes('Products') ? productsTotal.value : 0)
  + (form.targets.includes('CatalogueCandidates') ? candidatesTotal.value : 0)
))
const hasExactTotal = computed(() => canReviewCandidates.value)

const resultTitle = computed(() => {
  const query = form.query.trim()
  if (query) return t('products.queryResult', { query })
  return form.producerIds.length > 0 ? t('products.filteredProducts') : t('products.allProducts')
})

const searchValidationMessage = computed(() => {
  if (form.targets.length === 0) return t('products.selectSearchTarget')
  if (form.skuModes.length === 0 && form.nameModes.length === 0) return t('products.selectSearchField')
  const queryLength = form.query.trim().length
  const selectedModes = [...form.skuModes, ...form.nameModes]
  if (queryLength > 0 && queryLength < 4 && selectedModes.every((mode) => mode === 'Fuzzy')) {
    return t('products.fuzzyMinimum')
  }
  return ''
})

const mobileSearchSummary = computed(() => {
  const parts = [form.targets.map((target) => targetOptions.value.find((option) => option.value === target)?.label).join(', ')]
  const query = form.query.trim()
  if (query) parts.push(query)
  if (form.producerIds.length > 0) parts.push(t('products.producersSelected', { count: form.producerIds.length }))
  return parts.join(' · ')
})

const debouncedProductSearch = useDebounceFn(async () => {
  if (suspendAutoSearch || searchValidationMessage.value) return

  const query = form.query.trim()
  if (query === (queryString('query') ?? '').trim()) return

  rememberSearch(query)
  await applyFilters(true)
}, 450)

function formatDimension(value: number) {
  return value.toLocaleString(locale.value)
}

function sameModes(left: SearchMatchType[], right: SearchMatchType[]) {
  return left.length === right.length && right.every((mode) => left.includes(mode))
}

function targetCount(target: SearchTarget) {
  return target === 'Products' ? productsTotal.value : candidatesTotal.value
}

async function applySearchPreset(preset: SearchPreset) {
  form.skuModes = [...searchPresets[preset].sku]
  form.nameModes = [...searchPresets[preset].name]
  await applySearchConfiguration()
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

function candidateNames(candidate: CatalogueCandidateSearchModel) {
  return candidate.names.length > 0
    ? candidate.names.join(' · ')
    : t('products.noCandidateNames')
}

function highlightFragments(
  highlights: Record<string, string[]> | null | undefined,
  field: string,
  fallback: string,
) {
  const fragments = highlights?.[field]?.filter(Boolean)
  return fragments && fragments.length > 0 ? fragments : [fallback]
}

function resultSkuHighlight(row: CatalogueResultRow) {
  const source = row.kind === 'product' ? row.product : row.candidate
  return resolveSkuHighlight(
    row.sku,
    source.highlights?.sku ?? source.highlights?.normalizedSku,
  )
}

function resultNameFragments(row: CatalogueResultRow) {
  return row.kind === 'product'
    ? highlightFragments(row.product.highlights, 'name', row.product.name)
    : highlightFragments(row.candidate.highlights, 'names', candidateNames(row.candidate))
}

function catalogueResultRowClass({ row }: { row: CatalogueResultRow }) {
  return [
    row.kind === 'candidate' ? 'catalogue-result-row--candidate' : 'catalogue-result-row--product',
    selectedResultKey.value === row.key ? 'catalogue-result-row--selected' : '',
  ].filter(Boolean).join(' ')
}

function openCatalogueResult(row: CatalogueResultRow) {
  selectedResultKey.value = row.key
  if (row.kind === 'product') {
    openQuickView(row.product)
    return
  }
  openCandidate(row.candidate)
}

function openCatalogueResultDetails(row: CatalogueResultRow) {
  selectedResultKey.value = row.key
  if (row.kind === 'product') {
    openCrosses(row.product.id)
    return
  }
  openCandidate(row.candidate)
}

function ensureSelectedResult() {
  if (!catalogueResults.value.some((row) => row.key === selectedResultKey.value)) {
    selectedResultKey.value = catalogueResults.value[0]?.key ?? null
  }
}

function selectResultAt(index: number) {
  const row = catalogueResults.value[index]
  if (!row) return
  selectedResultKey.value = row.key
  void nextTick(() => {
    resultsScroll.value
      ?.querySelector('.catalogue-result-row--selected, .product-mobile-row--selected')
      ?.scrollIntoView({ block: 'nearest' })
  })
}

function handleResultsKeydown(event: KeyboardEvent) {
  if (event.target !== event.currentTarget || catalogueResults.value.length === 0) return
  const currentIndex = Math.max(0, catalogueResults.value.findIndex((row) => row.key === selectedResultKey.value))

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    if (event.key === 'Home') selectResultAt(0)
    else if (event.key === 'End') selectResultAt(catalogueResults.value.length - 1)
    else selectResultAt(Math.min(
      catalogueResults.value.length - 1,
      Math.max(0, currentIndex + (event.key === 'ArrowDown' ? 1 : -1)),
    ))
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const row = catalogueResults.value[currentIndex]
    if (!row) return
    if (event.ctrlKey || event.metaKey) openCatalogueResultDetails(row)
    else openCatalogueResult(row)
    return
  }

  if (event.key === 'Escape' && quickViewOpen.value) {
    event.preventDefault()
    quickViewOpen.value = false
    resultsScroll.value?.focus()
  }
}

function openCandidate(candidate: CatalogueCandidateSearchModel) {
  router.push({
    name: 'catalogue-enrichment',
    query: {
      sku: candidate.sku,
      candidateId: candidate.id,
    },
  })
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

function queryValues<T extends string>(name: string, allowed: T[]) {
  const value = queryString(name)
  if (!value) return []
  return [...new Set(value.split(',').filter((item): item is T => allowed.includes(item as T)))]
}

function queryNumbers(name: string) {
  return (queryString(name) ?? '')
    .split(',')
    .map(Number)
    .filter((value) => Number.isInteger(value) && value > 0)
}

function syncFormFromRoute() {
  form.query = queryString('query') ?? ''
  const routeTargets = queryValues('targets', ['Products', 'CatalogueCandidates'] satisfies SearchTarget[])
  form.targets = canReviewCandidates.value
    ? routeTargets.length > 0 ? routeTargets : [...searchPreferences.targets]
    : ['Products']
  const routeSkuModes = queryValues('skuModes', searchMatchTypes)
  const routeNameModes = queryValues('nameModes', searchMatchTypes)
  form.skuModes = routeSkuModes.length > 0 || routeNameModes.length > 0
    ? routeSkuModes
    : [...searchPreferences.skuModes]
  form.nameModes = routeSkuModes.length > 0 || routeNameModes.length > 0
    ? routeNameModes
    : [...searchPreferences.nameModes]
  form.includeHighlights = searchPreferences.includeHighlights
  const requestedProducerIds = queryNumbers('producerIds')
  form.producerIds = canReviewCandidates.value ? requestedProducerIds : requestedProducerIds.slice(0, 1)
  page.value = queryNumber('page') ?? 0
  size.value = queryNumber('size') ?? 20
  productSortBy.value = (queryString('productSort') ?? '').split(',').filter(Boolean)
  candidateSortBy.value = (queryString('candidateSort') ?? '').split(',').filter(Boolean)
}

function buildRouteQuery(resetPage: boolean) {
  return {
    query: form.query.trim() || undefined,
    targets: canReviewCandidates.value ? form.targets.join(',') : undefined,
    skuModes: canReviewCandidates.value ? form.skuModes.join(',') : undefined,
    nameModes: canReviewCandidates.value ? form.nameModes.join(',') : undefined,
    producerIds: form.producerIds.length > 0 ? form.producerIds.join(',') : undefined,
    productSort: productSortBy.value.length > 0 ? productSortBy.value.join(',') : undefined,
    candidateSort: candidateSortBy.value.length > 0 ? candidateSortBy.value.join(',') : undefined,
    page: resetPage ? 0 : page.value,
    size: size.value,
  }
}

async function applyFilters(replaceRoute = false) {
  const previousPath = route.fullPath
  const navigate = replaceRoute ? router.replace : router.push
  await navigate({
    name: 'products',
    query: buildRouteQuery(true),
  })
  if (route.fullPath === previousPath) await loadProducts()
}

async function applySearchConfiguration() {
  rememberSearchPreferences()
  await applyFilters(true)
}

function rememberSearchPreferences() {
  searchPreferences = {
    targets: [...form.targets],
    skuModes: [...form.skuModes],
    nameModes: [...form.nameModes],
    includeHighlights: form.includeHighlights,
  }
  saveCatalogueSearchPreferences(searchPreferences)
}

function isLastSearchMode(field: 'sku' | 'name', mode: SearchMatchType) {
  const modes = field === 'sku' ? form.skuModes : form.nameModes
  return modes.includes(mode) && form.skuModes.length + form.nameModes.length === 1
}

function setSingleProducer(producerId?: number) {
  form.producerIds = producerId ? [producerId] : []
}

async function submitSearch() {
  if (searchValidationMessage.value) return
  rememberSearch(form.query)
  await applyFilters()
  if (isMobileViewport.value) {
    mobileSearchCollapsed.value = true
  }
}

async function resetFilters() {
  suspendAutoSearch = true
  form.query = ''
  form.producerIds = []
  productSortBy.value = []
  candidateSortBy.value = []

  await router.push({
    name: 'products',
    query: { page: 0, size: size.value },
  })
  suspendAutoSearch = false
}

function sortField(value: string) {
  return value.endsWith('_desc') ? value.slice(0, -5) : value
}

function activeSort() {
  return form.targets.includes('Products') ? productSortBy.value : candidateSortBy.value
}

function sortDirection(field: string): 'asc' | 'desc' | undefined {
  const value = activeSort().find((item) => sortField(item) === field)
  if (!value) return undefined
  return value.endsWith('_desc') ? 'desc' : 'asc'
}

function sortPriority(field: string) {
  const currentSort = activeSort()
  const index = currentSort.findIndex((item) => sortField(item) === field)
  return index >= 0 && currentSort.length > 1 ? index + 1 : ''
}

async function toggleSort(field: string, event: MouseEvent) {
  const currentSort = activeSort()
  const current = currentSort.find((item) => sortField(item) === field)
  const next = !current ? field : current.endsWith('_desc') ? undefined : `${field}_desc`
  const remaining = currentSort.filter((item) => sortField(item) !== field)
  const nextSort = event.shiftKey
    ? next ? [...remaining, next] : remaining
    : next ? [next] : []
  const candidateFields = new Set(['sku', 'producerId'])

  productSortBy.value = form.targets.includes('Products') ? nextSort : []
  candidateSortBy.value = form.targets.includes('CatalogueCandidates')
    ? nextSort.filter((item) => candidateFields.has(sortField(item)))
    : []

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
    if (canReviewCandidates.value) {
      if (searchValidationMessage.value) return
      const response = await searchCatalogue({
        query: query || undefined,
        targets: form.targets,
        fields: {
          sku: form.skuModes,
          name: form.nameModes,
        },
        producerIds: form.producerIds,
        includeHighlights: form.includeHighlights && Boolean(query),
        page: page.value,
        size: size.value,
        sortBy: {
          products: productSortBy.value,
          catalogueCandidates: candidateSortBy.value,
        },
      })

      if (currentRequestId !== productsRequestId) return
      products.value = response.products.items
      catalogueCandidates.value = response.catalogueCandidates.items
      productsTotal.value = response.products.total
      candidatesTotal.value = response.catalogueCandidates.total
      const nextOffset = (page.value + 1) * size.value
      hasNext.value = (
        form.targets.includes('Products') && nextOffset < response.products.total
      ) || (
        form.targets.includes('CatalogueCandidates') && nextOffset < response.catalogueCandidates.total
      )
      await loadProducerNames(response.products.items, form.producerIds, response.catalogueCandidates.items)
      return
    }

    const onlySku = form.nameModes.length === 0 && form.skuModes.length > 0
    const resp = onlySku
      ? await searchProductsBySku({
          sku: query,
          producerId: form.producerIds[0],
          searchMode: form.skuModes.length === 1 ? form.skuModes[0] : 'Full',
          page: page.value,
          size: size.value,
          sortBy: productSortBy.value,
        })
      : await searchProducts({
          query: query || undefined,
          producerId: form.producerIds[0],
          page: page.value,
          size: size.value,
          sortBy: productSortBy.value,
        })

    if (currentRequestId !== productsRequestId) return

    products.value = resp.products
    catalogueCandidates.value = []
    productsTotal.value = resp.products.length
    candidatesTotal.value = 0
    hasNext.value = resp.products.length === size.value
    await loadProducerNames(resp.products, form.producerIds)
  } finally {
    if (currentRequestId === productsRequestId) {
      isLoading.value = false
    }
  }
}

async function loadProducerNames(
  items: ProductSearchModel[],
  selectedProducerIds: number[] = [],
  candidates: CatalogueCandidateSearchModel[] = [],
) {
  const ids = [...new Set([
    ...items.map((product) => product.producerId),
    ...candidates.map((candidate) => candidate.producerId),
    ...selectedProducerIds,
  ])]
    .filter((id) => !producerNames.value[id])

  const producers = await getProducersByIds(ids)
  producers.forEach((producer) => {
    producerNames.value[producer.id] = producer.name
  })
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

watch(() => form.producerIds, (producerIds) => {
  if (suspendAutoSearch || producerIds.join(',') === (queryString('producerIds') ?? '')) return
  void applyFilters(true)
}, { deep: true })

watch(catalogueResults, (rows) => {
  if (!rows.some((row) => row.key === selectedResultKey.value)) {
    selectedResultKey.value = null
  }
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
    || form.producerIds.length > 0
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

.product-results-aside {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.product-results-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.product-highlight-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 11px;
}

.product-highlight-toggle__sample {
  color: #047857;
  font-size: 12px;
  font-weight: 750;
}

.product-sort-hint {
  color: #64748b;
  font-size: 11px;
}

.product-sort-hint kbd {
  border: 1px solid #cbd5e1;
  border-bottom-color: #94a3b8;
  border-radius: 4px;
  background: #f8fafc;
  padding: 1px 5px;
  color: #334155;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
}

.catalogue-results-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.catalogue-results-scroll:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: -2px;
}

.product-results-footer {
  flex: 0 0 auto;
  border-top: 1px solid #dfe3e8;
  background: #fafafa;
  padding: 10px 16px;
}

.products-table {
  width: 100%;
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

.products-table :deep(.catalogue-result-row--selected > td.el-table__cell) {
  background: #eef6f1;
}

.products-table :deep(.el-table__cell) {
  padding-top: 9px;
  padding-bottom: 9px;
  color: #1e293b;
}

.sortable-column-header {
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

.sortable-column-header:hover,
.sortable-column-header:focus-visible {
  color: #0f172a;
}

.sortable-column-header:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: 3px;
}

.sortable-column-header span {
  color: #047857;
  font-variant-numeric: tabular-nums;
  font-weight: 750;
}

.sortable-column-header:disabled {
  color: #94a3b8;
  cursor: default;
}

.catalogue-search-primary {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(260px, 360px) auto;
  align-items: end;
  gap: 12px;
}

.catalogue-search-query,
.catalogue-search-producers {
  min-width: 0;
}

.catalogue-search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.catalogue-search-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.catalogue-search-targets {
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 0;
}

.catalogue-search-targets legend,
.catalogue-search-option-group legend {
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 650;
}

.catalogue-search-targets :deep(.el-checkbox-group),
.catalogue-search-option-group :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  column-gap: 14px;
  row-gap: 3px;
}

.catalogue-search-targets :deep(.el-checkbox),
.catalogue-search-option-group :deep(.el-checkbox) {
  height: 24px;
  margin-right: 0;
}

.catalogue-search-targets :deep(.el-checkbox__label),
.catalogue-search-option-group :deep(.el-checkbox__label) {
  padding-left: 6px;
  color: #334155;
  font-size: 12px;
}

.catalogue-search-target-count {
  margin-left: 4px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.catalogue-search-settings-toggle {
  display: flex;
  min-width: min(440px, 42vw);
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 0;
  background: transparent;
  padding: 0;
  color: #334155;
  text-align: right;
  cursor: pointer;
}

.catalogue-search-settings-toggle > span {
  display: grid;
  min-width: 0;
  justify-items: end;
  gap: 2px;
}

.catalogue-search-settings-toggle strong {
  font-size: 12px;
  font-weight: 650;
}

.catalogue-search-settings-toggle em {
  overflow: hidden;
  max-width: 100%;
  color: #64748b;
  font-size: 11px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalogue-search-settings-toggle > .el-icon {
  flex: 0 0 auto;
  transition: transform 140ms ease;
}

.catalogue-search-settings-toggle > .el-icon.is-open {
  transform: rotate(180deg);
}

.catalogue-search-settings-toggle:hover strong,
.catalogue-search-settings-toggle:focus-visible strong {
  color: #047857;
}

.catalogue-search-settings-toggle:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: 3px;
}

.catalogue-search-options {
  display: grid;
  grid-template-columns: auto minmax(310px, 1fr) minmax(310px, 1fr);
  gap: 18px;
  margin-top: 10px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.catalogue-search-option-group {
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 0 0 0 18px;
  border-left: 1px solid #e2e8f0;
}

.catalogue-search-presets {
  min-width: 220px;
}

.catalogue-search-presets > span {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 650;
}

.catalogue-search-presets > div {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
}

.catalogue-search-presets button {
  border: 0;
  border-right: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 5px 9px;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
}

.catalogue-search-presets button:last-child {
  border-right: 0;
}

.catalogue-search-presets button:hover,
.catalogue-search-presets button:focus-visible {
  background: #f8fafc;
  color: #0f172a;
}

.catalogue-search-presets button:focus-visible {
  outline: 2px solid #86bda4;
  outline-offset: -2px;
}

.catalogue-search-presets button.is-active {
  background: #eef6f1;
  color: #047857;
  font-weight: 650;
}

.catalogue-search-validation {
  margin: 8px 0 0;
  color: #b42318;
  font-size: 12px;
  font-weight: 600;
}

.catalogue-search-primary :deep(.el-select),
.catalogue-search-primary :deep(.el-autocomplete) {
  min-width: 0;
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

.product-identity__primary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.catalogue-source-label {
  flex: 0 0 auto;
  border: 1px solid;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 650;
  line-height: 1.4;
  white-space: nowrap;
}

.catalogue-source-label--candidate {
  border-color: #dbe3ef;
  background: #f8fafc;
  color: #002fa7;
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

.candidate-sku {
  color: #0f172a;
  font-size: 13px;
  font-weight: 750;
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

.product-mobile-row--selected {
  background: #eef6f1;
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

  .catalogue-search-primary {
    grid-template-columns: 1fr;
  }

  .catalogue-search-actions :deep(.el-button:first-child) {
    flex: 1;
  }

  .catalogue-search-options {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .catalogue-search-toolbar {
    display: grid;
    align-items: stretch;
    gap: 8px;
  }

  .catalogue-search-settings-toggle {
    width: 100%;
    min-width: 0;
    text-align: left;
  }

  .catalogue-search-settings-toggle > span {
    justify-items: start;
  }

  .catalogue-search-option-group {
    border-top: 1px solid #eceff2;
    border-left: 0;
    padding: 10px 0 0;
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

}

@media (min-width: 761px) and (max-width: 1180px) {
  .catalogue-search-primary {
    grid-template-columns: minmax(280px, 1fr) minmax(240px, 320px) auto;
  }

  .catalogue-search-options {
    grid-template-columns: auto 1fr 1fr;
  }

}
</style>
