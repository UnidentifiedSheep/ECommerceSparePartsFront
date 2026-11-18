<template>
  <div class="analytics-page">
    <PageHeader :title="t('analyticsRuns.title')" :description="t('analyticsRuns.description')">
      <template #actions>
        <el-button v-if="canCreate" type="primary" :disabled="!definitions.length || !!createdJob && !jobFinished" @click="createOpen = true">{{ t('analysisCreate.title') }}</el-button>
        <el-button v-if="canView" :icon="Refresh" :loading="loading" @click="reload">{{ t('common.actions.refresh') }}</el-button>
      </template>
    </PageHeader>
    <el-empty v-if="!canView" :description="t('analyticsRuns.noPermission')" />
    <AnalysisJobNotice v-if="canView && createdJob" :initial-job="createdJob" :name="createdName" @finished="jobCompleted" @results="showCreatedResults" @dismiss="createdJob = undefined; jobFinished = true" />
    <section v-if="canView" class="analytics-panel" :aria-label="t('analyticsRuns.title')">
      <div class="analytics-filters">
        <label class="analysis-filter">
          <span>{{ t('analyticsRuns.analysisType') }}</span>
          <el-select v-model="analysisType" clearable :loading="definitionsLoading" :placeholder="t('analyticsRuns.allAnalyses')" :aria-label="t('analyticsRuns.analysisType')">
            <el-option v-for="definition in definitions" :key="definition.systemName" :value="definition.systemName" :label="definition.name" />
          </el-select>
        </label>
        <label class="period-filter">
          <span>{{ t('analyticsRuns.periodFilter') }}</span>
          <el-date-picker v-model="period" type="monthrange" format="MM.YYYY" value-format="YYYY-MM" :start-placeholder="t('home.startDate')" :end-placeholder="t('home.endDate')" :aria-label="t('analyticsRuns.periodFilter')" />
        </label>
        <label class="pinned-filter">
          <span>{{ t('analyticsRuns.pinning') }}</span>
          <el-select v-model="pinned" :aria-label="t('analyticsRuns.pinning')">
            <el-option :label="t('analyticsRuns.allRuns')" value="all" />
            <el-option :label="t('analyticsRuns.pinnedOnly')" value="pinned" />
            <el-option :label="t('analyticsRuns.unpinnedOnly')" value="unpinned" />
          </el-select>
        </label>
        <el-button plain :disabled="!analysisType && !period && pinned === 'all'" @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
      </div>
      <DataLoadError v-if="definitionsError" :error="definitionsError" @retry="loadDefinitions" />
      <div class="list-description">{{ t('analyticsRuns.newestFirst') }}</div>
      <div ref="scrollElement" v-loading="loading && !runs.length" class="analytics-scroll" tabindex="0" :aria-label="t('analyticsRuns.title')" :aria-busy="loading" @scroll.passive="loadNearEnd">
        <table v-if="runs.length" class="analytics-table">
          <thead><tr><th scope="col">{{ t('analyticsRuns.analysisType') }}</th><th scope="col">{{ t('analyticsRuns.period') }}</th><th scope="col">{{ t('analyticsRuns.createdAt') }}</th><th scope="col" class="number">{{ t('analyticsRuns.productsCount') }}</th><th scope="col">{{ t('analyticsRuns.pinning') }}</th></tr></thead>
          <tbody>
            <tr v-for="run in runs" :key="run.id">
              <td class="analysis-name"><button class="run-link" type="button" @click="openRun(run.id)">{{ analysisName(run.analysisType) }}</button></td>
              <td>{{ formatPeriod(run) }}</td>
              <td><time :datetime="run.createdAt">{{ formatDate(run.createdAt) }}</time></td>
              <td class="number">{{ run.itemsCount.toLocaleString(locale) }}</td>
              <td><el-tag v-if="run.isPinned" type="warning" effect="plain" size="small"><el-icon aria-hidden="true"><StarFilled /></el-icon> {{ t('analyticsRuns.pinned') }}</el-tag><span v-else class="sr-only">{{ t('analyticsRuns.unpinnedOnly') }}</span></td>
            </tr>
          </tbody>
        </table>
        <el-empty v-if="!loading && !error && !runs.length" :description="t('analyticsRuns.empty')" />
        <DataLoadError v-if="error" :error="error" @retry="retry" />
        <p v-if="loading && runs.length" class="list-status" role="status">{{ t('analyticsRuns.loading') }}</p>
      </div>
      <footer class="analytics-footer" role="status">{{ t('analyticsRuns.loaded', { count: runs.length }) }}</footer>
    </section>
    <AnalyticsRunDrawer v-model="detailsOpen" :run-id="selectedRunId" @pinned="handlePinned" />
    <CreateAnalysisDialog v-model="createOpen" :definitions="definitions" @created="handleCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { Refresh, StarFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AnalyticsRunDrawer from '@/components/analytics/AnalyticsRunDrawer.vue'
