import type { StorageContentModel } from '@/models/storageContentModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { StorageType } from '@/enums/storageType.ts'
import { clampPageSize } from '@/services/api/api.ts'
import { toUtcDateTimeString } from '@/utils/dateTime.ts'
import { searchStorageContentsGraphql } from '@/services/graphql/products.ts'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { ManagedStoragesDocument, ManagedStorageDocument, CreateStorageDocument, EditStorageDocument, DeleteStorageDocument, AddStorageContentDocument, EditStorageContentsDocument, ZeroStorageContentDocument } from '@/graphql/generated/graphql'

const storageTypes = { Warehouse: 'WAREHOUSE', SupplierStorage: 'SUPPLIER_STORAGE' } as const
function mapStorage(storage: { code: string; description?: string | null; location?: string | null; type: 'WAREHOUSE' | 'SUPPLIER_STORAGE' }): StorageModel {
  return { code: storage.code, description: storage.description ?? undefined, location: storage.location ?? undefined, type: storage.type === 'WAREHOUSE' ? StorageType.Warehouse : StorageType.SupplierStorage }
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
  code: string
}

export interface GetStorageResponse {
  storage: StorageModel
}

export interface CreateStorageRequest {
  code: string
  description?: string
  location?: string
  type: StorageType
}

export interface CreateStorageResponse {
  code: string
}

export interface EditStorageRequest {
  storageCode: string
  description?: string
  location?: string
  type?: StorageType
}

export interface DeleteStorageRequest {
  code: string
}

export interface GetStorageContentRequest {
  storageCode?: string
  productId?: number
  page: number
  size?: number
  limit?: number
  showZeroContent?: boolean
  sortBy?: string[]
}

export interface GetStorageContentResponse {
  contents: StorageContentModel[]
}

export interface AddStorageContentItemRequest {
  productId: number
  currencyId: number
  buyPrice: number
  count: number
  purchaseDate: string
}

export interface AddStorageContentRequest {
  storageCode: string
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
  const { data } = await operationRequest(graphqlClient.query({ query: ManagedStoragesDocument, variables: { input: { pagination: { page: req.page, size: clampPageSize(req.limit) }, searchTerm: req.searchTerm, type: req.type ? storageTypes[req.type] : undefined } }, fetchPolicy: 'no-cache' }))
  return { storages: data.storages.list.map(mapStorage) }
}

export async function getStorage(req: GetStorageRequest): Promise<GetStorageResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: ManagedStorageDocument, variables: { code: req.code }, fetchPolicy: 'no-cache' }))
  if (!data.storages.byCode) throw new Error('Storage not found')
  return { storage: mapStorage(data.storages.byCode) }
}

export async function createStorage(req: CreateStorageRequest): Promise<CreateStorageResponse> {
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateStorageDocument, variables: { input: { ...req, type: storageTypes[req.type] } } }))
  if (!data) throw new Error('Storage creation returned no data')
  return { code: data.storages.create.code }
}

export async function editStorage(req: EditStorageRequest) {
  const payload: Record<string, PatchField<unknown>> = {}

  if (req.description !== undefined) payload.description = patchField(req.description)
  if (req.location !== undefined) payload.location = patchField(req.location)
  if (req.type !== undefined) payload.type = patchField(storageTypes[req.type])

  await operationRequest(graphqlClient.mutate({ mutation: EditStorageDocument, variables: { code: req.storageCode, input: payload } }))
}

export async function deleteStorage(req: DeleteStorageRequest) {
  await operationRequest(graphqlClient.mutate({ mutation: DeleteStorageDocument, variables: { code: req.code } }))
}

export async function getStorageContent(req: GetStorageContentRequest): Promise<GetStorageContentResponse> {
  const size = req.size ?? req.limit ?? 20

  return {
    contents: await searchStorageContentsGraphql({
      productId: req.productId,
      storageCode: req.storageCode,
      page: req.page,
      size: clampPageSize(size),
      showZeroCount: req.showZeroContent,
      sortBy: req.sortBy,
    }),
  }
}

export async function addStorageContent(req: AddStorageContentRequest) {
  await operationRequest(graphqlClient.mutate({ mutation: AddStorageContentDocument, variables: { input: { storageCode: req.storageCode, items: req.storageContent.map(item => ({ ...item, purchaseDate: toUtcDateTimeString(item.purchaseDate) })) } } }))
}

export async function editStorageContent(req: EditStorageContentRequest) {
  const model: Record<string, PatchField<unknown>> = {}

  if (req.count !== undefined) model.count = patchField(req.count)
  if (req.purchaseDatetime !== undefined) model.purchaseDatetime = patchField(toUtcDateTimeString(req.purchaseDatetime))
  if (req.buyPrice !== undefined) model.buyPrice = patchField(req.buyPrice)
  if (req.currencyId !== undefined) model.currencyId = patchField(req.currencyId)

  await operationRequest(graphqlClient.mutate({ mutation: EditStorageContentsDocument, variables: { items: [{ id: req.id, rowVersion: req.rowVersion, ...model }] } }))
}

export async function deleteStorageContent(id: number, rowVersion: number) {
  await operationRequest(graphqlClient.mutate({ mutation: ZeroStorageContentDocument, variables: { contentId: id, rowVersion } }))
}
