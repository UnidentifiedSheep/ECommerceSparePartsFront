<template>
  <div class="transactions-page">
    <header class="transactions-header">
      <div><h1>{{ t('transactions.title') }}</h1><p>{{ t('transactions.description') }}</p></div>
      <div class="header-actions">
        <el-button v-if="canCreateTransactions" type="primary" :icon="Plus" @click="createDialogOpen = true">{{ t('common.actions.create') }}</el-button>
        <el-button :icon="Refresh" :loading="isLoading" :disabled="!hasSelectedUserFilter" @click="reloadTransactions">{{ t('common.actions.refresh') }}</el-button>
      </div>
    </header>
    <section class="transactions-layout">
      <aside class="transactions-filters">
        <header class="filter-header"><h2>{{ t('transactions.filters') }}</h2><el-button v-if="narrowPage" text :icon="filtersExpanded ? ArrowUp : ArrowDown" :aria-expanded="filtersExpanded" :aria-label="t(filtersExpanded ? 'transactions.hideFilters' : 'transactions.showFilters')" @click="filtersExpanded = !filtersExpanded" /></header>
        <div v-show="!narrowPage || filtersExpanded" class="filter-body">
          <el-form label-position="top" class="transactions-filter-fields">
            <el-form-item :label="t(filters.logicalOperator === 'And' ? 'transactions.sender' : 'organizations.organization')">
              <OrganizationSelector v-model="sender" :member-required="false" :placeholder="t('transactions.selectUser')" />
            </el-form-item>
            <el-form-item :label="t('transactions.period')">
              <el-date-picker v-model="dateRange" type="daterange" :start-placeholder="t('transactions.start')" :end-placeholder="t('transactions.end')" value-format="YYYY-MM-DD" class="w-full" />
            </el-form-item>
            <el-form-item :label="t('common.labels.currency')">
              <el-select v-model="filters.currencyId" clearable filterable :placeholder="t('transactions.allCurrencies')" class="w-full">
                <el-option v-for="currency in currencies" :key="currency.id" :label="`${currency.shortName} (${currency.code})`" :value="currency.id" />
              </el-select>
            </el-form-item>
            <el-button text class="advanced-toggle" :type="advancedFilterCount ? 'primary' : 'default'" :icon="advancedFiltersOpen ? ArrowUp : ArrowDown" :aria-label="t('transactions.advancedFilters')" :aria-description="advancedFilterCount ? t('transactions.activeAdvancedFilters', { count: advancedFilterCount }) : undefined" :aria-expanded="advancedFiltersOpen" @click="advancedFiltersOpen = !advancedFiltersOpen">{{ t('transactions.advancedFilters') }}<span v-if="advancedFilterCount" class="advanced-count" aria-hidden="true">{{ advancedFilterCount }}</span></el-button>
            <section v-show="advancedFiltersOpen" class="advanced-filters">
              <el-form-item :label="t('transactions.participationMode')">
                <el-radio-group v-model="filters.logicalOperator" size="small">
                  <el-radio-button value="Or">{{ t('transactions.or') }}</el-radio-button>
                  <el-radio-button value="And">{{ t('transactions.and') }}</el-radio-button>
                </el-radio-group>
                <p class="filter-explanation">{{ logicalOperatorTooltip }}</p>
              </el-form-item>
              <el-form-item v-if="filters.logicalOperator === 'And'" :label="t('transactions.receiver')">
                <OrganizationSelector v-model="receiver" :member-required="false" :placeholder="t('transactions.selectReceiver')" />
              </el-form-item>
              <el-checkbox v-model="showReversed">{{ t('transactions.showReversed') }}</el-checkbox>
            </section>
          </el-form>
          <div class="filter-actions"><el-button @click="resetFilters">{{ t('common.actions.reset') }}</el-button><el-button type="primary" :disabled="!hasSelectedUserFilter || isLoading" @click="reloadTransactions">{{ t('transactions.show') }}</el-button></div>
        </div>
      </aside>
      <main class="transactions-content">
        <div class="journal-meta">
          <span>{{ t('transactions.loadedCount', { count: transactions.length }) }}</span>
          <span>{{ transactionPeriodText }}</span>
          <el-tooltip :content="t('transactions.flowContextHint')"><span class="flow-context">{{ flowOrganization ? t('transactions.relativeTo', { name: flowOrganization.name }) : t('transactions.neutralAmounts') }}</span></el-tooltip>
        </div>
        <div ref="tableRegion" class="transactions-table-region">
          <el-table ref="transactionsTableRef" tabindex="0" :aria-label="t('transactions.title')" :aria-description="t('common.labels.transactionNavigation')" highlight-current-row @keydown="tableNavigation.onKeydown" v-loading="isLoading" :data="transactions" class="transactions-table" height="100%" row-key="id" :empty-text="t(hasSelectedUserFilter ? 'organizationPage.noTransactions' : 'transactions.selectOrganizationToLoad')" @row-click="handleTransactionRowClick" @scroll="loadNearEnd">
            <el-table-column :label="t('common.labels.date')" min-width="145"><template #default="{ row }"><span :title="row.id">{{ formatTransactionDate(row.transactionDate) }}</span></template></el-table-column>
            <el-table-column :label="t('transactions.operation')" min-width="145">
              <template #default="{ row }">
                <div class="operation-cell">
                  <button v-if="canNavigateDocument(row) && !isReversedStatus(row.status)" type="button" class="document-link" @click.stop="isSaleSource(row.sourceType) ? openSaleByTransaction(row) : openPurchaseByTransaction(row)">{{ transactionSourceLabel(row.sourceType) }}<el-icon><ArrowRight /></el-icon></button>
                  <strong v-else>{{ transactionSourceLabel(row.sourceType) }}</strong>
                  <small>{{ transactionTypeLabel(row.type) }}<span v-if="isReversedStatus(row.status)"> · {{ t('transactions.reversed') }}</span><span v-else-if="!transactionIsCompleted(row)"> · {{ t('transactions.statuses.Pending') }}</span></small>
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="!compactTransfer" key="sender" :label="t('transactions.sender')" min-width="180"><template #default="{ row }"><OrganizationPartyHoverCard :organization="row.sender" filterable @filter-organization="useOrganizationFilter" /></template></el-table-column>
            <el-table-column v-if="!compactTransfer" key="receiver" :label="t('transactions.receiver')" min-width="180"><template #default="{ row }"><OrganizationPartyHoverCard :organization="row.receiver" filterable @filter-organization="useOrganizationFilter" /></template></el-table-column>
            <el-table-column v-else key="parties" :label="t('transactions.transferParties')" min-width="195">
              <template #default="{ row }"><div class="compact-parties"><OrganizationPartyHoverCard :organization="row.sender" filterable @filter-organization="useOrganizationFilter" /><el-icon><ArrowRight /></el-icon><OrganizationPartyHoverCard :organization="row.receiver" filterable @filter-organization="useOrganizationFilter" /></div></template>
            </el-table-column>
            <el-table-column :label="t('transactions.amount')" min-width="145" align="right"><template #default="{ row }"><strong class="transaction-amount" :class="amountClass(row)">{{ rowMoney(row) }}</strong></template></el-table-column>
          </el-table>
        </div>
        <footer class="table-footer">
          <span class="table-shortcuts">{{ t('common.labels.transactionNavigation') }}</span>
          <div v-if="loadMoreError" class="load-more-error" role="alert"><span>{{ loadMoreError }}</span><el-button size="small" @click="retryLoadMore">{{ t('common.actions.refresh') }}</el-button></div>
          <span v-else-if="isLoadingMore" class="table-shortcuts" role="status">{{ t('organizationPage.loadingTransactions') }}</span>
          <span v-else-if="transactions.length && !canLoadMore && !isLoading" class="table-shortcuts" role="status">{{ t('organizationPage.transactionsEnd') }}</span>
        </footer>
      </main>
    </section>
    <TransactionDetailsDrawer
      v-model="detailsOpen"
      :transaction="selectedTransaction"
      :currencies="currencies"
      :organization="flowOrganization"
      :navigation-loading="purchaseNavigationLoading || saleNavigationLoading"
      @navigate="tableNavigation.onKeydown"
      @open-document="row => isSaleSource(row.sourceType) ? openSaleByTransaction(row) : openPurchaseByTransaction(row)"
      @reversed="handleTransactionReversed"
    />
    <CreateTransactionDialog v-model="createDialogOpen" :currencies="currencies" @created="handleTransactionCreated" />
  </div>