import CreateAnalysisDialog from '@/components/analytics/CreateAnalysisDialog.vue'
import AnalysisJobNotice from '@/components/analytics/AnalysisJobNotice.vue'
import type { JobModel } from '@/services/api/jobs'
import DataLoadError from '@/components/common/DataLoadError.vue'
import { useI18n } from '@/i18n'
import { usePermissions } from '@/composables/usePermissions'
import { useAnalyticsRuns } from '@/composables/useAnalyticsRuns'
import { getAnalyses, type AnalysisDefinition, type AnalyticsRun } from '@/services/api/analytics'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'
import { schemaMonthToUtc } from '@/utils/schemaInputs'

const { t, locale } = useI18n()
const { hasPermission } = usePermissions()
const canView = computed(() => hasPermission('CHARTS_GET'))
const canCreate = computed(() => canView.value && hasPermission('JOBS_CREATE'))
const createOpen = ref(false)
const createdJob = ref<JobModel>()
const createdName = ref(''), createdType = ref('')
const jobFinished = ref(true)
function handleCreated(value: { job: JobModel; analysisType: string; name: string }) { createdJob.value = value.job; createdName.value = value.name; createdType.value = value.analysisType; jobFinished.value = ['Succeeded', 'Failed', 'Cancelled'].includes(value.job.status) }
function jobCompleted(status: string) { jobFinished.value = true; if (status === 'Succeeded') void load(true) }
function showCreatedResults() {
  if (analysisType.value === createdType.value && !period.value && pinned.value === 'all') void load(true)
  else { analysisType.value = createdType.value; period.value = null; pinned.value = 'all' }
}
const analysisType = ref('')
const pinned = ref<'all' | 'pinned' | 'unpinned'>('all')
const period = ref<[string, string] | null>(null)
const scrollElement = ref<HTMLElement>()
const definitions = ref<AnalysisDefinition[]>([])
const definitionsLoading = ref(false)
const definitionsError = ref<DataLoadErrorKind | null>(null)
const detailsOpen = ref(false)
const selectedRunId = ref<string>()
function openRun(id: string) { selectedRunId.value = id; detailsOpen.value = true }
let definitionsRequest = 0
let definitionsController: AbortController | undefined
const filters = computed(() => ({
  analysisType: analysisType.value || undefined,
  isPinned: pinned.value === 'all' ? undefined : pinned.value === 'pinned',
  periodFrom: period.value ? schemaMonthToUtc(period.value[0]) : undefined,
  periodTo: period.value ? new Date(Date.UTC(Number(period.value[1].slice(0, 4)), Number(period.value[1].slice(5, 7)), 1)).toISOString() : undefined,
}))
const { runs, loading, hasMore, error, load, retry } = useAnalyticsRuns(() => filters.value, canView)
function handlePinned(value: { id: string; isPinned: boolean }) {
  if (pinned.value !== 'all') void load(true)
  else runs.value = runs.value.map(run => run.id === value.id ? { ...run, isPinned: value.isPinned } : run)
}

