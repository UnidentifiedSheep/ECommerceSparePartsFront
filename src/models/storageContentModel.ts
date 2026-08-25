import type { CurrencyModel } from '@/models/currencyModel.ts'

export interface StorageContentModel {
  id: number
  storageCode: string
  productId: number
  count: number
  buyPrice: number
  purchaseDatetime: string
  rowVersion: number
  currency: CurrencyModel
}
