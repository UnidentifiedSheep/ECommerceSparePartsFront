import type { CurrencyModel } from '@/models/currencyModel.ts'

export interface StorageContentModel {
  id: number
  storageName: string
  productId: number
  count: number
  buyPrice: number
  purchaseDatetime: string
  rowVersion: number
  currency: CurrencyModel
}