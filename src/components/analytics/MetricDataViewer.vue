<template>
  <section class="metric-data-viewer" :class="{ 'metric-data-viewer--compact': densityMode === 'compact' }">
    <div class="metric-data-viewer__toolbar">
      <div class="metric-data-viewer__heading">
        <div class="metric-data-viewer__title">Данные метрики</div>
      </div>

      <div v-if="hasData" class="metric-data-viewer__actions">
        <el-input
          v-model="searchQuery"
          class="metric-data-viewer__search"
          clearable
          placeholder="Поиск по данным"
          size="small"
        />
        <el-radio-group v-model="densityMode" size="small">
          <el-radio-button label="comfortable">Обычный</el-radio-button>
          <el-radio-button label="compact">Компактный</el-radio-button>
        </el-radio-group>
        <el-button size="small" plain @click="expandAll">Развернуть</el-button>
        <el-button size="small" plain @click="collapseAll">Свернуть</el-button>
        <el-button size="small" type="primary" plain @click="copyJson">Копировать JSON</el-button>
      </div>
    </div>

    <div v-if="parseError" class="metric-data-viewer__error">
      <div class="metric-data-viewer__error-title">Данные не удалось прочитать как JSON</div>
      <pre class="metric-data-viewer__raw">{{ data }}</pre>
    </div>

    <div v-else-if="!hasData" class="metric-data-viewer__empty">
      Нет данных для отображения.
    </div>

    <div v-else-if="visibleRootEntries.length === 0" class="metric-data-viewer__empty">
      По поиску ничего не найдено.
    </div>

    <div v-else class="metric-data-viewer__content">
      <MetricNode
        v-for="entry in visibleRootEntries"
        :key="entry.path"
        :label="entry.label"
        :path="entry.path"
        :value="entry.value"
        :level="0"
        :expanded="expanded"
        :search-query="normalizedSearchQuery"
        @toggle="toggleExpanded"
        @copy="copyValue"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch, type Component, type PropType, type VNodeChild } from 'vue'
import { ElButton, ElNotification } from 'element-plus'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonArray
interface JsonObject {
  [key: string]: JsonValue
}
type JsonArray = JsonValue[]

interface MetricEntry {
  label: string
  path: string
  value: JsonValue
}

const props = defineProps<{
  data?: string | null
}>()

const expanded = ref<Set<string>>(new Set())
const searchQuery = ref('')
const densityMode = ref<'comfortable' | 'compact'>('comfortable')

const parsedData = computed<JsonValue | null>(() => {
  if (!props.data?.trim()) {
    return null
  }

  try {
    return JSON.parse(props.data) as JsonValue
  } catch {
    return null
  }
})

const parseError = computed(() => Boolean(props.data?.trim()) && parsedData.value === null)

const rootEntries = computed<MetricEntry[]>(() => {
  if (parseError.value || parsedData.value === null) {
    return []
  }

  const value = unwrapRootData(parsedData.value)

  if (isObject(value)) {
    return getEntries(value).map(([key, entryValue]) => ({
      label: key,
      path: key,
      value: entryValue,
    }))
  }

  if (Array.isArray(value)) {
    return value.map((entryValue, index) => ({
      label: `Элемент ${index + 1}`,
      path: String(index),
      value: entryValue,
    }))
  }

  return [{ label: 'Значение', path: 'value', value }]
})

const hasData = computed(() => rootEntries.value.length > 0)
const normalizedSearchQuery = computed(() => normalizeSearch(searchQuery.value))
const visibleRootEntries = computed(() => {
  if (!normalizedSearchQuery.value) {
    return rootEntries.value
  }

  return rootEntries.value.filter((entry) => matchesEntry(entry.label, entry.value, normalizedSearchQuery.value))
})

watch(
  () => props.data,
  () => {
    expanded.value = new Set(rootEntries.value.filter((entry) => isContainer(entry.value)).map((entry) => entry.path))
  },
  { immediate: true },
)

watch(normalizedSearchQuery, (query) => {
  if (!query) {
    expanded.value = new Set(rootEntries.value.filter((entry) => isContainer(entry.value)).map((entry) => entry.path))
    return
  }

  const paths = new Set<string>()
  rootEntries.value.forEach((entry) => collectMatchingContainerPaths(entry.value, entry.path, query, paths))
  expanded.value = paths
})

