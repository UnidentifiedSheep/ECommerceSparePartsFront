import type {
  ProductContentModel,
  ProductModel,
} from '@/models/productModel.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import type { CatalogueCandidateSearchModel } from '@/services/api/search.ts'
import type { CatalogueCandidateReviewModel, SupplierProductModel } from '@/models/catalogueCandidateModel.ts'
import type { ProducerModel, Supplier } from '@/models/producerModel.ts'
import { graphqlClient } from './client.ts'
import {
  CandidateToCatalogueDocument,
  CatalogueCandidateByIdDocument,
  CatalogueCandidateByProductIdDocument,
  CatalogueCandidatesForReviewDocument,
  CatalogueSearchDocument,
  MapCandidateCrossesDocument,
  ProducerSearchDocument,
  ProducersByIdsDocument,
  ProductAvailableStockDocument,
  ProductsAvailableStockDocument,
  ProductByIdDocument,
  ProductContentsDocument,
  ProductCrossesDocument,
  ProductPairDocument,
  ProductStorageContentsDocument,
  StorageContentsSearchDocument,
  type CandidateToCatalogueMutation,
  type CatalogueCandidateByIdQuery,
  type CatalogueCandidateByProductIdQuery,
  type CatalogueCandidateCrossFieldsFragment,
  type CatalogueCandidateDetailsFieldsFragment,
  type CatalogueCandidateReviewFieldsFragment,
  type CatalogueCandidatesForReviewQuery,
  type CatalogueSearchQuery,
  type CandidateMappingStatus,
  type MapCandidateCrossesMutation,
  type ProductLinkageType as GraphqlProductLinkageType,
  type ProducerSearchQuery,
  type ProducersByIdsQuery,
  type ProductAvailableStockQuery,
  type ProductsAvailableStockQuery,
  type ProductByIdQuery,
  type ProductContentsQuery,
  type ProductCrossesQuery,
  type ProductPairQuery,
  type ProductStorageContentsQuery,
  type StorageContentsSearchQuery,
  type ProductDetailsFieldsFragment,
  type ProductListFieldsFragment,
  type ProductFieldsFragment,
  type SupplierProductFieldsFragment,
  type SearchMatchType as GraphqlSearchMatchType,
} from '@/graphql/generated/graphql.ts'

type GqlProduct = ProductDetailsFieldsFragment | ProductFieldsFragment | ProductListFieldsFragment
type ProductByIdResponse = ProductByIdQuery
type ProductPairResponse = ProductPairQuery
type ProductContentsResponse = ProductContentsQuery
type ProductCrossesResponse = ProductCrossesQuery
type ProductStorageContentsResponse = ProductStorageContentsQuery
type StorageContentsSearchResponse = StorageContentsSearchQuery
type CatalogueSearchResponse = CatalogueSearchQuery
type ProducerSearchResponse = ProducerSearchQuery
type ProductAvailableStockResponse = ProductAvailableStockQuery
type ProductsAvailableStockResponse = ProductsAvailableStockQuery
type CatalogueCandidatesForReviewResponse = CatalogueCandidatesForReviewQuery
type CatalogueCandidateByIdResponse = CatalogueCandidateByIdQuery
type CatalogueCandidateByProductIdResponse = CatalogueCandidateByProductIdQuery
type CandidateToCatalogueResponse = CandidateToCatalogueMutation
type MapCandidateCrossesResponse = MapCandidateCrossesMutation
type ProducersByIdsResponse = ProducersByIdsQuery

