import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import { clampPageSize } from '@/services/api/api.ts'
import {
  searchCatalogueGraphql,
  searchProducersGraphql,
  searchProductsGraphql,
} from '@/services/graphql/products.ts'
import type {
  CandidateMappingStatus,
  SearchMatchType as GraphqlSearchMatchType,
} from '@/graphql/generated/graphql.ts'

export type { CandidateMappingStatus } from '@/graphql/generated/graphql.ts'

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
  producerName?: string
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
  candidateMappingStatus?: CandidateMappingStatus
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

const graphqlSearchMatchTypes: Record<SearchMatchType, GraphqlSearchMatchType> = {
  Exact: 'EXACT',
  StartsWith: 'STARTS_WITH',
  Contains: 'CONTAINS',
  Fuzzy: 'FUZZY',
}

function toGraphqlSearchMatchTypes(values: SearchMatchType[] | undefined) {
  return values?.map((value) => graphqlSearchMatchTypes[value])
}

export async function searchProducts(req: SearchProductsRequest): Promise<SearchProductsResponse> {
  return searchProductsGraphql({
    query: req.query,
    producerId: req.producerId,
    page: req.page,
    size: clampPageSize(req.size),
    sortBy: req.sortBy,
  })
}

export async function searchProductsBySku(req: SearchProductsBySkuRequest): Promise<SearchProductsResponse> {
  const searchModes: SearchMatchType[] = req.searchMode === 'Full'
    ? ['Exact', 'StartsWith', 'Contains']
    : req.searchMode
      ? [req.searchMode]
      : ['Exact', 'StartsWith', 'Contains']
  return searchProductsGraphql({
    query: req.sku,
    producerId: req.producerId,
    page: req.page,
    size: clampPageSize(req.size),
    skuModes: toGraphqlSearchMatchTypes(searchModes),
    nameModes: [],
    sortBy: req.sortBy,
  })
}

export async function searchCatalogue(req: SearchCatalogueRequest): Promise<SearchCatalogueResponse> {
  return searchCatalogueGraphql({
    query: req.query?.trim() || undefined,
    targets: (req.targets ?? ['Products']).map((target) => (
      target === 'Products' ? 'PRODUCTS' : 'CATALOGUE_CANDIDATES'
    )),
    skuModes: toGraphqlSearchMatchTypes(req.fields?.sku),
    nameModes: toGraphqlSearchMatchTypes(req.fields?.name),
    producerIds: req.producerIds ?? [],
    candidateMappingStatus: req.candidateMappingStatus ?? 'UNMAPPED',
    includeHighlights: req.includeHighlights ?? false,
    page: req.page,
    size: clampPageSize(req.size),
    productSortBy: req.sortBy?.products,
    catalogueCandidateSortBy: req.sortBy?.catalogueCandidates,
  })
}

export async function searchProducers(req: SearchProducersRequest): Promise<SearchProducersResponse> {
  return {
    producers: await searchProducersGraphql({
      query: req.query,
      page: req.page,
      size: clampPageSize(req.size),
    }),
  }
}
