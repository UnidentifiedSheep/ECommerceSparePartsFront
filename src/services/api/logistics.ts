import type { StorageRouteModel } from '@/models/storageRouteModel.ts'
import api from '@/services/api/api.ts'

export type LogisticsCalculationMode = 'Strict' | 'Soft'

export interface LogisticsCalculationItemRequest {
  productId: number
  quantity: number
}

export interface CalculateDeliveryCostRequest {
  storageFrom: string
  storageTo: string
  mode: LogisticsCalculationMode
  items: LogisticsCalculationItemRequest[]
}

export interface DeliveryCostItemModel {
  productId: number
  count: number
  quantity: number
  areaM3: number
  areaPerItem: number
  weight: number
  weightPerItem: number
  weightUnit: string
  skipped: boolean
  reasons?: string[] | null
}

export interface DeliveryCostModel {
  items: DeliveryCostItemModel[]
  totalAreaM3: number
  totalWeight: number
  weightUnit: string
  totalCost: number
  minimalPrice: number
  minimalPriceApplied: boolean
  currencyId: number
  pricingModel: string
}

export interface CalculateDeliveryCostResponse {
  deliveryCost: DeliveryCostModel
  usedRoute: StorageRouteModel
}

export async function calculateDeliveryCost(
  req: CalculateDeliveryCostRequest,
): Promise<CalculateDeliveryCostResponse> {
  const resp = await api.post<CalculateDeliveryCostResponse>('/main/logistics/calculate', req)
  return resp.data
}
