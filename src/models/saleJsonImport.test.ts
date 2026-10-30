import { describe, expect, it } from 'vitest'
import { parseSaleImport, SaleImportIssue, saleImportLimits } from './saleJsonImport'

const row = { count: '1', price: '5012,53', producer: 'Dayco', uniValue: '9PK4145HD' }
describe('legacy sale JSON', () => {
  it('parses legacy counts and comma prices without merging positions or prices', () => {
    expect(parseSaleImport(JSON.stringify([row, { count: '2', price: '3814,17', producer: 'Auger', uniValue: '15277' }, { ...row, price: '5.10' }]))).toEqual([
      { count: 1, price: 5012.53, producer: 'Dayco', sku: '9PK4145HD' },
      { count: 2, price: 3814.17, producer: 'Auger', sku: '15277' },
      { count: 1, price: 5.1, producer: 'Dayco', sku: '9PK4145HD' },
    ])
    expect(parseSaleImport(JSON.stringify([{ ...row, count: 2, price: 0.29 }]))[0]).toMatchObject({ count: 2, price: 0.29 })
  })
  it.each(['{', 'null', '{}', '[]'])('rejects malformed or non-array payloads %s', value => {
    expect(() => parseSaleImport(value)).toThrow(SaleImportIssue)
  })
  it.each(['0', '-1', '1.5', '', '1e2', '2147483648', null, true])('rejects invalid quantities %s with a row number', count => {
    expect(() => parseSaleImport(JSON.stringify([row, { ...row, count }]))).toThrowError(expect.objectContaining({ code: 'count', row: 2 }))
  })
  it.each(['0', '-2', 'NaN', '1,234.50', '1.001', '', null, true, '99999999999999999'])('rejects invalid prices %s', price => {
    expect(() => parseSaleImport(JSON.stringify([{ ...row, price }]))).toThrowError(expect.objectContaining({ code: 'price' }))
  })
  it('validates references and limits before API access', () => {
    for (const value of [{ ...row, uniValue: 123 }, { ...row, uniValue: '---' }, { ...row, producer: '' }, null]) {
      expect(() => parseSaleImport(JSON.stringify([value]))).toThrowError(expect.objectContaining({ code: 'reference' }))
    }
    expect(() => parseSaleImport(JSON.stringify(Array.from({ length: saleImportLimits.rows + 1 }, () => row)))).toThrowError(expect.objectContaining({ code: 'limit' }))
    expect(() => parseSaleImport(' '.repeat(saleImportLimits.text + 1))).toThrowError(expect.objectContaining({ code: 'limit' }))
  })
})
