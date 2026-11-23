import { computed, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { getServiceJob, type JobModel } from '@/services/api/jobs'
import { startJobUpdates, type JobUpdatesConnection } from '@/services/realtime/jobUpdates'

export function useAnalysisJob(initial: Ref<JobModel | undefined>, canTrack: Ref<boolean>) {
  const job = shallowRef<JobModel>()
  const failedToRead = ref(false), refreshing = ref(false)
  const terminal = computed(() => Boolean(job.value && ['Succeeded', 'Failed', 'Cancelled'].includes(job.value.status)))
  let generation = 0, revision = 0
  let connection: JobUpdatesConnection | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  function stop() { clearTimeout(timer); timer = undefined; void connection?.stop(); connection = undefined }
  onScopeDispose(() => { ++generation; stop() })

  async function refresh() {
    if (!job.value || !canTrack.value || refreshing.value) return
    const request = generation, eventRevision = revision, id = job.value.id
    refreshing.value = true
    try {
      const result = await getServiceJob('main', id)
      if (request === generation && eventRevision === revision) { job.value = result.job; failedToRead.value = false }
    } catch { if (request === generation && eventRevision === revision) failedToRead.value = true }
    finally { if (request === generation) refreshing.value = false }
  }
  function poll(request: number) {
    clearTimeout(timer)
    if (request !== generation || terminal.value || !job.value || !canTrack.value) return
    timer = setTimeout(async () => { await refresh(); poll(request) }, 10000)
  }
  watch([initial, canTrack], ([value, allowed]) => {
    const request = ++generation
    stop(); revision = 0; refreshing.value = false; failedToRead.value = false; job.value = value
    if (!value || !allowed || terminal.value) return
    void refresh()
    poll(request)
    void startJobUpdates('main', event => {
      if (request !== generation || event.jobId !== job.value?.id) return
      ++revision
      job.value = event.job ?? { ...job.value, status: event.status, attempts: event.attempts }
      failedToRead.value = false
      if (event.status === 'Failed') void refresh()
    }, () => { void refresh() }).then(result => {
      if (request !== generation || terminal.value) void result.stop()
      else connection = result
    }).catch(() => { /* Polling continues when realtime is unavailable. */ })
  }, { immediate: true })
  watch(terminal, value => { if (value) stop() })
  return { job, terminal, failedToRead, refreshing, refresh }
}
