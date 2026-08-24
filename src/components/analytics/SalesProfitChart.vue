<template>
  <div ref="chartElement" class="sales-profit-chart" role="img" :aria-label="accessibleLabel" />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts, EChartsOption } from 'echarts'
import type { SalesProfitDataPoint } from '@/services/api/analytics.ts'
import type { TimeSeriesGranularity } from '@/utils/timeSeries.ts'

use([
  BarChart,
  LineChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

interface TooltipParam {
  axisValueLabel?: string
  marker?: string
  seriesName?: string
  value?: number
  dataIndex?: number
}

const props = defineProps<{
  points: SalesProfitDataPoint[]
  locale: string
  granularity: TimeSeriesGranularity
  currencyLabel: string
  accessibleLabel: string
  labels: {
    revenue: string
    cost: string
    grossProfit: string
    margin: string
    sales: string
    products: string
  }
}>()

const chartElement = ref<HTMLDivElement>()
let chart: ECharts | undefined
let resizeObserver: ResizeObserver | undefined
const showDataZoom = computed(() => props.points.length >= 30)

const option = computed<EChartsOption>(() => ({
  animationDuration: 220,
  color: ['#047857', '#64748b', '#d97706'],
  grid: {
    top: 48,
    right: 24,
    bottom: showDataZoom.value ? 64 : 34,
    left: 24,
    containLabel: true,
  },
  legend: {
    top: 6,
    right: 8,
    itemWidth: 16,
    itemHeight: 8,
    textStyle: { color: '#475569', fontSize: 12 },
  },
  tooltip: {
    trigger: 'axis',
    borderColor: '#d7dee8',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    textStyle: { color: '#0f172a', fontSize: 12 },
    formatter: (rawParams: unknown) => formatTooltip(rawParams),
  },
  xAxis: {
    type: 'category',
    boundaryGap: true,
    data: props.points.map((point) => formatPeriod(point.periodStart)),
    axisLine: { lineStyle: { color: '#d7dee8' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', hideOverlap: true, fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#64748b',
      formatter: (value: number) => compactAmount(value),
    },
    splitLine: { lineStyle: { color: '#edf0f4' } },
  },
  dataZoom: showDataZoom.value
    ? [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', height: 18, bottom: 8 }]
    : [],
  series: [
    {
      name: props.labels.revenue,
      type: 'line',
      data: props.points.map((point) => point.revenue),
      symbol: 'none',
      lineStyle: { width: 2 },
      emphasis: { focus: 'series' },
    },
    {
      name: props.labels.cost,
      type: 'line',
      data: props.points.map((point) => point.cost),
      symbol: 'none',
      lineStyle: { width: 2 },
      emphasis: { focus: 'series' },
    },
    {
      name: props.labels.grossProfit,
      type: 'bar',
      data: props.points.map((point) => point.grossProfit),
      barMaxWidth: 22,
      itemStyle: { borderRadius: [2, 2, 0, 0] },
      emphasis: { focus: 'series' },
    },
  ],
}))

function formatPeriod(value: string) {
  if (props.granularity === 'Year') {
    return new Intl.DateTimeFormat(props.locale, { year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
  }

  if (props.granularity === 'Month') {
    return new Intl.DateTimeFormat(props.locale, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(value))
  }

  const firstPoint = props.points[0]
  const lastPoint = props.points[props.points.length - 1]
  const spansSeveralYears = Boolean(firstPoint && lastPoint
    && new Date(firstPoint.periodStart).getUTCFullYear() !== new Date(lastPoint.periodStart).getUTCFullYear())
  return new Intl.DateTimeFormat(props.locale, {
    day: '2-digit',
    month: 'short',
    year: spansSeveralYears ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(new Date(value))
}

function compactAmount(value: number) {
  return new Intl.NumberFormat(props.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function amount(value: number) {
  const formatted = new Intl.NumberFormat(props.locale, { maximumFractionDigits: 2 }).format(value)
  return `${formatted} ${props.currencyLabel}`.trim()
}

function formatTooltip(rawParams: unknown) {
  const params = Array.isArray(rawParams) ? rawParams as TooltipParam[] : []
  const point = props.points[params[0]?.dataIndex ?? -1]
  if (!point) return ''

  const series = params
    .map((item) => `${item.marker ?? ''}${item.seriesName}: <strong>${amount(Number(item.value ?? 0))}</strong>`)
    .join('<br>')
  const margin = new Intl.NumberFormat(props.locale, { style: 'percent', maximumFractionDigits: 1 }).format(point.margin)

  return [
    `<strong>${params[0]?.axisValueLabel ?? formatPeriod(point.periodStart)}</strong>`,
    series,
    `${props.labels.margin}: <strong>${margin}</strong>`,
    `${props.labels.sales}: <strong>${point.salesCount}</strong>`,
    `${props.labels.products}: <strong>${point.productsCount}</strong>`,
  ].filter(Boolean).join('<br>')
}

async function renderChart() {
  await nextTick()
  if (!chartElement.value) return
  chart ??= init(chartElement.value)
  chart.setOption(option.value, true)
}

watch(option, renderChart, { deep: true })

onMounted(() => {
  void renderChart()
  if (chartElement.value) {
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(chartElement.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.sales-profit-chart {
  width: 100%;
  height: 420px;
}

@media (max-width: 760px) {
  .sales-profit-chart {
    height: 360px;
  }
}
</style>
