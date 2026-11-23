import api, { clampPageSize } from '@/services/api/api.ts'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { gqlSort } from '@/services/graphql/sorting'
import { toUtcDateTimeString } from '@/utils/dateTime'
import { t } from '@/i18n'
import { AvailableJobsDocument, SearchJobsDocument, JobByIdDocument, JobStateByIdDocument, CreateJobDocument, CancelJobDocument, SearchJobSchedulesDocument, CreateJobScheduleDocument, UpdateJobScheduleDocument, RemoveJobScheduleDocument, type JobFieldsFragment, type JobScheduleFieldsFragment, type JobStatus as GqlJobStatus } from '@/graphql/generated/graphql'
import { normalizeObjectSchema, type CsvColumnSchema, type ObjectSchema, type SchemaUiField } from '@/models/schemaModel.ts'

export interface JobDefinitionModel {
  systemName: string
  name: string
  description: string
  initStateSchema: ObjectSchema
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

export interface JobModel {
  id: string
  isStep: boolean
  multiStepJobId: string | null
  systemName: string
  status: string
  attempts: number
  maxAttempts: number
  errorMessage: string | null
  lockedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  stepKey?: string | null
  inputInitialized?: boolean
}

export type JobStatus =
  | 'Pending'
  | 'Locked'
  | 'Processing'
  | 'Failed'
  | 'Succeeded'
  | 'CancellationRequested'
  | 'Cancelled'
  | 'Waiting'
  | 'Blocked'

export interface GetServiceJobsRequest {
  page: number
  size: number
  systemNames?: string[]
  statuses?: JobStatus[]
  sortBy?: string[]
}

export interface GetServiceJobsResponse {
  jobs: JobModel[]
}

export interface GetJobStateResponse {
  state: string
  output?: string | null
  inputInitialized?: boolean
}

export interface CreateJobRequest {
  systemName: string
  inputState: string
  maxAttempts: number
}

export interface CreateJobResponse {
  job: JobModel
}

export interface JobScheduleModel {
  id: string
  name: string
  description: string | null
  jobSystemName: string
  inputState: string
  maxAttempts: number
  cron: string
  localizedCron: string
  lastQueuedAt: string | null
  nextRunAt: string | null
  enabled: boolean
}

export interface GetJobSchedulesRequest {
  page: number
  size: number
  systemNames?: string[]
  nextRunFrom?: string | null
  nextRunTo?: string | null
  sortBy?: string[]
}

export interface GetJobSchedulesResponse {
  schedules: JobScheduleModel[]
}

export interface NewJobScheduleRequest {
  name: string
  description?: string | null
  jobSystemName: string
  inputState: string
  maxAttempts: number
  cron: string
  enabled: boolean
}

export interface CreateJobScheduleResponse {
  schedule: JobScheduleModel
}

interface PatchField<T> {
  isSet: boolean
  value: T
}

export interface PatchJobScheduleRequest {
  name?: PatchField<string>
  description?: PatchField<string | null>
  inputState?: PatchField<string>
  maxAttempts?: PatchField<number>
  cron?: PatchField<string>
  enabled?: PatchField<boolean>
}

export interface UpdateJobScheduleResponse {
  schedule: JobScheduleModel
}

export type JobSchemaField = SchemaUiField
export type JobCsvSchemaField = CsvColumnSchema
export type JobInitStateSchema = ObjectSchema

export interface ServiceJobDefinition {
  serviceKey: string
  service: JobsServiceModel
  job: JobDefinitionModel
}

export interface NamedObjectModel {
  systemName: string
  name: string | null
  description: string | null
}

export interface GetNamedObjectsResponse {
  namedObjects: NamedObjectModel[]
}

export async function getGatewayJobs(): Promise<GetGatewayJobsResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: AvailableJobsDocument, fetchPolicy: 'no-cache' }))
  return { services: { main: { available: true, statusCode: null, error: null, jobs: data.jobs.available.map(job => ({ ...job, initStateSchema: normalizeObjectSchema(job.initStateSchema) })) } } }
}

function requireMain(serviceKey: string) { if (serviceKey.toLowerCase() !== 'main') throw new Error(t('jobs.serviceUnavailable')) }
export function mapJob(job: JobFieldsFragment): JobModel {
  return { ...job, systemName: job.info?.systemName ?? '', status: job.status.toLowerCase().replace(/(^|_)([a-z])/g, (_, _prefix, letter: string) => letter.toUpperCase()), multiStepJobId: job.multiStepJob?.id ?? null, createdBy: job.createdBy?.id ?? null }
}
function mapSchedule(schedule: JobScheduleFieldsFragment): JobScheduleModel { return { ...schedule, jobSystemName: schedule.jobInfo?.systemName ?? '' } }

