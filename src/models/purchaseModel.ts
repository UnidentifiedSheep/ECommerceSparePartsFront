import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import type { OrganizationModel } from '@/models/organizationModel.ts'
import type { LogisticPricingType } from '@/enums/logisticPricingType.ts'
import type { RouteType } from '@/enums/routeType.ts'

export interface PurchaseModel {
  id: string
  supplier: UserModel
  supplierOrganization: OrganizationModel
  currency: CurrencyModel
  comment?: string | null
  storage: string
  purchaseDatetime: string
  transactionId: string
  totalSum: number
  logistics?: PurchaseLogisticModel | null
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
  logistics?: PurchaseContentLogisticModel | null
}

export interface PurchaseLogisticModel {
  routeId: string
  transactionId?: string | null
  pricingModel: LogisticPricingType
  routeType: RouteType
  priceKg: number
  pricePerM3: number
  pricePerOrder: number
  minimumPrice?: number | null
  minimumPriceApplied: boolean
  currency: CurrencyModel
}

export interface PurchaseContentLogisticModel {
  weightKg: number
  areaM3: number
  price: number
}
