<template>
  <div class="purchases-page">
    <div class="purchases-header">
      <div>
        <h1>{{ t('purchases.title') }}</h1>
        <p>{{ t('purchases.description') }}</p>
      </div>
      <el-button v-if="canCreatePurchases" type="primary" size="large" @click="createPurchaseDialogOpen = true">
        {{ t('purchases.create') }}
      </el-button>
    </div>

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
                  <UserSelector
                    v-model:selected-user="supplierToAdd"
                    :roles="['Supplier']"
                    :place-holder="t('purchases.supplier')"
                  />
                  <el-button :disabled="!supplierToAdd" @click="addSupplierFilter">{{ t('common.actions.add') }}</el-button>
                </div>
                <div v-if="selectedSuppliers.length > 0" class="filter-tags">
                  <el-tag
                    v-for="supplier in selectedSuppliers"
                    :key="supplier.id"
                    closable
                    @close="removeSupplierFilter(supplier.id)"
                  >
                    {{ supplier.surname }} {{ supplier.name }}
                  </el-tag>
                </div>
              </div>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('purchases.exactProducts') }}</div>
              <div class="filter-field">
                <span>{{ t('purchases.purchaseProducts') }}</span>
                <el-button plain @click="productSelectorOpen = true">{{ t('purchases.addProduct') }}</el-button>
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

              <el-table
                ref="purchasesTableRef"
                v-loading="purchasesLoading"
                :data="purchases"
                class="w-full"
                height="100%"
                highlight-current-row
                row-class-name="purchase-table-row"
                @current-change="selectPurchase"
                @sort-change="handleSortChange"
              >
                <el-table-column :label="t('purchases.supplier')" min-width="180">
                  <template #default="{ row }">
                    {{ row.supplier.surname }} {{ row.supplier.name }}
                  </template>
                </el-table-column>
                <el-table-column prop="storage" :label="t('common.labels.storage')" min-width="150" />
                <el-table-column prop="dateTime" :label="t('common.labels.date')" min-width="170" sortable="custom">
                  <template #default="{ row }">
                    {{ formatDate(row.purchaseDatetime) }}
                  </template>
                </el-table-column>
                <el-table-column prop="totalSum" :label="t('purchases.amount')" min-width="140" sortable="custom">
                  <template #default="{ row }">
                    {{ formatCurrency(row.totalSum, row.currency.currencySign) }}
                  </template>
                </el-table-column>
                <el-table-column
                  v-if="canEditPurchases || canDeletePurchases"
                  fixed="right"
                  :label="t('common.labels.actions')"
                  min-width="180"
                >
                  <template #default="{ row }">
                    <el-button
                      v-if="canEditPurchases"
                      size="small"
                      :loading="editPurchaseLoadingId === row.id"
                      @click.stop="openEditPurchase(row)"
                    >
                      {{ t('common.actions.edit') }}
                    </el-button>
                    <el-button
                      v-if="canDeletePurchases"
                      size="small"
                      type="danger"
                      @click.stop="removePurchase(row.id)"
                    >
                      {{ t('common.actions.delete') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

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
import { ElNotification } from 'element-plus'
import CreatePurchaseDialog from '@/components/purchases/CreatePurchaseDialog.vue'
import EditPurchaseDialog from '@/components/purchases/EditPurchaseDialog.vue'
import PurchaseDetails from '@/components/purchases/PurchaseDetails.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { PurchaseContentModel, PurchaseModel } from '@/models/purchaseModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { deletePurchase, getPurchase, getPurchaseContent, getPurchases } from '@/services/api/purchases.ts'
import { getStorages } from '@/services/api/storages.ts'
import { formatLocalDateTime, toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()
const purchases = ref<PurchaseModel[]>([])
const purchasesTableRef = ref<TableInstance>()
const route = useRoute()
const selectedPurchase = ref<PurchaseModel>()
const purchaseContent = ref<PurchaseContentModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const storages = ref<StorageModel[]>([])
const selectedSuppliers = ref<UserModel[]>([])
const supplierToAdd = ref<UserModel>()
const currencyIds = ref<number[]>([])
const selectedProducts = ref<ProductSearchModel[]>([])
const searchTerm = ref<string>()
const sortBy = ref<string>()
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const purchasesLoading = ref(false)
const contentLoading = ref(false)
const createPurchaseDialogOpen = ref(false)
const editPurchaseDialogOpen = ref(false)
const editPurchaseLoadingId = ref<string>()
const productSelectorOpen = ref(false)
const filtersDrawerOpen = ref(false)
const { hasPermission } = usePermissions()
const canCreatePurchases = computed(() => hasPermission('PURCHASE_CREATE'))
const canEditPurchases = computed(() => hasPermission('PURCHASE_EDIT'))
const canDeletePurchases = computed(() => hasPermission('PURCHASE_DELETE'))
const activeFiltersCount = computed(() => (
  selectedSuppliers.value.length
  + currencyIds.value.length
  + selectedProducts.value.length
  + (searchTerm.value?.trim() ? 1 : 0)
))
const activeFiltersText = computed(() => (
  activeFiltersCount.value === 0
    ? t('purchases.shownByPeriod')
    : t('purchases.activeFilters', { count: activeFiltersCount.value })
))

const rangeEnd = new Date()
const rangeStart = new Date()
rangeStart.setDate(rangeStart.getDate() - 30)

const dateRange = ref<[string, string]>([
  toLocalDateTimeInputValue(rangeStart),
  toLocalDateTimeInputValue(rangeEnd),
])

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
  const nextRangeEnd = new Date()
  const nextRangeStart = new Date()
  nextRangeStart.setDate(nextRangeStart.getDate() - 30)

  dateRange.value = [
    toLocalDateTimeInputValue(nextRangeStart),
    toLocalDateTimeInputValue(nextRangeEnd),
  ]
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

async function handleSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) {
    sortBy.value = undefined
  } else {
    sortBy.value = event.order === 'descending'
      ? `${event.prop}_desc`
      : event.prop
  }

  await loadPurchases(true)
}

function addSupplierFilter() {
  if (!supplierToAdd.value) return

  const exists = selectedSuppliers.value.some((supplier) => supplier.id === supplierToAdd.value?.id)
  if (!exists) {
    selectedSuppliers.value.push(supplierToAdd.value)
  }
  supplierToAdd.value = undefined
}

function removeSupplierFilter(id: string) {
  selectedSuppliers.value = selectedSuppliers.value.filter((supplier) => supplier.id !== id)
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
  const resp = await getCurrencies({ page: 0, size: 100 })
  currencies.value = resp.currencies
}

async function loadStorages() {
  const resp = await getStorages({ page: 0, limit: 100 })
  storages.value = resp.storages
}

async function loadPurchases(resetPage: boolean) {
  if (purchasesLoading.value || dateRange.value.length !== 2) return

  purchasesLoading.value = true
  try {
    if (resetPage) page.value = 0

    const resp = await getPurchases({
      rangeStartDate: dateRange.value[0],
      rangeEndDate: dateRange.value[1],
      page: page.value,
      limit: limit.value,
      supplierIds: selectedSuppliers.value.map((supplier) => supplier.id),
      currencyIds: currencyIds.value,
      productIds: selectedProducts.value.map((product) => product.id),
      sortBy: sortBy.value,
      searchTerm: searchTerm.value,
    })

    purchases.value = resp.purchases
    hasNext.value = resp.purchases.length === limit.value

    if (selectedPurchase.value) {
      const nextSelectedPurchase = resp.purchases.find((purchase) => purchase.id === selectedPurchase.value?.id)
      selectedPurchase.value = nextSelectedPurchase
      if (!nextSelectedPurchase) {
        purchaseContent.value = []
      }
    }
  } finally {
    purchasesLoading.value = false
  }
}

async function selectPurchase(purchase?: PurchaseModel) {
  selectedPurchase.value = purchase
  await nextTick()
  purchasesTableRef.value?.setCurrentRow(purchase)

  if (!purchase) {
    purchaseContent.value = []
    return
  }

  contentLoading.value = true
  try {
    const resp = await getPurchaseContent(purchase.id)
    purchaseContent.value = resp.content
  } finally {
    contentLoading.value = false
  }
}

async function openEditPurchase(purchase: PurchaseModel) {
  if (editPurchaseLoadingId.value) return

  editPurchaseLoadingId.value = purchase.id
  try {
    await selectPurchase(purchase)
    editPurchaseDialogOpen.value = true
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

  const response = await getPurchase(purchaseId)
  purchases.value = [
    response.purchase,
    ...purchases.value.filter((purchase) => purchase.id !== response.purchase.id),
  ]
  await selectPurchase(response.purchase)
}

async function removePurchase(id: string) {
  await deletePurchase(id)

  ElNotification({
    title: t('common.labels.success'),
    message: t('purchases.removed'),
    type: 'success',
  })

  if (selectedPurchase.value?.id === id) {
    selectedPurchase.value = undefined
    purchaseContent.value = []
  }

  await loadPurchases(false)
}

async function onPurchaseCreated(purchase: PurchaseModel) {
  purchases.value = [
    purchase,
    ...purchases.value.filter((item) => item.id !== purchase.id),
  ]
  await selectPurchase(purchase)
}

async function onPurchaseUpdated(purchaseId: string) {
  await loadPurchases(false)

  const updatedPurchase = purchases.value.find((item) => item.id === purchaseId)
  if (updatedPurchase) {
    await selectPurchase(updatedPurchase)
    return
  }

  selectedPurchase.value = undefined
  purchaseContent.value = []
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