</template>

<script setup lang="ts">
import { useTableArrowNavigation } from '@/composables/useTableArrowNavigation'
import { computed, nextTick, onMounted, onScopeDispose, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { ElMessage, type TableInstance } from 'element-plus'
import { ArrowDown, ArrowUp, ArrowRight, Plus, Refresh } from '@element-plus/icons-vue'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import OrganizationPartyHoverCard from '@/components/organizations/OrganizationPartyHoverCard.vue'
import TransactionDetailsDrawer from '@/components/transactions/TransactionDetailsDrawer.vue'
import { useTransactionPresentation } from '@/composables/useTransactionPresentation'
import CreateTransactionDialog from '@/components/transactions/CreateTransactionDialog.vue'
import type { OrganizationSelection } from '@/models/organizationModel.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { getOrganizations } from '@/services/api/organizations.ts'
import {
  getBalanceTransactions,
  type BalanceTransactionModel,
  type TransactionLogicalOperator,
} from '@/services/api/balances.ts'
import { getPurchaseByTransactionId } from '@/services/api/purchases.ts'
import { getSaleByTransactionId } from '@/services/api/sales.ts'
import { transactionIsCompleted } from '@/utils/transactionJournal'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

const pageSize = 100
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { hasPermission } = usePermissions()

const isLoading = ref(false)
const isLoadingMore = ref(false)
const purchaseNavigationLoading = ref(false)
const saleNavigationLoading = ref(false)
const createDialogOpen = ref(false)
const detailsOpen = ref(false)
const selectedTransaction = ref<BalanceTransactionModel | null>(null)
const transactions = ref<BalanceTransactionModel[]>([])
const transactionsTableRef = ref<TableInstance>()
const tableNavigation = useTableArrowNavigation({
  rows: transactions, selected: selectedTransaction,
  busy: computed(() => isLoading.value || isLoadingMore.value),
  root: () => transactionsTableRef.value?.$el as HTMLElement | undefined,
  select: selectTransaction,
  activate: openTransactionDetails,
  onBoundary: (direction) => { if (direction === 1) return loadMoreTransactions() },
})
const currencies = ref<CurrencyModel[]>([])
const sender = ref<OrganizationSelection | undefined>()
const receiver = ref<OrganizationSelection | undefined>()
function useOrganizationFilter(organization: OrganizationSelection['organization']) {
  filters.logicalOperator = 'Or'
  sender.value = { organization }
  receiver.value = undefined
}
const canLoadMore = ref(false)
const loadMoreError = ref('')
const dateRange = ref<[string, string] | null>(null)
const advancedFiltersOpen = ref(false)
const filtersExpanded = ref(false)
const narrowPage = useMediaQuery('(max-width: 980px)')
const tableRegion = ref<HTMLElement>()
const compactTransfer = ref(false)
useResizeObserver(tableRegion, ([entry]) => {
  if (entry) compactTransfer.value = entry.contentRect.width < 820
  void nextTick(loadNearEnd)
})
let requestGeneration = 0
let disposed = false
onScopeDispose(() => { disposed = true; ++requestGeneration })
const isApplyingRouteQuery = ref(false)
const isSyncingRouteQuery = ref(false)

const filters = reactive({
  currencyId: null as number | null,
  logicalOperator: 'Or' as TransactionLogicalOperator,
  skipReversed: true,
})

const canCreateTransactions = computed(() => hasPermission('BALANCES_TRANSACTION_CREATE'))
const showReversed = computed({
  get: () => !filters.skipReversed,
  set: (value: boolean) => {
    filters.skipReversed = !value
  },
})
const advancedFilterCount = computed(() => Number(filters.logicalOperator === 'And') + Number(!!receiver.value) + Number(!filters.skipReversed))
const flowOrganization = computed(() => {
  const a = sender.value?.organization
  const b = filters.logicalOperator === 'And' ? receiver.value?.organization : undefined
  return a && b && a.id !== b.id ? undefined : a ?? b
})
const canViewPurchases = computed(() => hasPermission('PURCHASE_GET'))
const canViewSales = computed(() => hasPermission('SALES_GET'))
const logicalOperatorTooltip = computed(() => (
  filters.logicalOperator === 'And'
    ? t('transactions.andTooltip')
    : t('transactions.orTooltip')
))
const transactionPeriodText = computed(() => (
  dateRange.value
    ? `${dateRange.value[0]} — ${dateRange.value[1]}`
    : t('transactions.allTime')
))
const hasSelectedUserFilter = computed(() => Boolean(sender.value || receiver.value))

const reloadTransactionsDebounced = useDebounceFn(async () => {
  if (!hasSelectedUserFilter.value || disposed) return
  await reloadTransactions()
}, 250)

onMounted(async () => {
  await applyFiltersFromQuery()
  await loadCurrencies()
  if (hasSelectedUserFilter.value && !disposed) {
    await reloadTransactions()
  }
})

async function loadCurrencies() {
  try {
    const response = await getCurrencies()
    currencies.value = response.currencies
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('transactions.loadCurrenciesError'))
  }
}

