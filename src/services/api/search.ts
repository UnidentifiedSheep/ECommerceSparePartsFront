import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

export interface SearchProductsRequest {
  query?: string
  producerId?: number
  lengthMin?: number
  lengthMax?: number
  widthMin?: number
  widthMax?: number
  heightMin?: number
  heightMax?: number
  dimensionUnit?: string
  page: number
  size: number
  sortBy?: string
}

export interface SearchProductsResponse {
  products: ProductSearchModel[]
}

export interface SearchProducersRequest {
  query?: string
  page: number
  size: number
}

export interface SearchProducersResponse {
  producers: ProducerSearchModel[]
}

export interface SearchProductsBySkuRequest {
  sku: string
  producerId?: number
  page: number
  size: number
  sortBy?: string
}

export async function searchProducts(req: SearchProductsRequest): Promise<SearchProductsResponse> {
  const resp = await api.get<SearchProductsResponse>('/search/products/all', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}

export async function searchProductsBySku(req: SearchProductsBySkuRequest): Promise<SearchProductsResponse> {
  const resp = await api.get<SearchProductsResponse>('/search/products/sku', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}

export async function searchProducers(req: SearchProducersRequest): Promise<SearchProducersResponse> {
  const resp = await api.get<SearchProducersResponse>('/search/producers', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}
