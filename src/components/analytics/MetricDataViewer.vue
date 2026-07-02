<template>
  <section class="metric-data-viewer">
    <div class="metric-data-viewer__header">
      <div class="metric-data-viewer__title-block">
        <h3>{{ metric.name || metric.systemName }}</h3>
        <p v-if="metric.description">{{ metric.description }}</p>
      </div>

      <button
        v-if="hasData"
        type="button"
        class="metric-data-viewer__copy-json"
        :aria-label="t('analytics.viewer.copyJson')"
        @click="copyJson"
      >
        <span class="ti ti-file-text" aria-hidden="true" />
      </button>
    </div>

    <div class="metric-data-viewer__meta">
      <div>
        <span>{{ t('analytics.viewer.period') }}</span>
        <strong>{{ periodLabel }}</strong>
      </div>
      <div v-if="metric.currencyId">
        <span>{{ t('analytics.viewer.currency') }}</span>
        <strong>{{ metric.currencyId }}</strong>
      </div>
      <div v-if="metric.lastMetricJob">
        <span>{{ t('common.labels.status') }}</span>
        <strong>{{ statusLabel(metric.lastMetricJob.status) }}</strong>
      </div>
      <div v-if="metric.lastMetricJob">
        <span>{{ t('analytics.viewer.updatedAt') }}</span>
        <strong>{{ formatDateTime(metric.lastMetricJob.updatedAt) }}</strong>
      </div>
    </div>

    <div v-if="parseError" class="metric-data-viewer__error">
      <div>{{ t('analytics.viewer.parseError') }}</div>
      <pre>{{ metric.data }}</pre>
    </div>

    <div v-else-if="!hasData" class="metric-data-viewer__empty">
      {{ t('analytics.viewer.empty') }}
    </div>

    <template v-else>
      <div v-if="allNumbersAreZero" class="metric-data-viewer__zero-note">
        {{ t('analytics.viewer.allZeroHint') }}
      </div>

      <div class="metric-data-viewer__content">
        <MetricDataRenderer :data="parsedData" />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue'
import { ElNotification } from 'element-plus'
import type { MetricModel } from '@/services/api/analytics.ts'
import { useI18n } from '@/i18n'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonArray
interface JsonObject {
  [key: string]: JsonValue
}
type JsonArray = JsonValue[]

interface MetricCardData {
  key: string
  value: JsonPrimitive
}

interface MetricSectionData {
  key: string
  cards: MetricCardData[]
  sections: MetricSectionData[]
}

const props = defineProps<{
  metric: MetricModel
}>()

const { locale, t } = useI18n()

const parsedDataState = computed<{ value: JsonValue | null, error: boolean }>(() => {
  const rawData = props.metric.data?.trim()
  if (!rawData) return { value: null, error: false }

  try {
    return { value: unwrapRootData(JSON.parse(rawData) as JsonValue), error: false }
  } catch {
    return { value: null, error: true }
  }
})

const parsedData = computed(() => parsedDataState.value.value)
const parseError = computed(() => parsedDataState.value.error)
const hasData = computed(() => !parseError.value && parsedData.value !== null && hasRenderableData(parsedData.value))
const allNumbersAreZero = computed(() => {
  const numbers = collectNumbers(parsedData.value)
  return numbers.length > 0 && numbers.every((value) => value === 0)
})

const periodLabel = computed(() => {
  const start = formatDateTime(props.metric.rangeStart)
  const endDate = props.metric.rangeEnd ? new Date(props.metric.rangeEnd) : null
  const end = endDate && endDate.getTime() > Date.now()
    ? t('analytics.viewer.present')
    : formatDateTime(props.metric.rangeEnd)

  return `${start} - ${end}`
})

const MetricDataRenderer = defineComponent({
  name: 'MetricDataRenderer',
  props: {
    data: {
      type: [String, Number, Boolean, Object, Array, null] as PropType<JsonValue | null>,
      default: null,
    },
  },
  setup(rendererProps) {
    return (): VNodeChild => renderMetricData(rendererProps.data)
  },
})

