import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { RouteType } from "@/enums/routeType.ts";
import { LogisticPricingType } from "@/enums/logisticPricingType.ts";

export interface StorageRouteModel {
  id: string
  fromStorageName: string
  toStorageName: string
  distanceM: number
  routeType: RouteType
  pricingModel: LogisticPricingType
  deliveryTimeMinutes: number
  pricePerKg: number
  pricePerM3: number
  pricePerOrder: number
  isActive: boolean
  currency: CurrencyModel
  minimumPrice?: number
  carrierId?: string
}