async function reloadTransactions() {
  if (!hasSelectedUserFilter.value || disposed) { invalidateTransactions(); return }
  const generation = ++requestGeneration
  loadMoreError.value = ''
  canLoadMore.value = false
  isLoadingMore.value = false
  isLoading.value = true
  try {
    const response = await getBalanceTransactions({
      rangeStart: dateRange.value ? `${dateRange.value[0]}T00:00:00.000` : undefined,
      rangeEnd: dateRange.value ? `${dateRange.value[1]}T23:59:59.999` : undefined,
      currencyId: filters.currencyId,
      senderId: sender.value?.organization.id,
      receiverId: filters.logicalOperator === 'And' ? receiver.value?.organization.id : undefined,
      logicalOperator: filters.logicalOperator,
      skipReversed: filters.skipReversed,
      size: pageSize,
    })

    if (generation !== requestGeneration || disposed) return
    transactions.value = response.transactions
    const current = transactions.value.find((item) => item.id === selectedTransaction.value?.id)
    selectedTransaction.value = current ?? null
    if (!current) detailsOpen.value = false
    await nextTick()
    transactionsTableRef.value?.setCurrentRow(current)
    canLoadMore.value = response.transactions.length === pageSize
  } catch (error) {
    if (generation === requestGeneration && !disposed) ElMessage.error(error instanceof Error ? error.message : t('transactions.loadError'))
  } finally {
    if (generation === requestGeneration) {
      isLoading.value = false
      await nextTick()
      loadNearEnd()
    }
  }
}

