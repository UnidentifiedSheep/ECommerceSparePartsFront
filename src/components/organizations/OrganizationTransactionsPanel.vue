<template>
  <section class="organization-transactions" :aria-label="t('transactions.title')">
    <header>
      <h3>{{ t('transactions.title') }}</h3>
      <el-button size="small" :loading="loading" @click="reload">{{ t('common.actions.refresh') }}</el-button>
    </header>
    <div class="transaction-filters">
      <label>
        <span>{{ t('transactions.period') }}</span>
        <el-date-picker v-model="period" type="daterange" value-format="YYYY-MM-DD" :start-placeholder="t('transactions.start')" :end-placeholder="t('transactions.end')" />
      </label>
      <label>
        <span>{{ t('common.labels.currency') }}</span>
        <el-select v-model="currencyId" clearable :placeholder="t('transactions.allCurrencies')">
          <el-option v-for="currency in currencies" :key="currency.id" :value="currency.id" :label="`${currency.shortName} (${currency.code})`" />
        </el-select>
      </label>
    </div>
    <el-checkbox v-model="showReversed">{{ t('transactions.showReversed') }}</el-checkbox>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon>
      <el-button size="small" @click="load(transactions.length === 0)">{{ t('common.actions.refresh') }}</el-button>
    </el-alert>
    <el-table ref="table" v-loading="loading && transactions.length === 0" :data="transactions" height="360" row-key="id" :empty-text="t('organizationPage.noTransactions')" @scroll="loadNearEnd">
      <el-table-column :label="t('common.labels.date')" min-width="145">
        <template #default="{ row }"><span :title="row.id">{{ date(row.transactionDate) }}</span></template>
      </el-table-column>
      <el-table-column :label="t('transactions.operation')" min-width="125">
        <template #default="{ row }">
          <div>{{ t(`transactions.types.${row.type}`) }}</div>
          <el-button
            v-if="canOpenDocument(row)"
            link type="primary" size="small"
            :loading="openingDocumentId === row.id"
            :disabled="!!openingDocumentId || reversed(row)"
            :title="t(row.sourceType === 'Sale' ? 'transactions.openSale' : 'transactions.openPurchase')"
            @click.stop="openDocument(row)"
          >{{ t(`transactions.sources.${row.sourceType}`) }} ↗</el-button>
          <small v-else>{{ t(`transactions.sources.${row.sourceType}`) }}</small>
        </template>
      </el-table-column>
      <el-table-column :label="t('organizationPage.moneyDirection')" min-width="240">
        <template #default="{ row }">
          <span class="direction-label" :class="{ 'direction-label--system': row.receiver.type === 'System', 'direction-label--organization': row.sender.type === 'System' }">{{ direction(row) }}</span>
          <div class="transaction-parties">
            <span :title="row.sender.name">{{ partyName(row.sender) }}</span>
            <span aria-hidden="true">→</span>
            <span :title="row.receiver.name">{{ partyName(row.receiver) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('transactions.amount')" min-width="140" align="right">
        <template #default="{ row }">
          <strong class="transaction-amount" :class="{ 'is-reversed': reversed(row) }">{{ money(row) }}</strong>
          <small v-if="reversed(row)">{{ t('transactions.reversed') }}</small>
          <small v-else-if="!completed(row)">{{ t('transactions.statuses.Pending') }}</small>
        </template>
      </el-table-column>
    </el-table>
    <div class="journal-status" role="status">
      <span v-if="loading && transactions.length">{{ t('organizationPage.loadingTransactions') }}</span>
      <span v-else-if="!hasNext && transactions.length && !error">{{ t('organizationPage.transactionsEnd') }}</span>
      <span v-else-if="transactions.length">{{ t('organizationPage.transactionsLoaded', { count: transactions.length }) }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onScopeDispose, ref, watch } from 'vue'
import { ElMessage, type TableInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import { getBalanceTransactions, type BalanceTransactionModel } from '@/services/api/balances'
import { getCurrencies } from '@/services/api/currencies'
import type { CurrencyModel } from '@/models/currencyModel'
import type { OrganizationModel } from '@/models/organizationModel'
import { getSaleByTransactionId } from '@/services/api/sales'
import { getPurchaseByTransactionId } from '@/services/api/purchases'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'

const props = defineProps<{ organizationId: string; refreshKey: number }>()
const { t, locale } = useI18n()
const router = useRouter()
const { hasPermission } = usePermissions()
const table = ref<TableInstance>()
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
    table.value?.setScrollTop(0)
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
function loadNearEnd() {
  if (loading.value || error.value || !hasNext.value || disposed) return
  const scroll = table.value?.$el.querySelector('.el-scrollbar__wrap') as HTMLElement | undefined
  if (scroll && scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight <= 80) void load()
}
function reversed(row: BalanceTransactionModel) { return typeof row.status === 'number' ? (row.status & 4) !== 0 : row.status.includes('Reversed') }
function completed(row: BalanceTransactionModel) { return typeof row.status === 'number' ? (row.status & 1) !== 0 : row.status.includes('Completed') }
function direction(row: BalanceTransactionModel) {
  if (row.sender.id === row.receiver.id) return t('organizationPage.internalTransfer')
  if (row.receiver.type === 'System') return t('organizationPage.toSystem')
  if (row.sender.type === 'System') return t('organizationPage.toOrganization')
  return t(row.sender.id === props.organizationId ? 'organizationPage.outgoing' : 'organizationPage.incoming')
}
function partyName(organization: OrganizationModel) { return organization.type === 'System' ? t('transactions.system') : organization.name }
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
function money(row: BalanceTransactionModel) {
  const currency = currencies.value.find(item => item.id === row.currencyId)
  return `${row.amount.toLocaleString(locale.value, { maximumFractionDigits: 2 })} ${currency?.currencySign || currency?.shortName || t('transactions.unknownCurrency', { id: row.currencyId })}`
}
function date(value: string) { return new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
watch([() => props.organizationId, () => props.refreshKey, currencyId, period, showReversed], reload, { immediate: true })
</script>

<style scoped>
.organization-transactions { display: grid; gap: 10px; min-width: 0; margin-top: 20px; border-top: 1px solid var(--app-border); padding-top: 16px; }
header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
h3 { margin: 0; font-size: 16px; font-weight: 650; }
.transaction-filters { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(120px, 1fr); gap: 10px; }
.transaction-filters label { display: grid; min-width: 0; gap: 5px; }
.transaction-filters label > span, small, .journal-status { color: var(--app-text-muted); font-size: 12px; }
small { display: block; margin-top: 3px; }
.transaction-filters :deep(.el-date-editor), .transaction-filters :deep(.el-select) { width: 100%; min-width: 0; }
.transaction-amount { white-space: nowrap; font-variant-numeric: tabular-nums; }
.is-reversed { color: var(--app-text-muted); text-decoration: line-through; }
.journal-status { min-height: 18px; text-align: center; }
.direction-label { display: inline-block; border-radius: 4px; background: var(--app-surface-muted, #f1f5f9); padding: 2px 6px; font-size: 12px; font-weight: 650; }
.direction-label--system { color: #1d4ed8; background: #eff6ff; }
.direction-label--organization { color: #047857; background: #ecfdf5; }
.transaction-parties { display: flex; align-items: baseline; gap: 5px; margin-top: 5px; font-size: 12px; color: var(--app-text-muted); }
.transaction-parties > span:not(:nth-child(2)) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 640px) { .transaction-filters { grid-template-columns: 1fr; } }
</style>
