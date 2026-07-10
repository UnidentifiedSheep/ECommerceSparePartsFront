import type { PriceOptionModel } from '@/models/priceOfferModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

export interface GetPriceOffersForProductRequest {
  productId: number
  currencyId: number
  sources?: string[]
  storageName: string
  page: number
  size: number
  sortBy?: string
}

export interface GetPriceOffersForProductResponse {
  priceOptions: PriceOptionModel[]
}

export async function getPriceOffersForProduct(
  req: GetPriceOffersForProductRequest,
): Promise<GetPriceOffersForProductResponse> {
  const params = new URLSearchParams()
  params.set('productId', String(req.productId))
  params.set('currencyId', String(req.currencyId))
  params.set('storageName', req.storageName)
  params.set('page', String(req.page))
  params.set('size', String(clampPageSize(req.size)))
  if (req.sortBy) params.set('sortBy', req.sortBy)
  req.sources?.forEach((source) => params.append('source', source))

  const resp = await api.get<GetPriceOffersForProductResponse>('/pricing/offers', {
    params,
  })
  return resp.data
}