async function loadMoreTransactions() {
  if (isLoading.value || isLoadingMore.value || loadMoreError.value || !canLoadMore.value || !hasSelectedUserFilter.value || disposed) return
  const generation = requestGeneration
  const cursor = transactions.value[transactions.value.length - 1]
  if (!cursor) return

  isLoadingMore.value = true
  try {
    const response = await getBalanceTransactions({
      rangeStart: dateRange.value ? `${dateRange.value[0]}T00:00:00.000` : undefined,
      rangeEnd: dateRange.value ? `${dateRange.value[1]}T23:59:59.999` : undefined,
      currencyId: filters.currencyId,
      senderId: sender.value?.organization.id,
      receiverId: filters.logicalOperator === 'And' ? receiver.value?.organization.id : undefined,
      logicalOperator: filters.logicalOperator,
      skipReversed: filters.skipReversed,
      cursorId: cursor.id,
      cursorDate: cursor.transactionDate,
      size: pageSize,
    })

    if (generation !== requestGeneration || disposed) return
    const existingIds = new Set(transactions.value.map((transaction) => transaction.id))
    const newTransactions = response.transactions.filter((transaction) => !existingIds.has(transaction.id))
    transactions.value = [...transactions.value, ...newTransactions]
    canLoadMore.value = response.transactions.length === pageSize && newTransactions.length > 0
  } catch (error) {
    if (generation === requestGeneration && !disposed) loadMoreError.value = error instanceof Error ? error.message : t('transactions.loadMoreError')
  } finally {
    if (generation === requestGeneration) {
      isLoadingMore.value = false
      await nextTick()
      loadNearEnd()
    }
  }
}

