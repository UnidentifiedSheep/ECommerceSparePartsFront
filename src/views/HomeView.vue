<template>
  <div class="home-page">
    <PageHeader :title="t('home.title')" :description="t('home.description')">
      <template #actions>
        <el-button
          v-if="canViewCharts"
          plain
          :loading="loading"
          :icon="Refresh"
          @click="loadChartData"
        >
          {{ t('common.actions.refresh') }}
        </el-button>
      </template>
    </PageHeader>

    <main class="home-content">
      <el-empty v-if="!canViewCharts" :description="t('home.noPermission')" />

      <section v-else class="chart-panel">
        <header class="chart-panel__header">
          <div>
            <h2>{{ chartDefinition?.name || t('home.salesProfitTitle') }}</h2>
            <p>{{ chartDefinition?.description || t('home.salesProfitDescription') }}</p>
          </div>
        </header>

        <div class="chart-filters">
          <div class="filter-field filter-field--organization">
            <label>{{ t('home.organizationOrBuyer') }}</label>
            <OrganizationSelector
              v-model="organizationSelection"
              :member-required="false"
              :placeholder="t('home.allOrganizations')"
            />
          </div>

          <div class="filter-field filter-field--period">
            <label>{{ t('home.period') }}</label>
            <div class="period-presets" role="group" :aria-label="t('home.period')">
              <button
                v-for="preset in periodPresets"
                :key="preset.days"
                type="button"
                :class="{ 'is-active': selectedPresetDays === preset.days }"
                @click="selectPeriod(preset.days)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="filter-field filter-field--dates">
            <div class="filter-label-row">
              <label>{{ t('home.dateRange') }}</label>
              <button type="button" class="today-button" @click="moveRangeToToday">
                {{ t('home.today') }}
              </button>
            </div>
            <div class="date-navigation">
              <el-tooltip :content="t('home.previousPeriod')" placement="top" :show-after="300">
                <button
                  type="button"
                  class="date-navigation-button"
                  :aria-label="t('home.previousPeriod')"
                  @click="shiftDateRange(-1)"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </button>
              </el-tooltip>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                format="DD.MM.YYYY"
                :start-placeholder="t('home.startDate')"
                :end-placeholder="t('home.endDate')"
                :clearable="false"
                @change="selectedPresetDays = null"
              />
              <el-tooltip :content="t('home.nextPeriod')" placement="top" :show-after="300">
                <button
                  type="button"
                  class="date-navigation-button"
                  :disabled="!canShiftForward"
                  :aria-label="t('home.nextPeriod')"
                  @click="shiftDateRange(1)"
                >
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </div>

          <div class="filter-field filter-field--granularity">
            <label>{{ t('home.granularity') }}</label>
            <el-select v-model="granularity">
              <el-option :label="t('home.granularities.Day')" value="Day" />
              <el-option :label="t('home.granularities.Month')" value="Month" />
              <el-option :label="t('home.granularities.Year')" value="Year" />
            </el-select>
          </div>

        </div>

        <div v-if="nextCursor" class="partial-data-note">
          {{ t('home.partialData') }}
        </div>

        <div v-if="points.length > 0" class="chart-summary">
          <div>
            <span>{{ t('home.revenue') }}</span>
            <strong>{{ formatAmount(summary.revenue) }}</strong>
          </div>
          <div>
            <span>{{ t('home.cost') }}</span>
            <strong>{{ formatAmount(summary.cost) }}</strong>
          </div>
          <div>
            <span>{{ t('home.grossProfit') }}</span>
            <strong :class="amountClass(summary.grossProfit)">{{ formatAmount(summary.grossProfit) }}</strong>
          </div>
          <div>
            <span>{{ t('home.margin') }}</span>
            <strong :class="amountClass(summary.margin)">{{ formatPercent(summary.margin) }}</strong>
          </div>
          <div>
            <span>{{ t('home.sales') }}</span>
            <strong>{{ formatInteger(summary.salesCount) }}</strong>
          </div>
          <div>
            <span>{{ t('home.products') }}</span>
            <strong>{{ formatInteger(summary.productsCount) }}</strong>
          </div>
        </div>

        <div v-loading="loading" class="chart-stage">
          <el-alert
            v-if="loadError"
            type="error"
            :title="loadError"
            :closable="false"
            show-icon
          />
          <el-empty
            v-else-if="!loading && !chartDefinition"
            :description="t('home.chartUnavailable')"
          />
          <el-empty
            v-else-if="!loading && points.length === 0"
            :description="t('home.noData')"
          />
          <SalesProfitChart
            v-else-if="points.length > 0"
            :points="points"
            :locale="locale"
            :granularity="granularity"
            :currency-label="currencyLabel"
            :accessible-label="chartDefinition?.name || t('home.salesProfitTitle')"
            :labels="chartLabels"
            :has-more="Boolean(nextCursor)"
            :loading-more="loadingMore"
            :loading-more-label="t('home.loadingMore')"
            @load-more="loadMoreChartData"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { ArrowLeft, ArrowRight, Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import SalesProfitChart from '@/components/analytics/SalesProfitChart.vue'
import type { OrganizationSelection } from '@/models/organizationModel.ts'
import {
  getCharts,
  querySalesProfitChart,
  type ChartGranularity,
  type ChartModel,
  type SalesProfitDataPoint,
} from '@/services/api/analytics.ts'
import { useCurrencyStore } from '@/stores/currencyStore.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'
import { fillTimeSeriesGaps } from '@/utils/timeSeries.ts'
import { ElMessage } from 'element-plus'

const salesProfitSystemName = 'SalesProfitOverTimeChartDataSource'
const { locale, t } = useI18n()
const { hasPermission } = usePermissions()
const currencyStore = useCurrencyStore()
const { baseCurrency } = storeToRefs(currencyStore)

const canViewCharts = computed(() => hasPermission('CHARTS_GET'))
const chartDefinition = ref<ChartModel>()
const points = ref<SalesProfitDataPoint[]>([])
const loadedDataPoints = ref<SalesProfitDataPoint[]>([])
const nextCursor = ref<string | null>(null)
const organizationSelection = ref<OrganizationSelection>()
const dateRange = ref<[string, string]>(periodRange(30))
const selectedPresetDays = ref<number | null>(30)
const granularity = ref<ChartGranularity>('Day')
const loading = ref(false)
const loadingMore = ref(false)
const loadError = ref('')
let chartRequestId = 0
let chartAbortController: AbortController | undefined

const periodPresets = computed(() => [
  { days: 7, label: t('home.periods.sevenDays') },
  { days: 30, label: t('home.periods.thirtyDays') },
  { days: 90, label: t('home.periods.ninetyDays') },
  { days: 365, label: t('home.periods.year') },
])

const chartLabels = computed(() => ({
  revenue: t('home.revenue'),
  cost: t('home.cost'),
  grossProfit: t('home.grossProfit'),
  margin: t('home.margin'),
  sales: t('home.sales'),
  products: t('home.products'),
}))

const currencyLabel = computed(() => baseCurrency.value?.currencySign || baseCurrency.value?.shortName || '')
const canShiftForward = computed(() => dateRange.value[1] < dateString(new Date()))

const summary = computed(() => {
  const totals = points.value.reduce((result, point) => ({
    revenue: result.revenue + point.revenue,
    cost: result.cost + point.cost,
    grossProfit: result.grossProfit + point.grossProfit,
    salesCount: result.salesCount + point.salesCount,
    productsCount: result.productsCount + point.productsCount,
  }), { revenue: 0, cost: 0, grossProfit: 0, salesCount: 0, productsCount: 0 })

  return {
    ...totals,
    margin: totals.revenue === 0 ? 0 : totals.grossProfit / totals.revenue,
  }
})

function dateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function periodRange(days: number): [string, string] {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return [dateString(start), dateString(end)]
}

function selectPeriod(days: number) {
  selectedPresetDays.value = days
  dateRange.value = periodRange(days)
  granularity.value = days <= 90 ? 'Day' : 'Month'
}

function shiftDateRange(direction: -1 | 1) {
  const stepDays = rangeLengthInDays()
  const shiftedStart = addDays(dateRange.value[0], direction * stepDays)
  const shiftedEnd = addDays(dateRange.value[1], direction * stepDays)
  const today = dateString(new Date())

  if (direction > 0 && shiftedEnd > today) {
    dateRange.value = [addDays(today, -stepDays + 1), today]
    return
  }

  dateRange.value = [shiftedStart, shiftedEnd]
}

function moveRangeToToday() {
  const days = rangeLengthInDays()
  const today = dateString(new Date())
  dateRange.value = [addDays(today, -days + 1), today]
}

function rangeLengthInDays() {
  const start = Date.parse(`${dateRange.value[0]}T00:00:00.000Z`)
  const end = Date.parse(`${dateRange.value[1]}T00:00:00.000Z`)
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1)
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function utcBoundary(date: string, endOfDay: boolean) {
  return `${date}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
}

async function loadChartData() {
  if (!canViewCharts.value || dateRange.value.length !== 2) return

  const requestId = ++chartRequestId
  chartAbortController?.abort()
  chartAbortController = new AbortController()
  const { signal } = chartAbortController
  loading.value = true
  loadingMore.value = false
  loadedDataPoints.value = []
  nextCursor.value = null
  points.value = []
  loadError.value = ''
  try {
    if (!chartDefinition.value) {
      const response = await getCharts(signal)
      if (requestId !== chartRequestId) return
      chartDefinition.value = response.charts.find((chart) => chart.systemName === salesProfitSystemName)
      if (!chartDefinition.value) {
        points.value = []
        return
      }
    }

    const response = await loadChartPage(undefined, signal)
    if (requestId !== chartRequestId) return
    loadedDataPoints.value = response.dataPoints
    nextCursor.value = response.nextCursor
    rebuildVisiblePoints()
  } catch (error) {
    if (requestId !== chartRequestId) return
    points.value = []
    loadError.value = error instanceof Error ? error.message : t('home.loadError')
  } finally {
    if (requestId === chartRequestId) loading.value = false
  }
}

async function loadMoreChartData() {
  if (!nextCursor.value || loadingMore.value || loading.value || !chartAbortController) return

  const requestId = chartRequestId
  const cursor = nextCursor.value
  loadingMore.value = true
  try {
    const response = await loadChartPage(cursor, chartAbortController.signal)
    if (requestId !== chartRequestId) return
    loadedDataPoints.value.push(...response.dataPoints)
    nextCursor.value = response.nextCursor
    rebuildVisiblePoints()
  } catch (error) {
    if (requestId !== chartRequestId) return
    ElMessage.error(error instanceof Error ? error.message : t('home.loadMoreError'))
  } finally {
    if (requestId === chartRequestId) loadingMore.value = false
  }
}

function loadChartPage(cursor: string | undefined, signal: AbortSignal) {
  const selection = organizationSelection.value
  return querySalesProfitChart({
    organizationId: selection?.organization.id ?? null,
    buyerId: selection?.member?.user.id ?? null,
    startDate: utcBoundary(dateRange.value[0], false),
    endDate: utcBoundary(dateRange.value[1], true),
    granularity: granularity.value,
    cursor,
    size: 100,
  }, signal)
}

function rebuildVisiblePoints() {
  const lastLoadedPoint = loadedDataPoints.value[loadedDataPoints.value.length - 1]
  const visibleEndDate = nextCursor.value && lastLoadedPoint
    ? lastLoadedPoint.periodStart
    : dateRange.value[1]

  points.value = fillTimeSeriesGaps({
    points: loadedDataPoints.value,
    startDate: dateRange.value[0],
    endDate: visibleEndDate,
    granularity: granularity.value,
    createEmptyPoint: (periodStart) => ({
      periodStart,
      revenue: 0,
      cost: 0,
      grossProfit: 0,
      salesCount: 0,
      productsCount: 0,
      margin: 0,
    }),
  })
}

function formatAmount(value: number) {
  const amount = value.toLocaleString(locale.value, { maximumFractionDigits: 2 })
  return `${amount} ${currencyLabel.value}`.trim()
}

function formatPercent(value: number) {
  return value.toLocaleString(locale.value, { style: 'percent', maximumFractionDigits: 1 })
}

function formatInteger(value: number) {
  return value.toLocaleString(locale.value, { maximumFractionDigits: 0 })
}

function amountClass(value: number) {
  return { 'is-negative': value < 0, 'is-positive': value > 0 }
}

const loadChartDataDebounced = useDebounceFn(() => loadChartData(), 300)

watch(
  [organizationSelection, dateRange, granularity],
  () => void loadChartDataDebounced(),
  { deep: true },
)

onMounted(async () => {
  if (!canViewCharts.value) return
  await Promise.all([currencyStore.loadBaseCurrency(), loadChartData()])
})
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 56px);
  background: var(--app-bg);
}

.home-content {
  padding: 24px;
}

.chart-panel {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
}

.chart-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 14px;
}

.chart-panel__header h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
  line-height: 1.3;
}

.chart-panel__header p {
  max-width: 760px;
  margin: 5px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.45;
}

.chart-filters {
  display: grid;
  grid-template-columns: minmax(240px, 1.2fr) auto minmax(260px, 1fr) 140px;
  align-items: end;
  gap: 12px;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface-tinted);
  padding: 14px 20px;
}

.filter-field {
  min-width: 0;
}

.filter-field label {
  display: block;
  margin-bottom: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.filter-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.today-button {
  border: 0;
  background: transparent;
  padding: 0;
  color: #047857;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.today-button:hover {
  text-decoration: underline;
}

.date-navigation {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  gap: 6px;
}

.date-navigation-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: #fff;
  color: var(--app-text-muted);
  cursor: pointer;
}

.date-navigation-button:hover:not(:disabled) {
  border-color: #9fb3a9;
  color: #047857;
}

.date-navigation-button:disabled {
  background: var(--app-surface-tinted);
  color: #b8c1cc;
  cursor: not-allowed;
}

.filter-field :deep(.el-date-editor),
.filter-field :deep(.el-select) {
  width: 100%;
}

.period-presets {
  display: inline-flex;
  height: 32px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: #fff;
}

.period-presets button {
  border: 0;
  border-right: 1px solid var(--app-border);
  background: transparent;
  padding: 0 10px;
  color: var(--app-text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.period-presets button:last-child {
  border-right: 0;
}

.period-presets button:hover,
.period-presets button.is-active {
  background: #ecfdf5;
  color: #047857;
}

.period-presets button.is-active {
  font-weight: 600;
}

.chart-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border-bottom: 1px solid var(--app-border);
  padding: 14px 20px;
}

.partial-data-note {
  border-bottom: 1px solid var(--app-border);
  background: #f8fafc;
  padding: 7px 20px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.chart-summary > div {
  min-width: 0;
  border-right: 1px solid var(--app-border);
  padding: 0 16px;
}

.chart-summary > div:first-child {
  padding-left: 0;
}

.chart-summary > div:last-child {
  border-right: 0;
}

.chart-summary span,
.chart-summary strong {
  display: block;
}

.chart-summary span {
  margin-bottom: 4px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.chart-summary strong {
  overflow: hidden;
  color: var(--app-text);
  font-size: 16px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-summary strong.is-positive { color: #047857; }
.chart-summary strong.is-negative { color: #b42318; }

.chart-stage {
  min-height: 420px;
  padding: 10px 12px 14px;
}

.chart-stage :deep(.el-empty) {
  min-height: 390px;
}

@media (max-width: 1280px) {
  .chart-filters {
    grid-template-columns: minmax(240px, 1fr) auto minmax(260px, 1fr) 140px;
  }

  .chart-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 16px;
  }

  .chart-summary > div:nth-child(3) {
    border-right: 0;
  }
}

@media (max-width: 860px) {
  .home-content {
    padding: 16px;
  }

  .chart-filters {
    grid-template-columns: 1fr 1fr;
  }

  .filter-field--organization,
  .filter-field--period {
    grid-column: 1 / -1;
  }

}

@media (max-width: 600px) {
  .chart-filters {
    grid-template-columns: 1fr;
  }

  .filter-field {
    grid-column: 1 / -1;
  }

  .period-presets {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    width: 100%;
  }

  .chart-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-summary > div:nth-child(3) {
    border-right: 1px solid var(--app-border);
  }

  .chart-summary > div:nth-child(even) {
    border-right: 0;
  }
}
</style>