export async function getServiceJobs(serviceKey: string, req: GetServiceJobsRequest): Promise<GetServiceJobsResponse> {
  requireMain(serviceKey)
  const { data } = await operationRequest(graphqlClient.query({ query: SearchJobsDocument, variables: { input: { pagination: { page: req.page, size: clampPageSize(req.size) }, systemNames: req.systemNames ?? [], statuses: req.statuses?.map(status => status.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase() as GqlJobStatus) ?? [], sortBy: gqlSort('Job', req.sortBy) } }, fetchPolicy: 'no-cache' }))
  return { jobs: data.jobs.search.map(mapJob) }
}

export async function getServiceJobState(serviceKey: string, jobId: string): Promise<GetJobStateResponse> {
  requireMain(serviceKey)
  const { data } = await operationRequest(graphqlClient.query({ query: JobStateByIdDocument, variables: { id: jobId }, fetchPolicy: 'no-cache' }))
  if (!data.jobs.byId) throw new Error(t('jobs.notFound'))
  return data.jobs.byId.state
}

export async function getServiceJob(serviceKey: string, jobId: string): Promise<CreateJobResponse> {
  requireMain(serviceKey)
  const { data } = await operationRequest(graphqlClient.query({ query: JobByIdDocument, variables: { id: jobId }, fetchPolicy: 'no-cache' }))
  if (!data.jobs.byId) throw new Error(t('jobs.notFound'))
  return { job: mapJob(data.jobs.byId) }
}

export async function createServiceJob(serviceKey: string, req: CreateJobRequest): Promise<CreateJobResponse> {
  requireMain(serviceKey)
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateJobDocument, variables: { input: req } }))
  if (!data) throw new Error(t('jobs.requestFailed'))
  return { job: mapJob(data.jobs.create) }
}

export async function cancelServiceJob(serviceKey: string, jobId: string): Promise<void> {
  requireMain(serviceKey)
  await operationRequest(graphqlClient.mutate({ mutation: CancelJobDocument, variables: { id: jobId } }))
}

export function patchField<T>(value: T): PatchField<T> {
  return {
    isSet: true,
    value,
  }
}

export async function getServiceJobSchedules(
  serviceKey: string,
  req: GetJobSchedulesRequest,
): Promise<GetJobSchedulesResponse> {
  requireMain(serviceKey)
  const { data } = await operationRequest(graphqlClient.query({ query: SearchJobSchedulesDocument, variables: { input: { pagination: { page: req.page, size: clampPageSize(req.size) }, jobSystemNames: req.systemNames ?? [], nextRunFrom: req.nextRunFrom ? toUtcDateTimeString(req.nextRunFrom) : undefined, nextRunTo: req.nextRunTo ? toUtcDateTimeString(req.nextRunTo) : undefined, sortBy: gqlSort('JobSchedule', req.sortBy) } }, fetchPolicy: 'no-cache' }))
  return { schedules: data.jobSchedules.search.map(mapSchedule) }
}

export async function createServiceJobSchedule(
  serviceKey: string,
  req: NewJobScheduleRequest,
): Promise<CreateJobScheduleResponse> {
  requireMain(serviceKey)
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateJobScheduleDocument, variables: { input: req } }))
  if (!data) throw new Error(t('jobs.requestFailed'))
  return { schedule: mapSchedule(data.jobSchedules.create) }
}

export async function updateServiceJobSchedule(
  serviceKey: string,
  scheduleId: string,
  patch: PatchJobScheduleRequest,
): Promise<UpdateJobScheduleResponse> {
  requireMain(serviceKey)
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: UpdateJobScheduleDocument, variables: { input: { scheduleId, ...patch } } }))
  if (!data) throw new Error(t('jobs.requestFailed'))
  return { schedule: mapSchedule(data.jobSchedules.update) }
}

export async function deleteServiceJobSchedule(serviceKey: string, scheduleId: string): Promise<void> {
  requireMain(serviceKey)
  await operationRequest(graphqlClient.mutate({ mutation: RemoveJobScheduleDocument, variables: { id: scheduleId } }))
}

export async function getServiceNamedObjects(serviceKey: string, groupName: string): Promise<GetNamedObjectsResponse> {
  const resp = await api.get<GetNamedObjectsResponse>(`/${serviceKey}/named-objects/${encodeURIComponent(groupName)}`)
  return resp.data
}