function loadNearEnd() {
  if (isLoading.value || isLoadingMore.value || loadMoreError.value || !canLoadMore.value || disposed) return
  const scroll = transactionsTableRef.value?.$el.querySelector('.el-table__body-wrapper .el-scrollbar__wrap') as HTMLElement | undefined
  if (scroll && scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight <= 100) void loadMoreTransactions()
}

function retryLoadMore() {
  loadMoreError.value = ''
  void loadMoreTransactions()
}

function resetFilters() {
  dateRange.value = null
  filters.currencyId = null
  filters.logicalOperator = 'Or'
  filters.skipReversed = true
  sender.value = undefined
  receiver.value = undefined
  transactions.value = []
  canLoadMore.value = false
}

async function applyFiltersFromQuery() {
  isApplyingRouteQuery.value = true
  try {
    const query = route.query
    const nextRange = parseDateRangeQuery(query.from, query.to)
    dateRange.value = nextRange

    filters.currencyId = parsePositiveIntegerQuery(query.currencyId)
    filters.logicalOperator = parseLogicalOperatorQuery(query.operator)
    filters.skipReversed = parseBooleanQuery(query.showReversed) !== true

    const senderId = firstQueryValue(query.senderId)
    const receiverId = firstQueryValue(query.receiverId)

    const [nextSender, nextReceiver] = await Promise.all([
      loadOrganizationById(senderId),
      filters.logicalOperator === 'And' ? loadOrganizationById(receiverId) : Promise.resolve(undefined),
    ])

    sender.value = nextSender
    receiver.value = filters.logicalOperator === 'And' ? nextReceiver : undefined
    advancedFiltersOpen.value = filters.logicalOperator === 'And' || !filters.skipReversed
    await nextTick()
  } finally {
    isApplyingRouteQuery.value = false
  }
}

async function loadOrganizationById(organizationId?: string): Promise<OrganizationSelection | undefined> {
  if (!organizationId) return undefined

  try {
    const response = await getOrganizations({ ids: [organizationId], page: 0, limit: 1 })
    const organization = response.organizations[0]
    return organization ? { organization } : undefined
  } catch {
    return undefined
  }
}

function parseDateRangeQuery(from: unknown, to: unknown): [string, string] | null {
  const rangeStart = firstQueryValue(from)
  const rangeEnd = firstQueryValue(to)
  if (!rangeStart || !rangeEnd || !isDateInputValue(rangeStart) || !isDateInputValue(rangeEnd)) return null
  return [rangeStart, rangeEnd]
}

function parsePositiveIntegerQuery(value: unknown) {
  const rawValue = firstQueryValue(value)
  if (!rawValue) return null

  const parsed = Number(rawValue)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function parseLogicalOperatorQuery(value: unknown): TransactionLogicalOperator {
  return firstQueryValue(value) === 'And' ? 'And' : 'Or'
}

function parseBooleanQuery(value: unknown) {
  const rawValue = firstQueryValue(value)
  if (rawValue === 'true') return true
  if (rawValue === 'false') return false
  return undefined
}

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined
  return typeof value === 'string' ? value : undefined
}

function isDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

async function syncFiltersToQuery() {
  const nextQuery: Record<string, string> = {}

  if (dateRange.value) {
    nextQuery.from = dateRange.value[0]
    nextQuery.to = dateRange.value[1]
  }
  if (filters.currencyId) nextQuery.currencyId = String(filters.currencyId)
  if (filters.logicalOperator !== 'Or') nextQuery.operator = filters.logicalOperator
  if (!filters.skipReversed) nextQuery.showReversed = 'true'
  if (sender.value?.organization.id) nextQuery.senderId = sender.value.organization.id
  if (filters.logicalOperator === 'And' && receiver.value?.organization.id) nextQuery.receiverId = receiver.value.organization.id

  if (isSameQuery(route.query, nextQuery)) return

  isSyncingRouteQuery.value = true
  try {
    await router.replace({
      name: 'transactions',
      query: nextQuery,
    })
  } finally {
    isSyncingRouteQuery.value = false
  }
}