async function loadDefinitions() {
  const request = ++definitionsRequest
  definitionsController?.abort()
  definitionsLoading.value = false
  definitionsError.value = null
  if (!canView.value) { definitions.value = []; return }
  definitionsController = new AbortController()
  definitionsLoading.value = true
  try {
    const result = await getAnalyses(definitionsController.signal)
    if (request === definitionsRequest) definitions.value = result
  } catch (cause) {
    if (request === definitionsRequest) definitionsError.value = classifyDataLoadError(cause)
  } finally { if (request === definitionsRequest) definitionsLoading.value = false }
}
onScopeDispose(() => { ++definitionsRequest; definitionsController?.abort() })

function analysisName(type: string) { return definitions.value.find(item => item.systemName === type)?.name ?? (type === 'AbcXyz' ? 'ABC/XYZ' : type) }
function formatDate(value: string) { return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function formatPeriod(run: AnalyticsRun) {
  const format = new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric', timeZone: 'UTC' })
  const start = run.periodStart ? format.format(new Date(run.periodStart)) : '…'
  const end = run.periodEnd ? format.format(new Date(new Date(run.periodEnd).getTime() - 1)) : '…'
  return start === end ? start : `${start} — ${end}`
}
function resetFilters() { analysisType.value = ''; period.value = null; pinned.value = 'all' }
function reload() { void load(true); void loadDefinitions() }
function loadNearEnd() {
  const element = scrollElement.value
  if (!element || loading.value || error.value || !hasMore.value) return
  if (element.scrollHeight - element.scrollTop - element.clientHeight <= 100) void load(false)
}
watch([filters, canView], () => { scrollElement.value?.scrollTo({ top: 0 }); void load(true) }, { immediate: true })
watch([locale, canView], () => { void loadDefinitions() }, { immediate: true })
watch([loading, hasMore, scrollElement], async () => { await nextTick(); loadNearEnd() }, { flush: 'post' })
useResizeObserver(scrollElement, loadNearEnd)
</script>

<style scoped>
.analytics-page { display: flex; height: calc(100dvh - var(--app-viewport-offset, 56px)); min-height: 0; flex-direction: column; overflow: hidden; background: var(--app-bg-soft); }
.analytics-panel { display: flex; flex: 1; min-height: 0; flex-direction: column; overflow: hidden; margin: 16px 24px 24px; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-surface); }
.analytics-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; padding: 16px; border-bottom: 1px solid var(--app-border); }
.analytics-filters label { display: grid; gap: 6px; min-width: 0; color: var(--app-text-muted); font-size: 12px; }
.analysis-filter { flex: 1 1 220px; }
.period-filter { flex: 1 1 300px; }
.pinned-filter { flex: 1 1 190px; }
.period-filter :deep(.el-date-editor) { width: 100%; }
.list-description { padding: 10px 16px; color: var(--app-text-muted); font-size: 12px; }
.analytics-scroll { position: relative; flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.analytics-scroll:focus-visible { outline: 2px solid var(--app-primary); outline-offset: -2px; }
.analytics-table { width: 100%; min-width: 650px; border-collapse: separate; border-spacing: 0; color: var(--app-text); font-size: 13px; }
.analytics-table th, .analytics-table td { padding: 13px 16px; border-bottom: 1px solid var(--app-border); text-align: left; white-space: nowrap; }
.analytics-table th { position: sticky; top: 0; z-index: 1; background: var(--app-surface-muted, var(--app-bg-soft)); color: var(--app-text-muted); font-size: 12px; font-weight: 600; }
.analysis-name { font-weight: 600; }
.run-link { border: 0; padding: 0; background: transparent; color: var(--app-primary); font: inherit; text-align: left; cursor: pointer; }
.run-link:hover { text-decoration: underline; }
.run-link:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 3px; }
.analytics-table .number { text-align: right; font-variant-numeric: tabular-nums; }
.analytics-table td:nth-child(5) { min-width: 130px; }
.analytics-footer { padding: 12px 16px; border-top: 1px solid var(--app-border); color: var(--app-text-muted); font-size: 12px; }
.list-status { color: var(--app-text-muted); font-size: 12px; text-align: center; }
@media (max-width: 680px) { .analytics-panel { margin: 12px; } .analytics-filters { gap: 10px; padding: 12px; } .period-filter { flex-basis: 100%; } }
</style>