function mapProduct(product: GqlProduct): ProductModel {
  const mapped: ProductModel = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: 'description' in product ? product.description : null,
    producerId: product.producer.id,
    producerName: product.producer.name,
    indicator: product.indicator,
    images: 'images' in product ? product.images : [],
    stock: product.stock ?? 0,
  }
  if ('pair' in product) mapped.pair = product.pair ? mapProduct(product.pair) : null
  if ('contents' in product) {
    mapped.contents = product.contents.map((item) => ({ quantity: item.quantity, product: mapProduct(item.product) }))
  }
  if ('crosses' in product && product.crosses) mapped.crosses = product.crosses.map(mapProduct)
  if ('size' in product) mapped.size = product.size ? { productId: product.id, ...product.size } : null
  if ('weight' in product) mapped.weight = product.weight ? { productId: product.id, ...product.weight } : null
  if ('characteristics' in product) {
    mapped.characteristics = product.characteristics.map((item) => ({ productId: product.id, ...item }))
  }
  return mapped
}

function mapSupplier(supplier: SupplierProductFieldsFragment['supplier']): Supplier {
  if (supplier === 'FAVORIT_PARTS') return 'FavoritParts'
  if (supplier === 'TMTR') return 'Tmtr'
  return 'Armtek'
}

function mapSupplierProduct(product: SupplierProductFieldsFragment): SupplierProductModel {
  return {
    id: product.id,
    candidateId: product.candidateId,
    sku: product.sku,
    producer: product.producer,
    supplier: mapSupplier(product.supplier),
    names: product.names.map((name) => ({ ...name })),
  }
}

function mapCatalogueCandidate(
  candidate:
    | CatalogueCandidateReviewFieldsFragment
    | CatalogueCandidateDetailsFieldsFragment
    | CatalogueCandidateCrossFieldsFragment,
): CatalogueCandidateReviewModel {
  const mapped: CatalogueCandidateReviewModel = {
    id: candidate.id,
    sku: candidate.sku,
    producer: {
      id: candidate.producer.id,
      name: candidate.producer.name,
      description: candidate.producer.description,
    },
    product: candidate.product ? mapProduct(candidate.product) : null,
    supplierProducts: candidate.supplierProducts.map(mapSupplierProduct),
  }
  if ('crosses' in candidate) {
    mapped.crosses = {
      mapped: candidate.crosses.mapped.map(mapCatalogueCandidate),
      notMapped: candidate.crosses.notMapped.map(mapSupplierProduct),
    }
  }
  return mapped
}

function mapHighlights(items?: Array<{ field: string, fragments: string[] }> | null) {
  const highlights = items?.reduce<Record<string, string[]>>((result, highlight) => {
    result[highlight.field] = highlight.fragments
    return result
  }, {})
  return highlights && Object.keys(highlights).length > 0 ? highlights : null
}

function mapSortBy(values: string[] = []) {
  return values.map((value) => ({
    field: value.replace(/^-/, '').replace(/_desc$/, ''),
    isDescending: value.startsWith('-') || value.endsWith('_desc'),
  }))
}

function mapSearchProduct(item: CatalogueSearchResponse['catalogue']['search']['products']['items'][number]): ProductSearchModel {
  const product = item.item

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    producerId: product.producer.id,
    producerName: product.producer.name,
    indicator: product.indicator,
    stock: product.stock,
    dimensions: product.size ? { ...product.size } : null,
    weight: product.weight ? {
      value: product.weight.weight,
      unit: product.weight.unit,
      weightKg: product.weight.unit === 'GRAM'
        ? product.weight.weight / 1000
        : product.weight.unit === 'TONNE'
          ? product.weight.weight * 1000
          : product.weight.weight,
    } : null,
    highlights: mapHighlights(item.highlights?.items),
  }
}

function mapSearchCandidate(
  item: CatalogueSearchResponse['catalogue']['search']['catalogues']['items'][number],
): CatalogueCandidateSearchModel {
  return {
    id: item.item.id,
    sku: item.item.sku,
    producerId: item.item.producer.id,
    producerName: item.item.producer.name,
    names: [...new Set(item.item.supplierProducts.flatMap((product) => product.names.map((name) => name.name)))],
    highlights: mapHighlights(item.highlights?.items),
  }
}

type ProductStorageContent = NonNullable<ProductStorageContentsResponse['products']['byId']>['storageContents'][number]

