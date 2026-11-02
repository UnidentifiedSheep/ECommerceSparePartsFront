<template>
  <section class="organization-transactions" :aria-label="t('organizationPage.operationHistory')">
    <header class="history-header">
      <h3>{{ t('organizationPage.operationHistory') }}</h3>
      <el-button size="small" :icon="Refresh" :loading="loading" @click="refreshAll">{{ t('common.actions.refresh') }}</el-button>
    </header>
    <div class="history-toolbar">
      <div class="period-filter" role="group" :aria-label="t('transactions.period')">
        <el-date-picker v-model="period" type="daterange" value-format="YYYY-MM-DD" :start-placeholder="t('transactions.start')" :end-placeholder="t('transactions.end')" :range-separator="t('organizationPage.dateSeparator')" />
      </div>
      <el-select v-model="currencyId" clearable class="currency-filter" :aria-label="t('common.labels.currency')" :placeholder="t('transactions.allCurrencies')">
        <el-option v-for="currency in currencies" :key="currency.id" :value="currency.id" :label="`${currency.shortName} (${currency.code})`" />
      </el-select>
      <el-popover trigger="click" placement="bottom-end" :width="240">
        <template #reference>
          <el-button :icon="Filter" :type="showReversed ? 'primary' : 'default'" plain :aria-label="t('transactions.filters')" :title="t('transactions.filters')" />
        </template>
        <el-checkbox v-model="showReversed">{{ t('transactions.showReversed') }}</el-checkbox>
      </el-popover>
    </div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon>
      <el-button size="small" @click="load(transactions.length === 0)">{{ t('common.actions.refresh') }}</el-button>
    </el-alert>
    <div ref="scrollElement" class="operation-list" role="list" :aria-label="t('organizationPage.operationHistory')" :aria-busy="loading" tabindex="0" @scroll.passive="loadNearEnd">
      <div v-if="loading && transactions.length === 0" class="journal-empty" role="status"><el-icon class="is-loading"><Loading /></el-icon>{{ t('organizationPage.loadingTransactions') }}</div>
      <el-empty v-else-if="!transactions.length && !error" :description="t('organizationPage.noTransactions')" :image-size="56" />
      <article v-for="row in transactions" :key="row.id" class="operation-item" role="listitem">
        <component
          :is="canOpenDocument(row) ? 'button' : 'div'"
          class="operation-row"
          :class="{ 'operation-row--link': canOpenDocument(row), 'operation-row--reversed': reversed(row) }"
          :type="canOpenDocument(row) ? 'button' : undefined"
          :disabled="canOpenDocument(row) ? !!openingDocumentId || reversed(row) : undefined"
          :title="canOpenDocument(row) ? t(row.sourceType === 'Sale' ? 'transactions.openSale' : 'transactions.openPurchase') : undefined"
          @click="openDocument(row)"
        >
          <el-icon class="flow-icon" :class="{ 'is-receipt': impact(row) > 0 && !reversed(row) }"><component :is="impact(row) > 0 ? BottomLeft : TopRight" /></el-icon>
          <span class="operation-main">
            <strong>{{ operationTitle(row) }}</strong>
            <span class="operation-description">{{ flowLabel(row) }} · {{ direction(row) }}<span v-if="reversed(row)"> · {{ t('transactions.reversed') }}</span><span v-else-if="!completed(row)"> · {{ t('transactions.statuses.Pending') }}</span></span>
          </span>
          <span class="operation-value">
            <strong class="transaction-amount" :class="{ 'is-receipt': impact(row) > 0 && !reversed(row), 'is-reversed': reversed(row) }">{{ money(row) }}</strong>
            <time :datetime="row.transactionDate">{{ date(row.transactionDate) }}</time>
          </span>
          <el-icon v-if="canOpenDocument(row)" class="document-arrow" :class="{ 'is-loading': openingDocumentId === row.id }"><component :is="openingDocumentId === row.id ? Loading : ArrowRight" /></el-icon>
        </component>
      </article>
    </div>
    <div class="journal-status" role="status">
      <span v-if="loading && transactions.length">{{ t('organizationPage.loadingTransactions') }}</span>
      <span v-else-if="!hasNext && transactions.length && !error">{{ t('organizationPage.transactionsEnd') }}</span>
      <span v-else-if="transactions.length">{{ t('organizationPage.transactionsLoaded', { count: transactions.length }) }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onScopeDispose, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight, BottomLeft, TopRight, Refresh, Filter, Loading } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getBalanceTransactions, type BalanceTransactionModel } from '@/services/api/balances'
