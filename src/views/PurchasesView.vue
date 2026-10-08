<template>
  <div class="purchases-page">
    <PageHeader :title="t('purchases.title')" :description="t('purchases.description')">
      <template #actions>
        <el-button v-if="canCreatePurchases" type="primary" size="large" @click="createPurchaseDialogOpen = true">
          {{ t('purchases.create') }}
        </el-button>
      </template>
    </PageHeader>

    <div class="purchases-content">
      <section class="purchases-toolbar">
        <div>
          <h2>{{ t('purchases.searchTitle') }}</h2>
          <p>{{ activeFiltersText }}</p>
        </div>
        <div class="toolbar-actions">
          <el-badge :value="activeFiltersCount" :hidden="activeFiltersCount === 0">
            <el-button size="large" plain @click="filtersDrawerOpen = true">{{ t('purchases.filters') }}</el-button>
          </el-badge>
          <el-button size="large" type="primary" @click="loadPurchases(true)">{{ t('common.actions.refresh') }}</el-button>
        </div>
      </section>

      <el-drawer
        v-model="filtersDrawerOpen"
        :title="t('purchases.filtersTitle')"
        direction="rtl"
        size="min(440px, 100vw)"
        class="purchase-filters-drawer"
      >
        <div class="drawer-content">
          <div class="drawer-body">
            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('purchases.periodAndSearch') }}</div>
              <label class="filter-field">
                <span>{{ t('purchases.period') }}</span>
                <el-date-picker
                  v-model="dateRange"
                  type="datetimerange"
                  range-separator="—"
                  :start-placeholder="t('purchases.start')"
                  :end-placeholder="t('purchases.end')"
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
                  :placeholder="selectedProducts.length > 0 ? t('purchases.searchDisabledByProducts') : t('purchases.searchPlaceholder')"
                />
              </label>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('purchases.currencies') }}</div>
              <label class="filter-field">
                <span>{{ t('purchases.currencies') }}</span>
                <el-select
                  v-model="currencyIds"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  clearable
                  :placeholder="t('purchases.allCurrencies')"
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
              <div class="drawer-section-title">{{ t('purchases.suppliers') }}</div>
              <div class="filter-field">
                <span>{{ t('purchases.addSupplier') }}</span>
                <div class="picker-row">
                  <OrganizationSelector
                    v-model="supplierToAdd"
                    :member-required="false"
                    :placeholder="t('purchases.supplier')"
                  />
                  <el-button :disabled="!supplierToAdd" @click="addSupplierFilter">{{ t('common.actions.add') }}</el-button>
                </div>
                <div v-if="selectedSuppliers.length > 0" class="filter-tags">
                  <el-tag
                    v-for="supplier in selectedSuppliers"
                    :key="supplier.organization.id"
                    closable
                    @close="removeSupplierFilter(supplier.organization.id)"
                  >
                    {{ supplier.organization.name }}
                  </el-tag>
                </div>
              </div>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('purchases.exactProducts') }}</div>
              <div class="filter-field">
                <span>{{ t('purchases.purchaseProducts') }}</span>
                <el-button plain @click="openProductFilterSelector">{{ t('purchases.addProduct') }}</el-button>
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
            <el-button type="primary" @click="applyDrawerFilters">{{ t('purchases.apply') }}</el-button>
          </div>
        </div>
      </el-drawer>

      <div class="purchases-workspace">
        <section class="purchases-list-panel">
          <div class="panel-heading">
            <div>
              <h2>{{ t('purchases.listTitle') }}</h2>
              <p>{{ t('purchases.onPage', { count: purchases.length }) }}</p>
            </div>
          </div>

          <div class="purchases-table-region">
              <el-table
                ref="purchasesTableRef"
                v-loading="purchasesLoading"
                :data="purchases"
                class="w-full"
                height="100%"
                highlight-current-row
                row-class-name="purchase-table-row"
                @current-change="handleCurrentPurchaseChange"
              >
                <el-table-column :label="t('purchases.supplier')" min-width="140">
                  <template #default="{ row }">
                    <div class="document-party-cell">
                      <OrganizationPartyHoverCard
                        :organization="row.supplierOrganization"
                        :user="row.supplier"
                      />
                      <OrganizationPartyHoverCard
                        :organization="row.supplierOrganization"
                        :user="row.supplier"
                        trigger-entity="user"
                      />
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="storageCode" :label="t('common.labels.storage')" min-width="100" show-overflow-tooltip />
                <el-table-column prop="dateTime" min-width="132">
                  <template #header><SortableColumnHeader :label="t('common.labels.date')" field="dateTime" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
                  <template #default="{ row }">
                    {{ formatDate(row.purchaseDatetime) }}
                  </template>
                </el-table-column>
                <el-table-column prop="totalSum" width="106" align="right">
                  <template #header><SortableColumnHeader :label="t('purchases.amount')" field="totalSum" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
                  <template #default="{ row }">
                    <span class="purchase-amount">{{ formatCurrency(row.totalSum, row.currency.currencySign) }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  v-if="canEditPurchases || canDeletePurchases"
                  fixed="right"
                  width="64"
                  align="center"
                >
                  <template #header><span class="purchases-visually-hidden">{{ t('common.labels.actions') }}</span></template>
                  <template #default="{ row }">
                    <div @click.stop>
                      <PurchaseActionsMenu
                        :can-edit="canEditPurchases"
                        :can-delete="canDeletePurchases"
                        :busy="editPurchaseLoadingId === row.id || deletingPurchaseId === row.id"
                        @edit="openEditPurchase(row)"
                        @delete="removePurchase(row)"
                      />
                    </div>
                  </template>
                </el-table-column>
              </el-table>
          </div>

          <div class="panel-footer">
            <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
          </div>
        </section>

        <section class="purchase-details-panel">
            <PurchaseDetails
              :purchase="selectedPurchase"
              :content="purchaseContent"
              :loading="contentLoading"
            />
        </section>
      </div>
    </div>

    <CreatePurchaseDialog
      v-model="createPurchaseDialogOpen"
      :currencies="currencies"
      :storages="storages"
      @created="onPurchaseCreated"
    />

    <EditPurchaseDialog
      v-model="editPurchaseDialogOpen"
      :purchase="selectedPurchase"
      :content="purchaseContent"
      :currencies="currencies"
      :storages="storages"
      @updated="onPurchaseUpdated"
    />

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProductFilter" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import CreatePurchaseDialog from '@/components/purchases/CreatePurchaseDialog.vue'
import EditPurchaseDialog from '@/components/purchases/EditPurchaseDialog.vue'
import PurchaseDetails from '@/components/purchases/PurchaseDetails.vue'
import PurchaseActionsMenu from '@/components/purchases/PurchaseActionsMenu.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import OrganizationPartyHoverCard from '@/components/organizations/OrganizationPartyHoverCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import SortableColumnHeader from '@/components/common/SortableColumnHeader.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { PurchaseContentModel, PurchaseModel } from '@/models/purchaseModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { OrganizationSelection } from '@/models/organizationModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { toSortExpressions, useMultiSort } from '@/composables/useMultiSort.ts'
import { deletePurchase, getPurchase, getPurchaseContent, getPurchases } from '@/services/api/purchases.ts'
import { getStorages } from '@/services/api/storages.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()
const purchases = ref<PurchaseModel[]>([])
const purchasesTableRef = ref<TableInstance>()
const route = useRoute()
const selectedPurchase = ref<PurchaseModel>()
const purchaseContent = ref<PurchaseContentModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const storages = ref<StorageModel[]>([])
const selectedSuppliers = ref<OrganizationSelection[]>([])
const supplierToAdd = ref<OrganizationSelection>()
const currencyIds = ref<number[]>([])
const selectedProducts = ref<ProductSearchModel[]>([])
const searchTerm = ref<string>()
const { sortBy, toggleSort } = useMultiSort()
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const purchasesLoading = ref(false)
const contentLoading = ref(false)
const isSettingCurrentPurchase = ref(false)
const createPurchaseDialogOpen = ref(false)
const editPurchaseDialogOpen = ref(false)
const editPurchaseLoadingId = ref<string>()
const deletingPurchaseId = ref<string>()
const productSelectorOpen = ref(false)
const filtersDrawerOpen = ref(false)
let contentRequestVersion = 0
const { hasPermission } = usePermissions()
const canCreatePurchases = computed(() => hasPermission('PURCHASE_CREATE'))
const canEditPurchases = computed(() => hasPermission('PURCHASE_EDIT'))
const canDeletePurchases = computed(() => hasPermission('PURCHASE_DELETE'))
const activeFiltersCount = computed(() => (
  (dateRange.value ? 1 : 0)
  + selectedSuppliers.value.length
  + currencyIds.value.length
  + selectedProducts.value.length
  + (searchTerm.value?.trim() ? 1 : 0)
))
const activeFiltersText = computed(() => (
  activeFiltersCount.value === 0
    ? t('purchases.shownAll')
    : t('purchases.activeFilters', { count: activeFiltersCount.value })
))

const dateRange = ref<[string, string] | null>(null)

const loadPurchasesDebounced = useDebounceFn(async () => {
  await loadPurchases(true)
}, 300)

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, t('purchases.noData'))
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

