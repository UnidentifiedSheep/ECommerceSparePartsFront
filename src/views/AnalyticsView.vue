<template>
  <main class="min-h-screen bg-slate-50 px-6 py-6">
    <section class="flex w-full flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">{{ t('analytics.title') }}</h1>
          <p class="mt-1 text-sm text-slate-500">{{ t('analytics.description') }}</p>
        </div>

        <div class="flex items-center gap-2">
          <el-button :icon="Refresh" :loading="isMetricsLoading" @click="loadMetrics(false)">
            {{ t('common.refresh') }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openCreateDrawer">
            {{ t('analytics.createMetric') }}
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="activeJob"
        :type="jobAlertType"
        :closable="isTerminalStatus(activeJob.status)"
        show-icon
        class="analytics-job-alert"
        @close="activeJob = null"
      >
        <template #title>
          <div class="flex flex-wrap items-center gap-2">
            <span>{{ metricName(activeJob.metricSystemName) }}</span>
            <el-tag :type="statusTagType(activeJob.status)" effect="light">
              {{ statusLabel(activeJob.status) }}
            </el-tag>
          </div>
        </template>
        <div class="mt-1 text-sm">
          <span v-if="activeJob.errorMessage">{{ activeJob.errorMessage }}</span>
          <span v-else>
            {{ t('analytics.refreshUpdating', { date: formatDateTime(activeJob.updatedAt) }) }}
          </span>
        </div>
      </el-alert>

      <div class="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 class="text-base font-medium text-slate-900">{{ t('analytics.availableMetrics') }}</h2>
            <el-tag type="info" effect="plain">{{ filteredMetricInfos.length }}</el-tag>
          </div>

          <div class="mb-4 flex flex-col gap-2">
            <el-input
              v-model="metricInfoSearch"
              clearable
              size="small"
              :placeholder="t('analytics.searchMetric')"
            />
            <el-button
              v-if="selectedMetricSystemName"
              size="small"
              plain
              class="analytics-clear-filter-button"
              @click="clearMetricFilter"
            >
              {{ t('analytics.resetFilter') }}
            </el-button>
          </div>

          <div v-loading="isInfoLoading" class="analytics-metric-list">
            <button
              v-for="metric in filteredMetricInfos"
              :key="metric.systemName"
              class="analytics-metric-filter-button"
              :class="{ 'analytics-metric-filter-button--active': selectedMetricSystemName === metric.systemName }"
              @click="selectMetricFilter(metric.systemName)"
            >
              <div class="text-sm font-medium text-slate-900">{{ metric.name }}</div>
              <div class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                {{ metric.description || metric.systemName }}
              </div>
            </button>

            <el-empty v-if="!isInfoLoading && filteredMetricInfos.length === 0" :description="t('analytics.notFound')" />
          </div>
        </aside>

        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-base font-medium text-slate-900">{{ t('analytics.metrics') }}</h2>
              <p class="text-sm text-slate-500">{{ metricsSubtitle }}</p>
            </div>
            <el-select v-model="sortBy" class="w-60" :placeholder="t('analytics.sorting')">
              <el-option
                v-for="option in sortOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <el-table
            v-loading="isMetricsLoading"
            :data="metrics"
            class="analytics-table"
            :empty-text="t('analytics.emptyMetrics')"
            height="560"
          >
            <el-table-column type="expand" width="48">
              <template #default="{ row }">
                <div class="bg-slate-50 px-5 py-4">
                  <MetricDataViewer :data="row.data" />
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('analytics.metric')" min-width="280">
              <template #default="{ row }">
                <div class="font-medium text-slate-900">{{ row.name }}</div>
                <div class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {{ row.description || '-' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('analytics.parameters')" min-width="230">
              <template #default="{ row }">
                <div class="flex flex-col gap-1 text-sm text-slate-700">
                  <span>{{ formatShortDateTime(row.rangeStart) }} — {{ formatShortDateTime(row.rangeEnd) }}</span>
                  <span class="text-xs text-slate-500">{{ metricCurrencyLabel(row.currencyId) }}</span>
                  <span class="text-xs text-slate-500">{{ metricProductLabel(row) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.status')" min-width="165">
              <template #default="{ row }">
                <div class="flex flex-col items-start gap-1">
                  <el-tag :type="metricTagType(row)" effect="light">
                    {{ metricTagLabel(row) }}
                  </el-tag>
                  <span v-if="row.lastCalculationJob" class="text-xs text-slate-500">
                    {{ t('analytics.lastCalculation', { status: statusLabel(row.lastCalculationJob.status) }) }}
                  </span>
                  <span v-if="row.lastCalculationJob" class="text-xs text-slate-400">
                    {{ formatDateTime(row.lastCalculationJob.updatedAt) }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('analytics.data')" width="120">
              <template #default="{ row }">
                <el-tag :type="row.data ? 'success' : 'info'" effect="light">
                  {{ row.data ? t('analytics.hasData') : t('analytics.noData') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="" width="130" align="right">
              <template #default="{ row }">
                <div class="analytics-actions-stack">
                  <el-button size="small" plain class="analytics-action-button" @click="openHistoryDrawer(row)">
                    {{ t('analytics.history') }}
                  </el-button>
                  <el-button
                    class="analytics-action-button"
                    size="small"
                    type="primary"
                    plain
                    :loading="isMetricRecalculating(row)"
                    :disabled="!canRecalculateMetric(row)"
                    @click="recalculateMetric(row)"
                  >
                    {{ t('analytics.recalculate') }}
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="border-t border-slate-200 px-5 py-4">
            <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
          </div>
        </section>
      </div>
    </section>

    <el-drawer
      v-model="createDrawerOpen"
      direction="rtl"
      size="520px"
      class="analytics-create-drawer"
      header-class="analytics-create-drawer-header"
      body-class="analytics-create-drawer-body"
      footer-class="analytics-create-drawer-footer"
      :show-close="false"
    >
      <template #header>
        <div class="analytics-drawer-titlebar">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('analytics.createMetric') }}</h2>
          <el-button
            :icon="Close"
            circle
            plain
            class="analytics-drawer-close"
            @click="createDrawerOpen = false"
          />
        </div>
      </template>

      <div class="flex h-full flex-col">
        <div class="flex-1 overflow-auto px-5 pb-6 pt-2">
          <fieldset class="rounded-2xl border border-slate-200 px-4 pb-6 pt-4">
            <legend class="px-2">
              <span class="text-base font-semibold text-slate-900">{{ t('analytics.metricParameters') }}</span>
            </legend>

            <el-form label-position="top">
              <el-form-item :label="t('analytics.metricType')" class="analytics-drawer-form-item">
                <el-select
                  v-model="createForm.metricSystemName"
                  class="w-full"
                  filterable
                  :placeholder="t('analytics.selectMetric')"
                >
                  <el-option
                    v-for="metric in metricInfos"
                    :key="metric.systemName"
                    :label="metric.name"
                    :value="metric.systemName"
                  >
                    <div class="flex flex-col py-1">
                      <span>{{ metric.name }}</span>
                      <span class="text-xs text-slate-400">{{ metric.description || metric.systemName }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item :label="t('analytics.period')" class="analytics-drawer-form-item">
                <el-date-picker
                  v-model="createForm.range"
                  type="datetimerange"
                  range-separator="—"
                  :start-placeholder="t('common.start')"
                  :end-placeholder="t('common.end')"
                  format="DD.MM.YYYY HH:mm"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  class="w-full"
                />
              </el-form-item>

              <el-form-item :label="t('common.currency')" class="analytics-drawer-form-item">
                <el-select
                  v-model="createForm.currencyId"
                  class="w-full"
                  filterable
                  :placeholder="t('common.selectCurrency')"
                  :loading="isCurrenciesLoading"
                >
                  <el-option
                    v-for="currency in currencies"
                    :key="currency.id"
                    :label="`${currency.shortName} (${currency.currencySign})`"
                    :value="currency.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item :label="t('analytics.exactProduct')" class="analytics-drawer-form-item">
                <div class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pb-4 pt-3">
                  <div v-if="selectedProduct" class="mb-4">
                    <div class="text-sm font-medium text-slate-900">{{ selectedProduct.name }}</div>
                    <div class="mt-1 text-xs text-slate-500">{{ selectedProduct.sku }}</div>
                  </div>
                  <div v-else class="mb-4 text-sm text-slate-500">
                    {{ t('analytics.productRequired') }}
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <el-button :icon="Search" @click="productDialogOpen = true">
                      {{ t('analytics.selectProduct') }}
                    </el-button>
                    <el-button v-if="selectedProduct" plain @click="selectedProduct = null">
                      {{ t('common.clear') }}
                    </el-button>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </fieldset>
        </div>

        <div class="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
          <div class="flex justify-end gap-3">
            <el-button @click="createDrawerOpen = false">{{ t('common.cancel') }}</el-button>
            <el-button type="primary" :loading="isCreating" :disabled="!canCreateJob" @click="submitJob">
              {{ t('analytics.createMetric') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer
      v-model="historyDrawerOpen"
      direction="rtl"
      size="720px"
      class="analytics-history-drawer"
      header-class="analytics-create-drawer-header"
      body-class="analytics-create-drawer-body"
      :show-close="false"
    >
      <template #header>
        <div class="analytics-drawer-titlebar">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">{{ t('analytics.calculationHistory') }}</h2>
            <p v-if="historyMetric" class="mt-1 text-sm text-slate-500">{{ historyMetric.name }}</p>
          </div>
          <el-button
            :icon="Close"
            circle
            plain
            class="analytics-drawer-close"
            @click="historyDrawerOpen = false"
          />
        </div>
      </template>

      <div class="flex h-full flex-col">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div class="text-sm text-slate-500">
            {{ t('analytics.latestRuns') }}
          </div>
          <el-select v-model="historySortBy" class="w-60" :placeholder="t('analytics.sorting')">
            <el-option
              v-for="option in historySortOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-5 py-4">
          <el-table
            v-loading="isHistoryLoading"
            :data="historyJobs"
            class="analytics-history-table"
            :empty-text="t('analytics.emptyHistory')"
          >
            <el-table-column :label="t('common.status')" min-width="150">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" effect="light">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('analytics.created')" min-width="170">
              <template #default="{ row }">
                <span class="text-sm text-slate-700">{{ formatDateTime(row.createdAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('analytics.updated')" min-width="170">
              <template #default="{ row }">
                <span class="text-sm text-slate-700">{{ formatDateTime(row.updatedAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('analytics.error')" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <span :class="row.errorMessage ? 'text-red-600' : 'text-slate-400'">
                  {{ row.errorMessage || '-' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="border-t border-slate-200 px-5 py-4">
          <ZeroPagination v-model:page="historyPage" v-model:size="historyLimit" :has-next="historyHasNext" />
        </div>
      </div>
    </el-drawer>

    <ProductSelectorDialog v-model="productDialogOpen" @select="onProductSelected" />
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElNotification, type TagProps } from 'element-plus'
import type { HubConnection } from '@microsoft/signalr'
import { Close, Plus, Refresh, Search } from '@element-plus/icons-vue'
import MetricDataViewer from '@/components/analytics/MetricDataViewer.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import {
  createCalculationJob,
  getCalculationJob,
  getMetricCalculationJobs,
  getMetricInfos,
  getMetrics,
  type CalculationJobModel,
  type CalculationStatus,
  type MetricCalculationJobSortBy,
  type MetricInfoModel,
  type MetricModel,
  type MetricSortBy,
} from '@/services/api/analytics.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import {
  startMetricCalculationHub,
  type MetricCalculationJobUpdatedEvent,
} from '@/services/realtime/metricCalculationHub.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()

const metricInfos = ref<MetricInfoModel[]>([])
const metrics = ref<MetricModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const selectedProduct = ref<ProductSearchModel | null>(null)
const activeJob = ref<CalculationJobModel | null>(null)
const historyMetric = ref<MetricModel | null>(null)
const historyJobs = ref<CalculationJobModel[]>([])
const metricInfoSearch = ref('')
const selectedMetricSystemName = ref<string | null>(null)
const productDialogOpen = ref(false)
const createDrawerOpen = ref(false)
const historyDrawerOpen = ref(false)
const isInfoLoading = ref(false)
const isMetricsLoading = ref(false)
const isHistoryLoading = ref(false)
const isCurrenciesLoading = ref(false)
const isCreating = ref(false)
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const historyPage = ref(0)
const historyLimit = ref(20)
const historyHasNext = ref(false)
const sortBy = ref<MetricSortBy>('createdAt_desc')
const historySortBy = ref<MetricCalculationJobSortBy>('createdAt_desc')
const recalculatingMetrics = ref<Record<string, boolean>>({})
let metricHubConnection: HubConnection | null = null

const sortOptions = computed<Array<{ label: string, value: MetricSortBy }>>(() => [
  { label: t('analytics.sort.createdDesc'), value: 'createdAt_desc' },
  { label: t('analytics.sort.createdAsc'), value: 'createdAt_asc' },
  { label: t('analytics.sort.updatedDesc'), value: 'updatedAt_desc' },
  { label: t('analytics.sort.updatedAsc'), value: 'updatedAt_asc' },
  { label: t('analytics.sort.recalculatedDesc'), value: 'recalculatedAt_desc' },
  { label: t('analytics.sort.recalculatedAsc'), value: 'recalculatedAt_asc' },
])

const historySortOptions = computed<Array<{ label: string, value: MetricCalculationJobSortBy }>>(() => [
  { label: t('analytics.sort.createdDesc'), value: 'createdAt_desc' },
  { label: t('analytics.sort.createdAsc'), value: 'createdAt_asc' },
  { label: t('analytics.sort.updatedDesc'), value: 'updatedAt_desc' },
  { label: t('analytics.sort.updatedAsc'), value: 'updatedAt_asc' },
  { label: t('analytics.sort.statusAsc'), value: 'status_asc' },
  { label: t('analytics.sort.statusDesc'), value: 'status_desc' },
])

const createForm = reactive<{
  metricSystemName?: string
  currencyId?: number
  range: string[]
}>({
  metricSystemName: undefined,
  currencyId: undefined,
  range: defaultRange(),
})

const canCreateJob = computed(() => Boolean(
  createForm.metricSystemName
  && createForm.currencyId
  && createForm.range.length === 2
  && createForm.range[0]
  && createForm.range[1]
  && selectedProduct.value,
))

const jobAlertType = computed(() => {
  if (!activeJob.value) return 'info'
  if (activeJob.value.status === 'Succeeded') return 'success'
  if (activeJob.value.status === 'Failed') return 'error'
  if (activeJob.value.status === 'Cancelled') return 'info'
  return 'warning'
})

const filteredMetricInfos = computed(() => {
  const query = metricInfoSearch.value.trim().toLocaleLowerCase(locale.value)
  if (!query) return metricInfos.value

  return metricInfos.value.filter((metric) =>
    metric.name.toLocaleLowerCase(locale.value).includes(query)
    || metric.description.toLocaleLowerCase(locale.value).includes(query)
    || metric.systemName.toLocaleLowerCase(locale.value).includes(query),
  )
})

const selectedMetricInfo = computed(() =>
  metricInfos.value.find((metric) => metric.systemName === selectedMetricSystemName.value) ?? null,
)

const metricsSubtitle = computed(() => selectedMetricInfo.value
  ? t('analytics.filterSubtitle', { name: selectedMetricInfo.value.name })
  : t('analytics.savedMetricsSubtitle'),
)

function defaultRange(): string[] {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return [toLocalDateTime(start), toLocalDateTime(end)]
}

function toLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

function formatDateTime(value: string): string {
  if (!value) return '-'
  return new Date(value).toLocaleString(locale.value)
}

function formatShortDateTime(value: string): string {
  if (!value) return '-'
  return new Date(value).toLocaleString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function metricRowKey(metric: MetricModel): string {
  return metric.id
}

function isMetricRecalculating(metric: MetricModel): boolean {
  return Boolean(recalculatingMetrics.value[metricRowKey(metric)])
    || Boolean(metric.lastCalculationJob && !isTerminalStatus(metric.lastCalculationJob.status))
}

function canRecalculateMetric(metric: MetricModel): boolean {
  return Boolean(metric.id)
    && !hasMetricTag(metric, 'Disabled')
    && !isMetricRecalculating(metric)
}

function metricName(systemName: string): string {
  return metricInfos.value.find((metric) => metric.systemName === systemName)?.name ?? systemName
}

function statusLabel(status: CalculationStatus): string {
  return t(`analytics.statuses.${status}`) || status
}

function statusTagType(status: CalculationStatus): TagProps['type'] {
  if (status === 'Succeeded') return 'success'
  if (status === 'Failed') return 'danger'
  if (status === 'Cancelled') return 'info'
  if (status === 'Calculating') return 'warning'
  return 'primary'
}

function hasMetricTag(metric: MetricModel, tag: string): boolean {
  return metric.tags
    .split(',')
    .map((item) => item.trim())
    .includes(tag)
}

function metricTagLabel(metric: MetricModel): string {
  if (hasMetricTag(metric, 'Disabled')) return t('analytics.disabled')
  if (hasMetricTag(metric, 'RecalculationNeeded')) return t('analytics.recalculationNeeded')
  return t('analytics.actual')
}

function metricTagType(metric: MetricModel): TagProps['type'] {
  if (hasMetricTag(metric, 'Disabled')) return 'danger'
  if (hasMetricTag(metric, 'RecalculationNeeded')) return 'warning'
  return 'success'
}

function metricCurrencyLabel(currencyId: number): string {
  const currency = currencies.value.find((item) => item.id === currencyId)
  if (!currency) return t('analytics.currencyNotFound')
  return `${currency.shortName} (${currency.currencySign})`
}

function metricProductLabel(metric: MetricModel): string {
  return metric.productId ? t('analytics.productSet') : t('analytics.noProduct')
}

function isTerminalStatus(status: CalculationStatus): boolean {
  return ['Succeeded', 'Failed', 'Cancelled'].includes(status)
}

function openCreateDrawer() {
  if (!createForm.metricSystemName && metricInfos.value.length > 0) {
    createForm.metricSystemName = metricInfos.value[0]?.systemName
  }
  createDrawerOpen.value = true
}

async function selectMetricFilter(systemName: string) {
  selectedMetricSystemName.value = selectedMetricSystemName.value === systemName ? null : systemName
  await loadMetrics(true)
}

async function clearMetricFilter() {
  selectedMetricSystemName.value = null
  await loadMetrics(true)
}

async function openHistoryDrawer(metric: MetricModel) {
  historyMetric.value = metric
  historyPage.value = 0
  historyDrawerOpen.value = true
  await loadMetricHistory()
}

function onProductSelected(product: ProductSearchModel) {
  selectedProduct.value = product
}

async function loadMetricInfos() {
  isInfoLoading.value = true
  try {
    const resp = await getMetricInfos()
    metricInfos.value = resp.metrics
    if (!createForm.metricSystemName && resp.metrics.length > 0) {
      createForm.metricSystemName = resp.metrics[0]?.systemName
    }
  } finally {
    isInfoLoading.value = false
  }
}

async function loadCurrencies() {
  isCurrenciesLoading.value = true
  try {
    const resp = await getCurrencies({ page: 0, size: 100 })
    currencies.value = resp.currencies
    if (!createForm.currencyId && resp.currencies.length > 0) {
      createForm.currencyId = resp.currencies[0]?.id
    }
  } finally {
    isCurrenciesLoading.value = false
  }
}

async function loadMetrics(resetPage: boolean) {
  if (resetPage) page.value = 0
  isMetricsLoading.value = true
  try {
    const resp = await getMetrics({
      page: page.value,
      limit: limit.value,
      sortBy: sortBy.value,
      metricSystemName: selectedMetricSystemName.value ?? undefined,
    })
    metrics.value = resp.metrics
    hasNext.value = resp.metrics.length === limit.value
  } finally {
    isMetricsLoading.value = false
  }
}

async function loadMetricHistory() {
  if (!historyMetric.value) return

  isHistoryLoading.value = true
  try {
    const resp = await getMetricCalculationJobs({
      metricId: historyMetric.value.id,
      page: historyPage.value,
      limit: historyLimit.value,
      sortBy: historySortBy.value,
    })
    historyJobs.value = resp.jobs
    historyHasNext.value = resp.jobs.length === historyLimit.value
  } finally {
    isHistoryLoading.value = false
  }
}

async function loadMetricSnapshot(metric: MetricModel): Promise<MetricModel | null> {
  const resp = await getMetrics({
    page: 0,
    limit: 100,
    sortBy: sortBy.value,
    metricSystemName: metric.systemName,
  })
  return resp.metrics.find((item) => item.id === metric.id) ?? null
}

function replaceMetric(updatedMetric: MetricModel): boolean {
  const index = metrics.value.findIndex((metric) => metric.id === updatedMetric.id)
  if (index < 0) return false

  metrics.value.splice(index, 1, updatedMetric)
  return true
}

function patchMetricJob(metricId: string, job: CalculationJobModel): MetricModel | null {
  const metric = metrics.value.find((item) => item.id === metricId)
  if (!metric) return null

  metric.lastCalculationJob = job
  return metric
}

function clearMetricRecalculation(metricId: string | null | undefined) {
  if (!metricId) return
  recalculatingMetrics.value = {
    ...recalculatingMetrics.value,
    [metricId]: false,
  }
}

async function handleMetricCalculationJobUpdated(event: MetricCalculationJobUpdatedEvent) {
  const resp = await getCalculationJob(event.requestId)
  const job: CalculationJobModel = {
    ...resp.calculationJob,
    status: event.calculationStatus,
    errorMessage: event.errorMessage,
  }
  activeJob.value = job

  const metricId = event.metricId ?? job.metricId
  const visibleMetric = metricId ? patchMetricJob(metricId, job) : null

  if (historyDrawerOpen.value && historyMetric.value && metricId === historyMetric.value.id) {
    await loadMetricHistory()
  }

  if (!isTerminalStatus(job.status)) {
    return
  }

  if (job.status !== 'Succeeded') {
    clearMetricRecalculation(metricId)
    return
  }

  clearMetricRecalculation(metricId)

  if (visibleMetric) {
    const updatedMetric = await loadMetricSnapshot(visibleMetric)
    if (updatedMetric) {
      replaceMetric(updatedMetric)
      if (historyMetric.value?.id === updatedMetric.id) {
        historyMetric.value = updatedMetric
      }
      return
    }
  }

  await loadMetrics(true)
}

async function submitJob() {
  if (!canCreateJob.value || !createForm.metricSystemName || !createForm.currencyId || !selectedProduct.value) return

  isCreating.value = true
  try {
    const resp = await createCalculationJob({
      metricSystemName: createForm.metricSystemName,
      metricPayload: {
        currencyId: createForm.currencyId,
        rangeStart: createForm.range[0] as string,
        rangeEnd: createForm.range[1] as string,
        productId: selectedProduct.value.id,
      },
    })
    createDrawerOpen.value = false
    ElNotification.success({
      title: t('analytics.creatingTitle'),
      message: t('analytics.calculationStarted'),
    })
    await refreshJob(resp.requestId)
  } finally {
    isCreating.value = false
  }
}

async function recalculateMetric(metric: MetricModel) {
  if (!metric.id) {
    ElNotification.warning({
      title: t('analytics.recalcFailedTitle'),
      message: t('analytics.noMetricId'),
    })
    return
  }

  const key = metricRowKey(metric)
  recalculatingMetrics.value = {
    ...recalculatingMetrics.value,
    [key]: true,
  }

  try {
    const resp = await createCalculationJob({
      metricId: metric.id,
    })
    ElNotification.success({
      title: t('analytics.recalculationStarted'),
      message: t('analytics.calculationStarted'),
    })
    await refreshJob(resp.requestId)
  } finally {
    recalculatingMetrics.value = {
      ...recalculatingMetrics.value,
      [key]: false,
    }
  }
}

async function refreshJob(id: string) {
  const resp = await getCalculationJob(id)
  activeJob.value = resp.calculationJob
}

watch(page, async () => loadMetrics(false))
watch(limit, async () => loadMetrics(true))
watch(sortBy, async () => loadMetrics(true))
watch(historyPage, async () => {
  if (historyDrawerOpen.value) await loadMetricHistory()
})
watch(historyLimit, async () => {
  if (!historyDrawerOpen.value) return
  historyPage.value = 0
  await loadMetricHistory()
})
watch(historySortBy, async () => {
  if (!historyDrawerOpen.value) return
  historyPage.value = 0
  await loadMetricHistory()
})
watch(historyDrawerOpen, (isOpen) => {
  if (isOpen) return
  historyMetric.value = null
  historyJobs.value = []
  historyHasNext.value = false
})

onMounted(async () => {
  await Promise.all([
    loadMetricInfos(),
    loadCurrencies(),
    loadMetrics(false),
  ])

  try {
    metricHubConnection = await startMetricCalculationHub(handleMetricCalculationJobUpdated)
  } catch {
    ElNotification.warning({
      title: t('common.messages.realtimeUnavailableTitle'),
      message: t('analytics.realtimeMessage'),
    })
  }
})

onBeforeUnmount(async () => {
  await metricHubConnection?.stop()
  metricHubConnection = null
})
</script>

<style scoped>
.analytics-table :deep(.el-table__row) {
  cursor: default;
}

.analytics-table {
  width: 100%;
}

.analytics-metric-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analytics-metric-filter-button {
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.analytics-metric-filter-button:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.analytics-metric-filter-button--active {
  background: #eff6ff;
  border-color: #2563eb;
  box-shadow: inset 3px 0 0 #2563eb;
}

.analytics-clear-filter-button {
  align-self: flex-start;
  margin-left: 0;
}

.analytics-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.analytics-table :deep(.cell) {
  padding-left: 10px;
  padding-right: 10px;
}

.analytics-action-button {
  width: 100%;
  margin-left: 0;
}

.analytics-actions-stack {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: 100%;
}

.analytics-actions-stack :deep(.el-button) {
  justify-content: center;
  margin-left: 0;
}

.analytics-job-alert :deep(.el-alert) {
  padding: 14px 16px;
}

.analytics-job-alert :deep(.el-alert__content) {
  width: 100%;
}

:global(.analytics-create-drawer-header) {
  margin-bottom: 0;
  padding: 0;
  border-bottom: 1px solid #e2e8f0;
}

:global(.analytics-create-drawer-body) {
  padding: 0;
}

.analytics-drawer-close {
  flex: 0 0 auto;
  margin-right: 0;
}

.analytics-drawer-close :deep(.el-icon) {
  color: #334155;
  font-size: 18px;
}

.analytics-drawer-titlebar {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 18px 24px;
}

.analytics-drawer-form-item {
  margin-bottom: 20px;
}

.analytics-drawer-form-item:last-child {
  margin-bottom: 0;
}

.analytics-drawer-form-item :deep(.el-select),
.analytics-drawer-form-item :deep(.el-date-editor) {
  width: 100%;
}

.analytics-drawer-form-item :deep(.el-form-item__label) {
  margin-bottom: 8px;
  color: #334155;
  font-weight: 500;
}
</style>
