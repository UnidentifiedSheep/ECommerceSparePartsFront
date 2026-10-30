import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseProductImport, normalizedImportSku } from '@/models/productGroupImport'
import { executeProductImport, resolveImportGroups } from './productGroupImport'
import { resolveImportReferences } from '@/services/api/productImport'
import { createProducts, createProductCrosses } from '@/services/api/products'
import { getProducersByIdsGraphql } from '@/services/graphql/products'

vi.mock('@/services/api/productImport', () => ({ resolveImportReferences: vi.fn() }))
vi.mock('@/services/api/products', () => ({ createProducts: vi.fn(), createProductCrosses: vi.fn() }))
vi.mock('@/services/graphql/products', () => ({ getProducersByIdsGraphql: vi.fn() }))
const database = new Map<string, { id: number; name: string }>()
let nextId = 100
const key = (sku: string, producerId: number) => `${producerId}:${normalizedImportSku(sku)}`
const input = (groups: Array<Array<{ sku: string; producer?: string; name?: string }>>) => parseProductImport(JSON.stringify(groups.map(products => ({ supplier: 'Armtek', products: products.map(row => ({ name: 'Part', producer: 'MAN', ...row })) }))))
const access = { canRead: () => true, canCreate: () => true, canLink: () => true }
beforeEach(() => {
  vi.resetAllMocks(); database.clear(); nextId = 100
  vi.mocked(resolveImportReferences).mockImplementation(async references => references.map(reference => {
    const producerId = reference.producerName === 'UNKNOWN' ? undefined : reference.producerName === 'OTHER' ? 2 : 1
    const product = producerId ? database.get(key(reference.sku, producerId)) : undefined
    return { sku: reference.sku, producerName: reference.producerName, supplier: reference.supplier === 'Armtek' ? 'ARMTEK' : null, productId: product?.id ?? null,
      producer: producerId ? { id: producerId, name: producerId === 1 ? 'MAN' : 'OTHER' } : null,
      product: product ? { ...product, sku: reference.sku } : null }
  }))
  vi.mocked(createProducts).mockImplementation(async request => ({ products: request.newProducts.map(row => {
    const product = { id: nextId++, sku: row.sku, name: row.name }
    database.set(key(row.sku, row.producerId), product)
    return product
  }) }))
  vi.mocked(createProductCrosses).mockResolvedValue(undefined)
  vi.mocked(getProducersByIdsGraphql).mockResolvedValue([{ id: 2, name: 'OTHER' }])
})

