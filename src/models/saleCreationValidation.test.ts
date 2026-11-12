import { describe, expect, it } from 'vitest'
import { saleCreationIssue, type SaleCreationValidationInput } from './saleCreationValidation'

const valid = (): SaleCreationValidationInput => ({
  buyerSelected: true, buyerMemberSelected: true, currencyId: 1, storageCode: 'MAIN', date: '2026-11-12T11:00:00.000',
  stockLoading: false, stockLoadFailed: false, importing: false,
  items: [{ productId: 42, count: 1, available: 10, price: 1000 }],
})

describe('sale creation blockers', () => {
  it('accepts a complete sale with the regular price or a valid manual discount', () => {
    const input = valid()
    expect(saleCreationIssue(input)).toBeUndefined()
    input.items[0]!.discountedPrice = 800
    expect(saleCreationIssue(input)).toBeUndefined()
  })

  it('rejects a selected organization without a buyer member before save can silently return', () => {
    expect(saleCreationIssue({ ...valid(), buyerMemberSelected: false })).toEqual({ code: 'buyerMember' })
  })

  it.each([null, '', 'invalid-date'])('rejects a cleared or invalid date %s', date => {
    expect(saleCreationIssue({ ...valid(), date })).toEqual({ code: 'date' })
  })

  it('distinguishes a stock request, a failed request and verified insufficient stock', () => {
    const input = valid()
    input.items[0]!.available = 0
    expect(saleCreationIssue({ ...input, stockLoading: true })).toEqual({ code: 'stockLoading' })
    expect(saleCreationIssue({ ...input, stockLoadFailed: true })).toEqual({ code: 'stockLoadFailed' })
    expect(saleCreationIssue(input)).toEqual({ code: 'stock', position: 1 })
  })

  it.each([0, -1, undefined, Number.NaN])('identifies an invalid regular price %s', price => {
    const input = valid(); input.items[0]!.price = price
    expect(saleCreationIssue(input)).toEqual({ code: 'price', position: 1 })
  })

  it.each([0, -1, 1200, Number.NaN])('identifies an invalid final price %s', discountedPrice => {
    const input = valid(); input.items[0]!.discountedPrice = discountedPrice
    expect(saleCreationIssue(input)).toEqual({ code: 'discount', position: 1 })
  })

  it('points to a cleared second quantity rather than its effect on another row stock calculation', () => {
    const input = valid()
    input.items[0]!.available = Number.NaN
    input.items.push({ productId: 42, count: undefined, available: 9, price: 1000 })
    expect(saleCreationIssue(input)).toEqual({ code: 'count', position: 2 })
  })

  it('reports duplicate-product shortages and resolves the blocker after fixing their combined quantity', () => {
    const input = valid()
    input.items = [{ productId: 42, count: 6, available: 4, price: 100 }, { productId: 42, count: 6, available: 4, price: 100 }]
    expect(saleCreationIssue(input)).toEqual({ code: 'stock', position: 1 })
    input.items[1]!.count = 4; input.items[0]!.available = 6
    expect(saleCreationIssue(input)).toBeUndefined()
  })
})
