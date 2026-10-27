import type { PurchaseContentModel, PurchaseModel } from '@/models/purchaseModel'
import { clampPageSize } from './api'
import { toUtcDateTimeString } from '@/utils/dateTime'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { mapPurchase, mapPurchaseContent } from '@/services/graphql/operationMapping'
import { gqlSort } from '@/services/graphql/partyMapping'
import { ListPurchasesDocument, PurchaseByIdDocument, PurchaseByTransactionDocument, PurchaseContentsDocument, CreatePurchaseDocument, UpdatePurchaseDocument, DeletePurchaseDocument } from '@/graphql/generated/graphql'

export interface GetPurchasesRequest {
  rangeStartDate?: string
  rangeEndDate?: string
  page: number
  limit: number
  supplierOrganizationIds?: string[]
  currencyIds?: number[]
  productIds?: number[]
  sortBy?: string[]
  searchTerm?: string
}

export interface GetPurchasesResponse {
  purchases: PurchaseModel[]
}

export interface GetPurchaseResponse {
  purchase: PurchaseModel
}

export interface GetPurchaseContentResponse {
  content: PurchaseContentModel[]
}

export interface NewPurchaseContentRequest {
  productId: number
  count: number
  price: number
  calculateLogistics: boolean
  comment?: string | null
}

export interface EditPurchaseContentRequest extends NewPurchaseContentRequest {
  id?: number | null
}

export interface CreatePurchaseRequest {
  supplierUserId: string
  supplierOrganizationId: string
  currencyId: number
  storageCode: string
  purchaseDate: string
  purchaseContent: NewPurchaseContentRequest[]
  withLogistics: boolean
  comment?: string | null
  payedSum?: number | null
  storageFrom?: string | null
  forcePayment: boolean
}

export interface EditPurchaseRequest {
  content: EditPurchaseContentRequest[]
  currencyId: number
  comment?: string | null
  purchaseDateTime: string
  withLogistics: boolean
  storageFrom?: string | null
}

export interface CreatePurchaseResponse {
  purchase: PurchaseModel
}

export async function getPurchases(req: GetPurchasesRequest): Promise<GetPurchasesResponse> {
  const { page, limit, rangeStartDate, rangeEndDate, sortBy, ...filters } = req
  const { data } = await operationRequest(graphqlClient.query({ query: ListPurchasesDocument, variables: { input: {
    ...filters, pagination: { page, size: clampPageSize(limit) }, sortBy: gqlSort(sortBy),
    rangeStartDate: rangeStartDate ? toUtcDateTimeString(rangeStartDate) : undefined,
    rangeEndDate: rangeEndDate ? toUtcDateTimeString(rangeEndDate) : undefined,
  } }, fetchPolicy: 'no-cache' }))
  return { purchases: data.purchases.list.map(mapPurchase) }
}
export async function getPurchase(id: string): Promise<GetPurchaseResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: PurchaseByIdDocument, variables: { id }, fetchPolicy: 'no-cache' }))
  if (!data.purchases.byId) throw new Error('Purchase not found')
  return { purchase: mapPurchase(data.purchases.byId) }
}
export async function getPurchaseByTransactionId(transactionId: string): Promise<GetPurchaseResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: PurchaseByTransactionDocument, variables: { transactionId }, fetchPolicy: 'no-cache' }))
  return { purchase: mapPurchase(data.purchases.byTransactionId) }
}
export async function getPurchaseContent(id: string): Promise<GetPurchaseContentResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: PurchaseContentsDocument, variables: { id }, fetchPolicy: 'no-cache' }))
  if (!data.purchases.byId) throw new Error('Purchase not found')
  return { content: data.purchases.byId.contents.map(mapPurchaseContent) }
}
export async function deletePurchase(id: string): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: DeletePurchaseDocument, variables: { input: { purchaseId: id } } }))
}
export async function createPurchase(req: CreatePurchaseRequest): Promise<CreatePurchaseResponse> {
  const { purchaseContent, ...fields } = req
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreatePurchaseDocument, variables: { input: { ...fields, contents: purchaseContent, purchaseDate: toUtcDateTimeString(req.purchaseDate) } } }))
  if (!data) throw new Error('Purchase creation returned no data')
  return { purchase: mapPurchase(data.purchases.create) }
}
export async function editPurchase(id: string, req: EditPurchaseRequest): Promise<void> {
  const { content, ...fields } = req
  await operationRequest(graphqlClient.mutate({ mutation: UpdatePurchaseDocument, variables: { input: { ...fields, purchaseId: id, contents: content, purchaseDateTime: toUtcDateTimeString(req.purchaseDateTime) } } }))
}
