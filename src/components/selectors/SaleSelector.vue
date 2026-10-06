<template>
  <div class="sale-selector">
    <div v-if="selectedSale" class="sale-selector__selection">
      <div class="sale-selector__selected-main">
        <strong>{{ formatDate(selectedSale.saleDatetime) }}</strong>
        <span class="sale-selector__amount">{{ formatAmount(selectedSale) }}</span>
      </div>
      <div class="sale-selector__selected-meta">
        {{ selectedSale.organization.name }} · {{ buyerName(selectedSale) }}
      </div>
      <div class="sale-selector__selected-meta">
        {{ selectedSale.storageCode }} · {{ t(`sales.states.${selectedSale.state}`) }} · {{ selectedSale.id.slice(0, 8) }}
      </div>
      <div class="sale-selector__selected-actions">
        <el-button size="small" plain @click="openDialog">{{ t('documents.saleChange') }}</el-button>
        <el-button size="small" text @click="clearSelection">{{ t('common.actions.reset') }}</el-button>
      </div>
    </div>
    <div v-else class="sale-selector__empty">
      <el-button @click="openDialog">{{ t('documents.saleChoose') }}</el-button>
      <span v-if="selectedLoading">{{ t('documents.saleLoading') }}</span>
      <span v-else-if="modelValue && selectedError" class="sale-selector__error">{{ selectedError }}</span>
    </div>

    <el-dialog v-model="dialogOpen" append-to-body :title="t('documents.saleChoose')" width="min(1060px, calc(100vw - 24px))" class="sale-selector-dialog">
      <form class="sale-selector__filters" @submit.prevent="loadFirstPage">
        <label class="sale-selector__filter sale-selector__filter--search">
          <span>{{ t('common.labels.search') }}</span>
          <el-input v-model="query" :prefix-icon="Search" clearable :placeholder="t('documents.saleSearchPlaceholder')" />
        </label>
        <label class="sale-selector__filter sale-selector__filter--date">
          <span>{{ t('common.labels.date') }}</span>
          <el-date-picker v-model="dateRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss.SSS" :start-placeholder="t('sales.start')" :end-placeholder="t('sales.end')" range-separator="—" />
        </label>
        <label class="sale-selector__filter sale-selector__filter--state">
          <span>{{ t('sales.state') }}</span>
          <el-select v-model="state" clearable :placeholder="t('sales.allStates')">
            <el-option v-for="option in stateOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </label>
        <div class="sale-selector__filter sale-selector__filter--organization">
          <span>{{ t('sales.buyer') }}</span>
          <OrganizationSelector v-model="organization" organization-only clearable />
        </div>
        <div class="sale-selector__filter-actions">
          <el-button type="primary" native-type="submit" :loading="loading">{{ t('products.find') }}</el-button>
          <el-button @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
        </div>
      </form>

      <div v-if="listError" class="sale-selector__list-error" role="alert">
        {{ listError }} <el-button link type="primary" @click="loadPage(failedPage)">{{ t('documents.retry') }}</el-button>
      </div>
      <div class="sale-selector__table-wrap">
        <el-table v-loading="loading && page === 0" :data="sales" height="min(430px, 48dvh)" :empty-text="t('documents.saleEmpty')" :row-class-name="rowClassName" @row-click="chooseSale">
          <el-table-column :label="t('common.labels.date')" min-width="150">
            <template #default="{ row }">{{ formatDate(row.saleDatetime) }}</template>
          </el-table-column>
          <el-table-column :label="t('sales.buyer')" min-width="220">
            <template #default="{ row }">
              <div class="sale-selector__party"><strong :title="row.organization.name">{{ row.organization.name }}</strong><span :title="buyerName(row)">{{ buyerName(row) }}</span></div>
            </template>
          </el-table-column>
          <el-table-column prop="storageCode" :label="t('sales.storage')" min-width="115" />
          <el-table-column :label="t('sales.state')" min-width="115">
            <template #default="{ row }">{{ t(`sales.states.${row.state}`) }}</template>
          </el-table-column>
          <el-table-column :label="t('sales.amount')" min-width="125" align="right">
            <template #default="{ row }"><strong>{{ formatAmount(row) }}</strong></template>
          </el-table-column>
          <el-table-column :label="t('documents.saleNumber')" min-width="105">
            <template #default="{ row }"><span class="sale-selector__id" :title="row.id">{{ row.id.slice(0, 8) }}</span></template>
          </el-table-column>
        </el-table>
      </div>
      <div class="sale-selector__footer">
        <span>{{ t('documents.loadedCount', { count: sales.length }) }}</span>
        <el-button v-if="hasMore" :loading="loading" @click="loadPage(page + 1)">{{ t('common.actions.loadMore') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import type { OrganizationSelection } from '@/models/organizationModel.ts'
import type { SaleModel, SaleState } from '@/models/saleModel.ts'
import { getSale, getSales } from '@/services/api/sales.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{ modelValue?: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()
const { t, locale } = useI18n()
const dialogOpen = ref(false)
const selectedSale = ref<SaleModel | null>(null)
const selectedLoading = ref(false)
const selectedError = ref('')
const sales = ref<SaleModel[]>([])
const loading = ref(false)
const listError = ref('')
const hasMore = ref(false)
const page = ref(0)
const failedPage = ref(0)
const query = ref('')
const state = ref<SaleState | ''>('')
const dateRange = ref<[string, string] | null>(null)
const organization = ref<OrganizationSelection>()
const stateOptions = computed(() => (['Draft', 'Completed', 'Deleted'] as SaleState[]).map((value) => ({ value, label: t(`sales.states.${value}`) })))
let listRequestVersion = 0
let selectedRequestVersion = 0

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
function formatAmount(sale: SaleModel) {
  return `${sale.totalSum.toLocaleString(locale.value)} ${sale.currency.currencySign}`
}
function buyerName(sale: SaleModel) {
  const name = [sale.buyer.name, sale.buyer.surname].filter(Boolean).join(' ')
  return name && name !== sale.buyer.userName ? `${name} (${sale.buyer.userName})` : sale.buyer.userName
}
function clearSelection() {
  selectedSale.value = null
  selectedLoading.value = false
  selectedError.value = ''
  emit('update:modelValue', null)
}
function rowClassName({ row }: { row: SaleModel }) {
  return row.id === props.modelValue ? 'sale-selector__row sale-selector__row--selected' : 'sale-selector__row'
}
function chooseSale(sale: SaleModel) {
  selectedSale.value = sale
  selectedError.value = ''
  emit('update:modelValue', sale.id)
  dialogOpen.value = false
}
function openDialog() {
  dialogOpen.value = true
  void loadFirstPage()
}
function resetFilters() {
  query.value = ''
  state.value = ''
  dateRange.value = null
  organization.value = undefined
  void loadFirstPage()
}
function loadFirstPage() { return loadPage(0) }
async function loadPage(nextPage: number) {
  if (loading.value && nextPage > 0) return
  const version = ++listRequestVersion
  loading.value = true
  listError.value = ''
  if (nextPage === 0) {
    sales.value = []
    hasMore.value = false
    page.value = 0
  }
  try {
    const result = await getSales({
      page: nextPage,
      limit: 25,
      searchTerm: query.value.trim() || undefined,
      rangeStartDate: dateRange.value?.[0],
      rangeEndDate: dateRange.value?.[1],
      organizationIds: organization.value ? [organization.value.organization.id] : undefined,
      states: state.value ? [state.value] : undefined,
      sortBy: ['dateTime_desc'],
    })
    if (version !== listRequestVersion) return
    sales.value = nextPage === 0 ? result.sales : [...sales.value, ...result.sales]
    page.value = nextPage
    hasMore.value = result.sales.length === 25
  } catch (error) {
    if (version === listRequestVersion) {
      failedPage.value = nextPage
      listError.value = error instanceof Error ? error.message : t('documents.salesError')
    }
  } finally {
    if (version === listRequestVersion) loading.value = false
  }
}

watch(() => props.modelValue, async (id) => {
  const version = ++selectedRequestVersion
  if (!id) { selectedSale.value = null; selectedLoading.value = false; selectedError.value = ''; return }
  if (selectedSale.value?.id === id) { selectedLoading.value = false; return }
  selectedSale.value = null
  const inList = sales.value.find((sale) => sale.id === id)
  if (inList) { selectedSale.value = inList; selectedError.value = ''; return }
  selectedLoading.value = true
  selectedError.value = ''
  try {
    const result = await getSale(id)
    if (version === selectedRequestVersion) selectedSale.value = result.sale
  } catch (error) {
    if (version === selectedRequestVersion) selectedError.value = error instanceof Error ? error.message : t('documents.salesError')
  } finally {
    if (version === selectedRequestVersion) selectedLoading.value = false
  }
}, { immediate: true })
onBeforeUnmount(() => { ++listRequestVersion; ++selectedRequestVersion })
</script>

<style scoped>
.sale-selector__selection { border: 1px solid var(--app-border); border-radius: 6px; padding: 11px 14px; }
.sale-selector__selected-main, .sale-selector__selected-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sale-selector__amount { font-weight: 650; white-space: nowrap; }
.sale-selector__selected-meta { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
.sale-selector__selected-actions { justify-content: flex-start; margin-top: 10px; }
.sale-selector__empty { display: flex; align-items: center; gap: 10px; }
.sale-selector__empty span { font-size: 12px; color: var(--el-text-color-secondary); }
.sale-selector__empty .sale-selector__error { color: var(--el-color-danger); }
.sale-selector__filters { display: grid; grid-template-columns: minmax(210px, 1.3fr) minmax(240px, 1.3fr) minmax(135px, .7fr); align-items: end; gap: 12px; margin-bottom: 16px; }
.sale-selector__filter { display: flex; flex-direction: column; min-width: 0; gap: 5px; font-size: 12px; font-weight: 600; }
.sale-selector__filter :deep(.el-date-editor), .sale-selector__filter :deep(.organization-selector-trigger) { width: 100%; }
.sale-selector__filter-actions { display: flex; gap: 8px; }
.sale-selector__filter-actions :deep(.el-button + .el-button) { margin-left: 0; }
.sale-selector__list-error { margin-bottom: 10px; color: var(--el-color-danger); font-size: 13px; }
.sale-selector__table-wrap { border: 1px solid var(--app-border); border-radius: 6px; overflow: hidden; }
.sale-selector__party { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.sale-selector__party strong, .sale-selector__party span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sale-selector__party span, .sale-selector__id { color: var(--el-text-color-secondary); font-size: 12px; }
.sale-selector__footer { display: flex; align-items: center; justify-content: space-between; min-height: 44px; color: var(--el-text-color-secondary); font-size: 12px; }
:deep(.sale-selector__row) { cursor: pointer; }
:deep(.sale-selector__row--selected) { background: var(--app-primary-soft); }
@media (max-width: 820px) { .sale-selector__filters { grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px) { .sale-selector__filters { grid-template-columns: 1fr; } .sale-selector__selected-main { flex-wrap: wrap; } }
</style>
