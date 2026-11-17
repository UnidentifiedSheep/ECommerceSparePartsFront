import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { graphqlClient } from '@/services/graphql/client'
import { getCurrencies, createCurrency } from './currencies'
import { editProducer, getProducerAliases, getProducerSupplierMappings, createProducerSupplierMapping } from './producers'
import { getStorages, editStorage, editStorageContent, deleteStorageContent } from './storages'
import { getRole, addPermissionToRole } from './roles'
import { addProductContent, createProductCrosses, setProductSize, setProductWeight } from './products'
import { getUploads, uploadFile } from './uploads'
import { StorageType } from '@/enums/storageType'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('./api', () => ({ default: {}, clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
vi.mock('axios', () => ({ default: { put: vi.fn() } }))

const query = vi.mocked(graphqlClient.query)
const mutate = vi.mocked(graphqlClient.mutate)
const variables = (index = 0) => mutate.mock.calls[index]![0].variables

beforeEach(() => {
  vi.clearAllMocks()
  query.mockReset()
  mutate.mockReset()
  mutate.mockResolvedValue({ data: {} } as never)
})

describe('administration GraphQL migration', () => {
  it('keeps currency signs and reads the created currency ID', async () => {
    const currency = { id: 1, shortName: 'RUB', name: 'Ruble', currencySign: '₽', code: '643' }
    query.mockResolvedValue({ data: { currencies: { list: [currency] } } } as never)
    expect(await getCurrencies()).toEqual({ currencies: [currency] })
    mutate.mockResolvedValue({ data: { currencies: { create: { id: 2 } } } } as never)
    const input = { shortName: 'USD', name: 'Dollar', currencySign: '$', code: '840' }
    expect(await createCurrency(input)).toEqual({ id: 2 })
    expect(variables()).toEqual({ input })
  })

  it('distinguishes clearing producer description from leaving other fields unchanged', async () => {
    mutate.mockResolvedValue({ data: { producers: { edit: { id: 7, name: 'MAN', description: null } } } } as never)
    await editProducer({ id: 7, description: null })
    expect(variables()).toEqual({ producerId: 7, input: { description: { isSet: true, value: null } } })
  })

  it('preserves alias paging and filters supplier mappings after reading nested producer IDs', async () => {
    query.mockResolvedValueOnce({ data: { producers: { byId: { aliases: ['A', 'B', 'C'] } } } } as never)
    expect(await getProducerAliases(7, 1, 2)).toEqual({ aliases: [{ producerId: 7, alias: 'C' }] })
    const mapping = { id: 3, producer: { id: 7 }, supplier: 'FAVORIT_PARTS', supplierProducerName: 'Man' }
    query.mockResolvedValueOnce({ data: { producers: { byId: { supplierMappings: [mapping, { ...mapping, id: 4, supplier: 'TMTR' }] } } } } as never)
    expect(await getProducerSupplierMappings({ producerId: 7, suppliers: ['FavoritParts'] })).toEqual({ mappings: [{ id: 3, producerId: 7, supplier: 'FavoritParts', supplierProducerName: 'Man' }] })
    mutate.mockResolvedValueOnce({ data: { producers: { createSupplierMapping: mapping } } } as never)
    await createProducerSupplierMapping({ producerId: 7, supplier: 'FavoritParts', supplierProducerName: 'Man' })
    expect(variables()).toEqual({ input: { producerId: 7, supplier: 'FAVORIT_PARTS', supplierProducerName: 'Man' } })
  })

  it('maps storage enums in both directions and sends only changed fields', async () => {
    query.mockResolvedValue({ data: { storages: { list: [{ code: 'MAIN', type: 'WAREHOUSE', location: null, description: null }] } } } as never)
    expect((await getStorages({ page: 2, limit: 500, type: StorageType.Warehouse })).storages[0]?.type).toBe(StorageType.Warehouse)
    expect(query.mock.calls[0]![0].variables).toEqual({ input: { pagination: { page: 2, size: 100 }, type: 'WAREHOUSE', searchTerm: undefined } })
    await editStorage({ storageCode: 'MAIN', description: '', type: StorageType.SupplierStorage })
    expect(variables()).toEqual({ code: 'MAIN', input: { description: { isSet: true, value: '' }, type: { isSet: true, value: 'SUPPLIER_STORAGE' } } })
  })

  it('preserves stock row versions, zero values and UTC dates when editing or zeroing stock', async () => {
    await editStorageContent({ id: 8, rowVersion: 12, count: 0, purchaseDatetime: '2026-11-17T12:00:00+03:00' })
    expect(variables()).toEqual({ items: [{ id: 8, rowVersion: 12, count: { isSet: true, value: 0 }, purchaseDatetime: { isSet: true, value: '2026-11-17T09:00:00.000Z' } }] })
    await deleteStorageContent(8, 13)
    expect(variables(1)).toEqual({ contentId: 8, rowVersion: 13 })
  })

  it('reads permissions from the role itself and assigns by system code', async () => {
    const role = { systemName: 'MANAGER', permissions: [{ systemName: 'SALES_GET', name: 'Sales', description: null }] }
    query.mockResolvedValue({ data: { roles: { byName: role } } } as never)
    expect((await getRole('MANAGER')).permissions).toEqual(role.permissions)
    await addPermissionToRole('MANAGER', 'SALES_GET')
    expect(variables()).toEqual({ input: { roleName: 'MANAGER', permissionName: 'SALES_GET' } })
  })

  it('translates kit quantities, cross relationships and measurement units', async () => {
    await addProductContent({ productId: 1, childProductId: 2, count: 3 })
    expect(variables()).toEqual({ productId: 1, items: [{ childProductId: 2, quantity: 3 }] })
    await createProductCrosses({ linkages: [{ productId: 1, crossProductId: 2, linkageType: 'FullLeftToRightCross' }] })
    expect(variables(1)).toEqual({ linkages: [{ productId: 1, crossProductId: 2, linkageType: 'FULL_LEFT_TO_RIGHT_CROSS' }] })
    await setProductSize(1, { length: 1, width: 2, height: 3, unit: 'Centimeter' })
    expect(variables(2)?.input).toEqual({ productId: 1, length: 1, width: 2, height: 3, unit: 'CENTIMETER' })
    await setProductWeight(1, { weight: 2, unit: 'Kilogram' })
    expect(variables(3)?.input).toEqual({ productId: 1, weight: 2, unit: 'KILOGRAM' })
  })

  it('retains upload cursors and completes uploads only after the signed PUT succeeds', async () => {
    const listing = { files: [], hasMore: true, nextCursor: 'next' }
    query.mockResolvedValue({ data: { uploads: { list: listing } } } as never)
    expect(await getUploads({ cursor: 'previous', size: 10 })).toEqual(listing)
    expect(query.mock.calls[0]![0].variables).toEqual({ input: { cursor: 'previous', size: 10 } })
    mutate.mockResolvedValue({ data: { uploads: { createRequest: 'https://files.example.test/signed' } } } as never)
    vi.mocked(axios.put).mockRejectedValueOnce(new Error('upload failed'))
    const file = new File(['test'], 'parts.csv', { type: 'text/csv' })
    await expect(uploadFile(file)).rejects.toThrow('upload failed')
    expect(mutate).toHaveBeenCalledTimes(1)
    mutate.mockClear()
    vi.mocked(axios.put).mockResolvedValueOnce({})
    await uploadFile(file)
    expect(axios.put).toHaveBeenLastCalledWith('https://files.example.test/signed', file, { headers: { 'Content-Type': 'text/csv' } })
    expect(variables(1)).toEqual({ fileName: 'parts.csv' })
  })
})
