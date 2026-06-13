import type { SaleContentModel, SaleModel } from '@/models/saleModel.ts'
import { mapUserModel, type UserModel } from '@/models/userModel.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'
import { toUtcDateTimeString } from '@/utils/dateTime.ts'

interface SaleDto {
  id: string
  buyer: UserModel
  comment?: string | null
  saleDatetime: string
  transactionId: string
  totalSum: number
  storage: string
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
  buyerId: string
  currencyId: number
  storageName: string
  saleDateTime: string
  contents: NewSaleContentRequest[]
  comment?: string | null
  payedSum?: number | null
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
  buyerId?: string
  currencyId?: number
  sortBy?: string
  searchTerm?: string
}

export interface GetSalesResponse {
  sales: SaleModel[]
}

export interface GetSaleContentResponse {
  content: SaleContentModel[]
}

function mapSaleModel(dto: SaleDto): SaleModel {
  return {
    ...dto,
    buyer: mapUserModel(dto.buyer),
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
  const resp = await api.get<{ sales: SaleDto[] }>('/main/sales', {
    params: {
      ...req,
      rangeStartDate: toUtcDateTimeString(req.rangeStartDate),
      rangeEndDate: toUtcDateTimeString(req.rangeEndDate),
      limit: clampPageSize(req.limit),
    },
  })

  return {
    sales: resp.data.sales.map(mapSaleModel),
  }
}

export async function getSaleContent(id: string): Promise<GetSaleContentResponse> {
  const resp = await api.get<GetSaleContentResponse>(`/main/sales/${id}/content`)
  return resp.data
}
