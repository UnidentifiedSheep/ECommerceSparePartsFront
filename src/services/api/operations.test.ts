import { beforeEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { graphqlClient } from '@/services/graphql/client'
import { getSales, getSaleContent, getProductSaleHistory, createSale, editSale, deleteSale } from './sales'
import { getPurchases, getPurchaseContent, createPurchase, editPurchase } from './purchases'
import { getBalanceTransactions, createSystemBalanceTransaction, deleteBalanceTransaction } from './balances'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('./api', () => ({ clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
const user = { id: 'user-1', userName: 'alice', info: { name: 'Alice', surname: 'Smith', description: null } }
const org = { id: 'org-1', type: 'BUSINESS', name: 'ACME', systemName: 'acme', isHidden: false, approximateBalanceInBaseCurrency: 10, owner: user }
const currency = { id: 1, name: 'Ruble', shortName: 'RUB', code: 'RUB', currencySign: '₽' }
const sale = { id: 'sale-1', buyer: user, organization: org, currency, comment: null, saleDatetime: '2026-10-27T10:00:00Z', storage: { code: 'MAIN' }, state: 'COMPLETED', rowVersion: 7, totalSum: 100 }
const purchase = { id: 'purchase-1', supplier: user, supplierOrganization: org, currency, purchaseDatetime: sale.saleDatetime, storage: { code: 'MAIN' }, totalSum: 100, logistics: { routeId: 'route-1', pricingModel: 'PER_WEIGHT', routeType: 'INTER_CITY', priceKg: 10, pricePerM3: 0, pricePerOrder: 0, minimumPrice: 0, minimumPriceApplied: false, currency } }
const product = { id: 1, sku: 'ABC', name: 'Part', producer: { id: 1, name: 'ACME' } }
beforeEach(() => { vi.mocked(graphqlClient.query).mockReset(); vi.mocked(graphqlClient.mutate).mockReset() })
const input = () => vi.mocked(graphqlClient.query).mock.calls[0]![0].variables!.input
const mutationInput = () => vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables!.input

describe('GraphQL operation contracts', () => {
  it('sends paginated sale filters, enum states and sort keys and maps the result', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { sales: { list: [sale] } } } as never)
    const result = await getSales({ page: 2, limit: 20, organizationIds: [org.id], productIds: [1], states: ['Completed'], sortBy: ['totalSum_desc'], rangeStartDate: '2026-10-27T13:00:00+03:00' })
    expect(input()).toMatchObject({ pagination: { page: 2, size: 20 }, organizationIds: [org.id], productIds: [1], states: ['COMPLETED'], sortBy: [{ field: 'totalSum', isDescending: true }], rangeStartDate: '2026-10-27T10:00:00.000Z' })
    expect(result.sales[0]).toMatchObject({ buyer: { name: 'Alice' }, organization: { type: 'Business' }, storageCode: 'MAIN', state: 'Completed', rowVersion: 7 })
    expect(print(vi.mocked(graphqlClient.query).mock.calls[0]![0].query)).not.toMatch(/\btransaction\s*\{/)
  })
  it('maps sale contents and rejects missing documents rather than clearing their content silently', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { sales: { byId: { contents: [{ id: 1, count: 2, price: 10, totalSum: 18, discount: 0.1, comment: null, product, details: [] }] } } } } as never).mockResolvedValueOnce({ data: { sales: { byId: null } } } as never)
    expect((await getSaleContent(sale.id)).contents[0]).toMatchObject({ product: { sku: 'ABC', producerName: 'ACME' }, discount: 0.1 })
    await expect(getSaleContent('missing')).rejects.toThrow('Sale not found')
  })
  it('keeps optimistic concurrency rowVersion on sale update and delete', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: {} } as never)
    await editSale(sale.id, 7, { currencyId: 1, saleDateTime: sale.saleDatetime, content: [{ id: 1, productId: 1, count: 1, price: 100, priceWithDiscount: 80 }], confirmationCode: 'confirmation-test', forcePayment: true })
    expect(mutationInput()).toMatchObject({ saleId: sale.id, rowVersion: 7, contents: [{ id: 1, priceWithDiscount: 80 }], confirmationCode: 'confirmation-test', forcePayment: true })
    expect(mutationInput()).not.toHaveProperty('content')
    vi.mocked(graphqlClient.mutate).mockClear()
    await deleteSale(sale.id, 7)
    expect(mutationInput()).toEqual({ saleId: sale.id, rowVersion: 7 })
  })
  it('creates sales with payment and confirmation data', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { sales: { create: sale } } } as never)
    await createSale({ userId: user.id, organizationId: org.id, currencyId: 1, storageCode: 'MAIN', saleDateTime: sale.saleDatetime, contents: [], payedSum: 50, forcePayment: true, confirmationCode: 'confirmation-test' })
    expect(mutationInput()).toMatchObject({ payedSum: 50, forcePayment: true, confirmationCode: 'confirmation-test', saleDateTime: '2026-10-27T10:00:00.000Z' })
  })
  it('loads purchase filters and logistics with the correct model enum values', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { purchases: { list: [purchase] } } } as never)
    const result = await getPurchases({ page: 1, limit: 500, supplierOrganizationIds: [org.id], sortBy: ['dateTime_desc'] })
    expect(input()).toMatchObject({ pagination: { page: 1, size: 100 }, supplierOrganizationIds: [org.id], sortBy: [{ field: 'dateTime', isDescending: true }] })
    expect(result.purchases[0]?.logistics).toMatchObject({ pricingModel: 'PerWeight', routeType: 'InterCity' })
  })
  it('maps purchase content logistics and sends the contents field on creation and update', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { purchases: { byId: { contents: [{ id: 1, count: 1, price: 10, totalSum: 10, comment: null, product, logistics: { weightKg: 1, areaM3: 0.1, price: 5 } }] } } } } as never)
    expect((await getPurchaseContent(purchase.id)).content[0]).toMatchObject({ product: { sku: 'ABC', producerName: 'ACME' }, logistics: { price: 5 } })
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { purchases: { create: purchase } } } as never)
    const contents = [{ productId: 1, count: 2, price: 10, calculateLogistics: true }]
    await createPurchase({ supplierUserId: user.id, supplierOrganizationId: org.id, currencyId: 1, storageCode: 'MAIN', purchaseDate: sale.saleDatetime, purchaseContent: contents, withLogistics: true, storageFrom: 'SOURCE', forcePayment: false })
    expect(mutationInput()).toMatchObject({ contents, withLogistics: true, storageFrom: 'SOURCE' })
    expect(mutationInput()).not.toHaveProperty('purchaseContent')
    vi.mocked(graphqlClient.mutate).mockClear()
    await editPurchase(purchase.id, { currencyId: 1, content: contents, purchaseDateTime: sale.saleDatetime, withLogistics: true })
    expect(mutationInput()).toMatchObject({ purchaseId: purchase.id, contents })
  })
  it('queries history with crosses and maps identity and currency per entry', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { products: { byId: { saleHistory: [{ saleContentId: 3, product, organization: { id: org.id, name: org.name, systemName: org.systemName }, storage: { code: 'MAIN' }, currency, quantity: 1, discount: 0, price: 10, averageBuyPrice: 5, saleDate: sale.saleDatetime, createdBy: { id: user.id } }] } } } } as never)
    const result = await getProductSaleHistory({ productId: 42, page: 1, size: 10, showCrosses: true, preferredOrganizationId: org.id, sortBy: ['price_asc'] })
    expect(input()).toMatchObject({ showCrosses: true, pagination: { page: 1, size: 10 }, preferredOrganizationId: org.id, sortBy: [{ field: 'price', isDescending: false }] })
    expect(result.history[0]).toMatchObject({ productId: product.id, product: { sku: 'ABC', producerName: 'ACME' }, organization: { name: 'ACME' }, currency: { currencySign: '₽' }, whoCreated: user.id })
  })
  it('uses a nullable composite transaction cursor and maps completion/reversal flags', async () => {
    const tx = { id: 'tx-1', amount: 10, sender: org, receiver: org, currency, transactionDate: sale.saleDatetime, type: 'TRANSFER', sourceType: 'MANUAL', isCompleted: true, isReversed: true, reversedAt: sale.saleDatetime }
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { transactions: { list: [tx] } } } as never)
    const request = { logicalOperator: 'Or' as const, skipReversed: false, size: 100, senderId: org.id }
    const result = await getBalanceTransactions(request)
    expect(input()).toMatchObject({ logicalOperation: 'OR', skipReversed: false, cursor: { value: null, size: 100 } })
    expect(result.transactions[0]).toMatchObject({ status: 5, type: 'Transfer', sourceType: 'Manual', currencyId: 1 })
    vi.mocked(graphqlClient.query).mockClear()
    await getBalanceTransactions({ ...request, cursorId: tx.id, cursorDate: tx.transactionDate })
    expect(input().cursor.value).toEqual({ id: tx.id, transactionDate: '2026-10-27T10:00:00.000Z' })
  })
  it('creates and reverses transactions without losing the force-payment flag', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: {} } as never)
    await createSystemBalanceTransaction({ organizationId: org.id, direction: 'UserToSystem', amount: 10, currencyId: 1, transactionDateTime: sale.saleDatetime, forcePayment: true })
    expect(mutationInput()).toMatchObject({ organizationId: org.id, direction: 'USER_TO_SYSTEM', forcePayment: true })
    vi.mocked(graphqlClient.mutate).mockClear()
    await deleteBalanceTransaction('tx-1', true)
    expect(mutationInput()).toEqual({ transactionId: 'tx-1', forcePayment: true })
  })
})