function renderMetricData(data: unknown): VNodeChild {
  const value = normalizeUnknownJson(data)
  if (value === null) return h('div')

  if (isPlainObject(value)) {
    const sections: MetricSectionData[] = []
    const cards: MetricCardData[] = []

    Object.entries(value).forEach(([key, entryValue]) => {
      if (isPlainObject(entryValue)) {
        sections.push(buildSection(key, entryValue))
        return
      }

      if (Array.isArray(entryValue)) {
        sections.push(buildSection(key, arrayToObject(entryValue)))
        return
      }

      cards.push({ key, value: entryValue })
    })

    return h('div', { class: 'metric-data-viewer__rendered' }, [
      cards.length > 0 ? renderCards(cards) : null,
      ...sections.map((section) => renderSection(section)),
    ])
  }

  if (Array.isArray(value)) {
    return renderSection(buildSection(t('analytics.viewer.value'), arrayToObject(value)))
  }

  return renderCards([{ key: t('analytics.viewer.value'), value }])
}

function buildSection(key: string, value: JsonObject): MetricSectionData {
  const section: MetricSectionData = {
    key,
    cards: [],
    sections: [],
  }

  Object.entries(value).forEach(([entryKey, entryValue]) => {
    if (isPlainObject(entryValue)) {
      section.sections.push(buildSection(entryKey, entryValue))
      return
    }

    if (Array.isArray(entryValue)) {
      section.sections.push(buildSection(entryKey, arrayToObject(entryValue)))
      return
    }

    section.cards.push({ key: entryKey, value: entryValue })
  })

  return section
}

function renderSection(section: MetricSectionData): VNodeChild {
  return h('section', { class: 'metric-data-viewer__section', key: section.key }, [
    h('h4', { class: 'metric-data-viewer__section-title' }, section.key),
    section.cards.length > 0 ? renderCards(section.cards) : null,
    ...section.sections.map((childSection) => renderSection(childSection)),
  ])
}

function renderCards(cards: MetricCardData[]): VNodeChild {
  return h('div', { class: 'metric-data-viewer__cards' }, cards.map((card) => renderCard(card)))
}

function renderCard(card: MetricCardData): VNodeChild {
  const valueType = metricValueType(card.value)

  return h('article', { class: 'metric-data-viewer__card', key: card.key }, [
    h('div', { class: 'metric-data-viewer__card-icon' }, [
      h('span', { class: `ti ${iconClass(valueType)}`, 'aria-hidden': 'true' }),
    ]),
    h('div', { class: 'metric-data-viewer__card-body' }, [
      h('div', { class: 'metric-data-viewer__card-label' }, card.key),
      h('div', { class: ['metric-data-viewer__card-value', `metric-data-viewer__card-value--${valueType}`] }, formatMetricValue(card.value)),
    ]),
  ])
}

function normalizeUnknownJson(value: unknown): JsonValue | null {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as JsonPrimitive
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUnknownJson(item)) as JsonArray
  }

  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => [key, normalizeUnknownJson(entryValue)])) as JsonObject
  }

  return String(value)
}

function unwrapRootData(value: JsonValue): JsonValue {
  if (!isPlainObject(value)) return value

  const keys = Object.keys(value)
  if (keys.length === 1 && keys[0] === 'data') {
    return value.data ?? null
  }

  return value
}

function isPlainObject(value: JsonValue | null): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function arrayToObject(value: JsonArray): JsonObject {
  return Object.fromEntries(value.map((entry, index) => [t('analytics.viewer.item', { index: index + 1 }), entry]))
}

function hasRenderableData(value: JsonValue): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (isPlainObject(value)) return Object.keys(value).length > 0
  return true
}

function collectNumbers(value: JsonValue | null): number[] {
  if (typeof value === 'number' && Number.isFinite(value)) return [value]
  if (Array.isArray(value)) return value.flatMap((entry) => collectNumbers(entry))
  if (isPlainObject(value)) return Object.values(value).flatMap((entry) => collectNumbers(entry))
  return []
}

