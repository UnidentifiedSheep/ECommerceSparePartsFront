import { describe, expect, it } from 'vitest'
import { organizationTransactionAmount } from './organizationTransactionAmount'

const organization = { id: 'organization' } as never
const system = { id: 'system' } as never
describe('organization account movement', () => {
  it('shows a deposit into the system as an increase of the paying organization balance', () => {
    expect(organizationTransactionAmount({ sender: organization, receiver: system, amount: 4000 }, 'organization')).toBe(4000)
  })
  it('shows a payment from the system as a decrease of the recipient organization balance', () => {
    expect(organizationTransactionAmount({ sender: system, receiver: organization, amount: 250 }, 'organization')).toBe(-250)
  })
  it('uses the selected account for transfers between organizations and avoids inventing movement for unrelated or self transfers', () => {
    const row = { sender: organization, receiver: system, amount: 90 }
    expect(organizationTransactionAmount(row, 'system')).toBe(-90)
    expect(organizationTransactionAmount(row, 'other')).toBe(0)
    expect(organizationTransactionAmount({ ...row, receiver: organization }, 'organization')).toBe(0)
  })
})
