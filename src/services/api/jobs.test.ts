import { beforeEach, describe, expect, it, vi } from 'vitest'
import { graphqlClient } from '@/services/graphql/client'
import { getGatewayJobs, getServiceJobs, getServiceJob, getServiceJobState, createServiceJob, cancelServiceJob, getServiceJobSchedules, createServiceJobSchedule, updateServiceJobSchedule, deleteServiceJobSchedule, patchField, mapJob } from './jobs'
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('./api', () => ({ default: { get: vi.fn() }, clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
const job = { id: 'job-1', isStep: true, stepKey: 'step', inputInitialized: true, multiStepJob: { id: 'parent' }, info: { systemName: 'Test', name: 'Task', description: '' }, status: 'CANCELLATION_REQUESTED' as const, attempts: 2, maxAttempts: 3, errorMessage: null, lockedAt: null, createdAt: '2026-11-23T00:00:00Z', updatedAt: '2026-11-23T00:00:00Z', createdBy: { id: 'user' } }
const schedule = { id: 'schedule', name: 'Schedule', description: null, jobInfo: { systemName: 'Test', name: 'Task' }, inputState: '{}', maxAttempts: 3, cron: '0 3 * * 0', localizedCron: 'Weekly', lastQueuedAt: null, nextRunAt: null, enabled: true }
beforeEach(() => vi.resetAllMocks())
describe('GraphQL job contracts', () => {
  it('loads the available Main definitions and normalizes schema fields', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { jobs: { available: [{ systemName: 'Test', name: 'Task', description: '', initStateSchema: { version: 1, fields: [{ name: 'x', type: 'STRING', required: false, accepts: [] }] } }] } } } as never)
    const result = await getGatewayJobs()
    expect(Object.keys(result.services)).toEqual(['main'])
    expect(result.services.main?.jobs[0]?.initStateSchema.fields[0]?.type).toBe('String')
  })
  it('maps nested metadata and accepts missing definitions for historical jobs', () => {
    expect(mapJob(job)).toMatchObject({ status: 'CancellationRequested', systemName: 'Test', multiStepJobId: 'parent', createdBy: 'user', stepKey: 'step' })
    expect(mapJob({ ...job, info: null })).toMatchObject({ systemName: '', id: 'job-1' })
  })
  it('sends zero-based paging, enum status filters and typed job sorting', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { jobs: { search: [job] } } } as never)
    const result = await getServiceJobs('main', { page: 2, size: 500, statuses: ['CancellationRequested'], systemNames: ['Test'], sortBy: ['-createdAt'] })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ input: { pagination: { page: 2, size: 100 }, statuses: ['CANCELLATION_REQUESTED'], systemNames: ['Test'], sortBy: [{ field: 'CREATED_AT', isDescending: true }] } })
    expect(result.jobs[0]?.status).toBe('CancellationRequested')
  })
  it('reads an individual job and its initialized state/output and handles a deleted job', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { jobs: { byId: job } } } as never)
    expect((await getServiceJob('main', 'job-1')).job.id).toBe('job-1')
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { jobs: { byId: { id: job.id, state: { state: '{}', inputInitialized: true, output: '{"result":0}' } } } } } as never)
    expect(await getServiceJobState('main', 'job-1')).toMatchObject({ inputInitialized: true, output: '{"result":0}' })
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { jobs: { byId: null } } } as never)
    await expect(getServiceJob('main', 'missing')).rejects.toThrow('jobs.notFound')
  })
  it('creates and cancels through mutations without REST side effects', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { jobs: { create: job } } } as never)
    const input = { systemName: 'Test', inputState: '{}', maxAttempts: 3 }
    await createServiceJob('main', input)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables).toEqual({ input })
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { jobs: { cancel: true } } } as never)
    await cancelServiceJob('main', 'job-1')
    expect(vi.mocked(graphqlClient.mutate).mock.calls[1]![0].variables).toEqual({ id: 'job-1' })
    await expect(createServiceJob('search', input)).rejects.toThrow('jobs.serviceUnavailable')
  })
  it('filters schedules, preserves cron and applies explicit patches including false and null', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { jobSchedules: { search: [schedule] } } } as never)
    expect((await getServiceJobSchedules('main', { page: 0, size: 20, systemNames: ['Test'], nextRunFrom: '2026-11-23T13:00:00+03:00', sortBy: ['-nextRunAt'] })).schedules[0]?.jobSystemName).toBe('Test')
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toMatchObject({ input: { nextRunFrom: '2026-11-23T10:00:00.000Z', jobSystemNames: ['Test'], sortBy: [{ field: 'NEXT_RUN_AT', isDescending: true }] } })
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { jobSchedules: { create: schedule } } } as never)
    await createServiceJobSchedule('main', { name: 'Schedule', jobSystemName: 'Test', inputState: '{}', maxAttempts: 3, cron: schedule.cron, enabled: true })
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { jobSchedules: { update: { ...schedule, enabled: false } } } } as never)
    await updateServiceJobSchedule('main', schedule.id, { enabled: patchField(false), description: patchField(null) })
    expect(vi.mocked(graphqlClient.mutate).mock.calls[1]![0].variables).toEqual({ input: { scheduleId: schedule.id, enabled: { isSet: true, value: false }, description: { isSet: true, value: null } } })
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { jobSchedules: { remove: true } } } as never)
    await deleteServiceJobSchedule('main', schedule.id)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[2]![0].variables).toEqual({ id: schedule.id })
  })
})
