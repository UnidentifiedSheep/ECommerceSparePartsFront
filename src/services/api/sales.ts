import type { SaleContentModel, SaleModel, SaleState } from '@/models/saleModel'
import type { CurrencyModel } from '@/models/currencyModel'
import { clampPageSize } from './api'
import { toUtcDateTimeString } from '@/utils/dateTime'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { mapSale, mapSaleContent } from '@/services/graphql/operationMapping'
import { gqlSort } from '@/services/graphql/partyMapping'
import { ListSalesDocument, SaleByIdDocument, SaleByTransactionDocument, SaleContentsDocument, ProductSalesHistoryDocument, CreateSaleDocument, UpdateSaleDocument, DeleteSaleDocument, type SaleState as GqlSaleState } from '@/graphql/generated/graphql'

export interface NewSaleContentRequest {
  productId: number
  count: number
  price: number
  priceWithDiscount: number
  comment?: string | null
}

export interface CreateSaleRequest {
  userId: string
  organizationId: string
  currencyId: number
  storageCode: string
  saleDateTime: string
  contents: NewSaleContentRequest[]
  comment?: string | null
  payedSum?: number | null
  forcePayment?: boolean
  confirmationCode?: string | null
}

export interface EditSaleContentRequest extends NewSaleContentRequest {
  id?: number | null
}

export interface EditSaleRequest {
  currencyId: number
  saleDateTime: string
  content: EditSaleContentRequest[]
  comment?: string | null
  forcePayment?: boolean
  confirmationCode?: string | null
}

export interface CreateSaleResponse {
  sale: SaleModel
}

export interface GetSalesRequest {
  rangeStartDate?: string
  rangeEndDate?: string
  page: number
  limit: number
  organizationIds?: string[]
  currencyIds?: number[]
  productIds?: number[]
  states?: SaleState[]
  sortBy?: string[]
  searchTerm?: string
}

export interface GetSalesResponse {
  sales: SaleModel[]
}

export interface GetSaleResponse {
  sale: SaleModel
}

export interface GetSaleContentResponse {
  contents: SaleContentModel[]
}

export interface ProductSaleHistoryModel {
  saleContentId: number
  productId: number
  storageCode: string
  currencyId: number
  quantity: number
  discount: number
  price: number
  averageBuyPrice: number
  saleDate: string
  whoCreated?: string | null
  product?: { id: number; sku: string; name: string; producerName: string }
  organization?: { id: string; name: string; systemName: string }
  currency?: CurrencyModel
}

export interface GetProductSaleHistoryRequest {
  showCrosses?: boolean
  productId: number
  storageCode?: string
  organizationId?: string
  preferredOrganizationId?: string
  currencyId?: number
  page: number
  size: number
  sortBy?: string[]
}

export interface GetProductSaleHistoryResponse {
  history: ProductSaleHistoryModel[]
}

export async function createSale(req: CreateSaleRequest): Promise<CreateSaleResponse> {
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateSaleDocument, variables: { input: { ...req, saleDateTime: toUtcDateTimeString(req.saleDateTime) } } }))
  if (!data) throw new Error('Sale creation returned no data')
  return { sale: mapSale(data.sales.create) }
}
export async function getSales(req: GetSalesRequest): Promise<GetSalesResponse> {
  const { page, limit, sortBy, rangeStartDate, rangeEndDate, states, ...filters } = req
  const { data } = await operationRequest(graphqlClient.query({ query: ListSalesDocument, variables: { input: {
    ...filters, pagination: { page, size: clampPageSize(limit) }, sortBy: gqlSort(sortBy),
    rangeStartDate: rangeStartDate ? toUtcDateTimeString(rangeStartDate) : undefined,
    rangeEndDate: rangeEndDate ? toUtcDateTimeString(rangeEndDate) : undefined,
    states: states?.map(state => state.toUpperCase() as GqlSaleState),
  } }, fetchPolicy: 'no-cache' }))
  return { sales: data.sales.list.map(mapSale) }
}
export async function getSale(id: string): Promise<GetSaleResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: SaleByIdDocument, variables: { id }, fetchPolicy: 'no-cache' }))
  if (!data.sales.byId) throw new Error('Sale not found')
  return { sale: mapSale(data.sales.byId) }
}
export async function getSaleByTransactionId(transactionId: string): Promise<GetSaleResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: SaleByTransactionDocument, variables: { transactionId }, fetchPolicy: 'no-cache' }))
  return { sale: mapSale(data.sales.byTransactionId) }
}
export async function getSaleContent(id: string): Promise<GetSaleContentResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: SaleContentsDocument, variables: { id }, fetchPolicy: 'no-cache' }))
  if (!data.sales.byId) throw new Error('Sale not found')
  return { contents: data.sales.byId.contents.map(mapSaleContent) }
}
export async function getProductSaleHistory(req: GetProductSaleHistoryRequest): Promise<GetProductSaleHistoryResponse> {
  const { productId, page, size, sortBy, ...filters } = req
  const { data } = await operationRequest(graphqlClient.query({ query: ProductSalesHistoryDocument, variables: { id: productId, input: { ...filters, pagination: { page, size: clampPageSize(size) }, sortBy: gqlSort(sortBy) } }, fetchPolicy: 'no-cache' }))
  if (!data.products.byId) throw new Error('Product not found')
  return { history: data.products.byId.saleHistory.map(item => ({
    ...item, productId: item.product.id, storageCode: item.storage.code, currencyId: item.currency.id,
    product: { id: item.product.id, sku: item.product.sku, name: item.product.name, producerName: item.product.producer.name },
    whoCreated: item.createdBy?.id,
  })) }
}
export async function deleteSale(id: string, rowVersion: number): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: DeleteSaleDocument, variables: { input: { saleId: id, rowVersion } } }))
}
export async function editSale(id: string, rowVersion: number, req: EditSaleRequest): Promise<void> {
  const { content, ...fields } = req
  await operationRequest(graphqlClient.mutate({ mutation: UpdateSaleDocument, variables: { input: { ...fields, saleId: id, rowVersion, contents: content, saleDateTime: toUtcDateTimeString(req.saleDateTime) } } }))
}