function mapCurrency(currency: ProductStorageContent['currency']): CurrencyModel {
  return {
    id: currency.id,
    code: currency.code,
    name: currency.name,
    shortName: currency.shortName,
    currencySign: currency.sign,
  }
}

function mapStorageContent(
  content: ProductStorageContent,
): StorageContentModel {
  return {
    id: content.id,
    storageCode: content.storage.code,
    productId: content.product.id,
    count: content.count,
    buyPrice: content.buyPrice,
    purchaseDatetime: content.purchaseDatetime,
    rowVersion: content.rowVersion,
    currency: mapCurrency(content.currency),
  }
}

export async function getProductByIdGraphql(
  productId: number,
  includeCatalogueCandidate = false,
  crossesPageSize?: number,
): Promise<{
  product: ProductModel | null
  catalogueCandidate: CatalogueCandidateReviewModel | null
}> {
  const response = await graphqlClient.query<ProductByIdResponse>({
    query: ProductByIdDocument,
    variables: {
      id: productId,
      crossesInput: { pagination: { page: 0, size: crossesPageSize ?? 1 }, sortBy: [] },
      includeCrosses: crossesPageSize !== undefined,
      includeCatalogueCandidate,
    },
    fetchPolicy: 'network-only',
  })
  return {
    product: response.data.products.byId ? mapProduct(response.data.products.byId) : null,
    catalogueCandidate: response.data.catalogueCandidates?.byProductId
      ? mapCatalogueCandidate(response.data.catalogueCandidates.byProductId)
      : null,
  }
}

export async function getCatalogueCandidatesForReviewGraphql(options: {
  productId?: number
  sku?: string
  candidateMappingStatus: CandidateMappingStatus
  page: number
  size: number
}): Promise<{ candidates: CatalogueCandidateReviewModel[], total: number }> {
  if (options.productId !== undefined) {
    const response = await graphqlClient.query<CatalogueCandidateByProductIdResponse>({
      query: CatalogueCandidateByProductIdDocument,
      variables: { productId: options.productId },
      fetchPolicy: 'network-only',
    })
    const candidate = response.data.catalogueCandidates.byProductId
    const matchesStatus = candidate && (
      options.candidateMappingStatus === 'ALL'
      || (options.candidateMappingStatus === 'MAPPED') === Boolean(candidate.product)
    )
    return {
      candidates: matchesStatus ? [mapCatalogueCandidate(candidate)] : [],
      total: matchesStatus ? 1 : 0,
    }
  }

  const response = await graphqlClient.query<CatalogueCandidatesForReviewResponse>({
    query: CatalogueCandidatesForReviewDocument,
    variables: {
      input: {
        query: options.sku?.trim() || null,
        targets: ['CATALOGUE_CANDIDATES'],
        skuModes: ['EXACT'],
        nameModes: [],
        producerIds: [],
        pagination: { page: options.page, size: options.size },
        productSortBy: [],
        catalogueCandidateSortBy: [],
        candidateMappingStatus: options.candidateMappingStatus,
        includeHighlights: false,
      },
    },
    fetchPolicy: 'network-only',
  })
  const section = response.data.catalogue.search.catalogues
  return {
    candidates: section.items.map((item) => mapCatalogueCandidate(item.item)),
    total: section.total,
  }
}

export async function getCatalogueCandidateByIdGraphql(id: string): Promise<CatalogueCandidateReviewModel | null> {
  const response = await graphqlClient.query<CatalogueCandidateByIdResponse>({
    query: CatalogueCandidateByIdDocument,
    variables: { id },
    fetchPolicy: 'network-only',
  })
  const candidate = response.data.catalogueCandidates.byId
  return candidate ? mapCatalogueCandidate(candidate) : null
}

export async function candidateToCatalogueGraphql(id: string, selectedName?: string): Promise<boolean> {
  const response = await graphqlClient.mutate<CandidateToCatalogueResponse>({
    mutation: CandidateToCatalogueDocument,
    variables: { input: { id, selectedName: selectedName?.trim() || null } },
  })
  return Boolean(response.data?.catalogueCandidates.candidateToCatalogue.id)
}

