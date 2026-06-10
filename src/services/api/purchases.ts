import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { PurchaseContentModel, PurchaseModel } from '@/models/purchaseModel.ts'
import { mapUserModel, type UserModel } from '@/models/userModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'
import { toUtcDateTimeString } from '@/utils/dateTime.ts'

interface PurchaseDto {
  id: string
  supplier: UserModel
  currency: CurrencyModel
  comment?: string | null
  storage: string
  purchaseDatetime: string
  transactionId: string
  totalSum: number
  logistics?: PurchaseModel['logistics']
}

interface PurchaseContentDto {
  id: number
  count: number
  price: number
  totalSum: number
  comment?: string | null
  product?: {
    id?: number
    sku?: string
    articleNumber?: string
    producerName?: string
    name?: string
  }
  article?: {
    id?: number
    articleNumber?: string
    producerName?: string
    name?: string
  }
  logistics?: PurchaseContentModel['logistics']
}

export interface GetPurchasesRequest {
  rangeStartDate: string
  rangeEndDate: string
  page: number
  limit: number
  supplierIds?: string[]
  currencyIds?: number[]
  productIds?: number[]
  sortBy?: string
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

export interface CreatePurchaseRequest {
  supplierId: string
  currencyId: number
  storageName: string
  purchaseDate: string
  purchaseContent: NewPurchaseContentRequest[]
  withLogistics: boolean
  comment?: string | null
  payedSum?: number | null
  storageFrom?: string | null
}

export interface CreatePurchaseResponse {
  purchase: PurchaseModel
}

function mapPurchaseModel(dto: PurchaseDto): PurchaseModel {
  return {
    ...dto,
    supplier: mapUserModel(dto.supplier),
  }
}

export async function getPurchases(req: GetPurchasesRequest): Promise<GetPurchasesResponse> {
  const params = new URLSearchParams()
  const appendParam = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return
    params.append(key, String(value))
  }

  appendParam('rangeStartDate', toUtcDateTimeString(req.rangeStartDate))
  appendParam('rangeEndDate', toUtcDateTimeString(req.rangeEndDate))
  appendParam('page', req.page)
  appendParam('limit', clampPageSize(req.limit))
  req.supplierIds?.forEach((id) => appendParam('supplierIds', id))
  req.currencyIds?.forEach((id) => appendParam('currencyIds', id))
  req.productIds?.forEach((id) => appendParam('productIds', id))
  appendParam('sortBy', req.sortBy)
  appendParam('searchTerm', req.searchTerm)

  const resp = await api.get<{ purchases: PurchaseDto[] }>('/main/purchases', {
    params,
  })
  return {
    purchases: resp.data.purchases.map(mapPurchaseModel),
  }
}

export async function getPurchase(id: string): Promise<GetPurchaseResponse> {
  const resp = await api.get<{ purchase: PurchaseDto }>(`/main/purchases/${id}`)
  return {
    purchase: mapPurchaseModel(resp.data.purchase),
  }
}

export async function getPurchaseByTransactionId(transactionId: string): Promise<GetPurchaseResponse> {
  const resp = await api.get<{ purchase: PurchaseDto }>(`/main/transactions/${transactionId}/purchase`)
  return {
    purchase: mapPurchaseModel(resp.data.purchase),
  }
}

export async function getPurchaseContent(id: string): Promise<GetPurchaseContentResponse> {
  const resp = await api.get<{ content: PurchaseContentDto[] }>(`/main/purchases/${id}/contents`)
  return {
    content: resp.data.content.map((item) => ({
      ...item,
      product: item.product ?? {
        id: item.article?.id,
        sku: item.article?.articleNumber,
        producerName: item.article?.producerName,
        name: item.article?.name,
      },
    })),
  }
}

export async function deletePurchase(id: string) {
  await api.delete(`/main/purchases/${id}`)
}

export async function createPurchase(req: CreatePurchaseRequest): Promise<CreatePurchaseResponse> {
  const resp = await api.post<{ purchase: PurchaseDto }>('/main/purchases', {
    ...req,
    purchaseDate: toUtcDateTimeString(req.purchaseDate),
  })
  return {
    purchase: mapPurchaseModel(resp.data.purchase),
  }
}
