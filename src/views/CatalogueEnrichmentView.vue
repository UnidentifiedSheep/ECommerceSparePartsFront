<template>
  <div class="catalogue-review-page">
    <PageHeader :title="t('catalogueReview.title')" :description="t('catalogueReview.description')">
      <template #actions>
        <el-button :icon="Refresh" :loading="isLoading" @click="loadCandidates">
          {{ t('common.actions.refresh') }}
        </el-button>
      </template>
    </PageHeader>

    <main v-if="canReview" class="catalogue-review-content">
      <section class="catalogue-review-filters">
        <label>
          <span>{{ t('catalogueReview.sku') }}</span>
          <el-autocomplete
            v-model="filters.sku"
            clearable
            :prefix-icon="Search"
            :placeholder="t('catalogueReview.skuPlaceholder')"
            :fetch-suggestions="suggestSku"
            :trigger-on-focus="false"
            :debounce="250"
            highlight-first-item
            value-key="sku"
            @select="selectSkuSuggestion"
            @keyup.enter="applyFilters"
          >
            <template #default="{ item }">
              <div class="sku-suggestion">
                <strong>{{ item.sku }}</strong>
                <span>{{ item.name }}</span>
                <em>{{ t('catalogueReview.stockValue', { count: item.stock }) }}</em>
              </div>
            </template>
          </el-autocomplete>
        </label>
        <div class="catalogue-product-filter">
          <span>{{ t('common.labels.product') }}</span>
          <div class="compact-product-picker">
            <button type="button" @click="productSelectorOpen = true">
              <span v-if="selectedFilterProduct" class="compact-product-picker__value">
                <strong>{{ selectedFilterProduct.sku }}</strong>
                <em>{{ selectedFilterProduct.name }}</em>
              </span>
              <span v-else class="compact-product-picker__placeholder">
                {{ t('catalogueReview.selectProduct') }}
              </span>
            </button>
            <el-button
              v-if="selectedFilterProduct"
              :icon="Close"
              text
              :aria-label="t('common.actions.reset')"
              @click="clearProductFilter"
            />
          </div>
        </div>
        <div class="catalogue-review-filter-actions">
          <el-button type="primary" @click="applyFilters">{{ t('common.actions.apply') }}</el-button>
          <el-button :disabled="!hasFilters" @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
        </div>
      </section>

      <section class="catalogue-review-workspace">
        <aside class="candidate-list-panel" v-loading="isLoading">
          <header class="candidate-list-header">
            <div>
              <h2>{{ t('catalogueReview.queue') }}</h2>
              <p>
                {{ t('catalogueReview.pageSummary', {
                  total: candidates.length,
                  unlinked: unlinkedCandidatesCount,
                  linked: linkedCandidatesCount,
                }) }}
              </p>
            </div>
          </header>

          <div v-if="candidates.length" class="candidate-list">
            <button
              v-for="candidate in candidates"
              :key="candidate.id"
              type="button"
              class="candidate-list-item"
              :class="{ 'candidate-list-item--selected': selectedCandidate?.id === candidate.id }"
              @click="selectCandidate(candidate)"
            >
              <span class="candidate-list-item__main">
                <strong>{{ candidate.sku }}</strong>
                <span>{{ candidate.producer.name }}</span>
              </span>
              <span class="candidate-list-item__meta">
                <span
                  class="candidate-status"
                  :class="candidate.product ? 'candidate-status--linked' : 'candidate-status--unlinked'"
                >
                  <el-icon>
                    <CircleCheckFilled v-if="candidate.product" />
                    <WarningFilled v-else />
                  </el-icon>
                  {{ candidate.product ? t('catalogueReview.linked') : t('catalogueReview.unlinked') }}
                </span>
                <span>{{ t('catalogueReview.sourcesCount', { count: candidate.supplierProducts.length }) }}</span>
              </span>
              <span v-if="candidate.supplierProducts.length" class="candidate-list-item__suppliers">
                <template
                  v-for="(supplier, supplierIndex) in candidateSuppliers(candidate)"
                  :key="supplier"
                >
                  <span class="supplier-source-label" :class="supplierColorClass(supplier)">
                    {{ supplierLabel(supplier) }}
                  </span>
                  <span
                    v-if="supplierIndex < candidateSuppliers(candidate).length - 1"
                    class="supplier-source-separator"
                  >·</span>
                </template>
              </span>
            </button>
          </div>
          <el-empty v-else-if="!isLoading" :description="t('catalogueReview.empty')" :image-size="72" />

          <footer class="candidate-list-footer">
            <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" :sizes="[10, 20, 30, 50]" />
          </footer>
        </aside>

        <article v-if="selectedCandidate" class="candidate-details">
          <header class="candidate-details-header">
            <div>
              <span>{{ selectedCandidate.producer.name }}</span>
              <h2>{{ selectedCandidate.sku }}</h2>
            </div>
            <div class="candidate-details-navigation">
              <span class="candidate-id">
                {{ t('catalogueReview.candidatePosition', {
                  current: selectedCandidateIndex + 1,
                  total: candidates.length,
                  id: selectedCandidate.id,
                }) }}
              </span>
              <el-button-group>
                <el-button
                  :icon="ArrowLeft"
                  :disabled="selectedCandidateIndex <= 0"
                  @click="selectAdjacentCandidate(-1)"
                >
                  {{ t('catalogueReview.previousCandidate') }}
                </el-button>
                <el-button
                  :disabled="selectedCandidateIndex >= candidates.length - 1"
                  @click="selectAdjacentCandidate(1)"
                >
                  {{ t('catalogueReview.nextCandidate') }}
                  <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                </el-button>
              </el-button-group>
            </div>
          </header>

          <section class="candidate-section">
            <div class="candidate-section-header">
              <h3>{{ t('catalogueReview.catalogueProduct') }}</h3>
            </div>

            <div v-if="selectedCandidate.product" class="catalogue-product">
              <img
                v-if="selectedCandidate.product.images[0]"
                :src="selectedCandidate.product.images[0]"
                :alt="selectedCandidate.product.name"
              />
              <div v-else class="catalogue-product__placeholder">{{ productInitial(selectedCandidate.product.name) }}</div>
              <div class="catalogue-product__content">
                <div class="catalogue-product__identity">
                  <strong>{{ selectedCandidate.product.name }}</strong>
                  <span>{{ selectedCandidate.product.producerName }} · {{ selectedCandidate.product.sku }}</span>
                </div>
                <p v-if="selectedCandidate.product.description">{{ selectedCandidate.product.description }}</p>
                <dl>
                  <div>
                    <dt>{{ t('products.stock') }}</dt>
                    <dd>{{ selectedCandidate.product.stock }}</dd>
                  </div>
                  <div>
                    <dt>ID</dt>
                    <dd>{{ selectedCandidate.product.id }}</dd>
                  </div>
                </dl>
              </div>
              <el-button :icon="ArrowRight" @click="openProduct(selectedCandidate.product.id)">
                {{ t('catalogueReview.openProduct') }}
              </el-button>
            </div>
            <div v-else class="catalogue-product-empty">
              <span>{{ t('catalogueReview.noProduct') }}</span>
              <p>{{ t('catalogueReview.noProductHint') }}</p>
            </div>
          </section>

          <section class="candidate-section candidate-sources-section">
            <div class="candidate-section-header">
              <h3>{{ t('catalogueReview.alternativeNames') }}</h3>
              <span>{{ groupedCandidateNames.length }}</span>
            </div>

            <div v-if="groupedCandidateNames.length" class="candidate-name-groups">
              <div v-for="group in groupedCandidateNames" :key="group.name" class="candidate-name-group">
                <strong>{{ group.name }}</strong>
                <div class="candidate-name-usages">
                  <template
                    v-for="(supplier, supplierIndex) in nameUsageSuppliers(group)"
                    :key="supplier"
                  >
                    <span class="supplier-source-label" :class="supplierColorClass(supplier)">
                      {{ supplierLabel(supplier) }}
                    </span>
                    <span
                      v-if="supplierIndex < nameUsageSuppliers(group).length - 1"
                      class="supplier-source-separator"
                    >·</span>
                  </template>
                </div>
              </div>
            </div>
            <p v-else class="supplier-product-empty">{{ t('catalogueReview.noNames') }}</p>
          </section>

          <section class="candidate-section candidate-sources-section">
            <div class="candidate-section-header">
              <h3>{{ t('catalogueReview.supplierProducts') }}</h3>
              <span>{{ selectedCandidate.supplierProducts.length }}</span>
            </div>

            <el-table
              v-if="selectedCandidate.supplierProducts.length"
              :data="selectedCandidate.supplierProducts"
              class="supplier-products-table"
            >
              <el-table-column :label="t('catalogueReview.supplier')" min-width="150">
                <template #default="{ row }">
                  <span
                    class="supplier-source-label"
                    :class="supplierColorClass(row.supplier)"
                  >
                    {{ supplierLabel(row.supplier) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="t('catalogueReview.supplierSku')" min-width="170">
                <template #default="{ row }">
                  <strong class="supplier-products-table__sku">{{ row.sku }}</strong>
                </template>
              </el-table-column>
              <el-table-column :label="t('common.labels.producer')" min-width="180">
                <template #default="{ row }">
                  <strong class="supplier-products-table__producer">{{ row.producer }}</strong>
                </template>
              </el-table-column>
              <el-table-column :label="t('catalogueReview.names')" width="110" align="right">
                <template #default="{ row }">{{ row.names.length }}</template>
              </el-table-column>
              <el-table-column label="ID" width="90" align="right">
                <template #default="{ row }"><span class="supplier-products-table__id">#{{ row.id }}</span></template>
              </el-table-column>
            </el-table>
            <el-empty v-else :description="t('catalogueReview.noSources')" :image-size="64" />
          </section>
        </article>

        <div v-else class="candidate-details-empty">
          <el-empty :description="t('catalogueReview.selectCandidate')" />
        </div>
      </section>
    </main>

    <main v-else class="catalogue-review-no-access">
      <el-empty :description="t('catalogueReview.noAccess')" />
    </main>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="selectFilterProduct" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, CircleCheckFilled, Close, Refresh, Search, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import type { CatalogueCandidateReviewModel } from '@/models/catalogueCandidateModel.ts'
import type { ProductModel } from '@/models/productModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { Supplier } from '@/models/producerModel.ts'
import { getCatalogueCandidatesForReview, getProductsByIds } from '@/services/api/products.ts'
import { searchProductsBySku } from '@/services/api/search.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'
import { groupCatalogueCandidateNames, type CatalogueNameGroup } from '@/utils/catalogueCandidateNames.ts'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { hasPermission } = usePermissions()

const canReview = computed(() => hasPermission('CATALOGUE_CANDIDATES_REVIEW'))
const candidates = ref<CatalogueCandidateReviewModel[]>([])
const selectedCandidate = ref<CatalogueCandidateReviewModel>()
const selectedFilterProduct = ref<ProductSearchModel>()
const productSelectorOpen = ref(false)
const page = ref(queryInteger(route.query.page, 0) ?? 0)
const size = ref(queryInteger(route.query.size, 20) ?? 20)
const hasNext = ref(false)
const isLoading = ref(false)
let requestId = 0

const filters = reactive({
  sku: typeof route.query.sku === 'string' ? route.query.sku : '',
  productId: queryInteger(route.query.productId),
})
const hasFilters = computed(() => Boolean(filters.sku.trim() || filters.productId))
const groupedCandidateNames = computed(() => (
  selectedCandidate.value ? groupCatalogueCandidateNames([selectedCandidate.value]) : []
))
const linkedCandidatesCount = computed(() => candidates.value.filter((candidate) => candidate.product).length)
const unlinkedCandidatesCount = computed(() => candidates.value.length - linkedCandidatesCount.value)
const selectedCandidateIndex = computed(() => (
  selectedCandidate.value
    ? candidates.value.findIndex((candidate) => candidate.id === selectedCandidate.value?.id)
    : -1
))

function queryInteger(value: unknown, fallback?: number): number | undefined {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= (fallback === 0 ? 0 : 1) ? parsed : fallback
}

function supplierLabel(supplier: Supplier) {
  return t(`producers.suppliers.${supplier}`)
}

function candidateSuppliers(candidate: CatalogueCandidateReviewModel): Supplier[] {
  return [...new Set(candidate.supplierProducts.map((item) => item.supplier))]
}

function nameUsageSuppliers(group: CatalogueNameGroup): Supplier[] {
  return [...new Set(group.usages.map((usage) => usage.supplier))]
}

function supplierColorClass(supplier: Supplier) {
  return `supplier-source-label--${supplier.toLocaleLowerCase()}`
}

function productInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase() || '—'
}

async function suggestSku(
  query: string,
  callback: (suggestions: ProductSearchModel[]) => void,
) {
  const sku = query.trim()
  if (!sku) {
    callback([])
    return
  }

  try {
    const response = await searchProductsBySku({
      sku,
      searchMode: 'StartsWith',
      page: 0,
      size: 8,
      sortBy: ['sku'],
    })
    const uniqueBySku = new Map(response.products.map((product) => [product.sku, product]))
    callback([...uniqueBySku.values()])
  } catch {
    callback([])
  }
}

async function selectSkuSuggestion(product: ProductSearchModel) {
  filters.sku = product.sku
  await applyFilters()
}

async function selectFilterProduct(product: ProductSearchModel) {
  selectedFilterProduct.value = product
  filters.productId = product.id
  await applyFilters()
}

async function clearProductFilter() {
  selectedFilterProduct.value = undefined
  filters.productId = undefined
  await applyFilters()
}

async function loadSelectedFilterProduct() {
  if (!filters.productId) return

  try {
    const response = await getProductsByIds([filters.productId])
    selectedFilterProduct.value = response.products[0]
  } catch {
    selectedFilterProduct.value = undefined
  }
}

function openProduct(productId: number) {
  router.push({ name: 'product-details', params: { id: productId } })
}

async function selectCandidate(candidate: CatalogueCandidateReviewModel) {
  selectedCandidate.value = candidate
  await syncRoute(candidate.id)
}

async function selectAdjacentCandidate(offset: -1 | 1) {
  const candidate = candidates.value[selectedCandidateIndex.value + offset]
  if (candidate) await selectCandidate(candidate)
}

async function syncRoute(candidateId = selectedCandidate.value?.id) {
  await router.replace({
    name: 'catalogue-enrichment',
    query: {
      ...(filters.sku.trim() ? { sku: filters.sku.trim() } : {}),
      ...(filters.productId ? { productId: String(filters.productId) } : {}),
      ...(page.value ? { page: String(page.value) } : {}),
      ...(size.value !== 20 ? { size: String(size.value) } : {}),
      ...(candidateId ? { candidateId: String(candidateId) } : {}),
    },
  })
}

async function loadCandidates() {
  if (!canReview.value) return

  const currentRequestId = ++requestId
  isLoading.value = true
  try {
    const response = await getCatalogueCandidatesForReview({
      productId: filters.productId,
      sku: filters.sku,
      page: page.value,
      size: size.value,
    })
    if (currentRequestId !== requestId) return

    candidates.value = response.candidates
    hasNext.value = response.candidates.length === size.value
    const requestedCandidateId = typeof route.query.candidateId === 'string'
      ? route.query.candidateId
      : undefined
    const nextSelection = response.candidates.find((item) => item.id === requestedCandidateId)
      ?? response.candidates.find((item) => item.id === selectedCandidate.value?.id)
      ?? response.candidates[0]
    selectedCandidate.value = nextSelection
    await syncRoute(nextSelection?.id)
  } catch (error) {
    if (currentRequestId === requestId) {
      candidates.value = []
      selectedCandidate.value = undefined
      hasNext.value = false
      ElMessage.error(error instanceof Error ? error.message : t('catalogueReview.loadError'))
    }
  } finally {
    if (currentRequestId === requestId) isLoading.value = false
  }
}

async function applyFilters() {
  if (page.value !== 0) page.value = 0
  else await loadCandidates()
}

async function resetFilters() {
  filters.sku = ''
  filters.productId = undefined
  selectedFilterProduct.value = undefined
  if (page.value !== 0) page.value = 0
  else await loadCandidates()
}

watch(page, loadCandidates)
watch(size, () => {
  if (page.value !== 0) page.value = 0
  else loadCandidates()
})

onMounted(async () => {
  await Promise.all([loadSelectedFilterProduct(), loadCandidates()])
})
</script>

<style scoped>
.catalogue-review-page { display: flex; height: calc(100dvh - 56px); min-height: 0; flex-direction: column; overflow: hidden; background: var(--app-bg); }
.catalogue-review-content { display: grid; min-height: 0; flex: 1; grid-template-rows: auto minmax(0, 1fr); gap: 12px; overflow: hidden; padding: 16px 24px 24px; }
.catalogue-review-filters {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(280px, 420px) auto;
  align-items: end;
  gap: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  padding: 12px;
}
.catalogue-review-filters label, .catalogue-product-filter { display: grid; min-width: 0; gap: 6px; color: #475569; font-size: 13px; font-weight: 650; }
.catalogue-review-filters :deep(.el-autocomplete) { width: 100%; }
.compact-product-picker { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; min-height: 32px; overflow: hidden; border: 1px solid var(--el-border-color); border-radius: 4px; background: #fff; }
.compact-product-picker:focus-within { border-color: var(--el-color-primary); }
.compact-product-picker > button { min-width: 0; height: 30px; border: 0; background: transparent; padding: 0 10px; cursor: pointer; text-align: left; }
.compact-product-picker__value { display: flex; min-width: 0; align-items: center; gap: 8px; }
.compact-product-picker__value strong { flex: 0 0 auto; color: #0f172a; font-size: 13px; }
.compact-product-picker__value em { overflow: hidden; color: #64748b; font-size: 13px; font-style: normal; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.compact-product-picker__placeholder { color: #a8abb2; font-weight: 400; }
.compact-product-picker :deep(.el-button) { margin-right: 2px; }
.catalogue-review-filter-actions { display: flex; gap: 8px; }
:global(.sku-suggestion) { display: grid; grid-template-columns: 130px minmax(180px, 1fr) auto; align-items: center; gap: 12px; min-width: 0; }
:global(.sku-suggestion strong) { color: #0f172a; }
:global(.sku-suggestion span) { overflow: hidden; color: #475569; text-overflow: ellipsis; white-space: nowrap; }
:global(.sku-suggestion em) { color: #64748b; font-size: 12px; font-style: normal; }
.catalogue-review-workspace {
  display: grid;
  grid-template-columns: minmax(310px, 370px) minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
}
.candidate-list-panel { display: grid; min-width: 0; min-height: 0; grid-template-rows: auto minmax(0, 1fr) auto; overflow: hidden; border-right: 1px solid var(--app-border); }
.candidate-list-header { padding: 16px; border-bottom: 1px solid var(--app-border); }
.candidate-list-header h2, .candidate-details-header h2, .candidate-section h3 { margin: 0; color: var(--app-text); }
.candidate-list-header h2 { font-size: 16px; }
.candidate-list-header p { margin: 3px 0 0; color: var(--app-text-muted); font-size: 13px; }
.candidate-list { min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.candidate-list-item { display: grid; width: 100%; gap: 7px; border: 0; border-bottom: 1px solid var(--app-border); background: transparent; padding: 13px 16px; color: inherit; cursor: pointer; text-align: left; }
.candidate-list-item:hover { background: #f8fafc; }
.candidate-list-item--selected { background: #eef6f1; box-shadow: inset 3px 0 0 #047857; }
.candidate-list-item--selected:hover { background: #eef6f1; }
.candidate-list-item__main, .candidate-list-item__meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.candidate-list-item__main strong { color: #0f172a; font-size: 14px; }
.candidate-list-item__main > span, .candidate-list-item__meta, .candidate-list-item__suppliers { color: #64748b; font-size: 12px; }
.candidate-list-item__main > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.candidate-status { display: inline-flex; align-items: center; gap: 4px; border-radius: 5px; padding: 2px 6px; font-weight: 650; line-height: 18px; }
.candidate-status .el-icon { font-size: 13px; }
.candidate-status--linked { background: #ecfdf5; color: #047857; }
.candidate-status--unlinked { background: #fff7ed; color: #b45309; }
.candidate-list-item__suppliers { display: flex; overflow: hidden; gap: 5px; white-space: nowrap; }
.candidate-list-footer { border-top: 1px solid var(--app-border); padding: 12px; }
.candidate-list-footer :deep(.flex) { gap: 6px; }
.candidate-list-footer :deep(.min-w-24) { min-width: 72px; }
.candidate-details { min-width: 0; overflow-y: auto; }
.candidate-details-header { position: sticky; z-index: 2; top: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--app-border); background: var(--app-surface); padding: 18px 20px; }
.candidate-details-header span { color: #64748b; font-size: 13px; }
.candidate-details-header h2 { margin-top: 3px; font-size: 22px; }
.candidate-details-navigation { display: flex; align-items: center; gap: 12px; }
.candidate-id { color: #64748b; font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.candidate-section { padding: 20px; }
.candidate-section + .candidate-section { border-top: 1px solid var(--app-border); }
.candidate-section-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.candidate-section-header h3 { font-size: 15px; }
.candidate-section-header > span { color: #64748b; font-size: 13px; }
.catalogue-product { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 16px; }
.catalogue-product img, .catalogue-product__placeholder { width: 72px; height: 72px; border: 1px solid var(--app-border); border-radius: 7px; background: #f1f5f9; object-fit: contain; }
.catalogue-product__placeholder { display: grid; place-items: center; color: #64748b; font-size: 24px; font-weight: 700; }
.catalogue-product__content { min-width: 0; }
.catalogue-product__identity { display: grid; gap: 3px; }
.catalogue-product__identity strong { color: #0f172a; font-size: 15px; }
.catalogue-product__identity span, .catalogue-product__content p { color: #64748b; font-size: 13px; }
.catalogue-product__content p { margin: 10px 0 0; line-height: 1.45; }
.catalogue-product dl { display: flex; gap: 20px; margin: 12px 0 0; }
.catalogue-product dl div { display: flex; gap: 6px; font-size: 12px; }
.catalogue-product dt { color: #64748b; }
.catalogue-product dd { margin: 0; color: #334155; font-weight: 650; }
.catalogue-product-empty { border-left: 3px solid #d97706; background: #fffbeb; padding: 12px 14px; }
.catalogue-product-empty span { color: #78350f; font-weight: 650; }
.catalogue-product-empty p { margin: 4px 0 0; color: #92400e; font-size: 13px; }
.candidate-name-groups { border-top: 1px solid var(--app-border); }
.candidate-name-group { display: grid; grid-template-columns: minmax(220px, 0.8fr) minmax(300px, 1.2fr); gap: 20px; border-bottom: 1px solid var(--app-border); padding: 12px 4px; }
.candidate-name-group > strong { color: #0f172a; font-size: 13px; line-height: 1.45; }
.candidate-name-usages { display: flex; flex-wrap: wrap; gap: 5px; color: #475569; font-size: 13px; }
.supplier-source-label { display: inline; min-width: 0; color: #475569; font-size: inherit; font-weight: 650; white-space: nowrap; }
.supplier-source-label--armtek { color: #047857; }
.supplier-source-label--favoritparts { color: #2563eb; }
.supplier-source-label--tmtr { color: #6d28d9; }
.supplier-source-separator { color: #94a3b8; font-weight: 400; }
.supplier-products-table { width: 100%; }
.supplier-products-table :deep(th.el-table__cell) { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 650; }
.supplier-products-table__sku, .supplier-products-table__producer { color: #0f172a; font-weight: 700; }
.supplier-products-table__id { color: #94a3b8; font-size: 12px; font-variant-numeric: tabular-nums; }
.supplier-product-empty { margin: 0; color: #94a3b8; font-size: 13px; }
.candidate-details-empty, .catalogue-review-no-access { display: grid; place-items: center; min-height: 480px; }
@media (max-width: 980px) {
  .catalogue-review-workspace { grid-template-columns: 320px minmax(0, 1fr); }
  .catalogue-product { grid-template-columns: 64px minmax(0, 1fr); }
  .catalogue-product > .el-button { grid-column: 1 / -1; justify-self: start; }
  .candidate-name-group { grid-template-columns: 1fr; gap: 6px; }
  .candidate-details-header { align-items: stretch; flex-direction: column; }
  .candidate-details-navigation { justify-content: space-between; }
}
@media (max-width: 720px) {
  .catalogue-review-page { height: auto; min-height: calc(100dvh - 56px); overflow: visible; }
  .catalogue-review-content { grid-template-rows: auto auto; overflow: visible; padding: 14px 16px 18px; }
  .catalogue-review-filters { grid-template-columns: 1fr; }
  .catalogue-review-workspace { display: block; height: auto; overflow: visible; }
  .candidate-list-panel { min-height: 420px; overflow: visible; border-right: 0; border-bottom: 1px solid var(--app-border); }
  .candidate-list { overflow: visible; }
  .candidate-details { overflow: visible; }
  .candidate-details-header { position: static; }
  .candidate-details-navigation { align-items: stretch; flex-direction: column; }
  .catalogue-product { grid-template-columns: 56px minmax(0, 1fr); }
  .catalogue-product img, .catalogue-product__placeholder { width: 56px; height: 56px; }
}
</style>
