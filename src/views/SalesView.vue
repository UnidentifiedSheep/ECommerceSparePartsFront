<template>
  <div class="sales-page">
    <div class="sales-header">
      <div>
        <h1>Продажи</h1>
        <p>Список продаж, точные фильтры по покупателям, валютам и товарам.</p>
      </div>
      <el-button v-if="canCreateSales" type="primary" size="large" @click="createSaleDialogOpen = true">
        Создать продажу
      </el-button>
    </div>

    <div class="sales-content">
      <section class="sales-toolbar">
        <div>
          <h2>Поиск продаж</h2>
          <p>{{ activeFiltersText }}</p>
        </div>
        <div class="toolbar-actions">
          <el-badge :value="activeFiltersCount" :hidden="activeFiltersCount === 0">
            <el-button size="large" plain @click="filtersDrawerOpen = true">Фильтры</el-button>
          </el-badge>
          <el-button size="large" type="primary" @click="loadSales(true)">Обновить</el-button>
        </div>
      </section>

      <el-drawer
        v-model="filtersDrawerOpen"
        title="Фильтры продаж"
        direction="rtl"
        size="min(440px, 100vw)"
        class="sale-filters-drawer"
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
              <div class="drawer-section-title">Покупатели</div>
              <div class="filter-field">
                <span>Добавить покупателя</span>
                <div class="picker-row">
                  <UserSelector
                    v-model:selected-user="buyerToAdd"
                    place-holder="Покупатель"
                  />
                  <el-button :disabled="!buyerToAdd" @click="addBuyerFilter">Добавить</el-button>
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
              <div class="drawer-section-title">Точные товары</div>
              <div class="filter-field">
                <span>Товары в продаже</span>
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

      <div class="sales-workspace">
        <section class="sales-list-panel">
          <div class="panel-heading">
            <div>
              <h2>Список продаж</h2>
              <p>{{ sales.length }} на текущей странице</p>
            </div>
          </div>

          <el-table
            ref="salesTableRef"
            v-loading="salesLoading"
            :data="sales"
            class="w-full"
            height="100%"
            highlight-current-row
            row-class-name="sale-table-row"
            @current-change="selectSale"
          >
            <el-table-column label="Покупатель" min-width="180">
              <template #default="{ row }">
                {{ row.buyer.surname }} {{ row.buyer.name }}
              </template>
            </el-table-column>
            <el-table-column prop="storage" label="Склад" min-width="150" />
            <el-table-column label="Дата" min-width="170">
              <template #default="{ row }">
                {{ formatDate(row.saleDatetime) }}
              </template>
            </el-table-column>
            <el-table-column label="Сумма" min-width="140">
              <template #default="{ row }">
                {{ formatCurrency(row.totalSum, row.currency.currencySign) }}
              </template>
            </el-table-column>
            <el-table-column label="Комментарий" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.comment || '—' }}
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

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProductFilter" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useDebounceFn } from '@vueuse/core'
import CreateSaleDialog from '@/components/sales/CreateSaleDialog.vue'
import SaleDetails from '@/components/sales/SaleDetails.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { SaleContentModel, SaleModel } from '@/models/saleModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { getSaleContent, getSales } from '@/services/api/sales.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { formatLocalDateTime, toLocalDateTimeInputValue } from '@/utils/dateTime.ts'

const { hasPermission } = usePermissions()
const canCreateSales = computed(() => hasPermission('SALES_CREATE'))
const sales = ref<SaleModel[]>([])
const salesTableRef = ref<TableInstance>()
const selectedSale = ref<SaleModel>()
const saleContent = ref<SaleContentModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const selectedBuyers = ref<UserModel[]>([])
const buyerToAdd = ref<UserModel>()
const currencyIds = ref<number[]>([])
const selectedProducts = ref<ProductSearchModel[]>([])
const searchTerm = ref<string>()
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const salesLoading = ref(false)
const contentLoading = ref(false)
const createSaleDialogOpen = ref(false)
const productSelectorOpen = ref(false)
const filtersDrawerOpen = ref(false)

const activeFiltersCount = computed(() => (
  selectedBuyers.value.length
  + currencyIds.value.length
  + selectedProducts.value.length
  + (searchTerm.value?.trim() ? 1 : 0)
))
const activeFiltersText = computed(() => (
  activeFiltersCount.value === 0
    ? 'Показаны продажи за выбранный период'
    : `Активных фильтров: ${activeFiltersCount.value}`
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
  selectedBuyers.value = []
  buyerToAdd.value = undefined
  currencyIds.value = []
  selectedProducts.value = []
  searchTerm.value = undefined
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
  const resp = await getCurrencies({ page: 0, size: 100 })
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
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить продажи')
  } finally {
    salesLoading.value = false
  }
}

async function selectSale(sale?: SaleModel) {
  selectedSale.value = sale
  await nextTick()
  salesTableRef.value?.setCurrentRow(sale)

  if (!sale) {
    saleContent.value = []
    return
  }

  contentLoading.value = true
  try {
    const resp = await getSaleContent(sale.id)
    saleContent.value = resp.content
  } catch (error) {
    saleContent.value = []
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить состав продажи')
  } finally {
    contentLoading.value = false
  }
}

async function onSaleCreated(sale: SaleModel) {
  resetFilters()
  await loadSales(true)
  const createdSale = sales.value.find((item) => item.id === sale.id)
  if (createdSale) {
    await selectSale(createdSale)
  }
}

watch(limit, async () => loadSales(true))
watch(page, async () => loadSales(false))
watch(dateRange, async () => loadSales(true), { deep: true })
watch(selectedBuyers, async () => loadSales(true), { deep: true })
watch(currencyIds, async () => loadSales(true), { deep: true })
watch(selectedProducts, async () => loadSales(true), { deep: true })
watch(searchTerm, () => loadSalesDebounced())

onMounted(async () => {
  await Promise.all([loadCurrencies(), loadSales(true)])
})
</script>

<style scoped src="@/assets/sales-view.css"></style>
