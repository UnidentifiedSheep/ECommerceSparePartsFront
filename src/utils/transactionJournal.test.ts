import { describe, expect, it } from 'vitest'
import type { BalanceTransactionModel } from '@/services/api/balances'
import { transactionFlowAmount, transactionIsCompleted, transactionIsReversed, transactionCanReverse } from './transactionJournal'

const transfer = (overrides: Partial<BalanceTransactionModel> = {}): BalanceTransactionModel => ({
  id: 'transfer', sender: { id: 'sender' } as BalanceTransactionModel['sender'],
  receiver: { id: 'receiver' } as BalanceTransactionModel['receiver'],
  amount: 100, currencyId: 1, transactionDate: '2026-11-02T00:00:00Z',
  status: 1, sourceType: 'Manual', type: 'Transfer', ...overrides,
})

describe('transaction journal cash flow', () => {
  it('only allows reversing completed manual transactions, including legacy numeric sources', () => {
    expect(transactionCanReverse(transfer())).toBe(true)
    expect(transactionCanReverse(transfer({ sourceType: 0, status: 'Completed' }))).toBe(true)
    for (const sourceType of ['Sale', 'Purchase', 'Logistic', 1, 2, 3] as const) expect(transactionCanReverse(transfer({ sourceType }))).toBe(false)
    for (const status of [0, 4, 5, 'Pending', 'Completed, Reversed', 'CompletionApplied'] as const) expect(transactionCanReverse(transfer({ status }))).toBe(false)
  })
  it('keeps the general journal neutral and shows outflow for the sender and inflow for the receiver', () => {
    const row = transfer()
    expect(transactionFlowAmount(row)).toBe(100)
    expect(transactionFlowAmount(row, 'sender')).toBe(-100)
    expect(transactionFlowAmount(row, 'receiver')).toBe(100)
    expect(transactionFlowAmount(row, 'other')).toBe(0)
    expect(transactionFlowAmount(transfer({ receiver: row.sender }), 'sender')).toBe(0)
  })
  it('distinguishes completed, pending and reversed status for safe reversal eligibility', () => {
    expect(transactionIsCompleted(transfer())).toBe(true)
    expect(transactionIsCompleted(transfer({ status: 0 }))).toBe(false)
    expect(transactionIsReversed(transfer())).toBe(false)
    expect(transactionIsReversed(transfer({ status: 5 }))).toBe(true)
    expect(transactionIsCompleted(transfer({ status: 'Completed' }))).toBe(true)
    expect(transactionIsReversed(transfer({ status: 'Completed, Reversed' }))).toBe(true)
  })
})