function unwrapRootData(value: JsonValue | null): JsonValue | null {
  if (!isObject(value)) {
    return value
  }

  const keys = Object.keys(value)
  if (keys.length === 1 && keys[0] === 'data') {
    return value.data as JsonValue
  }

  return value
}

function isObject(value: JsonValue | null): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isContainer(value: JsonValue): value is JsonObject | JsonArray {
  return (Array.isArray(value) && value.length > 0) || (isObject(value) && Object.keys(value).length > 0)
}

function getEntries(value: JsonObject | JsonArray): Array<[string, JsonValue]> {
  if (Array.isArray(value)) {
    return value.map((entryValue, index): [string, JsonValue] => [`Элемент ${index + 1}`, entryValue])
  }

  return Object.entries(value)
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-zа-яё0-9])([A-ZА-ЯЁ])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (first) => first.toUpperCase())
}

function formatValue(value: JsonValue): string {
  if (value === null) {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(value)
  }

  if (typeof value === 'string' && isIsoDate(value)) {
    const date = new Date(value)
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  return String(value)
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU')
}

function matchesEntry(label: string, value: JsonValue, query: string): boolean {
  if (!query) {
    return true
  }

  if (matchesSelf(label, value, query)) {
    return true
  }

  if (!isContainer(value)) {
    return false
  }

  return getEntries(value).some(([key, entryValue]) => matchesEntry(key, entryValue, query))
}

function matchesSelf(label: string, value: JsonValue, query: string): boolean {
  const formattedLabel = normalizeSearch(formatLabel(label))
  if (formattedLabel.includes(query) || normalizeSearch(label).includes(query)) {
    return true
  }

  if (isContainer(value)) {
    return false
  }

  return normalizeSearch(formatValue(value)).includes(query) || normalizeSearch(String(value)).includes(query)
}

function primitiveKind(value: JsonValue): string {
  if (value === null) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value ? 'boolean-true' : 'boolean-false'
  }

  if (typeof value === 'number') {
    return 'number'
  }

  if (typeof value === 'string' && isIsoDate(value)) {
    return 'date'
  }

  return 'text'
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime())
}

function stringifyValue(value: JsonValue | null): string {
  if (value === null || typeof value !== 'object') {
    return formatValue(value)
  }

  return JSON.stringify(value, null, 2)
}

function expandAll(): void {
  const paths = new Set<string>()
  rootEntries.value.forEach((entry) => collectContainerPaths(entry.value, entry.path, paths))
  expanded.value = paths
}

function collapseAll(): void {
  expanded.value = new Set()
}

function collectContainerPaths(value: JsonValue, path: string, paths: Set<string>): void {
  if (!isContainer(value)) {
    return
  }

  paths.add(path)
  getEntries(value).forEach(([key, entryValue]) => collectContainerPaths(entryValue, `${path}.${key}`, paths))
}

function collectMatchingContainerPaths(value: JsonValue, path: string, query: string, paths: Set<string>): boolean {
  if (!isContainer(value)) {
    return matchesSelf(path.split('.').pop() ?? path, value, query)
  }

  const matchedSelf = matchesSelf(path.split('.').pop() ?? path, value, query)
  let matchedChildren = false
  getEntries(value).forEach(([key, entryValue]) => {
    matchedChildren = collectMatchingContainerPaths(entryValue, `${path}.${key}`, query, paths) || matchedChildren
  })

  if (matchedSelf || matchedChildren) {
    paths.add(path)
    return true
  }

  return false
}

function toggleExpanded(path: string): void {
  const next = new Set(expanded.value)
  if (next.has(path)) {
    next.delete(path)
  } else {
    next.add(path)
  }
  expanded.value = next
}

function copyJson(): void {
  void copyToClipboard(stringifyValue(unwrapRootData(parsedData.value)))
}

function copyValue(value: JsonValue): void {
  void copyToClipboard(stringifyValue(value))
}

async function copyToClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value)
  ElNotification.success({
    title: 'Скопировано',
    message: 'Значение добавлено в буфер обмена',
    duration: 1600,
  })
}

