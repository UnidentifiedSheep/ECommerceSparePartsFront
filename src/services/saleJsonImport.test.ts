import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prepareSaleImport } from './saleJsonImport'
import { saleImportStockExceeded, type SaleImportInput } from '@/models/saleJsonImport'
import { resolveImportReferences } from '@/services/api/productImport'
import { getProductsAvailableStock } from '@/services/api/products'

vi.mock('@/services/api/productImport', () => ({ resolveImportReferences: vi.fn() }))
vi.mock('@/services/api/products', () => ({ getProductsAvailableStock: vi.fn() }))
const input = (sku = 'SKU1', price = 5012.53): SaleImportInput => ({ sku, producer: 'Dayco', count: 1, price })
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(resolveImportReferences).mockImplementation(async references => references.map(ref => ({
    sku: ref.sku, producerName: ref.producerName, supplier: null, productId: ref.sku === 'UNKNOWN' ? null : Number(ref.sku.replace('SKU', '')),
    producer: { id: 5, name: 'DAYCO' }, product: ref.sku === 'UNKNOWN' ? null : { id: Number(ref.sku.replace('SKU', '')), sku: ref.sku, name: 'Belt' },
  })))
  vi.mocked(getProductsAvailableStock).mockImplementation(async ids => new Map(ids.map(id => [id, 10])))
})
describe('sale JSON preview', () => {
  it('uses supplier-free resolution and stock in the selected warehouse, preserving quantities and distinct prices', async () => {
    const rows = await prepareSaleImport([input(), { ...input('SKU1', 6000), count: 2 }], 'MAIN', [{ productId: 1, count: 4 }])
    expect(resolveImportReferences).toHaveBeenCalledWith([{ sku: 'SKU1', producerName: 'Dayco', supplier: null }, { sku: 'SKU1', producerName: 'Dayco', supplier: null }])
    expect(getProductsAvailableStock).toHaveBeenCalledWith([1], 'MAIN')
    expect(rows.map(row => [row.count, row.price, row.requestedCount, row.availableStock])).toEqual([[1, 5012.53, 7, 10], [2, 6000, 7, 10]])
    expect(rows[0]!.product).toMatchObject({ id: 1, producerId: 5, producerName: 'DAYCO', stock: 10 })
  })
  it('marks unresolved rows and aggregate stock shortages without silently dropping or truncating positions', async () => {
    const rows = await prepareSaleImport([{ ...input(), count: 7 }, { ...input(), count: 4 }, input('UNKNOWN')], 'SECOND', [])
    expect(rows).toHaveLength(3)
    expect(rows[2]!.product).toBeUndefined()
    expect(rows.slice(0, 2).every(saleImportStockExceeded)).toBe(true)
    expect(rows[0]!.requestedCount).toBe(11)
    expect(rows[0]!.count).toBe(7)
  })
  it('treats missing warehouse stock as zero and propagates lookup failures', async () => {
    vi.mocked(getProductsAvailableStock).mockResolvedValueOnce(new Map())
    expect(saleImportStockExceeded((await prepareSaleImport([input()], 'MAIN', []))[0]!)).toBe(true)
    vi.mocked(resolveImportReferences).mockRejectedValueOnce(new Error('Unavailable'))
    await expect(prepareSaleImport([input()], 'MAIN', [])).rejects.toThrow('Unavailable')
  })
  it('batches resolution and unique stock lookups and refuses mismatched responses', async () => {
    await prepareSaleImport(Array.from({ length: 205 }, (_, index) => input(`SKU${index}`)), 'MAIN', [])
    expect(vi.mocked(resolveImportReferences).mock.calls.map(([refs]) => refs.length)).toEqual([100, 100, 5])
    expect(vi.mocked(getProductsAvailableStock).mock.calls.map(([ids]) => ids.length)).toEqual([100, 100, 5])
    vi.mocked(resolveImportReferences).mockResolvedValueOnce([])
    await expect(prepareSaleImport([input()], 'MAIN', [])).rejects.toMatchObject({ code: 'resolve' })
  })
})
