import api from '@/services/api/api.ts'

export const PriceOfferSourceType = {
  Supplier: 'Supplier',
  OurWarehouse: 'OurWarehouse',
} as const

export type PriceOfferSourceType = (typeof PriceOfferSourceType)[keyof typeof PriceOfferSourceType]

export interface PriceApplierStateModel {
  priceApplierSystemName: string
  usage: PriceOfferSourceType
  order: number
  enabled: boolean
}

export interface PriceApplierModel {
  systemName: string
  name: string
  isDynamic: boolean
  dslLogic: string | null
  states: PriceApplierStateModel[]
}

export interface UpsertPriceApplierStateModel {
  usage: PriceOfferSourceType
  order: number | null
  enabled: boolean
}

export interface UpsertPriceApplierRequest {
  systemName: string
  name: string | null
  dslLogic: string | null
  states: UpsertPriceApplierStateModel[]
}

interface GetPriceAppliersResponse {
  appliers: PriceApplierModel[]
}

interface UpsertPriceApplierResponse {
  applier: PriceApplierModel
}

export async function getPriceAppliers(usage: PriceOfferSourceType): Promise<PriceApplierModel[]> {
  const response = await api.get<GetPriceAppliersResponse>('/pricing/price-appliers', {
    params: { usage },
  })
  return response.data.appliers
}

export async function upsertPriceApplier(
  request: UpsertPriceApplierRequest,
): Promise<PriceApplierModel> {
  const response = await api.post<UpsertPriceApplierResponse>('/pricing/price-appliers', request)
  return response.data.applier
}

export async function deletePriceApplier(systemName: string): Promise<void> {
  await api.delete(`/pricing/price-appliers/${encodeURIComponent(systemName)}`)
}