export async function mapCandidateCrossesGraphql(
  candidateId: string,
  crossCandidateIds: string[],
  linkageType: GraphqlProductLinkageType,
): Promise<CatalogueCandidateReviewModel[]> {
  const response = await graphqlClient.mutate<MapCandidateCrossesResponse>({
    mutation: MapCandidateCrossesDocument,
    variables: { input: { candidateId, crossCandidateIds, linkageType } },
  })
  return (response.data?.catalogueCandidates.mapCrosses ?? []).map(mapCatalogueCandidate)
}

export async function searchProductsGraphql(options: {
  query?: string
  producerId?: number
  page: number
  size: number
  skuModes?: GraphqlSearchMatchType[]
  nameModes?: GraphqlSearchMatchType[]
  sortBy?: string[]
}): Promise<{ products: ProductSearchModel[]; total: number }> {
  const response = await searchCatalogueGraphql({
    query: options.query,
    producerIds: options.producerId === undefined ? [] : [options.producerId],
    page: options.page,
    size: options.size,
    skuModes: options.skuModes,
    nameModes: options.nameModes,
    productSortBy: options.sortBy,
    targets: ['PRODUCTS'],
    includeHighlights: true,
  })

  return {
    products: response.products.items,
    total: response.products.total,
  }
}

export async function searchCatalogueGraphql(options: {
  query?: string
  producerIds?: number[]
  page: number
  size: number
  skuModes?: GraphqlSearchMatchType[]
  nameModes?: GraphqlSearchMatchType[]
  productSortBy?: string[]
  catalogueCandidateSortBy?: string[]
  candidateMappingStatus?: CandidateMappingStatus
  targets?: Array<'PRODUCTS' | 'CATALOGUE_CANDIDATES'>
  includeHighlights?: boolean
}): Promise<{
  products: { items: ProductSearchModel[], total: number }
  catalogueCandidates: { items: CatalogueCandidateSearchModel[], total: number }
}> {
  const response = await graphqlClient.query<CatalogueSearchResponse>({
    query: CatalogueSearchDocument,
    variables: {
      input: {
        query: options.query?.trim() || null,
        targets: options.targets ?? ['PRODUCTS'],
        skuModes: options.skuModes ?? ['EXACT', 'STARTS_WITH', 'CONTAINS'],
        nameModes: options.nameModes ?? ['EXACT', 'STARTS_WITH', 'FUZZY'],
        producerIds: options.producerIds ?? [],
        pagination: { page: options.page, size: options.size },
        productSortBy: mapSortBy(options.productSortBy),
        catalogueCandidateSortBy: mapSortBy(options.catalogueCandidateSortBy),
        candidateMappingStatus: options.candidateMappingStatus ?? 'UNMAPPED',
        includeHighlights: options.includeHighlights ?? false,
      },
    },
    fetchPolicy: 'network-only',
  })

  return {
    products: {
      items: response.data.catalogue.search.products.items.map(mapSearchProduct),
      total: response.data.catalogue.search.products.total,
    },
    catalogueCandidates: {
      items: response.data.catalogue.search.catalogues.items.map(mapSearchCandidate),
      total: response.data.catalogue.search.catalogues.total,
    },
  }
}

export async function searchProducersGraphql(options: {
  query?: string
  page: number
  size: number
}): Promise<ProducerSearchModel[]> {
  const response = await graphqlClient.query<ProducerSearchResponse>({
    query: ProducerSearchDocument,
    variables: {
      input: {
        query: options.query?.trim() || null,
        pagination: { page: options.page, size: options.size },
      },
    },
    fetchPolicy: 'network-only',
  })
  return response.data.producers.search
}

