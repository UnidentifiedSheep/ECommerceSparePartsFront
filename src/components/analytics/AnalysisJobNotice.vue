<template>
  <section v-if="job" class="analysis-job-notice" role="status">
    <div><strong>{{ name }}</strong><span>{{ canTrack ? t(`jobs.statuses.${job.status}`) : t('analysisCreate.submitted') }}</span><p v-if="job.status === 'Succeeded'">{{ t('analysisCreate.completed') }}</p><p v-if="job.status === 'Failed' && job.errorMessage">{{ job.errorMessage }}</p><p v-if="failedToRead">{{ t('analysisCreate.statusError') }}</p></div>
    <div class="job-notice-actions">
      <el-button v-if="job.status === 'Succeeded'" size="small" type="primary" plain @click="emit('results')">{{ t('analysisCreate.showResults') }}</el-button>
      <el-button v-if="canTrack" size="small" plain :loading="refreshing" @click="refresh">{{ t('common.actions.refresh') }}</el-button>
      <el-button size="small" text @click="emit('dismiss')">{{ t('common.actions.close') }}</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from '@/i18n'
import { usePermissions } from '@/composables/usePermissions'
import { useAnalysisJob } from '@/composables/useAnalysisJob'
import type { JobModel } from '@/services/api/jobs'
const props = defineProps<{ initialJob?: JobModel; name: string }>()
const emit = defineEmits<{ finished: [status: string]; results: []; dismiss: [] }>()
const { t } = useI18n()
const { hasPermission } = usePermissions()
const canTrack = computed(() => hasPermission('JOBS_GET'))
const { job, terminal, failedToRead, refreshing, refresh } = useAnalysisJob(computed(() => props.initialJob), canTrack)
let notified: string | undefined
watch([terminal, job], ([done, value]) => { if (done && value && notified !== value.id) { notified = value.id; emit('finished', value.status) } }, { immediate: true })
</script>

<style scoped>
.analysis-job-notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 14px 24px 0; padding: 12px 16px; border: 1px solid var(--app-border); border-radius: 7px; background: var(--app-surface); font-size: 13px; }
.analysis-job-notice strong { margin-right: 12px; }
.analysis-job-notice span, .analysis-job-notice p { color: var(--app-text-muted); }
.analysis-job-notice p { margin: 5px 0 0; }
.job-notice-actions { display: flex; gap: 8px; flex-wrap: wrap; flex: none; }
@media (max-width: 680px) { .analysis-job-notice { flex-direction: column; align-items: stretch; margin: 12px 12px 0; } }
</style>