const MetricNode: Component = defineComponent({
  name: 'MetricNode',
  props: {
    label: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number, Boolean, Object, Array, null] as PropType<JsonValue>,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    expanded: {
      type: Object as PropType<Set<string>>,
      required: true,
    },
    searchQuery: {
      type: String,
      default: '',
    },
  },
  emits: {
    toggle: (...args: [string]) => args.length === 1,
    copy: (...args: [JsonValue]) => args.length === 1,
  },
  setup(nodeProps, { emit }) {
    return (): VNodeChild => {
      const isExpanded = nodeProps.expanded.has(nodeProps.path)
      const hasChildren = isContainer(nodeProps.value)

      if (!hasChildren) {
        const kind = primitiveKind(nodeProps.value)
        const isMatched = matchesSelf(nodeProps.label, nodeProps.value, nodeProps.searchQuery)

        return h('div', {
          class: ['metric-data-viewer__row', `metric-data-viewer__row--${kind}`, { 'metric-data-viewer__row--match': nodeProps.searchQuery && isMatched }],
          style: {
            marginLeft: nodeProps.level > 0 ? `${nodeProps.level * 12}px` : undefined,
          },
        }, [
          h('div', { class: 'metric-data-viewer__field' }, `${formatLabel(nodeProps.label)}:`),
          h('div', { class: ['metric-data-viewer__value', `metric-data-viewer__value--${kind}`] }, formatValue(nodeProps.value)),
          h(ElButton, {
            class: 'metric-data-viewer__copy',
            size: 'small',
            text: true,
            onClick: () => emit('copy', nodeProps.value),
          }, () => 'Копировать'),
        ])
      }

      const childEntries = getEntries(nodeProps.value)
      const groupMatched = matchesSelf(nodeProps.label, nodeProps.value, nodeProps.searchQuery)
      const visibleChildEntries = nodeProps.searchQuery && !groupMatched
        ? childEntries.filter(([key, entryValue]) => matchesEntry(key, entryValue, nodeProps.searchQuery))
        : childEntries
      const childNodes = visibleChildEntries.map(([key, entryValue]) => h(MetricNode, {
        key: `${nodeProps.path}.${key}`,
        label: key,
        path: `${nodeProps.path}.${key}`,
        value: entryValue,
        level: nodeProps.level + 1,
        expanded: nodeProps.expanded,
        searchQuery: nodeProps.searchQuery,
        onToggle: (path: string) => emit('toggle', path),
        onCopy: (value: JsonValue) => emit('copy', value),
      }))

      return h('section', {
        class: ['metric-data-viewer__group', { 'metric-data-viewer__group--match': nodeProps.searchQuery && groupMatched }],
        style: {
          marginLeft: nodeProps.level > 0 ? `${nodeProps.level * 12}px` : undefined,
        },
      }, [
        h('div', { class: 'metric-data-viewer__group-header' }, [
          h('button', {
            class: 'metric-data-viewer__group-toggle',
            type: 'button',
            onClick: () => emit('toggle', nodeProps.path),
          }, [
            h('span', { class: 'metric-data-viewer__group-name' }, formatLabel(nodeProps.label)),
          ]),
          h('div', { class: 'metric-data-viewer__group-actions' }, [
            h(ElButton, {
              size: 'small',
              text: true,
              onClick: () => emit('copy', nodeProps.value),
            }, () => 'Копировать'),
            h(ElButton, {
              size: 'small',
              plain: true,
              onClick: () => emit('toggle', nodeProps.path),
            }, () => (isExpanded ? 'Свернуть' : 'Развернуть')),
          ]),
        ]),
        isExpanded ? h('div', { class: 'metric-data-viewer__group-body' }, childNodes) : null,
      ])
    }
  },
})
</script>

<style>
.metric-data-viewer {
  --metric-accent: #1d4ed8;
  --metric-accent-soft: #eff6ff;
  --metric-border: #d8e0ec;
  --metric-border-strong: #b8c4d6;
  --metric-muted: #64748b;
  --metric-text: #0f172a;
  --metric-surface: #ffffff;
  --metric-subtle: #f8fafc;

  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 100%;
  overflow-x: auto;
  color: var(--metric-text);
}

.metric-data-viewer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 50px;
  padding: 12px 14px;
  background: var(--metric-surface);
  border: 1px solid var(--metric-border);
  border-radius: 8px;
}

