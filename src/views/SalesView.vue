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
                  <UserSelector
                    v-model:selected-user="buyerToAdd"
                    :place-holder="t('sales.buyer')"
                  />
                  <el-button :disabled="!buyerToAdd" @click="addBuyerFilter">{{ t('common.actions.add') }}</el-button>
                </div>
                <div v-if="selectedBuyers.length > 0" class="filter-tags">
                  <el-tag
                    v-for="buyer in selectedBuyers"
                    :key="buyer.id"
                    closable
                    @close="removeBuyerFilter(buyer.id)"
                  >
                    {{ buyer.surname }} {{ buyer.name }}
                  </el-tag>
                </div>
              </div>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('sales.exactProducts') }}</div>
              <div class="filter-field">
                <span>{{ t('sales.saleProducts') }}</span>
                <el-button plain @click="productSelectorOpen = true">{{ t('sales.addProduct') }}</el-button>
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

          <el-table
            ref="salesTableRef"
            v-loading="salesLoading"
            :data="sales"
            class="w-full"
            height="100%"
            highlight-current-row
            :row-class-name="saleRowClassName"
            @current-change="handleCurrentSaleChange"
            @sort-change="handleSortChange"
          >
            <el-table-column :label="t('sales.buyer')" min-width="140">
              <template #default="{ row }">
                <div class="sale-buyer-cell">
                  <UserHoverCard :user="row.buyer" class="sale-buyer-name" />
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
            <el-table-column prop="storage" :label="t('sales.storage')" min-width="100" show-overflow-tooltip />
            <el-table-column prop="dateTime" :label="t('common.labels.date')" min-width="132" sortable="custom">
              <template #default="{ row }">
                {{ formatDate(row.saleDatetime) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalSum" :label="t('sales.amount')" width="106" sortable="custom" align="right">
              <template #default="{ row }">
                <span class="sale-amount">{{ formatCurrency(row.totalSum, row.currency.currencySign) }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="canEditSales || canDeleteSales" :label="t('common.labels.actions')" width="88" align="right">
              <template #default="{ row }">
                <div class="sale-actions">
                  <ActionIconButton
                    v-if="canEditSales"
                    :label="t('common.actions.edit')"
                    :icon="Edit"
                    :disabled="row.state === 'Deleted'"
                    :loading="editingSaleId === row.id"
                    @click.stop="openEditSale(row)"
                  />
                  <ActionIconButton
                    v-if="canDeleteSales"
                    :label="t('common.actions.delete')"
                    :icon="Delete"
                    tone="danger"
                    :disabled="row.state === 'Deleted'"
                    :loading="deletingSaleId === row.id"
                    @click.stop="removeSale(row)"
                  />
                </div>
              </template>
            </el-table-column>
          </el-table>

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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import CreateSaleDialog from '@/components/sales/CreateSaleDialog.vue'
import EditSaleDialog from '@/components/sales/EditSaleDialog.vue'
import SaleDetails from '@/components/sales/SaleDetails.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import UserHoverCard from '@/components/users/UserHoverCard.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { SaleContentModel, SaleModel, SaleState } from '@/models/saleModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { deleteSale, getSale, getSaleContent, getSales } from '@/services/api/sales.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { formatLocalDateTime, toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()
const route = useRoute()
const { hasPermission } = usePermissions()
const canCreateSales = computed(() => hasPermission('SALES_CREATE'))
const canEditSales = computed(() => hasPermission('SALES_EDIT'))
const canDeleteSales = computed(() => hasPermission('SALES_DELETE'))
const sales = ref<SaleModel[]>([])
const salesTableRef = ref<TableInstance>()
const selectedSale = ref<SaleModel>()
const saleContent = ref<SaleContentModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const selectedBuyers = ref<UserModel[]>([])
const buyerToAdd = ref<UserModel>()
const currencyIds = ref<number[]>([])
const defaultSaleStates: SaleState[] = ['Completed']
const saleStates = ref<SaleState[]>([...defaultSaleStates])
const selectedProducts = ref<ProductSearchModel[]>([])
const searchTerm = ref<string>()
const sortBy = ref<string>()
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const salesLoading = ref(false)
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

const saleStateOptions = computed<Array<{ label: string, value: SaleState }>>(() => [
  { label: t('sales.states.Draft'), value: 'Draft' },
  { label: t('sales.states.Completed'), value: 'Completed' },
  { label: t('sales.states.Deleted'), value: 'Deleted' },
])

const activeFiltersCount = computed(() => (
  selectedBuyers.value.length
  + currencyIds.value.length
  + (isDefaultSaleStateFilter() ? 0 : 1)
  + selectedProducts.value.length
  + (searchTerm.value?.trim() ? 1 : 0)
))
const activeFiltersText = computed(() => (
  activeFiltersCount.value === 0
    ? t('sales.shownByPeriod')
    : t('sales.activeFilters', { count: activeFiltersCount.value })
))

const rangeEnd = new Date()
const rangeStart = new Date()
rangeStart.setDate(rangeStart.getDate() - 30)

const dateRange = ref<[string, string]>([
  toLocalDateTimeInputValue(rangeStart),
  toLocalDateTimeInputValue(rangeEnd),
])

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
  const nextRangeEnd = new Date()
  const nextRangeStart = new Date()
  nextRangeStart.setDate(nextRangeStart.getDate() - 30)

  dateRange.value = [
    toLocalDateTimeInputValue(nextRangeStart),
    toLocalDateTimeInputValue(nextRangeEnd),
  ]
  selectedBuyers.value = []
  buyerToAdd.value = undefined
  currencyIds.value = []
  saleStates.value = [...defaultSaleStates]
  selectedProducts.value = []
  searchTerm.value = undefined
}

function isDefaultSaleStateFilter() {
  return saleStates.value.length === defaultSaleStates.length
    && defaultSaleStates.every((state) => saleStates.value.includes(state))
}

async function handleSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) {
    sortBy.value = undefined
  } else {
    sortBy.value = event.order === 'descending'
      ? `${event.prop}_desc`
      : event.prop
  }

  await loadSales(true)
}

async function applyDrawerFilters() {
  filtersDrawerOpen.value = false
  await loadSales(true)
}

function addBuyerFilter() {
  if (!buyerToAdd.value) return

  const exists = selectedBuyers.value.some((buyer) => buyer.id === buyerToAdd.value?.id)
  if (!exists) {
    selectedBuyers.value.push(buyerToAdd.value)
  }
  buyerToAdd.value = undefined
}

function removeBuyerFilter(id: string) {
  selectedBuyers.value = selectedBuyers.value.filter((buyer) => buyer.id !== id)
}

function addProductFilter(product: ProductSearchModel) {
  const exists = selectedProducts.value.some((item) => item.id === product.id)
  if (!exists) {
    selectedProducts.value.push(product)
  }
  searchTerm.value = undefined
}

function removeProductFilter(id: number) {
  selectedProducts.value = selectedProducts.value.filter((product) => product.id !== id)
}

async function loadCurrencies() {
  const resp = await getCurrencies()
  currencies.value = resp.currencies
}

async function loadSales(resetPage: boolean) {
  if (salesLoading.value || dateRange.value.length !== 2) return

  salesLoading.value = true
  try {
    if (resetPage) page.value = 0

    const resp = await getSales({
      rangeStartDate: dateRange.value[0],
      rangeEndDate: dateRange.value[1],
      page: page.value,
      limit: limit.value,
      buyerIds: selectedBuyers.value.map((buyer) => buyer.id),
      currencyIds: currencyIds.value,
      productIds: selectedProducts.value.map((product) => product.id),
      states: saleStates.value,
      sortBy: sortBy.value,
      searchTerm: searchTerm.value,
    })

    sales.value = resp.sales
    hasNext.value = resp.sales.length === limit.value

    if (selectedSale.value) {
      const nextSelectedSale = resp.sales.find((sale) => sale.id === selectedSale.value?.id)
      selectedSale.value = nextSelectedSale
      if (!nextSelectedSale) {
        saleContent.value = []
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
      selectedSale.value = undefined
      saleContent.value = []
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

async function selectSale(sale?: SaleModel) {
  selectedSale.value = sale
  isSettingCurrentSale.value = true
  try {
    await nextTick()
    salesTableRef.value?.setCurrentRow(sale)
  } finally {
    isSettingCurrentSale.value = false
  }

  if (!sale) {
    saleContent.value = []
    return
  }

  contentLoading.value = true
  try {
    const resp = await getSaleContent(sale.id)
    saleContent.value = resp.contents
  } catch (error) {
    saleContent.value = []
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadContentError'))
  } finally {
    contentLoading.value = false
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
watch(selectedBuyers, async () => loadSales(true), { deep: true })
watch(currencyIds, async () => loadSales(true), { deep: true })
watch(saleStates, async () => loadSales(true), { deep: true })
watch(selectedProducts, async () => loadSales(true), { deep: true })
watch(searchTerm, () => loadSalesDebounced())
watch(() => route.query.saleId, async () => selectSaleFromRoute())
watch(editSaleDialogOpen, (open) => {
  if (open) return
  saleToEdit.value = undefined
  saleContentToEdit.value = []
})

onMounted(async () => {
  await Promise.all([loadCurrencies(), loadSales(true)])
  await selectSaleFromRoute()
})
</script>

<style scoped src="@/assets/sales-view.css"></style>
