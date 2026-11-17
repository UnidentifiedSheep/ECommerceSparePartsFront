import type {
  ProducerAliasModel,
  ProducerModel,
  ProducerSupplierMappingModel,
  Supplier,
} from '@/models/producerModel.ts'
import { clampPageSize } from '@/services/api/api.ts'
import { getProducersByIdsGraphql } from '@/services/graphql/products.ts'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import {
  ManagedProducersDocument, CreateProducerDocument, EditProducerDocument, DeleteProducerDocument,
  ProducerAliasesDocument, AddProducerAliasDocument, DeleteProducerAliasDocument,
  ProducerSupplierMappingsDocument, CreateProducerSupplierMappingDocument, DeleteProducerSupplierMappingDocument,
} from '@/graphql/generated/graphql'

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

export interface GetProducersRequest {
  searchTerm?: string
  ids?: number[]
  page: number
  limit: number
}

export interface GetProducersResponse {
  producers: ProducerModel[]
}

export interface CreateProducerRequest {
  name: string
  description?: string | null
}

export interface CreateProducerResponse {
  producer: ProducerModel
}

export interface EditProducerRequest {
  id: number
  name?: string
  description?: string | null
}

export interface EditProducerResponse {
  producer: ProducerModel
}

export interface GetProducerAliasesResponse {
  aliases: ProducerAliasModel[]
}

export interface AddProducerAliasRequest {
  producerId: number
  alias: string
}

export interface DeleteProducerAliasRequest {
  producerId: number
  alias: string
}

export interface GetProducerSupplierMappingsRequest {
  producerId: number
  suppliers?: Supplier[]
  page?: number
  limit?: number
}

export interface GetProducerSupplierMappingsResponse {
  mappings: ProducerSupplierMappingModel[]
}

export interface CreateProducerSupplierMappingRequest {
  producerId: number
  supplier: Supplier
  supplierProducerName: string
}

export interface CreateProducerSupplierMappingResponse {
  producerSupplierMapping: ProducerSupplierMappingModel
}

const supplierValues = { Armtek: 'ARMTEK', FavoritParts: 'FAVORIT_PARTS', Tmtr: 'TMTR' } as const
function mapSupplierMapping(item: { id: number; producer: { id: number }; supplier: string; supplierProducerName: string }): ProducerSupplierMappingModel {
  const supplier = item.supplier === 'ARMTEK' ? 'Armtek' : item.supplier === 'FAVORIT_PARTS' ? 'FavoritParts' : 'Tmtr'
  return { id: item.id, producerId: item.producer.id, supplier, supplierProducerName: item.supplierProducerName }
}

export async function getProducers(req: GetProducersRequest): Promise<GetProducersResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: ManagedProducersDocument, variables: { input: { searchTerm: req.searchTerm, ids: req.ids, pagination: { page: req.page, size: clampPageSize(req.limit) } } }, fetchPolicy: 'no-cache' }))
  return { producers: data.producers.list }
}

export async function getProducersByIds(ids: number[]): Promise<ProducerModel[]> {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) return []
  return getProducersByIdsGraphql(uniqueIds)
}

export async function createProducer(req: CreateProducerRequest): Promise<CreateProducerResponse> {
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateProducerDocument, variables: { input: req } }))
  if (!data) throw new Error('Producer creation returned no data')
  return { producer: data.producers.create }
}

export async function editProducer(req: EditProducerRequest): Promise<EditProducerResponse> {
  const payload: Record<string, PatchField<unknown>> = {}

  if (req.name !== undefined) payload.name = patchField(req.name)
  if (req.description !== undefined) payload.description = patchField(req.description)

  const { data } = await operationRequest(graphqlClient.mutate({ mutation: EditProducerDocument, variables: { producerId: req.id, input: payload } }))
  if (!data) throw new Error('Producer update returned no data')
  return { producer: data.producers.edit }
}

export async function deleteProducer(id: number) {
  await operationRequest(graphqlClient.mutate({ mutation: DeleteProducerDocument, variables: { id } }))
}

export async function getProducerAliases(producerId: number, page = 0, limit = 100): Promise<GetProducerAliasesResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: ProducerAliasesDocument, variables: { id: producerId }, fetchPolicy: 'no-cache' }))
  if (!data.producers.byId) throw new Error('Producer not found')
  const size = clampPageSize(limit)
  return { aliases: data.producers.byId.aliases.slice(page * size, (page + 1) * size).map(alias => ({ producerId, alias })) }
}

export async function addProducerAlias(req: AddProducerAliasRequest) {
  await operationRequest(graphqlClient.mutate({ mutation: AddProducerAliasDocument, variables: { input: req } }))
}

export async function deleteProducerAlias(req: DeleteProducerAliasRequest) {
  await operationRequest(graphqlClient.mutate({ mutation: DeleteProducerAliasDocument, variables: { input: req } }))
}

export async function getProducerSupplierMappings(
  req: GetProducerSupplierMappingsRequest,
): Promise<GetProducerSupplierMappingsResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: ProducerSupplierMappingsDocument, variables: { id: req.producerId }, fetchPolicy: 'no-cache' }))
  if (!data.producers.byId) throw new Error('Producer not found')
  const mappings = data.producers.byId.supplierMappings.map(mapSupplierMapping).filter(item => !req.suppliers?.length || req.suppliers.includes(item.supplier))
  const page = req.page ?? 0
  const size = clampPageSize(req.limit ?? 100)
  return { mappings: mappings.slice(page * size, (page + 1) * size) }
}

export async function createProducerSupplierMapping(
  req: CreateProducerSupplierMappingRequest,
): Promise<CreateProducerSupplierMappingResponse> {
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateProducerSupplierMappingDocument, variables: { input: { ...req, supplier: supplierValues[req.supplier] } } }))
  if (!data) throw new Error('Producer mapping creation returned no data')
  return { producerSupplierMapping: mapSupplierMapping(data.producers.createSupplierMapping) }
}

export async function deleteProducerSupplierMapping(producerId: number, mappingId: number): Promise<void> {
  void producerId
  await operationRequest(graphqlClient.mutate({ mutation: DeleteProducerSupplierMappingDocument, variables: { id: mappingId } }))
}
