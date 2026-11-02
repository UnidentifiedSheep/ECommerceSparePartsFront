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
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-table v-loading="loading" :data="transactions" height="360" row-key="id" :empty-text="t('organizationPage.noTransactions')">
      <el-table-column :label="t('common.labels.date')" min-width="145">
        <template #default="{ row }"><span :title="row.id">{{ date(row.transactionDate) }}</span></template>
      </el-table-column>
      <el-table-column :label="t('transactions.operation')" min-width="125">
        <template #default="{ row }">
          <div>{{ t(`transactions.types.${row.type}`) }}</div>
          <small>{{ t(`transactions.sources.${row.sourceType}`) }}</small>
        </template>
      </el-table-column>
      <el-table-column :label="t('organizationPage.counterparty')" min-width="160">
        <template #default="{ row }">
          <OrganizationPartyHoverCard :organization="row.sender.id === organizationId ? row.receiver : row.sender" />
          <small>{{ direction(row) }}</small>
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
    <footer>
      <el-button size="small" :disabled="loading || cursors.length === 0" @click="previous">{{ t('common.actions.back') }}</el-button>
      <span>{{ t('common.labels.page', { page: cursors.length + 1 }) }}</span>
      <el-button size="small" :disabled="loading || !hasNext" @click="next">{{ t('common.actions.forward') }}</el-button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { onScopeDispose, ref, watch } from 'vue'
import { getBalanceTransactions, type BalanceTransactionModel } from '@/services/api/balances'
import { getCurrencies } from '@/services/api/currencies'
import type { CurrencyModel } from '@/models/currencyModel'
import OrganizationPartyHoverCard from '@/components/organizations/OrganizationPartyHoverCard.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{ organizationId: string; refreshKey: number }>()
const { t, locale } = useI18n()
const period = ref<[string, string] | null>(null)
const currencyId = ref<number>()
const showReversed = ref(false)
const currencies = ref<CurrencyModel[]>([])
const transactions = ref<BalanceTransactionModel[]>([])
const loading = ref(false)
const error = ref('')
const hasNext = ref(false)
type Cursor = { id: string; date: string }
const cursors = ref<Cursor[]>([])
let requestId = 0
let currencyRequest: Promise<void> | undefined
let disposed = false
onScopeDispose(() => { disposed = true; ++requestId })

async function load() {
  const request = ++requestId
  loading.value = true
  error.value = ''
  hasNext.value = false
  transactions.value = []
  const cursor = cursors.value[cursors.value.length - 1]
  try {
    currencyRequest ??= getCurrencies().then(result => { if (!disposed) currencies.value = result.currencies }).catch(cause => { currencyRequest = undefined; throw cause })
    const [result] = await Promise.all([getBalanceTransactions({
      senderId: props.organizationId,
      logicalOperator: 'Or',
      skipReversed: !showReversed.value,
      currencyId: currencyId.value,
      rangeStart: period.value ? `${period.value[0]}T00:00:00.000` : undefined,
      rangeEnd: period.value ? `${period.value[1]}T23:59:59.999` : undefined,
      cursorId: cursor?.id,
      cursorDate: cursor?.date,
      size: 20,
    }), currencyRequest])
    if (request !== requestId) return
    transactions.value = result.transactions
    hasNext.value = result.transactions.length === 20
  } catch (cause) {
    if (request === requestId) error.value = cause instanceof Error ? cause.message : t('organizationPage.transactionsError')
  } finally {
    if (request === requestId) loading.value = false
  }
}
function reload() { cursors.value = []; return load() }
function next() {
  const last = transactions.value[transactions.value.length - 1]
  if (loading.value || !hasNext.value || !last) return
  cursors.value.push({ id: last.id, date: last.transactionDate })
  void load()
}
function previous() {
  if (loading.value || !cursors.value.length) return
  cursors.value.pop()
  void load()
}
function reversed(row: BalanceTransactionModel) { return typeof row.status === 'number' ? (row.status & 4) !== 0 : row.status.includes('Reversed') }
function completed(row: BalanceTransactionModel) { return typeof row.status === 'number' ? (row.status & 1) !== 0 : row.status.includes('Completed') }
function direction(row: BalanceTransactionModel) {
  if (row.sender.id === row.receiver.id) return t('organizationPage.internalTransfer')
  return t(row.sender.id === props.organizationId ? 'organizationPage.outgoing' : 'organizationPage.incoming')
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
header, footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
h3 { margin: 0; font-size: 16px; font-weight: 650; }
.transaction-filters { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(120px, 1fr); gap: 10px; }
.transaction-filters label { display: grid; min-width: 0; gap: 5px; }
.transaction-filters label > span, small, footer > span { color: var(--app-text-muted); font-size: 12px; }
small { display: block; margin-top: 3px; }
.transaction-filters :deep(.el-date-editor), .transaction-filters :deep(.el-select) { width: 100%; min-width: 0; }
.transaction-amount { white-space: nowrap; font-variant-numeric: tabular-nums; }
.is-reversed { color: var(--app-text-muted); text-decoration: line-through; }
@media (max-width: 640px) { .transaction-filters { grid-template-columns: 1fr; } }
</style>
