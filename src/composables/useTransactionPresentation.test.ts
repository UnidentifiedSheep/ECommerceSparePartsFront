import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CurrencyModel } from '@/models/currencyModel'
import type { BalanceTransactionModel } from '@/services/api/balances'
import { useTransactionPresentation } from './useTransactionPresentation'

vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: ref('en'), t: (key: string) => key }) }))
const row = { amount: 100, currencyId: 1, sender: { id: 'sender', name: 'Sender' }, receiver: { id: 'receiver', name: 'Receiver' }, status: 1 } as BalanceTransactionModel
const currencies = () => [{ id: 1, name: 'Ruble', code: 'RUB', shortName: 'RUB', currencySign: '₽' }] as CurrencyModel[]

describe('shared transaction presentation', () => {
  it('keeps account-balance signs on organization finances and cash-flow signs in the journal', () => {
    const account = useTransactionPresentation(currencies, () => row.sender, 'account')
    const journal = useTransactionPresentation(currencies, () => row.sender)
    const general = useTransactionPresentation(currencies, () => undefined)
    expect(account.rowMoney(row)).toBe('+100 ₽')
    expect(journal.rowMoney(row)).toBe('−100 ₽')
    expect(general.rowMoney(row)).toBe('100 ₽')
    expect(general.amountClass(row)).toBe('')
    expect(account.amountClass(row)).toBe('amount-positive')
  })
  it('updates context and marks reversed transactions consistently', () => {
    let organization = row.sender
    const account = useTransactionPresentation(currencies, () => organization, 'account')
    organization = row.receiver
    expect(account.rowMoney(row)).toBe('−100 ₽')
    expect(account.amountClass({ ...row, status: 5 })).toBe('amount-muted')
    expect(account.primaryStatus({ ...row, status: 5 }).type).toBe('danger')
    expect(account.currencyLabel(1)).toBe('Ruble (RUB)')
  })
})
