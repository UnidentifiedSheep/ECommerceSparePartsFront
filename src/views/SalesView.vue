<template>
  <div class="sales-page">
    <PageHeader :title="t('sales.title')" :description="t('sales.description')">
      <template #actions>
      <el-button v-if="canCreateSales" type="primary" size="large" @click="createSaleDialogOpen = true">
        {{ t('sales.create') }}
      </el-button>
      </template>
    </PageHeader>

    <div class="sales-content">
      <section class="sales-toolbar">
        <div>
          <h2>{{ t('sales.searchTitle') }}</h2>
          <p>{{ activeFiltersText }}</p>
        </div>
        <div class="toolbar-actions">
          <el-badge :value="activeFiltersCount" :hidden="activeFiltersCount === 0">
            <el-button size="large" plain @click="filtersDrawerOpen = true">{{ t('sales.filters') }}</el-button>
          </el-badge>
          <el-button size="large" type="primary" @click="loadSales(true)">{{ t('common.actions.refresh') }}</el-button>
        </div>
      </section>

      <el-drawer
        v-model="filtersDrawerOpen"
        :title="t('sales.filtersTitle')"
        direction="rtl"
        size="min(440px, 100vw)"
        class="sale-filters-drawer"
      >
        <div class="drawer-content">
          <div class="drawer-body">
            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('sales.periodAndSearch') }}</div>
              <label class="filter-field">
                <span>{{ t('sales.period') }}</span>
                <el-date-picker
                  v-model="dateRange"
                  type="datetimerange"
                  range-separator="—"
                  :start-placeholder="t('sales.start')"
                  :end-placeholder="t('sales.end')"
                  value-format="YYYY-MM-DDTHH:mm:ss.SSS"
                  class="w-full"
                />
              </label>

              <label class="filter-field">
                <span>{{ t('common.labels.search') }}</span>
                <el-input
                  v-model="searchTerm"
                  clearable
                  :disabled="selectedProducts.length > 0"
                  :placeholder="selectedProducts.length > 0 ? t('sales.searchDisabledByProducts') : t('sales.searchPlaceholder')"
                />
              </label>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('sales.currencies') }}</div>
              <label class="filter-field">
                <span>{{ t('sales.currencies') }}</span>
                <el-select
                  v-model="currencyIds"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  clearable
                  :placeholder="t('sales.allCurrencies')"
                  class="w-full"
                >
                  <el-option
                    v-for="currency in currencies"
                    :key="currency.id"
                    :label="`${currency.name} (${currency.currencySign})`"
                    :value="currency.id"
                  />
                </el-select>
              </label>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('sales.state') }}</div>
              <label class="filter-field">
                <span>{{ t('sales.state') }}</span>
                <el-select
                  v-model="saleStates"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :placeholder="t('sales.allStates')"
                  class="w-full"
                >
                  <el-option
                    v-for="option in saleStateOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </label>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('sales.buyers') }}</div>
              <div class="filter-field">
                <span>{{ t('sales.addBuyer') }}</span>
                <div class="picker-row">
                  <OrganizationSelector
                    v-model="buyerOrganizationToAdd"
                    organization-only
                    :placeholder="t('sales.buyer')"
                  />
                  <el-button :disabled="!buyerOrganizationToAdd" @click="addBuyerFilter">{{ t('common.actions.add') }}</el-button>
                </div>
                <div v-if="selectedBuyerOrganizations.length > 0" class="filter-tags">
                  <el-tag
                    v-for="buyer in selectedBuyerOrganizations"
                    :key="buyer.id"
                    closable
                    @close="removeBuyerFilter(buyer.id)"
                  >
                    {{ buyer.name }}
                  </el-tag>
                </div>
              </div>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('sales.exactProducts') }}</div>
              <div class="filter-field">
                <span>{{ t('sales.saleProducts') }}</span>
                <el-button plain @click="openProductFilterSelector">{{ t('sales.addProduct') }}</el-button>
                <div v-if="selectedProducts.length > 0" class="filter-tags">
                  <el-tag
                    v-for="product in selectedProducts"
                    :key="product.id"
                    closable
                    @close="removeProductFilter(product.id)"
                  >
                    {{ product.sku || product.name }}
                  </el-tag>
                </div>
              </div>
            </section>
          </div>

          <div class="drawer-footer">
            <el-button @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
            <el-button type="primary" @click="applyDrawerFilters">{{ t('sales.apply') }}</el-button>
          </div>
        </div>
      </el-drawer>

      <div class="sales-workspace">
        <section class="sales-list-panel">
          <div class="panel-heading">
            <div>
              <h2>{{ t('sales.listTitle') }}</h2>
              <p>{{ t('sales.onPage', { count: sales.length }) }}</p>
            </div>
          </div>

          <div class="sales-table-region">
          <el-table
            ref="salesTableRef"
            tabindex="0"
            :aria-label="t('sales.title')"
            :aria-description="t('common.labels.arrowNavigation')"
            @keydown="tableNavigation.onKeydown"
            @row-click="tableNavigation.onRowClick"
            v-loading="salesLoading"
            :data="sales"
            class="w-full"
            height="100%"
            highlight-current-row
            :row-class-name="saleRowClassName"
            @current-change="handleCurrentSaleChange"
          >
            <el-table-column :label="t('sales.buyer')" min-width="140">
              <template #default="{ row }">
                <div class="document-party-cell">
                  <OrganizationPartyHoverCard :organization="row.organization" :user="row.buyer" />
                  <OrganizationPartyHoverCard
                    :organization="row.organization"
                    :user="row.buyer"
                    trigger-entity="user"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.labels.status')" width="108">
              <template #default="{ row }">
                <span class="sale-state" :class="`sale-state--${row.state.toLowerCase()}`">
                  {{ t(`sales.states.${row.state}`) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="storageCode" :label="t('sales.storage')" min-width="100" show-overflow-tooltip />
            <el-table-column prop="dateTime" min-width="132">
              <template #header><SortableColumnHeader :label="t('common.labels.date')" field="dateTime" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
              <template #default="{ row }">
                {{ formatDate(row.saleDatetime) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalSum" min-width="180" align="right">
              <template #header><SortableColumnHeader :label="t('sales.amount')" field="totalSum" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
              <template #default="{ row }">
                <span class="sale-amount">{{ formatCurrency(row.totalSum, row.currency.currencySign) }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="canGenerateDocuments || canEditSales || canDeleteSales" width="64" align="center">
              <template #header><span class="sales-visually-hidden">{{ t('common.labels.actions') }}</span></template>
              <template #default="{ row }">
                <SaleActionsMenu
                  :sale-id="row.id"
                  :can-print="canGenerateDocuments"
                  :can-edit="canEditSales"
                  :can-delete="canDeleteSales"
                  :deleted="row.state === 'Deleted'"
                  :busy="editingSaleId === row.id || deletingSaleId === row.id"
                  @edit="openEditSale(row)"
                  @delete="removeSale(row)"
                />
              </template>
            </el-table-column>
          </el-table>
          </div>

          <div class="panel-footer">
            <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
          </div>
        </section>

        <section class="sale-details-panel">
          <SaleDetails
            :sale="selectedSale"
            :content="saleContent"
            :loading="contentLoading"
          />
        </section>
      </div>
    </div>

    <CreateSaleDialog
      v-model="createSaleDialogOpen"
      :currencies="currencies"
      @created="onSaleCreated"
    />

    <EditSaleDialog
      v-if="canEditSales"
      v-model="editSaleDialogOpen"
      :sale="saleToEdit"
      :content="saleContentToEdit"
      :currencies="currencies"
      @updated="onSaleUpdated"
    />

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProductFilter" />
  </div>
</template>

<script setup lang="ts">
import { useSelectionDebounce } from '@/composables/useSelectionDebounce'
import { useTableArrowNavigation } from '@/composables/useTableArrowNavigation'
import { queryField, useListQueryState } from '@/composables/useListQueryState'
import { queryText, queryStrings, queryPage, querySize, querySort, queryDates, queryIds } from '@/utils/listQuery'
import { organizationQueryBinding, productQueryBinding } from '@/composables/listFilterBindings'

import { computed, nextTick, onMounted, onScopeDispose, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import CreateSaleDialog from '@/components/sales/CreateSaleDialog.vue'
import EditSaleDialog from '@/components/sales/EditSaleDialog.vue'
import SaleDetails from '@/components/sales/SaleDetails.vue'
import SaleActionsMenu from '@/components/sales/SaleActionsMenu.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import OrganizationPartyHoverCard from '@/components/organizations/OrganizationPartyHoverCard.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import SortableColumnHeader from '@/components/common/SortableColumnHeader.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { SaleContentModel, SaleModel, SaleState } from '@/models/saleModel.ts'
import type { OrganizationModel, OrganizationSelection } from '@/models/organizationModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { deleteSale, getSale, getSaleContent, getSales } from '@/services/api/sales.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { toSortExpressions, useMultiSort } from '@/composables/useMultiSort.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()
const route = useRoute()
const { hasPermission } = usePermissions()
const canGenerateDocuments = computed(() => hasPermission('DOCUMENTS_ME', 'DOCUMENTS_ALL'))
const canCreateSales = computed(() => hasPermission('SALES_CREATE'))
const canEditSales = computed(() => hasPermission('SALES_EDIT'))
const canDeleteSales = computed(() => hasPermission('SALES_DELETE'))
const sales = ref<SaleModel[]>([])
const salesTableRef = ref<TableInstance>()
const selectedSale = ref<SaleModel>()
const saleContent = ref<SaleContentModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const selectedBuyerOrganizations = ref<OrganizationModel[]>([])
const buyerOrganizationToAdd = ref<OrganizationSelection>()
const currencyIds = ref<number[]>([])
const defaultSaleStates: SaleState[] = ['Completed']
const saleStates = ref<SaleState[]>([...defaultSaleStates])
const selectedProducts = ref<ProductSearchModel[]>([])
const searchTerm = ref<string>()
const { sortBy, toggleSort } = useMultiSort()
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const salesLoading = ref(false)
const tableNavigation = useTableArrowNavigation({
  rows: sales, selected: selectedSale, busy: salesLoading,
  root: () => salesTableRef.value?.$el as HTMLElement | undefined,
  select: (row) => selectSale(row),
  onBoundary: navigateSalePage,
})
const contentLoading = ref(false)
const isSettingCurrentSale = ref(false)
const createSaleDialogOpen = ref(false)
const editSaleDialogOpen = ref(false)
const productSelectorOpen = ref(false)
const filtersDrawerOpen = ref(false)
const deletingSaleId = ref<string>()
const editingSaleId = ref<string>()
const saleToEdit = ref<SaleModel>()
const saleContentToEdit = ref<SaleContentModel[]>([])
let contentRequestVersion = 0
const contentDebounce = useSelectionDebounce()
onScopeDispose(() => { ++contentRequestVersion })

const saleStateOptions = computed<Array<{ label: string, value: SaleState }>>(() => [
  { label: t('sales.states.Draft'), value: 'Draft' },
  { label: t('sales.states.Completed'), value: 'Completed' },
  { label: t('sales.states.Deleted'), value: 'Deleted' },
])

const activeFiltersCount = computed(() => (
  (dateRange.value ? 1 : 0)
  + selectedBuyerOrganizations.value.length
  + currencyIds.value.length
  + (isDefaultSaleStateFilter() ? 0 : 1)
  + selectedProducts.value.length
  + (searchTerm.value?.trim() ? 1 : 0)
))
const activeFiltersText = computed(() => (
  activeFiltersCount.value === 0
    ? t('sales.shownAll')
    : t('sales.activeFilters', { count: activeFiltersCount.value })
))

const dateRange = ref<[string, string] | null>(null)

const queryState = useListQueryState({
  search: queryField(searchTerm, queryText),
  dates: queryField(dateRange, queryDates),
  currencies: queryField(currencyIds, queryIds),
  products: productQueryBinding(selectedProducts),
  sort: queryField(sortBy, querySort(['dateTime', 'totalSum'])),
  buyers: organizationQueryBinding(selectedBuyerOrganizations, (item) => item, (organization) => organization),
  states: queryField(saleStates, (value) => queryStrings(value).filter((item): item is SaleState => ['Draft', 'Completed', 'Deleted'].includes(item))),
  page: queryField(page, queryPage),
  size: queryField(limit, querySize),
}, () => loadSales(false))

const loadSalesDebounced = useDebounceFn(async () => {
  await loadSales(true)
}, 300)

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, t('sales.noData'))
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

function saleRowClassName({ row }: { row: SaleModel }) {
  return [
    'sale-table-row',
    `sale-table-row--${row.state.toLowerCase()}`,
  ].join(' ')
}

function resetFilters() {
  dateRange.value = null
  selectedBuyerOrganizations.value = []
  buyerOrganizationToAdd.value = undefined
  currencyIds.value = []
  saleStates.value = [...defaultSaleStates]
  selectedProducts.value = []
  searchTerm.value = undefined
}

function isDefaultSaleStateFilter() {
  return saleStates.value.length === defaultSaleStates.length
    && defaultSaleStates.every((state) => saleStates.value.includes(state))
}

async function handleSortToggle(field: string, event: MouseEvent) {
  toggleSort(field, event)
  await loadSales(true)
}

async function applyDrawerFilters() {
  filtersDrawerOpen.value = false
  await loadSales(true)
}

function addBuyerFilter() {
  if (!buyerOrganizationToAdd.value) return

  const organizationId = buyerOrganizationToAdd.value.organization.id
  const exists = selectedBuyerOrganizations.value.some((buyer) => buyer.id === organizationId)
  if (!exists) {
    selectedBuyerOrganizations.value.push(buyerOrganizationToAdd.value.organization)
  }
  buyerOrganizationToAdd.value = undefined
}

function removeBuyerFilter(id: string) {
  selectedBuyerOrganizations.value = selectedBuyerOrganizations.value.filter((buyer) => buyer.id !== id)
}

function addProductFilter(product: ProductSearchModel) {
  const exists = selectedProducts.value.some((item) => item.id === product.id)
  if (!exists) {
    selectedProducts.value.push(product)
  }
  searchTerm.value = undefined
}

function openProductFilterSelector() {
  filtersDrawerOpen.value = false
  productSelectorOpen.value = true
}

function removeProductFilter(id: number) {
  selectedProducts.value = selectedProducts.value.filter((product) => product.id !== id)
}

async function loadCurrencies() {
  const resp = await getCurrencies()
  currencies.value = resp.currencies
}

async function navigateSalePage(direction: -1 | 1) {
  if (salesLoading.value || (direction === 1 ? !hasNext.value : page.value === 0)) return
  await loadSales(false, { page: page.value + direction, direction })
}

async function loadSales(resetPage: boolean, navigation?: { page: number; direction: -1 | 1 }) {
  if (queryState.restoring.value) return
  if (salesLoading.value) return

  salesLoading.value = true
  try {
    if (resetPage) page.value = 0

    const resp = await getSales({
      rangeStartDate: dateRange.value?.[0],
      rangeEndDate: dateRange.value?.[1],
      page: navigation?.page ?? page.value,
      limit: limit.value,
      organizationIds: selectedBuyerOrganizations.value.map((buyer) => buyer.id),
      currencyIds: currencyIds.value,
      productIds: selectedProducts.value.map((product) => product.id),
      states: saleStates.value,
      sortBy: toSortExpressions(sortBy.value),
      searchTerm: searchTerm.value,
    })

    // A full final page may advertise a successor which is actually empty.
    // Keep the current record and page when there is nothing to select there.
    if (navigation && resp.sales.length === 0) {
      if (navigation.direction === 1) hasNext.value = false
      return
    }
    if (navigation) page.value = navigation.page
    sales.value = resp.sales
    hasNext.value = resp.sales.length === limit.value

    if (selectedSale.value) {
      const nextSelectedSale = resp.sales.find((sale) => sale.id === selectedSale.value?.id)
      selectedSale.value = nextSelectedSale
      if (!nextSelectedSale) {
        contentDebounce.cancel()
        ++contentRequestVersion
        saleContent.value = []
        contentLoading.value = false
      }
    }
    if (navigation) {
      const row = navigation.direction === 1 ? resp.sales[0] : resp.sales[resp.sales.length - 1]
      if (row) {
        void selectSale(row)
        await nextTick()
        tableNavigation.scrollToSelected()
      }
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadError'))
  } finally {
    salesLoading.value = false
  }
}

async function removeSale(sale: SaleModel) {
  if (deletingSaleId.value) return

  try {
    await ElMessageBox.confirm(t('sales.deleteConfirm'), t('sales.deleteTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }

  deletingSaleId.value = sale.id
  try {
    await deleteSale(sale.id, sale.rowVersion)
    ElMessage.success(t('sales.deleted'))

    if (selectedSale.value?.id === sale.id) {
      contentDebounce.cancel()
      ++contentRequestVersion
      selectedSale.value = undefined
      saleContent.value = []
      contentLoading.value = false
    }

    await loadSales(false)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('sales.deleteError'))
  } finally {
    deletingSaleId.value = undefined
  }
}

async function openEditSale(sale: SaleModel) {
  if (editingSaleId.value || sale.state === 'Deleted') return

  editingSaleId.value = sale.id
  try {
    const resp = await getSaleContent(sale.id)
    saleToEdit.value = sale
    saleContentToEdit.value = resp.contents
    editSaleDialogOpen.value = true
  } catch (error) {
    saleContentToEdit.value = []
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadContentError'))
  } finally {
    editingSaleId.value = undefined
  }
}

async function selectSaleFromRoute() {
  const saleId = typeof route.query.saleId === 'string' ? route.query.saleId : undefined
  if (!saleId) return

  const existingSale = sales.value.find((sale) => sale.id === saleId)
  if (existingSale) {
    await selectSale(existingSale)
    return
  }

  try {
    const response = await getSale(saleId)
    sales.value = [
      response.sale,
      ...sales.value.filter((sale) => sale.id !== response.sale.id),
    ]
    await selectSale(response.sale)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadError'))
  }
}

async function handleCurrentSaleChange(sale?: SaleModel) {
  if (isSettingCurrentSale.value) return
  await selectSale(sale)
}

async function selectSale(sale?: SaleModel, immediate = false) {
  contentDebounce.cancel()
  const requestVersion = ++contentRequestVersion
  selectedSale.value = sale
  isSettingCurrentSale.value = true
  try {
    await nextTick()
    if (requestVersion !== contentRequestVersion) return
    isSettingCurrentSale.value = true
    salesTableRef.value?.setCurrentRow(sale)
  } finally {
    isSettingCurrentSale.value = false
  }

  if (!sale) {
    saleContent.value = []
    contentLoading.value = false
    return
  }

  contentLoading.value = true
  saleContent.value = []
  if (!immediate && !await contentDebounce.wait()) return
  if (requestVersion !== contentRequestVersion) return
  try {
    const resp = await getSaleContent(sale.id)
    if (requestVersion === contentRequestVersion) saleContent.value = resp.contents
  } catch (error) {
    if (requestVersion === contentRequestVersion) {
      saleContent.value = []
      ElMessage.error(error instanceof Error ? error.message : t('sales.loadContentError'))
    }
  } finally {
    if (requestVersion === contentRequestVersion) contentLoading.value = false
  }
}

async function onSaleCreated(sale: SaleModel) {
  sales.value = [
    sale,
    ...sales.value.filter((item) => item.id !== sale.id),
  ]
  await selectSale(sale)
}

async function onSaleUpdated(saleId: string) {
  try {
    const response = await getSale(saleId)
    const index = sales.value.findIndex((item) => item.id === response.sale.id)
    if (index >= 0) {
      sales.value.splice(index, 1, response.sale)
    } else {
      sales.value = [response.sale, ...sales.value]
    }
    await selectSale(response.sale)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadError'))
    await loadSales(false)
  }
}

watch(limit, async () => loadSales(true))
watch(page, async () => loadSales(false))
watch(dateRange, async () => loadSales(true), { deep: true })
watch(selectedBuyerOrganizations, async () => loadSales(true), { deep: true })
watch(currencyIds, async () => loadSales(true), { deep: true })
watch(saleStates, async () => loadSales(true), { deep: true })
watch(selectedProducts, async () => loadSales(true), { deep: true })
watch(searchTerm, () => { if (!queryState.restoring.value) loadSalesDebounced() })
watch(() => route.query.saleId, async () => selectSaleFromRoute())
watch(editSaleDialogOpen, (open) => {
  if (open) return
  saleToEdit.value = undefined
  saleContentToEdit.value = []
})

onMounted(async () => {
  await queryState.restoreInitial()
  await Promise.all([loadCurrencies(), loadSales(false)])
  await selectSaleFromRoute()
})
</script>

<style scoped src="@/assets/sales-view.css"></style>
