<template>
  <el-drawer v-model="isOpen" append-to-body direction="rtl" size="min(400px, 100vw)" :with-header="false" class="transaction-drawer" @opened="focusDetails">
      <div v-if="selectedTransaction" ref="transactionDetailsRef" class="transaction-details" tabindex="0" @keydown="emit('navigate', $event)">
        <header class="drawer-heading"><h2>{{ t('transactions.detailsTitle') }}</h2><el-button :icon="Close" circle text :aria-label="t('transactions.close')" @click="isOpen = false" /></header>
        <section class="transaction-hero">
          <el-icon class="transfer-icon"><Switch /></el-icon>
          <strong class="hero-amount" :class="amountClass(selectedTransaction)">{{ rowMoney(selectedTransaction) }}</strong>
          <el-tag :type="primaryStatus(selectedTransaction).type" effect="light" round>{{ primaryStatus(selectedTransaction).label }}</el-tag>
          <time :datetime="selectedTransaction.transactionDate">{{ formatTransactionDate(selectedTransaction.transactionDate) }}</time>
          <small v-if="flowOrganization">{{ t('transactions.relativeTo', { name: flowOrganization.name }) }}</small>
        </section>
        <section class="transfer-participants" :aria-label="t('transactions.transferParties')">
          <div class="transfer-party"><el-icon><OfficeBuilding /></el-icon><div><span>{{ t('transactions.sender') }}</span><OrganizationPartyHoverCard :organization="selectedTransaction.sender" placement="bottom-start" /></div></div>
          <el-icon class="transfer-direction"><ArrowDown /></el-icon>
          <div class="transfer-party"><el-icon><OfficeBuilding /></el-icon><div><span>{{ t('transactions.receiver') }}</span><OrganizationPartyHoverCard :organization="selectedTransaction.receiver" placement="bottom-start" /></div></div>
        </section>
        <dl class="transaction-facts">
          <div><dt>{{ t('transactions.source') }}</dt><dd><el-tag :type="transactionSourceTag(selectedTransaction.sourceType)" effect="plain">{{ transactionSourceLabel(selectedTransaction.sourceType) }}</el-tag></dd></div>
          <div><dt>{{ t('common.labels.currency') }}</dt><dd>{{ currencyLabel(selectedTransaction.currencyId) }}</dd></div>
          <div><dt>{{ t('common.labels.type') }}</dt><dd>{{ transactionTypeLabel(selectedTransaction.type) }}</dd></div>
        </dl>
        <div v-if="canNavigateDocument(selectedTransaction)" class="drawer-document"><el-button type="primary" plain :loading="navigationLoading" :disabled="isReversedStatus(selectedTransaction.status)" @click="emit('open-document', selectedTransaction)">{{ t(isSaleSource(selectedTransaction.sourceType) ? 'transactions.openSale' : 'transactions.openPurchase') }}</el-button></div>
        <footer v-if="canDeleteTransactions && transactionCanReverse(selectedTransaction)" class="drawer-cancel"><el-button type="danger" color="#b91c1c" plain :icon="CircleClose" :loading="cancellingTransactionId === selectedTransaction.id" :disabled="Boolean(cancellingTransactionId)" @click="confirmCancelTransaction(selectedTransaction)">{{ t('transactions.cancelTransaction') }}</el-button></footer>
      </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed, h, onScopeDispose, ref } from 'vue'
import { ElIcon, ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowRight, Close, OfficeBuilding, Switch, CircleClose } from '@element-plus/icons-vue'
import OrganizationPartyHoverCard from '@/components/organizations/OrganizationPartyHoverCard.vue'
import type { CurrencyModel } from '@/models/currencyModel'
import type { OrganizationModel } from '@/models/organizationModel'
import { deleteBalanceTransaction, type BalanceTransactionModel } from '@/services/api/balances'
import { transactionCanReverse } from '@/utils/transactionJournal'
import { useTransactionPresentation } from '@/composables/useTransactionPresentation'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'

const props = withDefaults(defineProps<{
  transaction?: BalanceTransactionModel | null
  currencies: CurrencyModel[]
  organization?: Pick<OrganizationModel, 'id' | 'name'>
  convention?: 'flow' | 'account'
  navigationLoading?: boolean
}>(), { convention: 'flow' })
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  navigate: [event: KeyboardEvent]
  'open-document': [transaction: BalanceTransactionModel]
  reversed: [id: string]
}>()
const selectedTransaction = computed(() => props.transaction)
const transactionDetailsRef = ref<HTMLElement>()
const cancellingTransactionId = ref<string>()
const { t } = useI18n()
const { hasPermission } = usePermissions()
const canDeleteTransactions = computed(() => hasPermission('BALANCES_TRANSACTION_DELETE'))
const flowOrganization = computed(() => props.organization)
const { rowMoney, amountClass, primaryStatus, formatTransactionDate, transactionSourceTag, transactionSourceLabel, currencyLabel, transactionTypeLabel, isSaleSource, isPurchaseSource, isReversedStatus, partyName, formatMoney } =
  useTransactionPresentation(() => props.currencies, () => props.organization, props.convention)
let disposed = false
onScopeDispose(() => { disposed = true })

