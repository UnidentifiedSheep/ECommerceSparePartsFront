<template>
  <div class="purchases-page">
    <div class="purchases-header">
      <div>
        <h1>Закупки</h1>
        <p>Список закупок, точные фильтры по поставщикам, валютам и товарам.</p>
      </div>
      <el-button v-if="canCreatePurchases" type="primary" size="large" @click="createPurchaseDialogOpen = true">
        Создать закупку
      </el-button>
    </div>

    <div class="purchases-content">
      <section class="purchases-toolbar">
        <div>
          <h2>Поиск закупок</h2>
          <p>{{ activeFiltersText }}</p>
        </div>
        <div class="toolbar-actions">
          <el-badge :value="activeFiltersCount" :hidden="activeFiltersCount === 0">
            <el-button size="large" plain @click="filtersDrawerOpen = true">Фильтры</el-button>
          </el-badge>
          <el-button size="large" type="primary" @click="loadPurchases(true)">Обновить</el-button>
        </div>
      </section>

      <el-drawer
        v-model="filtersDrawerOpen"
        title="Фильтры закупок"
        direction="rtl"
        size="440px"
        class="purchase-filters-drawer"
      >
        <div class="drawer-content">
          <div class="drawer-body">
            <section class="drawer-section">
              <div class="drawer-section-title">Период и поиск</div>
              <label class="filter-field">
                <span>Период</span>
                <el-date-picker
                  v-model="dateRange"
                  type="datetimerange"
                  range-separator="—"
                  start-placeholder="Начало"
                  end-placeholder="Конец"
                  value-format="YYYY-MM-DDTHH:mm:ss.SSS"
                  class="w-full"
                />
              </label>

              <label class="filter-field">
                <span>Поиск</span>
                <el-input
                  v-model="searchTerm"
                  clearable
                  :disabled="selectedProducts.length > 0"
                  :placeholder="selectedProducts.length > 0 ? 'Недоступен при выборе точных товаров' : 'Строка поиска'"
                />
              </label>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">Валюты</div>
              <label class="filter-field">
                <span>Валюты</span>
                <el-select
                  v-model="currencyIds"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  clearable
                  placeholder="Все валюты"
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
              <div class="drawer-section-title">Поставщики</div>
              <div class="filter-field">
                <span>Добавить поставщика</span>
                <div class="picker-row">
                  <UserSelector
                    v-model:selected-user="supplierToAdd"
                    :roles="['Supplier']"
                    place-holder="Поставщик"
                  />
                  <el-button :disabled="!supplierToAdd" @click="addSupplierFilter">Добавить</el-button>
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
              <div class="drawer-section-title">Точные товары</div>
              <div class="filter-field">
                <span>Товары в закупке</span>
                <el-button plain @click="productSelectorOpen = true">Добавить товар</el-button>
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
            <el-button @click="resetFilters">Сбросить</el-button>
            <el-button type="primary" @click="applyDrawerFilters">Применить</el-button>
          </div>
        </div>
      </el-drawer>

      <div class="purchases-workspace">
        <section class="purchases-list-panel">
          <div class="panel-heading">
          <div>
              <h2>Список закупок</h2>
              <p>{{ purchases.length }} на текущей странице</p>
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
              >
                <el-table-column label="Поставщик" min-width="180">
                  <template #default="{ row }">
                    {{ row.supplier.surname }} {{ row.supplier.name }}
                  </template>
                </el-table-column>
                <el-table-column prop="storage" label="Склад" min-width="150" />
                <el-table-column label="Дата" min-width="170">
                  <template #default="{ row }">
                    {{ formatDate(row.purchaseDatetime) }}
                  </template>
                </el-table-column>
                <el-table-column label="Сумма" min-width="140">
                  <template #default="{ row }">
                    {{ formatCurrency(row.totalSum, row.currency.currencySign) }}
                  </template>
                </el-table-column>
                <el-table-column fixed="right" label="Действия" min-width="110">
                  <template #default="{ row }">
                    <el-button size="small" type="danger" @click="removePurchase(row.id)">Удалить</el-button>
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
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const purchasesLoading = ref(false)
const contentLoading = ref(false)
const createPurchaseDialogOpen = ref(false)
const productSelectorOpen = ref(false)
const filtersDrawerOpen = ref(false)
const { hasPermission } = usePermissions()
const canCreatePurchases = computed(() => hasPermission('PURCHASE_CREATE'))
const activeFiltersCount = computed(() => (
  selectedSuppliers.value.length
  + currencyIds.value.length
  + selectedProducts.value.length
  + (searchTerm.value?.trim() ? 1 : 0)
))
const activeFiltersText = computed(() => (
  activeFiltersCount.value === 0
    ? 'Показаны закупки за выбранный период'
    : `Активных фильтров: ${activeFiltersCount.value}`
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
  return formatLocalDateTime(value, 'Нет данных')
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString('ru-RU')} ${sign ?? ''}`.trim()
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
    title: 'Успех',
    message: 'Закупка удалена',
    type: 'success',
  })

  if (selectedPurchase.value?.id === id) {
    selectedPurchase.value = undefined
    purchaseContent.value = []
  }

  await loadPurchases(false)
}

async function onPurchaseCreated(purchase: PurchaseModel) {
  resetFilters()
  await loadPurchases(true)
  const createdPurchase = purchases.value.find((item) => item.id === purchase.id)
  if (createdPurchase) {
    await selectPurchase(createdPurchase)
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

<style scoped>
.purchases-page {
  min-height: calc(100vh - 56px);
  background: #f7f7f8;
}

.purchases-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 18px 20px;
}

.purchases-header h1,
.purchases-toolbar h2,
.panel-heading h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 750;
  line-height: 1.2;
}

.purchases-header h1 {
  font-size: 26px;
}

.purchases-header p,
.purchases-toolbar p,
.panel-heading p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.purchases-content {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.purchases-toolbar,
.purchases-list-panel,
.purchase-details-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.purchases-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.drawer-content {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.drawer-body {
  flex: 1;
  overflow: auto;
  padding: 10px 20px 24px;
}

.drawer-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}

.drawer-section + .drawer-section {
  margin-top: 14px;
}

.drawer-section-title {
  margin-bottom: 12px;
  color: #334155;
  font-size: 15px;
  font-weight: 600;
}

.filter-field {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.filter-field > span {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
}

.filter-field--wide {
  grid-column: 1;
}

.filter-field--period {
  max-width: none;
}

.picker-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  min-width: 0;
}

.picker-row :deep(.el-select) {
  flex: 1;
}

.picker-hint {
  color: #64748b;
  font-size: 13px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 14px 20px;
}

.purchases-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.85fr);
  gap: 16px;
}

.purchases-list-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 760px;
  overflow: hidden;
  padding: 16px;
}

.panel-footer {
  display: flex;
  justify-content: flex-start;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
}

.purchase-details-panel {
  overflow: hidden;
}

:deep(.purchase-table-row) {
  cursor: pointer;
}

:deep(.purchase-table-row:hover > td) {
  background: #eff6ff !important;
}

:deep(.el-table__body tr.current-row > td) {
  background: #dbeafe !important;
}

@media (max-width: 1180px) {
  .purchases-workspace {
    grid-template-columns: 1fr;
  }
}

:deep(.purchase-filters-drawer .el-drawer__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #e2e8f0;
  padding: 18px 20px;
}

:deep(.purchase-filters-drawer .el-drawer__body) {
  padding: 0;
}
</style>
