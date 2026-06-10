import api from '@/services/api/api.ts'

export interface JobDefinitionModel {
  systemName: string
  name: string
  description: string
  initStateSchema: string
}

export interface JobsServiceModel {
  available: boolean
  statusCode: number
  jobs: JobDefinitionModel[]
  error: string | null
}

export interface GetGatewayJobsResponse {
  services: Record<string, JobsServiceModel>
}

export interface JobModel {
  id: string
  systemName: string
  state: string
  status: string
  attempts: number
  maxAttempts: number
  errorMessage: string | null
  lockedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export interface CreateJobRequest {
  systemName: string
  inputState: string
  maxAttempts: number
}

export interface CreateJobResponse {
  job: JobModel
}

export type JobSchemaFieldControl = 'UploadFile' | string

export interface JobSchemaField {
  name: string
  type: string
  label?: string
  description?: string
  required?: boolean
  control?: JobSchemaFieldControl
  accepts?: string[]
}

export interface JobInitStateSchema {
  fields: JobSchemaField[]
}

export interface ServiceJobDefinition {
  serviceKey: string
  service: JobsServiceModel
  job: JobDefinitionModel
}

export async function getGatewayJobs(): Promise<GetGatewayJobsResponse> {
  const resp = await api.get<GetGatewayJobsResponse>('/jobs')
  return resp.data
}

export async function createServiceJob(serviceKey: string, req: CreateJobRequest): Promise<CreateJobResponse> {
  const resp = await api.post<CreateJobResponse>(`/${serviceKey}/jobs`, req)
  return resp.data
}
