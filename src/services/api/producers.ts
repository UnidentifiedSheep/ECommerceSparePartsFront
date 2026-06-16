import type { ProducerModel, ProducerOtherNameModel } from '@/models/producerModel.ts'
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

export interface GetProducerOtherNamesResponse {
  names: ProducerOtherNameModel[]
}

export interface AddProducerOtherNameRequest {
  producerId: number
  otherName: string
  whereUsed: string
}

export interface DeleteProducerOtherNameRequest {
  producerId: number
  otherName: string
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

export async function getProducerOtherNames(producerId: number, page = 0, limit = 100): Promise<GetProducerOtherNamesResponse> {
  const resp = await api.get<GetProducerOtherNamesResponse>(`/main/producers/${producerId}/names`, {
    params: { page, limit: clampPageSize(limit) },
  })
  return resp.data
}

export async function addProducerOtherName(req: AddProducerOtherNameRequest) {
  await api.post(`/main/producers/${req.producerId}/names`, {
    otherName: req.otherName,
    whereUsed: req.whereUsed,
  })
}

export async function deleteProducerOtherName(req: DeleteProducerOtherNameRequest) {
  await api.delete(`/main/producers/${req.producerId}/names/${encodeURIComponent(req.otherName)}`)
}