function metricValueType(value: JsonPrimitive): 'number' | 'date' | 'boolean' | 'text' {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'string' && isIsoDate(value)) return 'date'
  return 'text'
}

function iconClass(type: ReturnType<typeof metricValueType>): string {
  if (type === 'number') return 'ti-hash'
  if (type === 'date') return 'ti-calendar'
  if (type === 'boolean') return 'ti-toggle-left'
  return 'ti-file-text'
}

function formatMetricValue(value: JsonPrimitive): string {
  if (value === null) return '-'

  if (typeof value === 'number') {
    return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 4 }).format(value)
  }

  if (typeof value === 'boolean') {
    return value ? t('analytics.viewer.yes') : t('analytics.viewer.no')
  }

  if (typeof value === 'string' && isIsoDate(value)) {
    return formatDateTime(value)
  }

  return String(value)
}

function statusLabel(status: string): string {
  return t(`analytics.statuses.${status}`) || status
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(new Date(value).getTime())
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleString(locale.value)
}

async function copyJson(): Promise<void> {
  await navigator.clipboard.writeText(props.metric.data ?? '')
  ElNotification.success({
    title: t('analytics.viewer.copiedTitle'),
    message: t('analytics.viewer.copiedMessage'),
    duration: 1600,
  })
}
</script>

<style>
.metric-data-viewer {
  display: grid;
  gap: 14px;
  color: #0f172a;
}

.metric-data-viewer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.metric-data-viewer__title-block {
  min-width: 0;
}

.metric-data-viewer__title-block h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.metric-data-viewer__title-block p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.metric-data-viewer__copy-json {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid #d8e0ec;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
}

.metric-data-viewer__copy-json:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
}

.metric-data-viewer__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-data-viewer__meta div {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 12px;
}

.metric-data-viewer__meta span,
.metric-data-viewer__meta strong {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-data-viewer__meta span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.metric-data-viewer__meta strong {
  margin-top: 3px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 650;
}

.metric-data-viewer__zero-note {
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: 13px;
  line-height: 1.45;
  padding: 10px 12px;
}

.metric-data-viewer__content,
.metric-data-viewer__rendered {
  display: grid;
  gap: 16px;
}

.metric-data-viewer__section {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding-top: 2px;
}

.metric-data-viewer__section .metric-data-viewer__section {
  margin-left: 12px;
}

.metric-data-viewer__section-title {
  margin: 0;
  color: #334155;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
}

.metric-data-viewer__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.metric-data-viewer__card {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}

.metric-data-viewer__card-icon {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
}

.ti-hash::before {
  content: "#";
}

.ti-calendar::before {
  content: "C";
}

.ti-toggle-left::before {
  content: "T";
}

.ti-file-text::before {
  content: "F";
}

.metric-data-viewer__card-body {
  min-width: 0;
}

.metric-data-viewer__card-label {
  overflow-wrap: anywhere;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.metric-data-viewer__card-value {
  margin-top: 6px;
  overflow-wrap: anywhere;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  white-space: pre-wrap;
}

.metric-data-viewer__card-value--text {
  font-size: 14px;
  font-weight: 650;
}

.metric-data-viewer__card-value--date,
.metric-data-viewer__card-value--boolean {
  font-size: 14px;
}

.metric-data-viewer__card-value--number {
  font-variant-numeric: tabular-nums;
}

.metric-data-viewer__empty,
.metric-data-viewer__error {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #64748b;
  font-size: 14px;
  padding: 16px;
}

.metric-data-viewer__error {
  border-color: #fecaca;
  color: #991b1b;
}

.metric-data-viewer__error pre {
  max-height: 240px;
  overflow: auto;
  margin: 10px 0 0;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fff7f7;
  color: #7f1d1d;
  font-size: 12px;
  padding: 10px;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .metric-data-viewer__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .metric-data-viewer__meta,
  .metric-data-viewer__cards {
    grid-template-columns: 1fr;
  }
}
</style>
