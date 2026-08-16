import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

export interface SearchProductsRequest {
  query?: string
  producerId?: number
  page: number
  size: number
  sortBy?: string[]
}

export interface SearchProductsResponse {
  products: ProductSearchModel[]
  total?: number
}

export type SearchMatchType =
  | 'Exact'
  | 'StartsWith'
  | 'Contains'
  | 'Fuzzy'

export type SkuSearchMode = 'Full' | SearchMatchType
export type SearchTarget = 'Products' | 'CatalogueCandidates'

export interface CatalogueCandidateSearchModel {
  id: string
  sku: string
  producerId: number
  names: string[]
  highlights?: Record<string, string[]> | null
}

export interface CatalogueSearchFieldsRequest {
  sku?: SearchMatchType[]
  name?: SearchMatchType[]
}

export interface SearchCatalogueRequest {
  query?: string
  targets?: SearchTarget[]
  fields?: CatalogueSearchFieldsRequest
  producerIds?: number[]
  includeHighlights?: boolean
  page: number
  size: number
  sortBy?: {
    products?: string[]
    catalogueCandidates?: string[]
  }
}

export interface SearchCatalogueSection<T> {
  items: T[]
  total: number
}

export interface SearchCatalogueResponse {
  products: SearchCatalogueSection<ProductSearchModel>
  catalogueCandidates: SearchCatalogueSection<CatalogueCandidateSearchModel>
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
  searchMode?: SkuSearchMode
  page: number
  size: number
  sortBy?: string[]
}

export async function searchProducts(req: SearchProductsRequest): Promise<SearchProductsResponse> {
  const resp = await api.get<{ products: ProductSearchModel[] }>('/search/products/all', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}

export async function searchProductsBySku(req: SearchProductsBySkuRequest): Promise<SearchProductsResponse> {
  const resp = await api.get<{ products: ProductSearchModel[] }>('/search/products/sku', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}

export async function searchCatalogue(req: SearchCatalogueRequest): Promise<SearchCatalogueResponse> {
  const resp = await api.post<SearchCatalogueResponse>('/search/catalogue/search', {
    ...req,
    query: req.query?.trim() || null,
    producerIds: req.producerIds ?? [],
    includeHighlights: req.includeHighlights ?? false,
    size: clampPageSize(req.size),
    sortBy: {
      products: req.sortBy?.products ?? [],
      catalogueCandidates: req.sortBy?.catalogueCandidates ?? [],
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
