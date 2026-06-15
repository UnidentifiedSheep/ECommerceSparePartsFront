import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { UserModel } from '@/models/userModel.ts'

export interface SaleModel {
  id: string
  buyer: UserModel
  comment?: string | null
  saleDatetime: string
  transactionId: string
  totalSum: number
  storage: string
  currency: CurrencyModel
}

export interface SaleContentModel {
  id: number
  count: number
  price: number
  totalSum: number
  comment?: string | null
  discount: number
  product: {
    id?: number
    sku?: string
    producerName?: string
    name?: string
  }
  details: SaleContentDetailModel[]
}

export interface SaleContentDetailModel {
  id: number
  saleContentId: number
  storageContentId: number
  currency: CurrencyModel
  buyPrice: number
  count: number
  purchaseDatetime: string
}
