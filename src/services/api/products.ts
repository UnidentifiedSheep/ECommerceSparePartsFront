import type { ProductContentModel, ProductModel, ProductSizeModel, ProductWeightModel } from '@/models/productModel.ts'
import type {
  EditProductReservationModel,
  ProductReservationHistoryModel,
  NewProductReservationModel,
  ProductReservationModel,
} from '@/models/productReservationModel.ts'
import { mapOrganizationModel, type OrganizationDto } from '@/models/organizationModel.ts'
import type { CatalogueCandidateReviewModel } from '@/models/catalogueCandidateModel.ts'
import type {
  CandidateMappingStatus,
  ProductLinkageType as CandidateCrossLinkageType,
} from '@/graphql/generated/graphql.ts'
import api, { clampPageSize } from '@/services/api/api.ts'
import {
  getProductAvailableStockGraphql,
  getProductsAvailableStockGraphql,
  getProductByIdGraphql,
  getCatalogueCandidatesForReviewGraphql,
  getCatalogueCandidateByIdGraphql,
  candidateToCatalogueGraphql,
  mapCandidateCrossesGraphql,
  getProductContentsGraphql,
  getProductCrossesGraphql,
  getProductPairGraphql,
} from '@/services/graphql/products.ts'

export interface CreateProductRequestItem {
  sku: string
  name: string
  producerId: number
  description?: string | null
  indicator?: string | null
  categoryId?: number | null
}

export interface CreateProductsRequest {
  newProducts: CreateProductRequestItem[]
}

export interface CreateProductsResponse {
  createdIds: number[]
}

export type ProductLinkageType =
  | 0
  | 1
  | 2
  | 3

export interface ProductLinkageRequestItem {
  productId: number
  crossProductId: number
  linkageType: ProductLinkageType
}

export interface CreateProductCrossesRequest {
  linkages: ProductLinkageRequestItem[]
}

export interface GetProductCrossesRequest {
  productId: number
  page: number
  size: number
  sortBy?: string[]
}

export interface GetProductCrossesResponse {
  crosses: ProductModel[]
}

export interface GetProductByIdResponse {
  product: ProductModel
  catalogueCandidate: CatalogueCandidateReviewModel | null
}

export interface GetProductSizeResponse {
  productSize: ProductSizeModel
}

export interface GetProductWeightResponse {
  productWeight: ProductWeightModel
}

export interface GetProductAvailableStockResponse {
  availableStock: number
}

export interface GetCatalogueCandidatesForReviewRequest {
  productId?: number
  sku?: string
  candidateMappingStatus: CandidateMappingStatus
  page: number
  size: number
}

export interface GetCatalogueCandidatesForReviewResponse {
  candidates: CatalogueCandidateReviewModel[]
  total: number
}

export interface GetProductPairResponse {
  pair: ProductModel | null
}

export interface GetProductContentResponse {
  content: ProductContentModel[]
}

export interface AddProductContentRequest {
  productId: number
  childProductId: number
  count: number
}

export interface EditProductContentRequest {
  productId: number
  childProductId: number
  count: number
}

export interface AddProductCharacteristicRequest {
  productId: number
  name: string
  value: string
}

export interface EditProductCharacteristicRequest {
  productId: number
  name: string
  value: string
}

export interface GetProductReservationsRequest {
  productId?: number
  organizationId?: string
  showDeleted?: boolean
  page: number
  size: number
  sortBy?: string[]
}

export interface GetProductReservationsResponse {
  reservations: ProductReservationModel[]
}

export interface CreateProductReservationRequest {
  reservation: NewProductReservationModel
}

export interface CreateProductReservationResponse {
  reservation: ProductReservationModel
}

export interface GetProductReservationHistoryRequest {
  reservationId: number
  page: number
  size: number
}

export interface GetProductReservationHistoryResponse {
  history: ProductReservationHistoryModel[]
}

interface ProductReservationDto extends Omit<ProductReservationModel, 'organization'> {
  organization: OrganizationDto
}

export type DimensionUnit = 0 | 1 | 2
export type WeightUnit = 0 | 1 | 2

