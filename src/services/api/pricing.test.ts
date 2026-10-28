import { beforeEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { graphqlClient } from '@/services/graphql/client'
import { ApiError } from '@/models/errorModel'
import { getMarkupGroups, getMarkupGroupRanges, getAllMarkupGroupRanges, upsertMarkupGroup, deleteMarkupGroup } from './markups'
import { getPriceAppliers, upsertPriceApplier, deletePriceApplier } from './priceAppliers'
import { getPriceOffersForProduct } from './priceOffers'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('./api', () => ({ clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
const group = { id: 7, name: 'Retail', currency: { id: 2 }, sourceMessageId: 'message-1' }
const applier = { systemName: 'retail', name: 'Retail', isDynamic: true, dslLogic: '{}', states: [{ priceApplierSystemName: 'retail', usage: 'OUR_WAREHOUSE', order: 3, enabled: false }] }
const range = (id: number) => ({ id, rangeStart: id, rangeEnd: id + 1, markup: 0.2 })
const rangesResult = (ranges: ReturnType<typeof range>[]) => ({ data: { markupGroups: { byId: { id: 7, ranges } } } })
beforeEach(() => { vi.mocked(graphqlClient.query).mockReset(); vi.mocked(graphqlClient.mutate).mockReset() })
const queryInput = () => vi.mocked(graphqlClient.query).mock.calls[0]![0].variables!.input
const mutationInput = () => vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables!.input

describe('Pricing GraphQL contracts', () => {
  it('loads group metadata without eagerly requesting ranges and keeps sourceMessageId', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { markupGroups: { search: [group] } } } as never)
    expect((await getMarkupGroups({ page: 2, size: 300, searchTerm: ' Retail ' })).groups).toEqual([{ id: 7, name: 'Retail', currencyId: 2, sourceMessageId: 'message-1' }])
    expect(queryInput()).toEqual({ pagination: { page: 2, size: 100 }, searchTerm: 'Retail' })
    expect(print(vi.mocked(graphqlClient.query).mock.calls[0]![0].query)).not.toMatch(/\branges\b/)
  })

  it('pages ranges independently and does not treat a missing group as empty', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce(rangesResult([range(1)]) as never).mockResolvedValueOnce({ data: { markupGroups: { byId: null } } } as never)
    expect(await getMarkupGroupRanges(7, 4, 20)).toEqual([range(1)])
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ id: 7, pagination: { page: 4, size: 20 } })
    await expect(getMarkupGroupRanges(7, 0, 20)).rejects.toThrow('Markup group not found')
  })

  it('loads all range pages before replacement editing, including groups larger than 100', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce(rangesResult(Array.from({ length: 100 }, (_, i) => range(i))) as never).mockResolvedValueOnce(rangesResult([range(100), range(101)]) as never)
    const ranges = await getAllMarkupGroupRanges(7)
    expect(ranges).toHaveLength(102)
    expect(ranges[ranges.length - 1]).toEqual(range(101))
    expect(vi.mocked(graphqlClient.query).mock.calls.map(([q]) => q.variables)).toEqual([
      { id: 7, pagination: { page: 0, size: 100 } }, { id: 7, pagination: { page: 1, size: 100 } },
    ])
  })

  it('rejects incomplete range loading instead of returning a partial editable collection', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce(rangesResult(Array.from({ length: 100 }, (_, i) => range(i))) as never).mockRejectedValueOnce(new Error('Offline'))
    await expect(getAllMarkupGroupRanges(7)).rejects.toThrow('Offline')
  })

  it('upserts metadata and the complete range collection through the new input', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { markupGroups: { upsert: { ...group, sourceMessageId: null } } } } as never)
    const input = { id: 7, name: null, currencyId: 2, ranges: [{ rangeStart: 0, rangeEnd: 100, markup: 0.2 }] }
    expect(await upsertMarkupGroup(input)).toMatchObject({ id: 7, sourceMessageId: null })
    expect(mutationInput()).toEqual(input)
    expect(mutationInput()).not.toHaveProperty('group')
  })

  it('maps rule usage enums in both directions and preserves ordering, disabled state and null order', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { priceAppliers: { list: [applier] } } } as never)
    expect((await getPriceAppliers('Supplier'))[0]?.states[0]).toMatchObject({ usage: 'OurWarehouse', order: 3, enabled: false })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ usage: 'SUPPLIER' })
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { priceAppliers: { upsert: applier } } } as never)
    await upsertPriceApplier({ systemName: 'retail', name: null, dslLogic: '{}', states: [{ usage: 'Supplier', order: null, enabled: true }, { usage: 'OurWarehouse', order: 3, enabled: false }] })
    expect(mutationInput()).toMatchObject({ states: [{ usage: 'SUPPLIER', order: null, enabled: true }, { usage: 'OUR_WAREHOUSE', order: 3, enabled: false }] })
  })

  it('deletes rules by exact system name via a mutation', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { priceAppliers: { delete: true } } } as never)
    await deletePriceApplier('rule/one')
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables).toEqual({ systemName: 'rule/one' })
  })

  it('deletes groups by ID and preserves the localized last-group restriction', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { markupGroups: { delete: true } } } as never)
      .mockRejectedValueOnce({ graphQLErrors: [{ message: 'Нельзя удалить последнюю группу наценок.', extensions: { status: 409 } }] })
    await deleteMarkupGroup(7)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables).toEqual({ id: 7 })
    await expect(deleteMarkupGroup(8)).rejects.toMatchObject({ status: 409, message: 'Нельзя удалить последнюю группу наценок.' })
  })

  it('loads product offers with server paging, source enums and ordered sort keys; maps currencies and dates', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { products: { byId: { id: 4, offers: [{
      priceOfferId: 'offer-1', score: 1, currency: { id: 2 }, sellPrice: 120, markup: 0.2, forStorage: 'MAIN', deliveryTime: 'PT24H', guaranteedDeliveryTime: 'P2D', deliveryProbability: 90,
      offer: { id: 'offer-1', product: { id: 4 }, currency: { id: 3 }, source: 'FAVORITE_PARTS', offerForStorage: 'SUPPLIER', purchasePrice: 100, availableQuantity: 5, minimumPurchaseQuantity: 1, quantityCoefficient: 1, daysToRefund: 14, deliveryDate: null, guaranteedDeliveryDate: '2026-10-30T00:00:00Z', deliveryProbability: 90, orderTill: null, expiresAt: '2026-10-31T00:00:00Z' },
    }] } } } } as never)
    const result = await getPriceOffersForProduct({ productId: 4, currencyId: 2, storageCode: 'MAIN', page: 3, size: 500, sources: ['OurWarehouse', 'Armtek', 'FavoriteParts', 'Tmtr'], sortBy: ['-score', 'sellPrice_asc'] })
    expect(queryInput()).toEqual({ currencyId: 2, storageCode: 'MAIN', pagination: { page: 3, size: 100 }, sources: ['OUR_WAREHOUSE', 'ARMTEK', 'FAVORITE_PARTS', 'TMTR'], sortBy: [{ field: 'score', isDescending: true }, { field: 'sellPrice', isDescending: false }] })
    expect(result.priceOptions[0]).toMatchObject({ currencyId: 2, sellPrice: 120, deliveryTime: 'PT24H', offer: { productId: 4, currencyId: 3, source: 'FavoriteParts', orderTill: null, guaranteedDeliveryDate: '2026-10-30T00:00:00Z' } })
  })

  it('keeps business validation errors localized and typed for the UI', async () => {
    vi.mocked(graphqlClient.mutate).mockRejectedValue({ graphQLErrors: [{ message: 'Validation failed', extensions: { status: 400, validationErrors: [{ propertyName: 'ranges', errorMessage: 'Диапазоны пересекаются' }] } }] })
    const result = upsertMarkupGroup({ name: null, currencyId: 2, ranges: [] })
    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toThrow('Диапазоны пересекаются')
  })
})
