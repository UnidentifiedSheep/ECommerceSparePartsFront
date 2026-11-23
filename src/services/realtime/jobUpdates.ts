import { JobUpdatedDocument } from '@/graphql/generated/graphql'
import { subscribeGraphql } from '@/services/graphql/subscriptions'
import { mapJob, type JobModel } from '@/services/api/jobs'

export interface JobStatusUpdatedEvent { jobId: string; status: string; attempts: number; job?: JobModel }
export interface JobUpdatesConnection { stop(): Promise<void> }

export async function startJobUpdates(serviceKey: string, onUpdated: (event: JobStatusUpdatedEvent) => void | Promise<void>, onConnected?: () => void, onUnavailable?: () => void): Promise<JobUpdatesConnection> {
  if (serviceKey.toLowerCase() !== 'main') return { stop: async () => {} }
  const stop = subscribeGraphql(JobUpdatedDocument, {}, {
    next: data => { const job = mapJob(data.onJobUpdated.job); void onUpdated({ jobId: job.id, status: job.status, attempts: job.attempts, job }) },
    connected: () => onConnected?.(), disconnected: () => onUnavailable?.(), error: () => onUnavailable?.(),
  })
  return { stop: async () => stop() }
}