import { getCurrencies } from '@/services/api/currencies'
import type { CurrencyModel } from '@/models/currencyModel'
import { getSaleByTransactionId } from '@/services/api/sales'
import { getPurchaseByTransactionId } from '@/services/api/purchases'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'
import { organizationTransactionAmount } from '@/utils/organizationTransactionAmount'

const props = defineProps<{ organizationId: string; refreshKey: number }>()
const emit = defineEmits<{ refreshFinances: [] }>()
const { t, locale } = useI18n()
const router = useRouter()
const { hasPermission } = usePermissions()
const scrollElement = ref<HTMLElement>()
const openingDocumentId = ref('')
const period = ref<[string, string] | null>(null)
const currencyId = ref<number>()
const showReversed = ref(false)
const currencies = ref<CurrencyModel[]>([])
const transactions = ref<BalanceTransactionModel[]>([])
const loading = ref(false)
const error = ref('')
const hasNext = ref(false)
type Cursor = { id: string; date: string }
let cursor: Cursor | undefined
let requestId = 0
let currencyRequest: Promise<void> | undefined
let disposed = false
onScopeDispose(() => { disposed = true; ++requestId })

async function load(reset = false) {
  if (!reset && (loading.value || !hasNext.value)) return
  const request = ++requestId
  loading.value = true
  error.value = ''
  if (reset) {
    hasNext.value = false
    transactions.value = []
    cursor = undefined
    scrollElement.value?.scrollTo({ top: 0 })
  }
  const currentCursor = cursor
  try {
    currencyRequest ??= getCurrencies().then(result => { if (!disposed) currencies.value = result.currencies }).catch(cause => { currencyRequest = undefined; throw cause })
    const [result] = await Promise.all([getBalanceTransactions({
      senderId: props.organizationId,
      logicalOperator: 'Or',
      skipReversed: !showReversed.value,
      currencyId: currencyId.value,
      rangeStart: period.value ? `${period.value[0]}T00:00:00.000` : undefined,
      rangeEnd: period.value ? `${period.value[1]}T23:59:59.999` : undefined,
      cursorId: currentCursor?.id,
      cursorDate: currentCursor?.date,
      size: 20,
    }), currencyRequest])
    if (request !== requestId) return
    const existing = new Set(transactions.value.map(row => row.id))
    const added = result.transactions.filter(row => !existing.has(row.id))
    transactions.value = [...transactions.value, ...added]
    const last = result.transactions[result.transactions.length - 1]
    if (last) cursor = { id: last.id, date: last.transactionDate }
    hasNext.value = result.transactions.length === 20 && added.length > 0
  } catch (cause) {
    if (request === requestId) error.value = cause instanceof Error ? cause.message : t('organizationPage.transactionsError')
  } finally {
    if (request === requestId) {
      loading.value = false
      await nextTick()
      if (!error.value) loadNearEnd()
    }
  }
}
function reload() { return load(true) }
function refreshAll() { emit('refreshFinances'); void reload() }
function loadNearEnd() {
  if (loading.value || error.value || !hasNext.value || disposed) return
  const scroll = scrollElement.value
  if (scroll && scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight <= 80) void load()
}
function reversed(row: BalanceTransactionModel) { return typeof row.status === 'number' ? (row.status & 4) !== 0 : row.status.includes('Reversed') }
function completed(row: BalanceTransactionModel) { return typeof row.status === 'number' ? (row.status & 1) !== 0 : row.status.includes('Completed') }
function direction(row: BalanceTransactionModel) {
  if (row.sender.id === row.receiver.id) return t('organizationPage.internalTransfer')
  if (row.receiver.type === 'System') return t('organizationPage.toSystem')
  if (row.sender.type === 'System') return t('organizationPage.fromSystem')
  return row.sender.id === props.organizationId
    ? t('organizationPage.toParty', { name: row.receiver.name })
    : t('organizationPage.fromParty', { name: row.sender.name })
}
function canOpenDocument(row: BalanceTransactionModel) {
  return row.sourceType === 'Sale' && hasPermission('SALES_GET') || row.sourceType === 'Purchase' && hasPermission('PURCHASE_GET')
}
async function openDocument(row: BalanceTransactionModel) {
  if (!canOpenDocument(row) || reversed(row) || openingDocumentId.value) return
  const organizationId = props.organizationId
  openingDocumentId.value = row.id
  try {
    const isSale = row.sourceType === 'Sale'
    const id = isSale ? (await getSaleByTransactionId(row.id)).sale.id : (await getPurchaseByTransactionId(row.id)).purchase.id
    if (disposed || organizationId !== props.organizationId) return
    await router.push({ name: isSale ? 'sales' : 'purchases', query: isSale ? { saleId: id } : { purchaseId: id } })
  } catch (cause) {
    if (!disposed && organizationId === props.organizationId) ElMessage.error(cause instanceof Error ? cause.message : t(row.sourceType === 'Sale' ? 'transactions.openSaleError' : 'transactions.openPurchaseError'))
  } finally { openingDocumentId.value = '' }
}
function impact(row: BalanceTransactionModel) { return organizationTransactionAmount(row, props.organizationId) }
function flowLabel(row: BalanceTransactionModel) {
  return t(impact(row) > 0 ? 'organizationPage.receipt' : impact(row) < 0 ? 'organizationPage.debit' : 'organizationPage.internalTransfer')
}
function operationTitle(row: BalanceTransactionModel) {
  if (row.sourceType === 'Manual' && row.type === 'Transfer') return t('organizationPage.manualTransfer')
  if (row.type !== 'Transfer') return `${t(`transactions.types.${row.type}`)} · ${t(`transactions.sources.${row.sourceType}`)}`
  return t(`transactions.sources.${row.sourceType}`)
}
function money(row: BalanceTransactionModel) {
  const currency = currencies.value.find(item => item.id === row.currencyId)
  const prefix = impact(row) > 0 ? '+' : impact(row) < 0 ? '−' : ''
  return `${prefix}${Math.abs(row.amount).toLocaleString(locale.value, { maximumFractionDigits: 2 })} ${currency?.currencySign || currency?.shortName || t('transactions.unknownCurrency', { id: row.currencyId })}`
}
function date(value: string) { return new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
watch([() => props.organizationId, () => props.refreshKey, currencyId, period, showReversed], reload, { immediate: true })
</script>

<style scoped>
.organization-transactions { display: grid; gap: 12px; min-width: 0; margin-top: 20px; }
.history-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h3 { margin: 0; font-size: 16px; font-weight: 650; color: var(--app-text); }
.history-toolbar { display: flex; gap: 8px; align-items: center; min-width: 0; }
.period-filter { flex: 1; min-width: 0; }
.period-filter :deep(.el-date-editor) { width: 100%; min-width: 0; }
.currency-filter { flex: 0 0 150px; width: 150px; }
.history-toolbar > .el-button { margin: 0; padding: 8px; }
.operation-list { max-height: 480px; min-height: 220px; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-gutter: stable; }
.operation-list:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 3px; border-radius: 4px; }
.operation-item { border-bottom: 1px solid var(--app-border); }
.operation-item:last-child { border-bottom: 0; }
.operation-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 66px; margin: 0; border: 0; padding: 10px 6px; background: transparent; color: var(--app-text); font: inherit; text-align: left; }
.operation-row--link { cursor: pointer; border-radius: 4px; }
.operation-row--link:hover:not(:disabled) { background: var(--app-bg-soft); }
.operation-row--link:focus-visible { outline: 2px solid var(--app-primary); outline-offset: -2px; }
.operation-row:disabled { cursor: default; }
.flow-icon { flex: 0 0 22px; color: var(--app-text-muted); font-size: 16px; }
.operation-main { flex: 1; min-width: 0; display: grid; gap: 4px; }
.operation-main > strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 600; }
.operation-description { color: var(--app-text-muted); font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
.operation-value { flex: none; display: grid; justify-items: end; gap: 4px; }
.transaction-amount { white-space: nowrap; font-variant-numeric: tabular-nums; font-size: 15px; font-weight: 650; }
.operation-value time { font-size: 11px; color: var(--app-text-muted); white-space: nowrap; }
.document-arrow { flex: 0 0 14px; font-size: 14px; color: var(--app-text-muted); }
.is-receipt { color: #15803d; }
.is-reversed { color: var(--app-text-muted); text-decoration: line-through; }
.operation-row--reversed .operation-main { opacity: .65; }
.journal-status, .journal-empty { color: var(--app-text-muted); font-size: 12px; text-align: center; }
.journal-status { min-height: 18px; }
.journal-empty { display: flex; gap: 8px; align-items: center; justify-content: center; min-height: 160px; }
@media (max-width: 540px) {
  .history-toolbar { flex-wrap: wrap; }
  .period-filter { flex-basis: 100%; }
  .currency-filter { flex: 1; }
  .operation-row { gap: 8px; padding-right: 2px; }
  .operation-value { max-width: 48%; }
  .transaction-amount { max-width: 100%; font-size: 14px; overflow-wrap: anywhere; white-space: normal; text-align: right; }
  .flow-icon { flex-basis: 18px; }
}
</style>