.metric-data-viewer__heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.metric-data-viewer__title {
  font-size: 17px;
  font-weight: 650;
  line-height: 1.25;
  color: var(--metric-text);
}

.metric-data-viewer__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.metric-data-viewer__search {
  width: 220px;
}

.metric-data-viewer__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 680px;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__group {
  overflow: hidden;
  background: var(--metric-surface);
  border: 1px solid var(--metric-border);
  border-radius: 8px;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__group--match {
  border-color: #93c5fd;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__group-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 14px;
  min-height: 50px;
  padding: 12px 14px 12px 16px;
  background: var(--metric-subtle);
  border-left: 3px solid var(--metric-accent);
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__group-toggle {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__group-name {
  overflow: hidden;
  font-size: 16px;
  font-style: italic;
  font-weight: 650;
  line-height: 1.3;
  color: var(--metric-accent);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__group-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__group-body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-left: 14px;
  padding: 6px 14px 10px 14px;
  border-top: 1px solid var(--metric-border);
  border-left: 1px solid #dbe4f0;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__row {
  display: grid;
  grid-template-columns: minmax(190px, 28%) minmax(220px, 1fr) max-content;
  column-gap: 16px;
  row-gap: 0;
  align-items: baseline;
  min-height: 34px;
  padding: 7px 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #edf1f7;
  border-radius: 0;
  transition: background-color 0.15s ease;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__row:hover,
.metric-data-viewer__row:focus-within {
  background: #f8fafc;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__row--match {
  background: #fffbeb;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__row--match:hover,
.metric-data-viewer__row--match:focus-within {
  background: #fef3c7;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__row:last-child {
  border-bottom: 0;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__field {
  min-width: 0;
  font-size: 14px;
  font-style: italic;
  font-weight: 650;
  line-height: 1.35;
  color: #334155;
  overflow-wrap: anywhere;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__value {
  min-width: 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--metric-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__value--number {
  font-weight: 600;
  color: #0f172a;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__value--date {
  color: #475569;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__value--boolean-true {
  font-weight: 600;
  color: #15803d;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__value--boolean-false {
  font-weight: 600;
  color: #b45309;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__value--null {
  color: #94a3b8;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__copy {
  flex: 0 0 auto;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer__row:hover .metric-data-viewer__copy,
.metric-data-viewer__row:focus-within .metric-data-viewer__copy {
  opacity: 1;
  pointer-events: auto;
}

.metric-data-viewer--compact {
  gap: 8px;
}

.metric-data-viewer--compact .metric-data-viewer__toolbar {
  min-height: 42px;
  padding: 8px 10px;
}

.metric-data-viewer--compact .metric-data-viewer__title {
  font-size: 15px;
}

.metric-data-viewer--compact .metric-data-viewer__content {
  gap: 8px;
  min-width: 620px;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer--compact .metric-data-viewer__group-header {
  min-height: 40px;
  padding: 8px 10px 8px 12px;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer--compact .metric-data-viewer__group-name {
  font-size: 14px;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer--compact .metric-data-viewer__group-body {
  margin-left: 10px;
  padding: 4px 10px 6px 10px;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer--compact .metric-data-viewer__row {
  grid-template-columns: minmax(160px, 26%) minmax(200px, 1fr) max-content;
  column-gap: 12px;
  min-height: 28px;
  padding: 4px 0;
}

/*noinspection CssUnusedSymbol*/
.metric-data-viewer--compact .metric-data-viewer__field,
.metric-data-viewer--compact .metric-data-viewer__value {
  font-size: 13px;
  line-height: 1.3;
}

.metric-data-viewer__empty,
.metric-data-viewer__error {
  padding: 18px;
  color: var(--metric-muted);
  background: var(--metric-surface);
  border: 1px solid var(--metric-border);
  border-radius: 8px;
}

.metric-data-viewer__error {
  color: #991b1b;
  border-color: #fecaca;
}

.metric-data-viewer__error-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 650;
}

.metric-data-viewer__raw {
  max-height: 260px;
  padding: 12px;
  overflow: auto;
  font-size: 13px;
  color: #7f1d1d;
  background: #fff7f7;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

</style>
