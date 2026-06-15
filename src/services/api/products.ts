import type { ProductModel, ProductSizeModel, ProductWeightModel } from '@/models/productModel.ts'
import type {
  EditProductReservationModel,
  ProductReservationHistoryModel,
  NewProductReservationModel,
  ProductReservationModel,
} from '@/models/productReservationModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

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
  sortBy?: string
}

export interface GetProductCrossesResponse {
  crosses: ProductModel[]
  requestedArticle: ProductModel
}

export interface GetProductSizeResponse {
  productSize: ProductSizeModel
}

export interface GetProductWeightResponse {
  productWeight: ProductWeightModel
}

export interface GetProductReservationsRequest {
  productId?: number
  userId?: string
  showDeleted?: boolean
  page: number
  size: number
  sortBy?: string
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

export interface EditProductRequest {
  id: number
  sku?: string
  name?: string
  producerId?: number
  description?: string | null
  indicator?: string | null
}

export async function getProductCrosses(req: GetProductCrossesRequest): Promise<GetProductCrossesResponse> {
  const resp = await api.get<GetProductCrossesResponse>(`/main/products/${req.productId}/crosses/`, {
    params: {
      page: req.page,
      size: clampPageSize(req.size),
      sortBy: req.sortBy,
    },
  })

  return resp.data
}

export async function getProductReservations(req: GetProductReservationsRequest): Promise<GetProductReservationsResponse> {
  const resp = await api.get<GetProductReservationsResponse>('/main/products/reservations', {
    params: {
      productId: req.productId,
      userId: req.userId,
      showDeleted: req.showDeleted,
      page: req.page,
      size: clampPageSize(req.size),
      sortBy: req.sortBy,
    },
  })

  return resp.data
}

export async function createProductReservation(req: CreateProductReservationRequest): Promise<CreateProductReservationResponse> {
  const resp = await api.post<CreateProductReservationResponse>('/main/products/reservations', req)
  return resp.data
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
  // Backend PatchProductDto currently exposes ProducerId as JSON "productId".
  if (req.producerId !== undefined) payload.productId = patchField(req.producerId)
  if (req.description !== undefined) payload.description = patchField(req.description)
  if (req.indicator !== undefined) payload.indicator = patchField(req.indicator)

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
