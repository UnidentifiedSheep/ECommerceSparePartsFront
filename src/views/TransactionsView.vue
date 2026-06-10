<template>
  <div class="transactions-page">
    <section class="transactions-header">
      <div>
        <h1>Транзакции</h1>
        <p>Журнал балансовых операций по пользователям и валютам.</p>
      </div>
      <el-button type="primary" :loading="isLoading" @click="reloadTransactions">
        Обновить
      </el-button>
    </section>

    <section class="transactions-layout">
      <aside class="transactions-filters">
        <div class="filter-title">Фильтры</div>

        <el-form label-position="top">
          <el-form-item label="Период">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              start-placeholder="Начало"
              end-placeholder="Конец"
              value-format="YYYY-MM-DD"
              class="w-full"
              :clearable="false"
            />
          </el-form-item>

          <el-form-item label="Валюта">
            <el-select v-model="filters.currencyId" clearable filterable placeholder="Все валюты" class="w-full">
              <el-option
                v-for="currency in currencies"
                :key="currency.id"
                :label="`${currency.shortName} (${currency.code})`"
                :value="currency.id"
              />
            </el-select>
          </el-form-item>

          <fieldset class="participants-filter">
            <legend>
              <el-tooltip
                placement="top"
                :content="logicalOperatorTooltip"
                :show-after="700"
              >
                <div class="logical-switch">
                  <span :class="{ active: filters.logicalOperator === 'And' }">И</span>
                  <el-switch
                    v-model="filters.logicalOperator"
                    size="small"
                    active-value="Or"
                    inactive-value="And"
                  />
                  <span :class="{ active: filters.logicalOperator === 'Or' }">ИЛИ</span>
                </div>
              </el-tooltip>
            </legend>

            <template v-if="filters.logicalOperator === 'And'">
              <div class="participant-row">
                <label>Отправитель</label>
                <UserSelector
                  v-model:selected-user="sender"
                  place-holder="Выберите отправителя"
                />
              </div>

              <div class="participants-arrow">направление перевода</div>

              <div class="participant-row">
                <label>Получатель</label>
                <UserSelector
                  v-model:selected-user="receiver"
                  place-holder="Выберите получателя"
                />
              </div>
            </template>

            <div v-else class="participant-row">
              <label>Пользователь</label>
              <UserSelector
                v-model:selected-user="sender"
                place-holder="Выберите пользователя"
              />
            </div>
          </fieldset>
        </el-form>

        <div class="filter-actions">
          <el-button @click="resetFilters">Сбросить</el-button>
          <el-button type="primary" @click="reloadTransactions">Показать</el-button>
        </div>
      </aside>

      <main class="transactions-content">
        <div class="transactions-summary">
          <div>
            <span>Найдено</span>
            <strong>{{ transactions.length }}</strong>
          </div>
          <div>
            <span>Сумма</span>
            <strong>{{ formatTotalAmount }}</strong>
          </div>
          <div>
            <span>Период</span>
            <strong>{{ dateRange[0] }} - {{ dateRange[1] }}</strong>
          </div>
        </div>

        <el-table
          v-loading="isLoading"
          :data="transactions"
          class="transactions-table"
          row-key="id"
          @row-click="selectTransaction"
        >
          <el-table-column label="Дата" min-width="170">
            <template #default="{ row }">
              {{ formatLocalDateTime(row.transactionDate) }}
            </template>
          </el-table-column>

          <el-table-column label="Операция" min-width="160">
            <template #default="{ row }">
              <div class="operation-cell">
                <el-tag :type="transactionTypeTag(row.type)" effect="light">
                  {{ transactionTypeLabel(row.type) }}
                </el-tag>
                <el-tag
                  v-if="isPurchaseSource(row.sourceType) && !isReversedStatus(row.status)"
                  :type="transactionSourceTag(row.sourceType)"
                  effect="plain"
                  class="source-link"
                  @click.stop="openPurchaseByTransaction(row)"
                >
                  {{ transactionSourceLabel(row.sourceType) }}
                </el-tag>
                <el-tag
                  v-else
                  :type="transactionSourceTag(row.sourceType)"
                  effect="plain"
                  :class="{ 'source-disabled': isPurchaseSource(row.sourceType) && isReversedStatus(row.status) }"
                >
                  {{ transactionSourceLabel(row.sourceType) }}
                </el-tag>
                <el-tag v-if="isReversedStatus(row.status)" type="danger" effect="light">
                  Отменен
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Отправитель" min-width="190">
            <template #default="{ row }">
              <button
                v-if="partyUser(row.sender)"
                type="button"
                class="user-link"
                @click.stop="openUser(row.sender)"
              >
                {{ partyLabel(row.sender) }}
              </button>
              <span v-else>{{ partyLabel(row.sender) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Получатель" min-width="190">
            <template #default="{ row }">
              <button
                v-if="partyUser(row.receiver)"
                type="button"
                class="user-link"
                @click.stop="openUser(row.receiver)"
              >
                {{ partyLabel(row.receiver) }}
              </button>
              <span v-else>{{ partyLabel(row.receiver) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Сумма" min-width="150" align="right">
            <template #default="{ row }">
              <strong
                :class="{
                  'amount-muted': isReversedStatus(row.status),
                  'amount-negative': !isReversedStatus(row.status) && isNegativeTransaction(row),
                  'amount-positive': !isReversedStatus(row.status) && !isNegativeTransaction(row),
                }"
              >
                {{ formatMoney(row.amount, row.currencyId) }}
              </strong>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <el-button
            v-if="canLoadMore"
            plain
            :loading="isLoadingMore"
            @click="loadMoreTransactions"
          >
            Загрузить еще
          </el-button>
        </div>
      </main>
    </section>

    <el-drawer
      v-model="detailsOpen"
      direction="rtl"
      size="420px"
      :with-header="false"
      class="transaction-drawer"
    >
      <div v-if="selectedTransaction" class="transaction-details">
        <header>
          <div>
            <span>{{ transactionTypeLabel(selectedTransaction.type) }}</span>
            <h2>{{ formatMoney(selectedTransaction.amount, selectedTransaction.currencyId) }}</h2>
          </div>
          <el-button text @click="detailsOpen = false">Закрыть</el-button>
        </header>

        <dl>
          <div>
            <dt>Источник</dt>
            <dd class="source-details">
              <el-tag :type="transactionSourceTag(selectedTransaction.sourceType)" effect="plain">
                {{ transactionSourceLabel(selectedTransaction.sourceType) }}
              </el-tag>
              <el-button
                v-if="isPurchaseSource(selectedTransaction.sourceType)"
                size="small"
                type="primary"
                plain
                :loading="purchaseNavigationLoading"
                :disabled="isReversedStatus(selectedTransaction.status)"
                @click="openPurchaseByTransaction(selectedTransaction)"
              >
                Открыть закупку
              </el-button>
            </dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd class="status-list">
              <el-tag
                v-for="status in transactionStatusItems(selectedTransaction.status)"
                :key="status.raw"
                :type="status.type"
                effect="light"
              >
                {{ status.label }}
              </el-tag>
            </dd>
          </div>
          <div>
            <dt>Дата</dt>
            <dd>{{ formatLocalDateTime(selectedTransaction.transactionDate) }}</dd>
          </div>
          <div>
            <dt>Отправитель</dt>
            <dd>
              <button
                v-if="partyUser(selectedTransaction.sender)"
                type="button"
                class="user-link"
                @click="openUser(selectedTransaction.sender)"
              >
                {{ partyLabel(selectedTransaction.sender) }}
              </button>
              <span v-else>{{ partyLabel(selectedTransaction.sender) }}</span>
            </dd>
          </div>
          <div>
            <dt>Получатель</dt>
            <dd>
              <button
                v-if="partyUser(selectedTransaction.receiver)"
                type="button"
                class="user-link"
                @click="openUser(selectedTransaction.receiver)"
              >
                {{ partyLabel(selectedTransaction.receiver) }}
              </button>
              <span v-else>{{ partyLabel(selectedTransaction.receiver) }}</span>
            </dd>
          </div>
          <div>
            <dt>Валюта</dt>
            <dd>{{ currencyLabel(selectedTransaction.currencyId) }}</dd>
          </div>
        </dl>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import UserSelector from '@/components/selectors/UserSelector.vue'
import type { UserModel } from '@/models/userModel.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import {
  getBalanceTransactions,
  type BalanceTransactionModel,
  type TransactionLogicalOperator,
  type TransactionPartyModel,
  type TransactionSourceType,
  type TransactionStatus,
  type TransactionType,
} from '@/services/api/balances.ts'
import { getPurchaseByTransactionId } from '@/services/api/purchases.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'

const pageSize = 100
const router = useRouter()

const isLoading = ref(false)
const isLoadingMore = ref(false)
const purchaseNavigationLoading = ref(false)
const detailsOpen = ref(false)
const selectedTransaction = ref<BalanceTransactionModel | null>(null)
const transactions = ref<BalanceTransactionModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const sender = ref<UserModel | undefined>()
const receiver = ref<UserModel | undefined>()
const canLoadMore = ref(false)
const dateRange = ref<[string, string]>(defaultDateRange())

const filters = reactive({
  currencyId: null as number | null,
  logicalOperator: 'And' as TransactionLogicalOperator,
})

const formatTotalAmount = computed(() => {
  if (!filters.currencyId) return 'Выберите валюту'
  const total = transactions.value.reduce((sum, transaction) => sum + transaction.amount, 0)
  return formatMoney(total, filters.currencyId)
})
const logicalOperatorTooltip = computed(() => (
  filters.logicalOperator === 'And'
    ? 'И: точное направление. Будут найдены транзакции, где выбранный пользователь именно отправитель, а второй именно получатель.'
    : 'ИЛИ: участие в операции. Выберите одного пользователя, будут найдены транзакции, где он был отправителем или получателем.'
))
const hasSelectedUserFilter = computed(() => Boolean(sender.value || receiver.value))

const reloadTransactionsDebounced = useDebounceFn(async () => {
  if (!hasSelectedUserFilter.value) return
  await reloadTransactions()
}, 250)

onMounted(async () => {
  await loadCurrencies()
})

async function loadCurrencies() {
  try {
    const response = await getCurrencies({ page: 0, size: 100 })
    currencies.value = response.currencies
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить валюты')
  }
}

async function reloadTransactions() {
  if (!validateFilters()) return

  isLoading.value = true
  try {
    const response = await getBalanceTransactions({
      rangeStart: dateRange.value[0],
      rangeEnd: dateRange.value[1],
      currencyId: filters.currencyId,
      senderId: sender.value?.id,
      receiverId: filters.logicalOperator === 'And' ? receiver.value?.id : undefined,
      logicalOperator: filters.logicalOperator,
      size: pageSize,
    })

    transactions.value = response.transactions
    canLoadMore.value = response.transactions.length === pageSize
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить транзакции')
  } finally {
    isLoading.value = false
  }
}

async function loadMoreTransactions() {
  const cursor = transactions.value[transactions.value.length - 1]
  if (!cursor || !validateFilters()) return

  isLoadingMore.value = true
  try {
    const response = await getBalanceTransactions({
      rangeStart: dateRange.value[0],
      rangeEnd: dateRange.value[1],
      currencyId: filters.currencyId,
      senderId: sender.value?.id,
      receiverId: filters.logicalOperator === 'And' ? receiver.value?.id : undefined,
      logicalOperator: filters.logicalOperator,
      cursorId: cursor.id,
      cursorDate: cursor.transactionDate,
      size: pageSize,
    })

    const existingIds = new Set(transactions.value.map((transaction) => transaction.id))
    const newTransactions = response.transactions.filter((transaction) => !existingIds.has(transaction.id))
    transactions.value = [...transactions.value, ...newTransactions]
    canLoadMore.value = response.transactions.length === pageSize && newTransactions.length > 0
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить следующую страницу')
  } finally {
    isLoadingMore.value = false
  }
}

function validateFilters() {
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) {
    ElMessage.warning('Выберите период')
    return false
  }

  return true
}

function resetFilters() {
  dateRange.value = defaultDateRange()
  filters.currencyId = null
  filters.logicalOperator = 'And'
  sender.value = undefined
  receiver.value = undefined
  transactions.value = []
  canLoadMore.value = false
}

function selectTransaction(transaction: BalanceTransactionModel) {
  selectedTransaction.value = transaction
  detailsOpen.value = true
}

function partyLabel(party: TransactionPartyModel) {
  if (party.partyType === 'System' || party.partyType === 1) return 'Система'
  if (!party.user) return 'Пользователь'

  const name = [party.user.surname || party.user.userInfo?.surname, party.user.name || party.user.userInfo?.name]
    .filter(Boolean)
    .join(' ')

  return name || party.user.userName || 'Пользователь'
}

function partyUser(party: TransactionPartyModel) {
  if (party.partyType === 'System' || party.partyType === 1) return null
  return party.user
}

function openUser(party: TransactionPartyModel) {
  const user = partyUser(party)
  if (!user) return

  router.push({
    name: 'users',
    query: {
      userId: user.id,
    },
  })
}

function formatMoney(value: number, currencyId: number) {
  const currency = currencies.value.find((item) => item.id === currencyId)
  return `${formatNumber(value)} ${currency?.currencySign ?? currency?.shortName ?? ''}`.trim()
}

function currencyLabel(currencyId: number) {
  const currency = currencies.value.find((item) => item.id === currencyId)
  return currency ? `${currency.shortName} (${currency.code})` : `Валюта ${currencyId}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function transactionTypeLabel(type: TransactionType) {
  const labels: Record<string, string> = {
    Transfer: 'Перевод',
    Refund: 'Возврат',
    Fee: 'Комиссия',
    Adjustment: 'Корректировка',
    0: 'Перевод',
    1: 'Возврат',
    2: 'Комиссия',
    3: 'Корректировка',
  }

  return labels[String(type)] ?? String(type)
}

function transactionSourceLabel(sourceType: TransactionSourceType) {
  const labels: Record<string, string> = {
    Manual: 'Ручная',
    Purchase: 'Закупка',
    Sale: 'Продажа',
    Logistic: 'Логистика',
    0: 'Ручная',
    1: 'Закупка',
    2: 'Продажа',
    3: 'Логистика',
  }

  return labels[String(sourceType)] ?? String(sourceType)
}

function transactionSourceTag(sourceType: TransactionSourceType) {
  if (sourceType === 'Purchase' || sourceType === 1) return 'success'
  if (sourceType === 'Sale' || sourceType === 2) return 'warning'
  if (sourceType === 'Logistic' || sourceType === 3) return 'info'
  return ''
}

function isPurchaseSource(sourceType: TransactionSourceType) {
  return sourceType === 'Purchase' || sourceType === 1
}

async function openPurchaseByTransaction(transaction: BalanceTransactionModel) {
  if (!isPurchaseSource(transaction.sourceType) || isReversedStatus(transaction.status) || purchaseNavigationLoading.value) return

  purchaseNavigationLoading.value = true
  try {
    const response = await getPurchaseByTransactionId(transaction.id)
    detailsOpen.value = false
    await router.push({
      name: 'purchases',
      query: {
        purchaseId: response.purchase.id,
      },
    })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось открыть закупку по транзакции')
  } finally {
    purchaseNavigationLoading.value = false
  }
}

function transactionStatusItems(status: TransactionStatus) {
  const values = transactionStatusValues(status)
  if (values.length === 0) values.push(String(status))

  return values.map((value) => ({
    raw: value,
    label: transactionStatusLabelByValue(value),
    type: transactionStatusTagType(value),
  }))
}

function transactionStatusValues(status: TransactionStatus) {
  if (typeof status === 'string') {
    return status.split(',').map((item) => item.trim()).filter(Boolean)
  }

  const numericStatus = Number(status)
  if (!Number.isFinite(numericStatus)) return [String(status)]
  if (numericStatus === 0) return ['Pending']

  const values: string[] = []
  if ((numericStatus & 1) === 1) values.push('Completed')
  if ((numericStatus & 2) === 2) values.push('CompletionApplied')
  if ((numericStatus & 4) === 4) values.push('Reversed')
  if ((numericStatus & 8) === 8) values.push('ReversedApplied')
  return values
}

function transactionStatusLabelByValue(status: string) {
  const value = String(status)
  const labels: Record<string, string> = {
    Pending: 'Ожидает',
    Completed: 'Завершена',
    CompletionApplied: 'Проведена',
    Reversed: 'Отменена',
    ReversedApplied: 'Отмена проведена',
    0: 'Ожидает',
    1: 'Завершена',
    2: 'Проведена',
    4: 'Отменена',
    8: 'Отмена проведена',
  }

  return labels[value] ?? value
}

function transactionStatusTagType(status: string) {
  if (status === 'Reversed' || status === 'ReversedApplied' || status === '4' || status === '8') return 'danger'
  if (status === 'Pending' || status === '0') return 'warning'
  if (status === 'CompletionApplied' || status === '2') return 'success'
  return 'info'
}

function isReversedStatus(status: TransactionStatus) {
  return transactionStatusValues(status).some((value) => (
    value === 'Reversed'
    || value === 'ReversedApplied'
    || value === '4'
    || value === '8'
  ))
}

function transactionTypeTag(type: TransactionType) {
  if (type === 'Refund' || type === 1) return 'warning'
  if (type === 'Fee' || type === 2) return 'danger'
  if (type === 'Adjustment' || type === 3) return 'info'
  return 'success'
}

function isNegativeTransaction(transaction: BalanceTransactionModel) {
  return transaction.type === 'Fee' || transaction.type === 2
}

function defaultDateRange(): [string, string] {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return [formatDateInput(start), formatDateInput(end)]
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
    dateRange.value[0],
    dateRange.value[1],
    filters.currencyId,
    filters.logicalOperator,
    sender.value?.id,
    receiver.value?.id,
  ],
  async () => {
    if (!hasSelectedUserFilter.value) {
      transactions.value = []
      canLoadMore.value = false
      return
    }

    await reloadTransactionsDebounced()
  },
)
</script>

<style scoped>
.transactions-page {
  min-height: 100%;
  background: #f5f7fb;
  padding: 24px;
}

.transactions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.transactions-header h1 {
  margin: 0;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}

.transactions-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.transactions-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}

.transactions-filters,
.transactions-content {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.transactions-filters {
  align-self: start;
  padding: 16px;
}

.filter-title {
  margin-bottom: 16px;
  color: #111827;
  font-size: 16px;
  font-weight: 650;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #e2e8f0;
  padding-top: 14px;
}

.participants-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  margin: 4px 0 18px;
  padding: 16px 12px 12px;
}

.participants-filter legend {
  margin-left: 10px;
  padding: 0 6px;
}

.participant-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participant-row label {
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.participants-arrow {
  align-self: center;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  line-height: 1;
  padding: 5px 9px;
}

.logical-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 8%);
  cursor: help;
  padding: 4px 8px;
}

.logical-switch span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.logical-switch span.active {
  color: #111827;
}

:deep(.participant-row .el-select) {
  width: 100%;
}

.transactions-content {
  min-width: 0;
  padding: 16px;
}

.transactions-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.transactions-summary div {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.transactions-summary span {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 12px;
}

.transactions-summary strong {
  color: #111827;
  font-size: 16px;
}

.transactions-table {
  width: 100%;
}

.operation-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operation-cell span {
  color: #64748b;
  font-size: 13px;
}

.source-link {
  cursor: pointer;
}

.source-link:hover {
  filter: brightness(.96);
}

.source-disabled {
  opacity: .65;
  text-decoration: line-through;
}

.user-link {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0;
  text-align: left;
}

.user-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.amount-positive {
  color: #047857;
}

.amount-negative {
  color: #b91c1c;
}

.amount-muted {
  color: #94a3b8;
  text-decoration: line-through;
}

.table-footer {
  display: flex;
  justify-content: flex-start;
  padding-top: 14px;
}

.transaction-details {
  min-height: 100%;
  background: #fff;
}

.transaction-details header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e2e8f0;
  padding: 22px 24px 18px;
}

.transaction-details header span {
  color: #2563eb;
  font-size: 13px;
  font-weight: 650;
}

.transaction-details h2 {
  margin: 5px 0 0;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
}

.transaction-details dl {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 20px 24px;
}

.transaction-details dl div {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}

.transaction-details dt {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 12px;
}

.transaction-details dd {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.status-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.source-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

:deep(.transaction-drawer .el-drawer__body) {
  padding: 0;
}

:deep(.transactions-filters .el-form-item) {
  margin-bottom: 16px;
}

:deep(.transactions-filters .el-date-editor.el-input__wrapper) {
  width: 100%;
}

@media (max-width: 980px) {
  .transactions-page {
    padding: 16px;
  }

  .transactions-layout {
    grid-template-columns: 1fr;
  }

  .transactions-summary {
    grid-template-columns: 1fr;
  }
}
</style>