function isSameQuery(currentQuery: Record<string, unknown>, nextQuery: Record<string, string>) {
  const currentEntries: Array<[string, string]> = []
  Object.entries(currentQuery).forEach(([key, value]) => {
    const queryValue = firstQueryValue(value)
    if (queryValue !== undefined) {
      currentEntries.push([key, queryValue])
    }
  })

  if (currentEntries.length !== Object.keys(nextQuery).length) return false

  return currentEntries.every(([key, value]) => nextQuery[key] === value)
}

function handleTransactionRowClick(transaction: BalanceTransactionModel, column: unknown, event: MouseEvent) {
  tableNavigation.onRowClick(transaction, column, event)
  openTransactionDetails(transaction)
}

function selectTransaction(transaction: BalanceTransactionModel) {
  selectedTransaction.value = transaction
  transactionsTableRef.value?.setCurrentRow(transaction)
}

function openTransactionDetails(transaction: BalanceTransactionModel) {
  selectTransaction(transaction)
  detailsOpen.value = true
}








const { transactionTypeLabel, transactionSourceLabel, isPurchaseSource, isSaleSource, isNavigableSource, isReversedStatus, formatTransactionDate, rowMoney, amountClass } = useTransactionPresentation(() => currencies.value, () => flowOrganization.value)

async function handleTransactionReversed(id: string) {
  if (selectedTransaction.value?.id === id) { selectedTransaction.value = null; detailsOpen.value = false }
  await reloadTransactions()
}

async function handleTransactionCreated() {
  await reloadTransactions()
}

async function openPurchaseByTransaction(transaction: BalanceTransactionModel) {
  if (!canViewPurchases.value || !isPurchaseSource(transaction.sourceType) || isReversedStatus(transaction.status) || purchaseNavigationLoading.value) return

  purchaseNavigationLoading.value = true
  try {
    const response = await getPurchaseByTransactionId(transaction.id)
    if (disposed) return
    detailsOpen.value = false
    await router.push({
      name: 'purchases',
      query: {
        purchaseId: response.purchase.id,
      },
    })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('transactions.openPurchaseError'))
  } finally {
    purchaseNavigationLoading.value = false
  }
}

async function openSaleByTransaction(transaction: BalanceTransactionModel) {
  if (!canViewSales.value || !isSaleSource(transaction.sourceType) || isReversedStatus(transaction.status) || saleNavigationLoading.value) return

  saleNavigationLoading.value = true
  try {
    const response = await getSaleByTransactionId(transaction.id)
    if (disposed) return
    detailsOpen.value = false
    await router.push({
      name: 'sales',
      query: {
        saleId: response.sale.id,
      },
    })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('transactions.openSaleError'))
  } finally {
    saleNavigationLoading.value = false
  }
}

function canNavigateDocument(row: BalanceTransactionModel) { return isNavigableSource(row.sourceType) && (isPurchaseSource(row.sourceType) ? canViewPurchases.value : canViewSales.value) }
function invalidateTransactions() {
  ++requestGeneration
  loadMoreError.value = ''
  isLoading.value = false
  isLoadingMore.value = false
  transactions.value = []
  selectedTransaction.value = null
  detailsOpen.value = false
  canLoadMore.value = false
}

watch(() => filters.logicalOperator, (operator) => {
  if (operator !== 'Or') return

  if (!sender.value && receiver.value) {
    sender.value = receiver.value
  }
  receiver.value = undefined
})
watch(
  () => [
    dateRange.value?.[0],
    dateRange.value?.[1],
    filters.currencyId,
    filters.logicalOperator,
    filters.skipReversed,
    sender.value?.organization.id,
    receiver.value?.organization.id,
  ],
  async () => {
    if (isApplyingRouteQuery.value) return

    invalidateTransactions()
    await syncFiltersToQuery()

    if (!hasSelectedUserFilter.value) {
      transactions.value = []
      canLoadMore.value = false
      return
    }

    await reloadTransactionsDebounced()
  },
)

watch(() => route.query, async () => {
  if (isApplyingRouteQuery.value || isSyncingRouteQuery.value) return

  invalidateTransactions()
  await applyFiltersFromQuery()

  if (hasSelectedUserFilter.value) {
    await reloadTransactions()
    return
  }

  transactions.value = []
  canLoadMore.value = false
})
</script>

