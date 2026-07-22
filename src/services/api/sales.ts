import type { SaleContentModel, SaleModel, SaleState } from '@/models/saleModel.ts'
import { mapUserModel, type UserModel } from '@/models/userModel.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'
import { toUtcDateTimeString } from '@/utils/dateTime.ts'
import {
  mapOrganizationModel,
  type OrganizationDto,
} from '@/models/organizationModel.ts'

interface SaleDto {
  id: string
  buyer: UserModel
  organization: OrganizationDto
  comment?: string | null
  saleDatetime: string
  transactionId: string
  totalSum: number
  storage: string
  state: SaleState
  rowVersion: number
  currency: CurrencyModel
}

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
  storageName: string
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
  rangeStartDate: string
  rangeEndDate: string
  page: number
  limit: number
  buyerIds?: string[]
  currencyIds?: number[]
  productIds?: number[]
  states?: SaleState[]
  sortBy?: string
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

function mapSaleModel(dto: SaleDto): SaleModel {
  return {
    ...dto,
    buyer: mapUserModel(dto.buyer),
    organization: mapOrganizationModel(dto.organization),
  }
}

export async function createSale(req: CreateSaleRequest): Promise<CreateSaleResponse> {
  const resp = await api.post<{ sale: SaleDto }>('/main/sales', {
    ...req,
    saleDateTime: toUtcDateTimeString(req.saleDateTime),
  })

  return {
    sale: mapSaleModel(resp.data.sale),
  }
}

export async function getSales(req: GetSalesRequest): Promise<GetSalesResponse> {
  const params = new URLSearchParams()
  const appendParam = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return
    params.append(key, String(value))
  }

  appendParam('rangeStartDate', toUtcDateTimeString(req.rangeStartDate))
  appendParam('rangeEndDate', toUtcDateTimeString(req.rangeEndDate))
  appendParam('page', req.page)
  appendParam('limit', clampPageSize(req.limit))
  req.buyerIds?.forEach((id) => appendParam('buyerIds', id))
  req.currencyIds?.forEach((id) => appendParam('currencyIds', id))
  req.productIds?.forEach((id) => appendParam('productIds', id))
  req.states?.forEach((state) => appendParam('state', state))
  appendParam('sortBy', req.sortBy)
  appendParam('searchTerm', req.searchTerm)

  const resp = await api.get<{ sales: SaleDto[] }>('/main/sales', {
    params,
  })

  return {
    sales: resp.data.sales.map(mapSaleModel),
  }
}

export async function getSale(id: string): Promise<GetSaleResponse> {
  const resp = await api.get<{ sale: SaleDto }>(`/main/sales/${id}`)
  return {
    sale: mapSaleModel(resp.data.sale),
  }
}

export async function getSaleByTransactionId(transactionId: string): Promise<GetSaleResponse> {
  const resp = await api.get<{ sale: SaleDto }>(`/main/transactions/${transactionId}/sale`)
  return {
    sale: mapSaleModel(resp.data.sale),
  }
}

export async function getSaleContent(id: string): Promise<GetSaleContentResponse> {
  const resp = await api.get<GetSaleContentResponse & { content?: SaleContentModel[] }>(`/main/sales/${id}/contents`)
  return {
    contents: resp.data.contents ?? resp.data.content ?? [],
  }
}

export async function deleteSale(id: string, rowVersion: number): Promise<void> {
  await api.delete(`/main/sales/${id}`, {
    headers: {
      'If-Match': rowVersion,
    },
  })
}

export async function editSale(id: string, rowVersion: number, req: EditSaleRequest): Promise<void> {
  await api.put(`/main/sales/${id}`, {
    ...req,
    saleDateTime: toUtcDateTimeString(req.saleDateTime),
  }, {
    headers: {
      'If-Match': rowVersion,
    },
  })
}