export interface SetProductSizeRequest {
  length: number
  width: number
  height: number
  unit: DimensionUnit
}

export interface SetProductWeightRequest {
  weight: number
  unit: WeightUnit
}

interface PatchField<T> {
  isSet: boolean
  value: T
}

function patchField<T>(value: T): PatchField<T> {
  return {
    isSet: true,
    value,
  }
}

function mapProductReservationModel(dto: ProductReservationDto): ProductReservationModel {
  return {
    ...dto,
    organization: mapOrganizationModel(dto.organization),
  }
}

export interface EditProductRequest {
  id: number
  sku?: string
  name?: string
  producerId?: number
  description?: string | null
  indicator?: string | null
  pairId?: number | null
}

export async function getProductCrosses(req: GetProductCrossesRequest): Promise<GetProductCrossesResponse> {
  return {
    crosses: await getProductCrossesGraphql({
      ...req,
      size: clampPageSize(req.size),
    }),
  }
}

export async function getProductById(
  productId: number,
  includeCatalogueCandidate = false,
  crossesPageSize?: number,
): Promise<GetProductByIdResponse> {
  const { product, catalogueCandidate } = await getProductByIdGraphql(
    productId,
    includeCatalogueCandidate,
    crossesPageSize === undefined ? undefined : clampPageSize(crossesPageSize),
  )
  if (!product) throw new Error(`Product ${productId} not found`)
  return { product, catalogueCandidate }
}

export async function getProductReservations(req: GetProductReservationsRequest): Promise<GetProductReservationsResponse> {
  const resp = await api.get<{ reservations: ProductReservationDto[] }>('/main/products/reservations', {
    params: {
      productId: req.productId,
      organizationId: req.organizationId,
      showDeleted: req.showDeleted,
      page: req.page,
      size: clampPageSize(req.size),
      sortBy: req.sortBy,
    },
  })

  return {
    reservations: resp.data.reservations.map(mapProductReservationModel),
  }
}

export async function getProductAvailableStock(
  productId: number,
  storageCode: string,
): Promise<GetProductAvailableStockResponse> {
  return {
    availableStock: await getProductAvailableStockGraphql(productId, storageCode),
  }
}

export async function getProductsAvailableStock(
  productIds: number[],
  storageCode: string,
): Promise<Map<number, number>> {
  if (productIds.length === 0) return new Map()
  return getProductsAvailableStockGraphql(productIds, storageCode)
}

export async function getCatalogueCandidatesForReview(
  req: GetCatalogueCandidatesForReviewRequest,
): Promise<GetCatalogueCandidatesForReviewResponse> {
  return getCatalogueCandidatesForReviewGraphql({
    ...req,
    size: clampPageSize(req.size),
  })
}

export async function getCatalogueCandidateById(id: string): Promise<CatalogueCandidateReviewModel | null> {
  return getCatalogueCandidateByIdGraphql(id)
}

export async function candidateToCatalogue(id: string, selectedName?: string): Promise<boolean> {
  return candidateToCatalogueGraphql(id, selectedName)
}

export async function mapCandidateCrosses(
  candidateId: string,
  crossCandidateIds: string[],
  linkageType: CandidateCrossLinkageType,
): Promise<CatalogueCandidateReviewModel[]> {
  return mapCandidateCrossesGraphql(candidateId, crossCandidateIds, linkageType)
}

export async function getProductPair(productId: number): Promise<GetProductPairResponse> {
  return { pair: await getProductPairGraphql(productId) }
}

export async function getProductContent(productId: number): Promise<GetProductContentResponse> {
  return { content: await getProductContentsGraphql(productId) }
}

export async function addProductContent(req: AddProductContentRequest): Promise<void> {
  await api.post(`/main/products/${req.productId}/contents`, {
    content: {
      [req.childProductId]: req.count,
    },
  })
}

export async function editProductContent(req: EditProductContentRequest): Promise<void> {
  await api.patch(`/main/products/${req.productId}/contents/${req.childProductId}`, {
    count: req.count,
  })
}

