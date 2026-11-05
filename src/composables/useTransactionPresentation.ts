import type { CurrencyModel } from '@/models/currencyModel'
import type { OrganizationModel } from '@/models/organizationModel'
import type { BalanceTransactionModel, TransactionSourceType, TransactionStatus, TransactionType } from '@/services/api/balances'
import { transactionFlowAmount, transactionIsCompleted, transactionIsReversed } from '@/utils/transactionJournal'
import { organizationTransactionAmount } from '@/utils/organizationTransactionAmount'
import { useI18n } from '@/i18n'

export function useTransactionPresentation(
  getCurrencies: () => CurrencyModel[],
  getOrganization: () => Pick<OrganizationModel, 'id' | 'name'> | undefined,
  convention: 'flow' | 'account' = 'flow',
) {
  const { t, locale } = useI18n()
  function relativeAmount(row: BalanceTransactionModel) {
    const organization = getOrganization()
    return convention === 'account' && organization
      ? organizationTransactionAmount(row, organization.id)
      : transactionFlowAmount(row, organization?.id)
  }

  function formatMoney(value: number, currencyId: number) {
    const currency = getCurrencies().find((item) => item.id === currencyId)
    return `${formatNumber(value)} ${currency?.currencySign ?? currency?.shortName ?? t('transactions.unknownCurrency', { id: currencyId })}`.trim()
  }

  function currencyLabel(currencyId: number) {
    const currency = getCurrencies().find((item) => item.id === currencyId)
    return currency ? `${currency.name} (${currency.code})` : t('transactions.unknownCurrency', { id: currencyId })
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat(locale.value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  function transactionTypeLabel(type: TransactionType) {
    const labels: Record<string, string> = {
      Transfer: t('transactions.types.Transfer'),
      Refund: t('transactions.types.Refund'),
      Fee: t('transactions.types.Fee'),
      Adjustment: t('transactions.types.Adjustment'),
      0: t('transactions.types.Transfer'),
      1: t('transactions.types.Refund'),
      2: t('transactions.types.Fee'),
      3: t('transactions.types.Adjustment'),
    }

    return labels[String(type)] ?? String(type)
  }

  function transactionSourceLabel(sourceType: TransactionSourceType) {
    const labels: Record<string, string> = {
      Manual: t('transactions.sources.Manual'),
      Purchase: t('transactions.sources.Purchase'),
      Sale: t('transactions.sources.Sale'),
      Logistic: t('transactions.sources.Logistic'),
      0: t('transactions.sources.Manual'),
      1: t('transactions.sources.Purchase'),
      2: t('transactions.sources.Sale'),
      3: t('transactions.sources.Logistic'),
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

  function isSaleSource(sourceType: TransactionSourceType) {
    return sourceType === 'Sale' || sourceType === 2
  }

  function isNavigableSource(sourceType: TransactionSourceType) {
    return isPurchaseSource(sourceType) || isSaleSource(sourceType)
  }

  function isReversedStatus(status: TransactionStatus) {
    return typeof status === 'number' ? (status & 4) !== 0 : status.includes('Reversed')
  }

  function primaryStatus(row: BalanceTransactionModel) {
    if (transactionIsReversed(row)) return { label: t('transactions.statuses.Reversed'), type: 'danger' as const }
    return transactionIsCompleted(row)
      ? { label: t('transactions.statuses.Completed'), type: 'success' as const }
      : { label: t('transactions.statuses.Pending'), type: 'warning' as const }
  }

  function formatTransactionDate(value: string) { return new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }

  function partyName(party: BalanceTransactionModel['sender']) { return party.type === 'System' ? t('transactions.system') : party.name }

  function signedMoney(amount: number, currencyId: number) { return `${amount > 0 ? '+' : amount < 0 ? '−' : ''}${formatMoney(Math.abs(amount), currencyId)}` }

  function rowMoney(row: BalanceTransactionModel) { return getOrganization() ? signedMoney(relativeAmount(row), row.currencyId) : formatMoney(row.amount, row.currencyId) }

  function amountClass(row: BalanceTransactionModel) {
    if (transactionIsReversed(row)) return 'amount-muted'
    if (!getOrganization()) return ''
    const amount = relativeAmount(row)
    return amount > 0 ? 'amount-positive' : amount < 0 ? 'amount-negative' : ''
  }

  return { formatMoney, currencyLabel, formatNumber, transactionTypeLabel, transactionSourceLabel, transactionSourceTag, isPurchaseSource, isSaleSource, isNavigableSource, isReversedStatus, primaryStatus, formatTransactionDate, partyName, signedMoney, rowMoney, amountClass }
}