function focusDetails() { transactionDetailsRef.value?.focus({ preventScroll: true }) }
function canNavigateDocument(row: BalanceTransactionModel) {
  return isSaleSource(row.sourceType) && hasPermission('SALES_GET') || isPurchaseSource(row.sourceType) && hasPermission('PURCHASE_GET')
}
async function confirmCancelTransaction(transaction: BalanceTransactionModel) {
  if (!canDeleteTransactions.value || !transactionCanReverse(transaction) || cancellingTransactionId.value) return
  const context = props.organization?.id
  cancellingTransactionId.value = transaction.id
  try {
    try {
      await ElMessageBox.confirm(
        h('div', [
          h('p', t('transactions.reversalExplanation')),
          h('p', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } }, [
            h('strong', partyName(transaction.receiver)),
            h(ElIcon, null, { default: () => h(ArrowRight) }),
            h('strong', partyName(transaction.sender)),
          ]),
          h('p', [h('strong', formatMoney(transaction.amount, transaction.currencyId))]),
          h('p', t('transactions.reversalStatusHint')),
        ]),
        t('transactions.cancelTitle'),
        { confirmButtonText: t('transactions.cancelTransaction'), cancelButtonText: t('transactions.close'), type: 'warning', closeOnClickModal: false, autofocus: false, confirmButtonClass: 'transaction-reversal-confirm' },
      )
    } catch { return }
    if (disposed || !isOpen.value || context !== props.organization?.id || props.transaction?.id !== transaction.id
      || !canDeleteTransactions.value || !transactionCanReverse(props.transaction)) return
    await deleteBalanceTransaction(transaction.id)
    if (disposed || context !== props.organization?.id) return
    ElMessage.success(t('transactions.cancelled'))
    if (props.transaction?.id === transaction.id) isOpen.value = false
    emit('reversed', transaction.id)
  } catch (error) {
    if (!disposed && context === props.organization?.id) ElMessage.error(error instanceof Error ? error.message : t('transactions.cancelError'))
  } finally { cancellingTransactionId.value = undefined }
}
</script>

<style scoped>
.transaction-details { min-height: 100%; background: var(--app-surface); color: var(--app-text); padding: 20px; }
.drawer-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.drawer-heading h2 { margin: 0; font-size: 17px; font-weight: 650; }
.transaction-hero { display: grid; justify-items: center; gap: 10px; padding: 28px 0 24px; text-align: center; }
.transfer-icon { font-size: 22px; color: var(--app-text-muted); }
.hero-amount { font-size: 30px; line-height: 1.25; font-weight: 700; max-width: 100%; white-space: normal; overflow-wrap: anywhere; }
.transaction-hero time, .transaction-hero small { color: var(--app-text-muted); font-size: 12px; }
.transaction-details :deep(.el-tag--success) { color: #15803d; --el-tag-text-color: #15803d; }
.transaction-details :deep(.el-tag--warning) { color: #854d0e; --el-tag-text-color: #854d0e; }
.transaction-details :deep(.el-tag--danger) { color: #b91c1c; --el-tag-text-color: #b91c1c; }
.transfer-participants { display: grid; gap: 12px; padding: 22px 0; border-block: 1px solid var(--app-border); }
.transfer-party { display: flex; align-items: center; gap: 12px; min-width: 0; }
.transfer-party > .el-icon { color: var(--app-text-muted); font-size: 18px; }
.transfer-party > div { display: grid; gap: 4px; min-width: 0; }
.transfer-party span { color: var(--app-text-muted); font-size: 12px; }
.transfer-direction { margin-left: 2px; color: var(--app-text-muted); }
.transaction-facts { display: grid; gap: 14px; margin: 0; padding: 22px 0; }
.transaction-facts > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.transaction-facts dt { flex: none; color: var(--app-text-muted); font-size: 13px; }
.transaction-facts dd { margin: 0; text-align: right; font-size: 13px; font-weight: 500; }
.drawer-document { padding-bottom: 18px; }
.drawer-document .el-button { width: 100%; }
.drawer-cancel { border-top: 1px solid var(--app-border); padding-top: 20px; }
.drawer-cancel .el-button { width: 100%; color: #b91c1c; }
.drawer-cancel .el-button:hover { color: #fff; background: #b91c1c; border-color: #b91c1c; }
.drawer-cancel :deep(.el-button) { --el-button-text-color: #b91c1c; --el-button-hover-text-color: #fff; --el-button-hover-bg-color: #b91c1c; --el-button-hover-border-color: #b91c1c; }
:global(.transaction-reversal-confirm.el-button) { --el-button-bg-color: #b91c1c; --el-button-border-color: #b91c1c; --el-button-hover-bg-color: #991b1b; --el-button-hover-border-color: #991b1b; --el-button-active-bg-color: #7f1d1d; --el-button-text-color: #fff; }
:global(.transaction-drawer .el-drawer__body) { padding: 0; }
.amount-positive { color: #15803d; }
.amount-negative { color: #b91c1c; }
.amount-muted { color: var(--app-text-muted); text-decoration: line-through; }
@media (max-width: 640px) { .transaction-details { padding: 16px; } }
</style>