export async function deleteProductContent(productId: number, childProductId: number): Promise<void> {
  await api.delete(`/main/products/${productId}/contents/${childProductId}`)
}

export async function addProductCharacteristic(req: AddProductCharacteristicRequest): Promise<void> {
  await api.post('/main/products/characteristics/', {
    characteristics: [
      {
        productId: req.productId,
        name: req.name,
        value: req.value,
      },
    ],
  })
}

export async function editProductCharacteristic(req: EditProductCharacteristicRequest): Promise<void> {
  await api.patch(`/main/products/${req.productId}/characteristics/${encodeURIComponent(req.name)}`, {
    value: {
      value: patchField(req.value),
    },
  })
}

export async function deleteProductCharacteristic(productId: number, name: string): Promise<void> {
  await api.delete(`/main/products/${productId}/characteristics/${encodeURIComponent(name)}`)
}

export async function createProductReservation(req: CreateProductReservationRequest): Promise<CreateProductReservationResponse> {
  const resp = await api.post<{ reservation: ProductReservationDto }>('/main/products/reservations', req)
  return {
    reservation: mapProductReservationModel(resp.data.reservation),
  }
}

export async function editProductReservation(reservationId: number, newValue: EditProductReservationModel): Promise<void> {
  await api.put(`/main/products/reservations/${reservationId}`, {
    newValue,
  })
}

export async function deleteProductReservation(reservationId: number): Promise<void> {
  await api.delete(`/main/products/reservations/${reservationId}`)
}

export async function getProductReservationHistory(
  req: GetProductReservationHistoryRequest,
): Promise<GetProductReservationHistoryResponse> {
  const resp = await api.get<GetProductReservationHistoryResponse>(`/main/products/reservations/${req.reservationId}/history`, {
    params: {
      page: req.page,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}

export async function createProducts(req: CreateProductsRequest): Promise<CreateProductsResponse> {
  const resp = await api.post<CreateProductsResponse>('/main/products', req)
  return resp.data
}

export async function createProductCrosses(req: CreateProductCrossesRequest): Promise<void> {
  await api.post('/main/products/crosses', req)
}

export async function editProduct(req: EditProductRequest): Promise<void> {
  const payload: Record<string, PatchField<unknown>> = {}

  if (req.sku !== undefined) payload.sku = patchField(req.sku)
  if (req.name !== undefined) payload.name = patchField(req.name)
  if (req.producerId !== undefined) payload.producerId = patchField(req.producerId)
  if (req.description !== undefined) payload.description = patchField(req.description)
  if (req.indicator !== undefined) payload.indicator = patchField(req.indicator)
  if (req.pairId !== undefined) payload.pairId = patchField(req.pairId)

  await api.patch(`/main/products/${req.id}`, {
    patchProduct: payload,
  })
}

export async function uploadProductImages(productId: number, files: File[]): Promise<void> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  await api.post(`/main/products/${productId}/imgs/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function deleteProductImage(productId: number, imagePath: string): Promise<void> {
  await api.delete(`/main/products/${productId}/imgs`, {
    params: {
      imagePath,
    },
  })
}

export async function getProductSize(productId: number): Promise<GetProductSizeResponse> {
  const resp = await api.get<GetProductSizeResponse>(`/main/products/${productId}/sizes`)
  return resp.data
}

export async function setProductSize(productId: number, req: SetProductSizeRequest): Promise<void> {
  await api.put(`/main/products/${productId}/sizes`, req)
}

export async function deleteProductSize(productId: number): Promise<void> {
  await api.delete(`/main/products/${productId}/sizes`)
}

export async function getProductWeight(productId: number): Promise<GetProductWeightResponse> {
  const resp = await api.get<GetProductWeightResponse>(`/main/products/${productId}/weights`)
  return resp.data
}

export async function setProductWeight(productId: number, req: SetProductWeightRequest): Promise<void> {
  await api.put(`/main/products/${productId}/weights`, req)
}

export async function deleteProductWeight(productId: number): Promise<void> {
  await api.delete(`/main/products/${productId}/weights`)
}