describe('product group import execution', () => {
  it('resolves legacy references without a supplier and links existing and new products in one group', async () => {
    database.set(key('INF211208', 1), { id: 10, name: 'Existing fitting' })
    const groups = parseProductImport(JSON.stringify([
      { name: 'Фитинг м12х1,5 D=8х1', producer: 'STARTEC', uniValue: 'INF211208' },
      { name: 'Штуцер прямой', producer: 'STELLOX', uniValue: '8521306SX' },
    ]))
    await executeProductImport(groups, access, vi.fn(), vi.fn())
    expect(vi.mocked(resolveImportReferences).mock.calls[0]![0]).toEqual([
      { sku: 'INF211208', producerName: 'STARTEC', supplier: null },
      { sku: '8521306SX', producerName: 'STELLOX', supplier: null },
    ])
    expect(createProducts).toHaveBeenCalledWith({ newProducts: [{ sku: '8521306SX', name: 'Штуцер прямой', producerId: 1 }] })
    expect(createProductCrosses).toHaveBeenCalledWith({ linkages: [{ productId: 10, crossProductId: 100, linkageType: 'FullCross' }] })
    expect(groups[0]!.done).toBe(true)
  })

  it('resolves supplier context, creates only missing products, deduplicates aliases and links full groups', async () => {
    database.set(key('OLD', 1), { id: 10, name: 'Existing' })
    const groups = input([[{ sku: 'OLD' }, { sku: 'NEW' }, { sku: 'NEW', producer: 'ALIAS' }]])
    await executeProductImport(groups, access, vi.fn(), vi.fn())
    expect(vi.mocked(createProducts).mock.calls[0]![0].newProducts).toEqual([{ sku: 'NEW', name: 'Part', producerId: 1 }])
    expect(createProductCrosses).toHaveBeenCalledWith({ linkages: [{ productId: 10, crossProductId: 100, linkageType: 'FullCross' }] })
    expect(vi.mocked(resolveImportReferences).mock.calls[0]![0][0]!.supplier).toBe('Armtek')
    expect(groups[0]!.done).toBe(true)
  })

  it('does not write any group while a producer or required product name remains unresolved', async () => {
    await expect(executeProductImport(input([[{ sku: 'ONE' }], [{ sku: 'TWO', producer: 'UNKNOWN' }]]), access, vi.fn(), vi.fn())).rejects.toMatchObject({ code: 'producer' })
    await expect(executeProductImport(input([[{ sku: 'ONE', name: '' }]]), access, vi.fn(), vi.fn())).rejects.toMatchObject({ code: 'name' })
    await expect(executeProductImport(input([[{ sku: 'ONE', name: 'AB' }]]), access, vi.fn(), vi.fn())).rejects.toMatchObject({ code: 'name' })
    expect(createProducts).not.toHaveBeenCalled(); expect(createProductCrosses).not.toHaveBeenCalled()
  })

  it('looks up a manual producer and resolves by canonical name without applying supplier mappings again', async () => {
    const groups = input([[{ sku: 'ONE', producer: 'UNKNOWN' }]])
    groups[0]!.rows[0]!.manualProducerId = 2
    await resolveImportGroups(groups)
    expect(resolveImportReferences).toHaveBeenCalledWith([{ sku: 'ONE', producerName: 'OTHER', supplier: null }])
    expect(groups[0]!.rows[0]!.producerId).toBe(2)
  })

  it('caps creation batches at 100 and keeps groups isolated', async () => {
    const groups = input([Array.from({ length: 105 }, (_, index) => ({ sku: `SKU${index}` })), [{ sku: 'OTHER' }]])
    await executeProductImport(groups, access, vi.fn(), vi.fn())
    expect(vi.mocked(createProducts).mock.calls.map(([req]) => req.newProducts.length)).toEqual([100, 5, 1])
    expect(createProductCrosses).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createProductCrosses).mock.calls[0]![0].linkages).toHaveLength(104)
    expect(vi.mocked(resolveImportReferences).mock.calls.every(([references]) => references.length <= 100)).toBe(true)
  })

  it('retains completed groups and created IDs after a cross failure, then resumes without duplicate creations', async () => {
    const groups = input([[{ sku: 'AAA' }, { sku: 'BBB' }], [{ sku: 'CCC' }, { sku: 'DDD' }]])
    vi.mocked(createProductCrosses).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(undefined)
    await expect(executeProductImport(groups, access, vi.fn(), vi.fn())).rejects.toThrow('Offline')
    expect(groups.map(group => group.done)).toEqual([true, false])
    expect(groups[1]!.rows.every(row => row.productId)).toBe(true)
    await executeProductImport(groups, access, vi.fn(), vi.fn())
    expect(createProducts).toHaveBeenCalledTimes(2)
    expect(createProductCrosses).toHaveBeenCalledTimes(3)
    expect(groups.every(group => group.done)).toBe(true)
  })

  it('recovers a create that committed but lost its response by resolving before retrying', async () => {
    const groups = input([[{ sku: 'AAA' }, { sku: 'BBB' }]])
    const original = vi.mocked(createProducts).getMockImplementation()!
    vi.mocked(createProducts).mockImplementationOnce(async request => { await original(request); throw new Error('Lost response') })
    await executeProductImport(groups, access, vi.fn(), vi.fn())
    expect(createProducts).toHaveBeenCalledTimes(1)
    expect(createProductCrosses).toHaveBeenCalledTimes(1)
    expect(groups[0]!.done).toBe(true)
  })

  it('reuses products shared by multiple groups rather than creating them twice', async () => {
    const groups = input([[{ sku: 'AAA' }, { sku: 'BBB' }], [{ sku: 'AAA' }, { sku: 'CCC' }]])
    await executeProductImport(groups, access, vi.fn(), vi.fn())
    expect(vi.mocked(createProducts).mock.calls.map(([req]) => req.newProducts.length)).toEqual([2, 1])
    expect(groups[0]!.rows[0]!.productId).toBe(groups[1]!.rows[0]!.productId)
  })

  it('skips later batches already resolved during concurrent-create recovery', async () => {
    const products = Array.from({ length: 105 }, (_, index) => ({ sku: `SKU${index}` }))
    vi.mocked(createProducts).mockImplementationOnce(async () => {
      products.forEach((product, index) => database.set(key(product.sku, 1), { id: index + 1, name: 'Created elsewhere' }))
      throw new Error('Concurrent create')
    })
    await executeProductImport(input([products]), access, vi.fn(), vi.fn())
    expect(createProducts).toHaveBeenCalledTimes(1)
    expect(createProductCrosses).toHaveBeenCalledTimes(1)
  })

  it('allows linking existing products without create rights but prevents unauthorized writes', async () => {
    database.set(key('AAA', 1), { id: 1, name: 'A' }); database.set(key('BBB', 1), { id: 2, name: 'B' })
    await executeProductImport(input([[{ sku: 'AAA' }, { sku: 'BBB' }]]), { ...access, canCreate: () => false }, vi.fn(), vi.fn())
    expect(createProducts).not.toHaveBeenCalled()
    vi.mocked(createProductCrosses).mockClear()
    await expect(executeProductImport(input([[{ sku: 'AAA' }, { sku: 'BBB' }]]), { ...access, canLink: () => false }, vi.fn(), vi.fn())).rejects.toMatchObject({ code: 'permissions' })
    expect(createProductCrosses).not.toHaveBeenCalled()
  })

  it('rejects a malformed resolver response before creating or linking products', async () => {
    vi.mocked(resolveImportReferences).mockResolvedValueOnce([])
    await expect(executeProductImport(input([[{ sku: 'AAA' }]]), access, vi.fn(), vi.fn())).rejects.toMatchObject({ code: 'resolve' })
    expect(createProducts).not.toHaveBeenCalled(); expect(createProductCrosses).not.toHaveBeenCalled()
  })

  it('sends only 999 FullCross links for 1000 existing products', async () => {
    const products = Array.from({ length: 1000 }, (_, index) => ({ sku: `SKU${index}` }))
    products.forEach((product, index) => database.set(key(product.sku, 1), { id: index + 1, name: 'Existing' }))
    await executeProductImport(input([products]), { ...access, canCreate: () => false }, vi.fn(), vi.fn())
    expect(createProducts).not.toHaveBeenCalled()
    expect(vi.mocked(createProductCrosses).mock.calls[0]![0].linkages).toHaveLength(999)
  })

  it('stops between batches if permission is revoked and resumes with only the remaining products', async () => {
    const groups = input([Array.from({ length: 105 }, (_, index) => ({ sku: `SKU${index}` }))])
    let allowed = true
    const original = vi.mocked(createProducts).getMockImplementation()!
    vi.mocked(createProducts).mockImplementation(async request => { const result = await original(request); allowed = false; return result })
    const mutableAccess = { ...access, canCreate: () => allowed }
    await expect(executeProductImport(groups, mutableAccess, vi.fn(), vi.fn())).rejects.toMatchObject({ code: 'permissions' })
    expect(database.size).toBe(100)
    expect(createProductCrosses).not.toHaveBeenCalled()
    allowed = true
    await executeProductImport(groups, mutableAccess, vi.fn(), vi.fn())
    expect(vi.mocked(createProducts).mock.calls.map(([request]) => request.newProducts.length)).toEqual([100, 5])
    expect(groups[0]!.done).toBe(true)
    expect(groups[0]!.rows.every(row => row.created)).toBe(true)
  })
})
