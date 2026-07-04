import type { ProducerAliasModel, ProducerModel } from '@/models/producerModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

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
  page: number
  limit: number
}

export interface GetProducersResponse {
  producers: ProducerModel[]
}

export interface GetProducerResponse {
  producer: ProducerModel
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

interface ProducerAliasWireModel {
  producerId: number
  alias: string
}

interface GetProducerAliasesWireResponse {
  aliases: ProducerAliasWireModel[]
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

function toProducerAlias(item: ProducerAliasWireModel): ProducerAliasModel {
  return {
    producerId: item.producerId,
    alias: item.alias,
  }
}

export async function getProducers(req: GetProducersRequest): Promise<GetProducersResponse> {
  const resp = await api.get<GetProducersResponse>('/main/producers', {
    params: {
      ...req,
      limit: clampPageSize(req.limit),
    },
  })
  return resp.data
}

export async function getProducer(id: number): Promise<GetProducerResponse> {
  const resp = await api.get<GetProducerResponse>(`/main/producers/${id}`)
  return resp.data
}

export async function createProducer(req: CreateProducerRequest): Promise<CreateProducerResponse> {
  const resp = await api.post<CreateProducerResponse>('/main/producers', {
    newProducer: req,
  })

  return resp.data
}

export async function editProducer(req: EditProducerRequest): Promise<EditProducerResponse> {
  const payload: Record<string, PatchField<unknown>> = {}

  if (req.name !== undefined) payload.name = patchField(req.name)
  if (req.description !== undefined) payload.description = patchField(req.description)

  const resp = await api.patch<EditProducerResponse>(`/main/producers/${req.id}`, {
    editProducer: payload,
  })

  return resp.data
}

export async function deleteProducer(id: number) {
  await api.delete(`/main/producers/${id}`)
}

export async function getProducerAliases(producerId: number, page = 0, limit = 100): Promise<GetProducerAliasesResponse> {
  const resp = await api.get<GetProducerAliasesWireResponse>(`/main/producers/${producerId}/aliases`, {
    params: { page, limit: clampPageSize(limit) },
  })
  return {
    aliases: resp.data.aliases.map(toProducerAlias),
  }
}

export async function addProducerAlias(req: AddProducerAliasRequest) {
  await api.post(`/main/producers/${req.producerId}/aliases`, {
    alias: req.alias,
  })
}

export async function deleteProducerAlias(req: DeleteProducerAliasRequest) {
  await api.delete(`/main/producers/${req.producerId}/aliases/${encodeURIComponent(req.alias)}`)
}