export async function getProducersByIdsGraphql(ids: number[]): Promise<ProducerModel[]> {
  const response = await graphqlClient.query<ProducersByIdsResponse>({
    query: ProducersByIdsDocument,
    variables: { ids: [...new Set(ids)] },
    fetchPolicy: 'network-only',
  })
  return response.data.producers.byIds.map((producer) => ({ ...producer }))
}

export async function getProductAvailableStockGraphql(productId: number, storageCode: string): Promise<number> {
  const response = await graphqlClient.query<ProductAvailableStockResponse>({
    query: ProductAvailableStockDocument,
    variables: { id: productId, input: { storageCode } },
    fetchPolicy: 'network-only',
  })
  return response.data.products.byId?.availableStock ?? 0
}

export async function getProductsAvailableStockGraphql(
  productIds: number[],
  storageCode: string,
): Promise<Map<number, number>> {
  const response = await graphqlClient.query<ProductsAvailableStockResponse>({
    query: ProductsAvailableStockDocument,
    variables: { ids: [...new Set(productIds)], input: { storageCode } },
    fetchPolicy: 'network-only',
  })
  return new Map(response.data.products.byIds.map((product) => [product.id, product.availableStock]))
}

export async function getProductPairGraphql(productId: number): Promise<ProductModel | null> {
  const response = await graphqlClient.query<ProductPairResponse>({
    query: ProductPairDocument,
    variables: { id: productId },
    fetchPolicy: 'network-only',
  })
  const pair = response.data.products.byId?.pair
  return pair ? mapProduct(pair) : null
}

export async function getProductContentsGraphql(productId: number): Promise<ProductContentModel[]> {
  const response = await graphqlClient.query<ProductContentsResponse>({
    query: ProductContentsDocument,
    variables: { id: productId },
    fetchPolicy: 'network-only',
  })
  return (response.data.products.byId?.contents ?? []).map((item) => ({
    quantity: item.quantity,
    product: mapProduct(item.product),
  }))
}

export async function getProductCrossesGraphql(options: {
  productId: number
  page: number
  size: number
  sortBy?: string[]
}): Promise<ProductModel[]> {
  const response = await graphqlClient.query<ProductCrossesResponse>({
    query: ProductCrossesDocument,
    variables: {
      id: options.productId,
      input: {
        pagination: { page: options.page, size: options.size },
        sortBy: mapSortBy(options.sortBy),
      },
    },
    fetchPolicy: 'network-only',
  })
  return (response.data.products.byId?.crosses ?? []).map(mapProduct)
}

export async function getProductStorageContentsGraphql(options: {
  productId: number
  storageCode?: string
  page: number
  size: number
  showZeroCount?: boolean
  sortBy?: Array<{ field: string; isDescending: boolean }>
}): Promise<StorageContentModel[]> {
  const response = await graphqlClient.query<ProductStorageContentsResponse>({
    query: ProductStorageContentsDocument,
    variables: {
      id: options.productId,
      input: {
        pagination: { page: options.page, size: options.size },
        storageCode: options.storageCode,
        showZeroCount: options.showZeroCount ?? false,
        sortBy: options.sortBy ?? [],
      },
    },
    fetchPolicy: 'network-only',
  })
  return (response.data.products.byId?.storageContents ?? []).map(mapStorageContent)
}

export async function searchStorageContentsGraphql(options: {
  productId?: number
  storageCode?: string
  page: number
  size: number
  showZeroCount?: boolean
  sortBy?: Array<{ field: string; isDescending: boolean }>
}): Promise<StorageContentModel[]> {
  const response = await graphqlClient.query<StorageContentsSearchResponse>({
    query: StorageContentsSearchDocument,
    variables: {
      input: {
        productId: options.productId,
        storageCode: options.storageCode,
        pagination: { page: options.page, size: options.size },
        showZeroCount: options.showZeroCount ?? false,
        sortBy: options.sortBy ?? [],
      },
    },
    fetchPolicy: 'network-only',
  })
  return response.data.storageContents.search.map(mapStorageContent)
}
