import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import type { OrganizationModel } from '@/models/organizationModel.ts'

export interface PurchaseModel {
  id: string
  supplier: UserModel
  supplierOrganization: OrganizationModel
  currency: CurrencyModel
  comment?: string | null
  storageCode: string
  purchaseDatetime: string
  transactionId?: string
  totalSum: number
}

export interface PurchaseContentModel {
  id: number
  count: number
  price: number
  totalSum: number
  comment?: string | null
  product: {
    id?: number
    sku?: string
    producerName?: string
    name?: string
  }
}