function resetFilters() {
  dateRange.value = null
  selectedSuppliers.value = []
  supplierToAdd.value = undefined
  currencyIds.value = []
  selectedProducts.value = []
  searchTerm.value = undefined
}

async function applyDrawerFilters() {
  filtersDrawerOpen.value = false
  await loadPurchases(true)
}

async function handleSortToggle(field: string, event: MouseEvent) {
  toggleSort(field, event)
  await loadPurchases(true)
}

function addSupplierFilter() {
  if (!supplierToAdd.value) return

  const exists = selectedSuppliers.value.some((supplier) => supplier.organization.id === supplierToAdd.value?.organization.id)
  if (!exists) {
    selectedSuppliers.value.push(supplierToAdd.value)
  }
  supplierToAdd.value = undefined
}

function removeSupplierFilter(id: string) {
  selectedSuppliers.value = selectedSuppliers.value.filter((supplier) => supplier.organization.id !== id)
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

async function loadStorages() {
  const resp = await getStorages({ page: 0, limit: 100 })
  storages.value = resp.storages
}

async function loadPurchases(resetPage: boolean) {
  if (purchasesLoading.value) return

  purchasesLoading.value = true
  try {
    if (resetPage) page.value = 0

    const resp = await getPurchases({
      rangeStartDate: dateRange.value?.[0],
      rangeEndDate: dateRange.value?.[1],
      page: page.value,
      limit: limit.value,
      supplierOrganizationIds: selectedSuppliers.value.map((supplier) => supplier.organization.id),
      currencyIds: currencyIds.value,
      productIds: selectedProducts.value.map((product) => product.id),
      sortBy: toSortExpressions(sortBy.value),
      searchTerm: searchTerm.value,
    })

    purchases.value = resp.purchases
    hasNext.value = resp.purchases.length === limit.value

    if (selectedPurchase.value) {
      const nextSelectedPurchase = resp.purchases.find((purchase) => purchase.id === selectedPurchase.value?.id)
      selectedPurchase.value = nextSelectedPurchase
      if (!nextSelectedPurchase) {
        ++contentRequestVersion
        purchaseContent.value = []
        contentLoading.value = false
      }
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('purchases.loadError'))
  } finally {
    purchasesLoading.value = false
  }
}

async function handleCurrentPurchaseChange(purchase?: PurchaseModel) {
  if (isSettingCurrentPurchase.value) return
  await selectPurchase(purchase)
}

async function selectPurchase(purchase?: PurchaseModel): Promise<boolean> {
  const requestVersion = ++contentRequestVersion
  selectedPurchase.value = purchase
  isSettingCurrentPurchase.value = true
  try {
    await nextTick()
    purchasesTableRef.value?.setCurrentRow(purchase)
  } finally {
    isSettingCurrentPurchase.value = false
  }

  if (!purchase) {
    purchaseContent.value = []
    contentLoading.value = false
    return true
  }

  contentLoading.value = true
  purchaseContent.value = []
  try {
    const resp = await getPurchaseContent(purchase.id)
    if (requestVersion === contentRequestVersion) purchaseContent.value = resp.content
    return requestVersion === contentRequestVersion
  } catch (error) {
    if (requestVersion === contentRequestVersion) {
      purchaseContent.value = []
      ElMessage.error(error instanceof Error ? error.message : t('purchases.loadContentError'))
    }
    return false
  } finally {
    if (requestVersion === contentRequestVersion) contentLoading.value = false
  }
}

async function openEditPurchase(purchase: PurchaseModel) {
  if (editPurchaseLoadingId.value) return

  editPurchaseLoadingId.value = purchase.id
  try {
    if (await selectPurchase(purchase)) editPurchaseDialogOpen.value = true
  } finally {
    editPurchaseLoadingId.value = undefined
  }
}

async function selectPurchaseFromRoute() {
  const purchaseId = typeof route.query.purchaseId === 'string' ? route.query.purchaseId : undefined
  if (!purchaseId) return

  const existingPurchase = purchases.value.find((purchase) => purchase.id === purchaseId)
  if (existingPurchase) {
    await selectPurchase(existingPurchase)
    return
  }

  try {
    const response = await getPurchase(purchaseId)
    purchases.value = [
      response.purchase,
      ...purchases.value.filter((purchase) => purchase.id !== response.purchase.id),
    ]
    await selectPurchase(response.purchase)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('purchases.loadError'))
  }
}

