import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { StorageRouteModel } from '@/models/storageRouteModel.ts'
import { mapUserModel, type UserModel } from '@/models/userModel.ts'
import type { StorageType } from '@/enums/storageType.ts'
import type { LogisticPricingType } from '@/enums/logisticPricingType.ts'
import type { RouteType } from '@/enums/routeType.ts'
import api, { clampPageSize } from '@/services/api/api.ts'
import { toUtcDateTimeString } from '@/utils/dateTime.ts'

interface PatchField<T> {
  isSet: boolean
  value: T
}

interface StorageRouteDto {
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

function patchField<T>(value: T): PatchField<T> {
  return {
    isSet: true,
    value,
  }
}

function mapStorageRoute(dto: StorageRouteDto): StorageRouteModel {
  return dto
}

export interface GetStoragesRequest {
  page: number
  limit: number
  searchTerm?: string
  type?: StorageType
}

export interface GetStoragesResponse {
  storages: StorageModel[]
}

export interface GetStorageRequest {
  name: string
}

export interface GetStorageResponse {
  storage: StorageModel
}

export interface CreateStorageRequest {
  name: string
  description?: string
  location?: string
  type: StorageType
}

export interface CreateStorageResponse {
  name: string
}

export interface EditStorageRequest {
  storageName: string
  description?: string
  location?: string
  type?: StorageType
}

export interface DeleteStorageRequest {
  name: string
}

export interface GetStorageOwnersResponse {
  owners: UserModel[]
}

export interface GetStorageOwnersRequest {
  storageName: string
  page: number
  size: number
}

export interface GetStorageRoutesRequest {
  from?: string
  to?: string
  isActive?: boolean
  page: number
  limit: number
}

export interface GetStorageRoutesResponse {
  storageRoutes: StorageRouteModel[]
}

export interface GetStorageRouteResponse {
  storageRoute: StorageRouteModel
}

export interface CreateStorageRouteRequest {
  storageFrom: string
  storageTo: string
  distance: number
  routeType: RouteType
  pricingType: LogisticPricingType
  deliveryTime: number
  priceKg: number
  priceM3: number
  currencyId: number
  pricePerOrder: number
  minimumPrice?: number
  carrierId?: string
}

export interface CreateStorageRouteResponse {
  routeId: string
}

export interface EditStorageRouteRequest {
  id: string
  distanceM?: number
  routeType?: RouteType
  pricingModel?: LogisticPricingType
  deliveryTimeMinutes?: number
  priceKg?: number
  pricePerM3?: number
  pricePerOrder?: number
  isActive?: boolean
  currencyId?: number
  minimumPrice?: number | null
  carrierId?: string | null
}

export interface GetStorageContentRequest {
  storageName?: string
  articleId?: number
  page: number
  limit: number
  showZeroContent?: boolean
}

export interface GetStorageContentResponse {
  content: StorageContentModel[]
}

export interface AddStorageContentItemRequest {
  productId: number
  currencyId: number
  buyPrice: number
  count: number
  purchaseDate: string
}

export interface AddStorageContentRequest {
  storageName: string
  storageContent: AddStorageContentItemRequest[]
}

export interface EditStorageContentRequest {
  id: number
  rowVersion: number
  count?: number
  purchaseDatetime?: string
  buyPrice?: number
  currencyId?: number
}

export async function getStorages(req: GetStoragesRequest): Promise<GetStoragesResponse> {
  const resp = await api.get<GetStoragesResponse>('/main/storages', {
    params: {
      ...req,
      limit: clampPageSize(req.limit),
    },
  })
  return resp.data
}

export async function getStorage(req: GetStorageRequest): Promise<GetStorageResponse> {
  const resp = await api.get<GetStorageResponse>(`/main/storages/${req.name}`)
  return resp.data
}

export async function createStorage(req: CreateStorageRequest): Promise<CreateStorageResponse> {
  const resp = await api.post<CreateStorageResponse>('/main/storages', req)
  return resp.data
}

export async function editStorage(req: EditStorageRequest) {
  const payload: Record<string, PatchField<unknown>> = {}

  if (req.description !== undefined) payload.description = patchField(req.description)
  if (req.location !== undefined) payload.location = patchField(req.location)
  if (req.type !== undefined) payload.type = patchField(req.type)

  await api.patch(`/main/storages/${req.storageName}`, {
    editStorage: payload,
  })
}

export async function deleteStorage(req: DeleteStorageRequest) {
  await api.delete(`/main/storages/${req.name}`)
}

export async function getStorageOwners(req: GetStorageOwnersRequest): Promise<GetStorageOwnersResponse> {
  const resp = await api.get<{ owners: UserModel[] }>(`/main/storages/${req.storageName}/owners`, {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })
  return {
    owners: resp.data.owners.map(mapUserModel),
  }
}

export async function getStorageRoutes(req: GetStorageRoutesRequest): Promise<GetStorageRoutesResponse> {
  const resp = await api.get<{ storageRoutes: StorageRouteDto[] }>(`/main/storages/routes`, {
    params: {
      ...req,
      limit: clampPageSize(req.limit),
    },
  })
  return {
    storageRoutes: resp.data.storageRoutes.map(mapStorageRoute),
  }
}

export async function getStorageRoute(id: string): Promise<GetStorageRouteResponse> {
  const resp = await api.get<{ storageRoute: StorageRouteDto }>(`/main/storages/routes/${id}`)
  return {
    storageRoute: mapStorageRoute(resp.data.storageRoute),
  }
}

export async function createStorageRoute(req: CreateStorageRouteRequest): Promise<CreateStorageRouteResponse> {
  const resp = await api.post<CreateStorageRouteResponse>('/main/storages/routes', req)
  return resp.data
}

export async function editStorageRoute(req: EditStorageRouteRequest) {
  const payload: Record<string, PatchField<unknown>> = {}

  if (req.distanceM !== undefined) payload.distanceM = patchField(req.distanceM)
  if (req.routeType !== undefined) payload.routeType = patchField(req.routeType)
  if (req.pricingModel !== undefined) payload.pricingModel = patchField(req.pricingModel)
  if (req.deliveryTimeMinutes !== undefined) payload.deliveryTimeMinutes = patchField(req.deliveryTimeMinutes)
  if (req.priceKg !== undefined) payload.priceKg = patchField(req.priceKg)
  if (req.pricePerM3 !== undefined) payload.pricePerM3 = patchField(req.pricePerM3)
  if (req.pricePerOrder !== undefined) payload.pricePerOrder = patchField(req.pricePerOrder)
  if (req.isActive !== undefined) payload.isActive = patchField(req.isActive)
  if (req.currencyId !== undefined) payload.currencyId = patchField(req.currencyId)
  if (req.minimumPrice !== undefined) payload.minimumPrice = patchField(req.minimumPrice)
  if (req.carrierId !== undefined) payload.carrierId = patchField(req.carrierId)

  await api.patch(`/main/storages/routes/${req.id}`, {
    patchStorageRoute: payload,
  })
}

export async function deleteStorageRoute(id: string) {
  await api.delete(`/main/storages/routes/${id}`)
}

export async function getStorageContent(req: GetStorageContentRequest): Promise<GetStorageContentResponse> {
  const resp = await api.get<GetStorageContentResponse>('/main/storages/content', {
    params: {
      ...req,
      limit: clampPageSize(req.limit),
    },
  })
  return resp.data
}

export async function addStorageContent(req: AddStorageContentRequest) {
  await api.post('/main/storages/content', {
    ...req,
    storageContent: req.storageContent.map((item) => ({
      ...item,
      purchaseDate: toUtcDateTimeString(item.purchaseDate),
    })),
  })
}

export async function editStorageContent(req: EditStorageContentRequest) {
  const model: Record<string, PatchField<unknown>> = {}

  if (req.count !== undefined) model.count = patchField(req.count)
  if (req.purchaseDatetime !== undefined) model.purchaseDatetime = patchField(toUtcDateTimeString(req.purchaseDatetime))
  if (req.buyPrice !== undefined) model.buyPrice = patchField(req.buyPrice)
  if (req.currencyId !== undefined) model.currencyId = patchField(req.currencyId)

  await api.patch('/main/storages/content', {
    editedFields: {
      [req.id]: {
        model,
        rowVersion: req.rowVersion,
      },
    },
  })
}

export async function deleteStorageContent(id: number, rowVersion: number) {
  await api.delete(`/main/storages/content/${id}`, {
    params: { rowVersion },
  })
}