<style scoped>
.transactions-page { display: flex; flex-direction: column; height: calc(100dvh - var(--app-viewport-offset, 56px)); min-height: 0; box-sizing: border-box; overflow: hidden; background: var(--app-bg-soft); padding: 20px; }
.transactions-header { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.transactions-header h1 { margin: 0; color: var(--app-text); font-size: 26px; font-weight: 700; }
.transactions-header p { margin: 4px 0 0; color: var(--app-text-muted); font-size: 13px; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: end; }
.transactions-layout { display: grid; flex: 1; min-height: 0; min-width: 0; grid-template-columns: 280px minmax(0,1fr); gap: 16px; }
.transactions-filters, .transactions-content { min-width: 0; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-surface); }
.transactions-filters { align-self: start; max-height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 16px; }
.filter-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.filter-header h2 { margin: 0; font-size: 15px; font-weight: 650; }
.filter-body { display: flex; flex-direction: column; min-height: 0; margin-top: 16px; }
.transactions-filter-fields { min-height: 0; overflow-y: auto; overflow-x: hidden; }
.filter-actions { display: flex; gap: 8px; justify-content: end; border-top: 1px solid var(--app-border); padding-top: 12px; margin-top: 8px; }
.advanced-toggle { padding: 4px 0; height: auto; margin-bottom: 12px; }
.advanced-count { margin-left: 6px; border-radius: 4px; background: var(--app-primary-soft); padding: 0 5px; font-size: 11px; }
.advanced-filters { padding: 12px 0; border-top: 1px solid var(--app-border); }
.filter-explanation { color: var(--app-text-muted); font-size: 12px; line-height: 1.5; margin: 8px 0 0; }
.transactions-content { display: flex; flex-direction: column; min-height: 0; padding: 16px; }
.journal-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; padding-bottom: 10px; color: var(--app-text-muted); font-size: 12px; }
.flow-context { color: var(--app-text); }
.transactions-table-region { flex: 1; min-height: 0; min-width: 0; }
.transactions-table { width: 100%; }
.transactions-table :deep(.el-table__row) { cursor: pointer; }
.operation-cell { display: grid; gap: 3px; line-height: 1.3; }
.operation-cell > strong { font-weight: 600; font-size: 13px; }
.operation-cell small { color: var(--app-text-muted); font-size: 12px; }
.document-link { display: inline-flex; align-items: center; width: fit-content; gap: 4px; border: 0; padding: 0; background: transparent; color: var(--app-primary); font: inherit; font-weight: 600; cursor: pointer; }
.document-link:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 3px; }
.document-link:hover { text-decoration: underline; }
.compact-parties { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 6px; min-width: 0; }
.compact-parties > .el-icon { flex: none; color: var(--app-text-muted); }
.compact-parties :deep(.organization-party-reference) { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.transaction-amount, .hero-amount { color: var(--app-text); white-space: nowrap; font-variant-numeric: tabular-nums; }
.amount-positive { color: #15803d; }
.amount-negative { color: #b91c1c; }
.amount-muted { color: var(--app-text-muted); text-decoration: line-through; }
.table-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 12px; }
.load-more-error { display: flex; align-items: center; gap: 8px; color: #b91c1c; font-size: 12px; }
.table-shortcuts { color: var(--app-text-muted); font-size: 11px; }
:deep(.transactions-filters .el-form-item) { margin-bottom: 16px; }
:deep(.transactions-filters .el-select), :deep(.transactions-filters .el-date-editor) { width: 100%; min-width: 0; }
@media (max-width:980px) {
  .transactions-page { height: auto; min-height: calc(100dvh - var(--app-viewport-offset,56px)); overflow: visible; padding: 12px; }
  .transactions-layout { grid-template-columns: 1fr; }
  .transactions-content { height: clamp(420px,75dvh,760px); }
  .transactions-filters { padding: 10px 14px; }
}
@media (max-width:640px) {
  .transactions-header { align-items: start; gap: 10px; }
  .transactions-header h1 { font-size: 22px; }
  .transactions-header p { display: none; }
  .header-actions { gap: 4px; }
  .header-actions > .el-button { margin: 0; padding: 8px 10px; }
  .transactions-content { padding: 12px; }
}
</style>