async function removePurchase(purchase: PurchaseModel) {
  if (deletingPurchaseId.value) return

  try {
    await ElMessageBox.confirm(t('purchases.deleteConfirm'), t('purchases.deleteTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }

  deletingPurchaseId.value = purchase.id
  try {
    await deletePurchase(purchase.id)
    ElMessage.success(t('purchases.removed'))

    if (selectedPurchase.value?.id === purchase.id) {
      ++contentRequestVersion
      selectedPurchase.value = undefined
      purchaseContent.value = []
      contentLoading.value = false
    }

    await loadPurchases(false)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('purchases.deleteError'))
  } finally {
    deletingPurchaseId.value = undefined
  }
}

async function onPurchaseCreated(purchase: PurchaseModel) {
  purchases.value = [
    purchase,
    ...purchases.value.filter((item) => item.id !== purchase.id),
  ]
  await selectPurchase(purchase)
}

async function onPurchaseUpdated(purchaseId: string) {
  try {
    const response = await getPurchase(purchaseId)
    const index = purchases.value.findIndex((item) => item.id === response.purchase.id)
    if (index >= 0) {
      purchases.value.splice(index, 1, response.purchase)
    } else {
      purchases.value = [response.purchase, ...purchases.value]
    }
    await selectPurchase(response.purchase)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('purchases.loadError'))
    await loadPurchases(false)
  }
}

watch(limit, async () => loadPurchases(true))
watch(page, async () => loadPurchases(false))
watch(dateRange, async () => loadPurchases(true), { deep: true })
watch(selectedSuppliers, async () => loadPurchases(true), { deep: true })
watch(currencyIds, async () => loadPurchases(true), { deep: true })
watch(selectedProducts, async () => loadPurchases(true), { deep: true })
watch(searchTerm, () => loadPurchasesDebounced())
watch(() => route.query.purchaseId, async () => selectPurchaseFromRoute())

onMounted(async () => {
  await Promise.all([loadCurrencies(), loadStorages(), loadPurchases(true)])
  await selectPurchaseFromRoute()
})
</script>

<style scoped src="@/assets/purchases-view.css"></style>
