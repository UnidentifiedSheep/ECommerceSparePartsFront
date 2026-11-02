import type { BalanceTransactionModel } from '@/services/api/balances'

// Main applies +Amount to the sender's balance and -Amount to the receiver's.
// This is the organization's account balance, rather than a bank cash-flow sign.
export function organizationTransactionAmount(row: Pick<BalanceTransactionModel, 'sender' | 'receiver' | 'amount'>, organizationId: string): number {
  if (row.sender.id === row.receiver.id) return 0
  if (row.sender.id === organizationId) return row.amount
  if (row.receiver.id === organizationId) return -row.amount
  return 0
}
