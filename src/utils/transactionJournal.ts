import type { BalanceTransactionModel } from '@/services/api/balances'

// Journal signs describe transfer direction. Organization account-balance signs
// use a different backend convention; see organizationTransactionAmount.ts.
export function transactionFlowAmount(row: BalanceTransactionModel, organizationId?: string): number {
  if (!organizationId) return row.amount
  if (row.sender.id === row.receiver.id) return 0
  if (row.sender.id === organizationId) return -row.amount
  if (row.receiver.id === organizationId) return row.amount
  return 0
}

export function transactionIsReversed(row: BalanceTransactionModel): boolean {
  return typeof row.status === 'number' ? (row.status & 4) !== 0 : row.status.includes('Reversed')
}

export function transactionIsCompleted(row: BalanceTransactionModel): boolean {
  return typeof row.status === 'number' ? (row.status & 1) !== 0 : row.status.split(',').some(status => status.trim() === 'Completed')
}

export function transactionCanReverse(row: BalanceTransactionModel): boolean {
  return (row.sourceType === 'Manual' || row.sourceType === 0) && transactionIsCompleted(row) && !transactionIsReversed(row)
}

