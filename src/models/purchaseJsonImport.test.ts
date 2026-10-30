import { describe, expect, it } from 'vitest'
import { parsePurchaseImport, purchaseCurrencyMatches } from './purchaseJsonImport'
import { parseProductImport } from './productGroupImport'

const row = { producer: 'ZEKKERT', sku: 'SR1035', name: 'Bearing\\', count: 1, price: 651 }
const payload = (products: unknown[] = [row]) => ({ type: 'purchase', supplier: 'Armtek', currency: 'RUB', products })
describe('purchase JSON', () => {
  it('preserves invoice positions and prices, including repeated products and zero-priced items', () => {
    const result = parsePurchaseImport(JSON.stringify(payload([row, { ...row, count: '2', price: '12,50' }, { ...row, sku: 'GIFT', price: 0 }])))
    expect(result.group.supplier).toBe('Armtek')
    expect(result.group.rows.map(row => [row.sku, row.count, row.price])).toEqual([['SR1035', 1, 651], ['SR1035', 2, 12.5], ['GIFT', 1, 0]])
    expect(result.group.rows[0]!.name).toBe('Bearing\\')
  })
  it('preserves partial/unknown currency and return information without changing invoice quantities', () => {
    const result = parsePurchaseImport(JSON.stringify({ ...payload([{ ...row, count: 3, returnedCount: 1 }]), currency: null, partial: true }))
    expect(result).toMatchObject({ currency: null, partial: true })
    expect(result.group.rows[0]).toMatchObject({ count: 3, returnedCount: 1 })
  })
  it('rejects purchase documents and unwrapped document positions in the cross-group importer', () => {
    for (const input of [payload(), [payload()], [row], { products: [row] }]) expect(() => parseProductImport(JSON.stringify(input))).toThrowError(expect.objectContaining({ code: 'document' }))
  })
  it.each([null, [], { products: [row] }, { ...payload(), supplier: 'Other' }, { ...payload(), partial: 'false' }, payload([])])('requires an explicit purchase document and supported supplier', value => {
    expect(() => parsePurchaseImport(JSON.stringify(value))).toThrow()
  })
  it('validates money, references, quantities and limits before any API access', () => {
    for (const invalid of [{ ...row, count: 0 }, { ...row, count: 1.5 }, { ...row, price: -1 }, { ...row, price: '1.001' }, { ...row, returnedCount: 2 }, { ...row, sku: '---' }, { ...row, producer: '' }]) expect(() => parsePurchaseImport(JSON.stringify(payload([invalid])))).toThrow()
    expect(() => parsePurchaseImport(JSON.stringify(payload(Array.from({ length: 1001 }, () => row))))).toThrowError(expect.objectContaining({ code: 'limit' }))
  })
  it('compares ISO/numeric currency codes and does not confuse currencies sharing a symbol', () => {
    const rub = { id: 1, code: '643', shortName: 'RUB', currencySign: '₽', name: 'Ruble' }
    expect(purchaseCurrencyMatches('RUB', rub)).toBe(true)
    expect(purchaseCurrencyMatches('USD', rub)).toBe(false)
    expect(purchaseCurrencyMatches('USD', { ...rub, code: 'CAD', shortName: 'CAD', currencySign: '$' })).toBe(false)
    expect(purchaseCurrencyMatches(null, rub)).toBe(true)
  })
})
