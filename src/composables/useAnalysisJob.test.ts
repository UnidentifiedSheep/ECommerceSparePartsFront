import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { useAnalysisJob } from './useAnalysisJob'
import { getServiceJob, type JobModel } from '@/services/api/jobs'
import { startJobHub } from '@/services/realtime/jobHub'
vi.mock('@/services/api/jobs', () => ({ getServiceJob: vi.fn() }))
vi.mock('@/services/realtime/jobHub', () => ({ startJobHub: vi.fn() }))
const job = (id = 'job-1', status = 'Pending'): JobModel => ({ id, status, isStep: false, multiStepJobId: null, systemName: 'AbcXyzCalculationLrt', attempts: 0, maxAttempts: 3, errorMessage: null, lockedAt: null, createdAt: '2026-11-17T00:00:00Z', updatedAt: '2026-11-17T00:00:00Z', createdBy: null })
let scope: EffectScope
const stop = vi.fn(async () => {})
const setup = (allowed = true) => {
  const initial = ref<JobModel | undefined>(job()), canTrack = ref(allowed)
  scope = effectScope()
  return { ...scope.run(() => useAnalysisJob(initial, canTrack))!, initial, canTrack }
}
async function flush() { for (let i = 0; i < 10; i++) await nextTick() }
beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks()
  vi.mocked(getServiceJob).mockResolvedValue({ job: job() })
  vi.mocked(startJobHub).mockResolvedValue({ stop } as never)
})
afterEach(() => { scope.stop(); vi.useRealTimers() })
describe('analysis job tracking', () => {
  it('ignores other jobs and prevents a stale HTTP status from overwriting a completed realtime event', async () => {
    let resolve!: (value: { job: JobModel }) => void
    vi.mocked(getServiceJob).mockReturnValueOnce(new Promise(done => { resolve = done }))
    const state = setup()
    await flush()
    const event = vi.mocked(startJobHub).mock.calls[0]![1]
    await event({ jobId: 'another-job', status: 'Succeeded', attempts: 1 })
    expect(state.job.value?.status).toBe('Pending')
    await event({ jobId: 'job-1', status: 'Succeeded', attempts: 1 })
    resolve({ job: job() })
    await flush()
    expect(state.job.value?.status).toBe('Succeeded')
    expect(state.terminal.value).toBe(true)
    expect(stop).toHaveBeenCalled()
  })
  it('polls when realtime is unavailable, then stops after completion', async () => {
    vi.mocked(startJobHub).mockRejectedValue(new Error('offline'))
    vi.mocked(getServiceJob).mockResolvedValueOnce({ job: job() }).mockResolvedValueOnce({ job: job('job-1', 'Succeeded') })
    const state = setup()
    await flush()
    await vi.advanceTimersByTimeAsync(10000)
    expect(state.job.value?.status).toBe('Succeeded')
    await vi.advanceTimersByTimeAsync(30000)
    expect(getServiceJob).toHaveBeenCalledTimes(2)
  })
  it('does not request job status without permission', async () => {
    const state = setup(false)
    await flush()
    expect(state.job.value?.id).toBe('job-1')
    expect(getServiceJob).not.toHaveBeenCalled()
    expect(startJobHub).not.toHaveBeenCalled()
  })
  it('closes the connection and stops polling on unmount', async () => {
    setup()
    await flush()
    scope.stop()
    await vi.advanceTimersByTimeAsync(30000)
    expect(stop).toHaveBeenCalled()
    expect(getServiceJob).toHaveBeenCalledTimes(1)
  })
})
