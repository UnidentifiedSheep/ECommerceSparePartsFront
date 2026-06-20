import api from '@/services/api/api.ts'

export interface JobDefinitionModel {
  systemName: string
  name: string
  description: string
  initStateSchema: string
}

export interface JobsServiceModel {
  available: boolean
  statusCode: number | null
  jobs: JobDefinitionModel[]
  error: string | null
}

export interface GetGatewayJobsResponse {
  services: Record<string, JobsServiceModel>
}

interface GatewayServiceJobsDto {
  serviceName: string
  available: boolean
  jobs: JobDefinitionModel[]
}

interface GetAggregatedAvailableJobsResponse {
  jobs: GatewayServiceJobsDto[]
}

export interface JobModel {
  id: string
  systemName: string
  status: string
  attempts: number
  maxAttempts: number
  errorMessage: string | null
  lockedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export type JobStatus =
  | 'Pending'
  | 'Locked'
  | 'Processing'
  | 'Failed'
  | 'Succeeded'
  | 'Cancelled'

export interface GetServiceJobsRequest {
  page: number
  size: number
  systemNames?: string[]
  statuses?: JobStatus[]
  sortBy?: string
}

export interface GetServiceJobsResponse {
  jobs: JobModel[]
}

export interface GetJobStateResponse {
  state: string
}

export interface CreateJobRequest {
  systemName: string
  inputState: string
  maxAttempts: number
}

export interface CreateJobResponse {
  job: JobModel
}

export type JobSchemaFieldControl = 'UploadFile' | 'TextField' | string

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
  const resp = await api.get<GetAggregatedAvailableJobsResponse>('/jobs/available')
  return {
    services: Object.fromEntries(resp.data.jobs.map((service) => [
      service.serviceName,
      {
        available: service.available,
        statusCode: null,
        jobs: service.jobs,
        error: null,
      },
    ])),
  }
}

export async function getServiceJobs(serviceKey: string, req: GetServiceJobsRequest): Promise<GetServiceJobsResponse> {
  const params = new URLSearchParams()
  params.append('page', String(req.page))
  params.append('size', String(req.size))
  if (req.sortBy) params.append('sortBy', req.sortBy)
  req.systemNames?.forEach((systemName) => params.append('systemName', systemName))
  req.statuses?.forEach((status) => params.append('status', status))

  const resp = await api.get<GetServiceJobsResponse>(`/${serviceKey}/jobs`, {
    params,
  })
  return resp.data
}

export async function getServiceJobState(serviceKey: string, jobId: string): Promise<GetJobStateResponse> {
  const resp = await api.get<GetJobStateResponse>(`/${serviceKey}/jobs/${jobId}/state`)
  return resp.data
}

export async function createServiceJob(serviceKey: string, req: CreateJobRequest): Promise<CreateJobResponse> {
  const resp = await api.post<CreateJobResponse>(`/${serviceKey}/jobs`, req)
  return resp.data
}
