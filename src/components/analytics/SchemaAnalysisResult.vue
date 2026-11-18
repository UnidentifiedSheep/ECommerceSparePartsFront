<template>
  <div class="schema-result">
    <el-alert v-if="run.schemaVersion !== definition.schemaVersion" type="warning" :closable="false" :title="t('analysisSchema.versionChanged')" />
    <details class="schema-section">
      <summary>{{ t('analysisDetails.parameters') }}</summary>
      <AnalysisSchemaValue :schema="definition.parametersSchema" :value="run.parameters" />
    </details>
    <details open class="schema-section schema-summary">
      <summary>{{ t('analysisSchema.summary') }}</summary>
      <el-alert v-if="summaryInvalid" type="warning" :closable="false" :title="t('analysisDetails.invalidData')" />
      <AnalysisSchemaValue v-else :schema="definition.summarySchema" :value="run.summary" />
    </details>
    <DataLoadError v-if="error" :error="error" @retry="loadChart" />
    <div v-if="chart" class="schema-items-panel">
      <el-form v-if="filterFields.length" label-position="top" class="schema-filters" @submit.prevent="loadPage(true)">
        <DynamicSchemaForm :fields="filterFields" :model-value="values" :empty-text="''" @update-field="(name, value) => values[name] = value" />
        <div><el-button type="primary" plain :disabled="!canApply" @click="loadPage(true)">{{ t('common.actions.apply') }}</el-button><el-button plain @click="resetFilters">{{ t('common.actions.reset') }}</el-button></div>
      </el-form>
      <p v-if="!canApply" class="schema-hint">{{ t('analysisSchema.requiredFilters') }}</p>
      <el-alert v-if="referencesError" type="warning" :closable="false" :title="t('analysisSchema.referencesError')" />
      <div ref="scrollElement" v-loading="loading && !rows.length" class="schema-items" tabindex="0" :aria-busy="loading" @scroll.passive="loadNearEnd">
        <table v-if="rows.length" class="schema-result-table">
          <thead><tr><th v-for="column in columns" :key="column.name" scope="col" :title="column.description || undefined">{{ column.label || column.name }}</th></tr></thead>
          <tbody><tr v-for="(row, index) in rows" :key="index"><td v-for="column in columns" :key="column.name" :class="{ 'schema-segment': isSegment(column) }">
            <AnalysisReferenceValue :point="row.point" :field="column" :value="row.value[column.name]" />
          </td></tr></tbody>
        </table>
        <el-empty v-if="!loading && !pageError && canApply && !rows.length" :description="t('analysisDetails.empty')" />
        <DataLoadError v-if="pageError" :error="pageError" @retry="loadPage(rows.length === 0)" />
        <p v-if="loading" role="status" class="schema-hint">{{ t('analyticsRuns.loading') }}</p>
      </div>
      <div class="schema-hint">{{ t('analysisSchema.loadedRows', { count: rows.length }) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onScopeDispose, reactive, ref, shallowRef, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
import { usePermissions } from '@/composables/usePermissions'
import { getAnalysisItemsDefinition, getSchemaAnalysisItems, type AnalysisConfiguration, type AnalysisRunDetails, type AnalysisDataPoint } from '@/services/api/analytics'
import type { SchemaField } from '@/models/schemaModel'
import { toSchemaUiFields } from '@/models/schemaModel'
import { validateAnalysisRecord, analysisCursor } from '@/utils/analysisSchema'
import { analysisFormDefaults, isEmptyAnalysisValue, serializeAnalysisForm } from '@/utils/analysisForm'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'
import AnalysisSchemaValue from './AnalysisSchemaValue.vue'
import AnalysisReferenceValue from './AnalysisReferenceValue.vue'
import DynamicSchemaForm, { type FieldValue } from '@/components/schema/DynamicSchemaForm.vue'
import DataLoadError from '@/components/common/DataLoadError.vue'

const props = defineProps<{ run: AnalysisRunDetails; definition: AnalysisConfiguration }>()
const { t } = useI18n()
const { hasPermission } = usePermissions()
type Chart = NonNullable<Awaited<ReturnType<typeof getAnalysisItemsDefinition>>>
const chart = shallowRef<Chart | null>(null)
const values = reactive<Record<string, FieldValue>>({})
const filterFields = computed(() => toSchemaUiFields(chart.value?.queryInputSchema.fields.filter(field => !['runId', 'cursor', 'size'].includes(field.name)) ?? []))
const columns = computed(() => chart.value?.dataPointSchema.fields.length ? chart.value.dataPointSchema.fields : [...props.definition.segmentsSchema.fields, ...props.definition.dataSchema.fields].filter((field, index, fields) => fields.findIndex(item => item.name === field.name) === index))
const canApply = computed(() => filterFields.value.every(field => !field.required || !isEmptyAnalysisValue(values[field.name])))
const rows = ref<{ point: AnalysisDataPoint; value: Record<string, unknown> }[]>([])
const loading = ref(false), hasMore = ref(false)
const referencesError = ref(false)
const error = ref<DataLoadErrorKind | null>(null), pageError = ref<DataLoadErrorKind | null>(null)
const scrollElement = ref<HTMLElement>()
let generation = 0, pageGeneration = 0, disposed = false
let controller: AbortController | undefined, pageController: AbortController | undefined
let cursor: string | null = null, applied: Record<string, unknown> = {}
onScopeDispose(() => { disposed = true; ++generation; ++pageGeneration; controller?.abort(); pageController?.abort() })
const summaryInvalid = computed(() => { if (props.run.summary == null) return false; try { validateAnalysisRecord(props.definition.summarySchema, props.run.summary); return false } catch { return true } })
function isSegment(field: SchemaField) { return props.definition.segmentsSchema.fields.some(item => item.name === field.name) }
function resetFilters() { Object.assign(values, analysisFormDefaults('', filterFields.value)); void loadPage(true) }

async function loadChart() {
  const request = ++generation
  ++pageGeneration; controller?.abort(); pageController?.abort()
  chart.value = null; rows.value = []; error.value = null; pageError.value = null; referencesError.value = false; cursor = null; hasMore.value = false
  for (const name of Object.keys(values)) delete values[name]
  if (!hasPermission('CHARTS_GET') || disposed) return
  controller = new AbortController()
  loading.value = true
  try {
    const result = await getAnalysisItemsDefinition(props.definition.itemsChartSystemName, controller.signal)
    if (request !== generation || disposed) return
    if (!result) throw new Error('Missing analysis chart')
    chart.value = result
    Object.assign(values, analysisFormDefaults('', filterFields.value))
    await loadPage(true)
  } catch (cause) { if (request === generation && !disposed) error.value = classifyDataLoadError(cause) }
  finally { if (request === generation && !disposed) loading.value = false }
}
async function loadPage(reset: boolean) {
  if (disposed || !hasPermission('CHARTS_GET') || !chart.value || (!reset && (loading.value || !hasMore.value))) return
  if (!canApply.value) {
    if (reset) { ++pageGeneration; pageController?.abort(); rows.value = []; cursor = null; hasMore.value = false; pageError.value = null; loading.value = false }
    return
  }
  if (reset) {
    try { applied = JSON.parse(serializeAnalysisForm(filterFields.value, values)) } catch { ElMessage.warning(t('analysisSchema.invalidFilters')); return }
  }
  const request = ++pageGeneration
  pageController?.abort(); pageController = new AbortController()
  const signal = pageController.signal
  if (reset) { rows.value = []; referencesError.value = false; cursor = null; hasMore.value = false; scrollElement.value?.scrollTo({ top: 0 }) }
  const previous = cursor
  loading.value = true; pageError.value = null
  try {
    const result = await getSchemaAnalysisItems(props.definition.itemsChartSystemName, { ...applied, runId: props.run.id, size: 40, cursor: analysisCursor(cursor, chart.value.queryInputSchema.fields.find(field => field.name === 'cursor')) }, signal, { products: hasPermission('ARTICLES_GET_MAIN'), organizations: hasPermission('ORGANIZATIONS_GET'), users: hasPermission('USERS_GET') })
    if (disposed || request !== pageGeneration) return
    const added = result.points.map(point => ({ point, value: validateAnalysisRecord({ version: chart.value!.dataPointSchema.version, fields: columns.value }, point.value) }))
    rows.value.push(...added)
    referencesError.value ||= result.referencesUnavailable
    cursor = result.nextCursor
    hasMore.value = cursor !== null && cursor !== previous && added.length > 0
  } catch (cause) { if (!disposed && request === pageGeneration) pageError.value = classifyDataLoadError(cause) }
  finally { if (!disposed && request === pageGeneration) loading.value = false }
}
function loadNearEnd() { const el = scrollElement.value; if (el && !loading.value && !pageError.value && hasMore.value && el.scrollHeight - el.scrollTop - el.clientHeight < 100) void loadPage(false) }
watch(() => props.run.id, () => { void loadChart() }, { immediate: true })
watch([loading, scrollElement], async () => { await nextTick(); loadNearEnd() }, { flush: 'post' })
useResizeObserver(scrollElement, loadNearEnd)
</script>

<style scoped>
.schema-result { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; min-width: 0; }
.schema-section { flex: none; font-size: 13px; }
.schema-section summary { color: var(--app-primary); cursor: pointer; margin-bottom: 10px; }
.schema-summary { max-height: 32vh; overflow: auto; padding: 12px; background: var(--app-bg-soft); border-radius: 6px; }
.schema-items-panel { display: flex; flex: 1; min-height: 0; flex-direction: column; gap: 10px; }
.schema-filters { flex: none; }
.schema-filters :deep(.dynamic-schema-form) { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0 12px; }
.schema-items { flex: 1; position: relative; min-width: 0; min-height: 160px; overflow: auto; overscroll-behavior: contain; }
.schema-result-table { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 12px; }
.schema-result-table th { position: sticky; top: 0; z-index: 1; text-align: left; color: var(--app-text-muted); background: var(--app-surface); }
.schema-result-table th, .schema-result-table td { padding: 10px 8px; border-bottom: 1px solid var(--app-border); white-space: nowrap; }
.schema-result-table :deep(a) { color: var(--app-primary); font-weight: 600; }
.schema-result-table :deep(small) { display: block; color: var(--app-text-muted); margin-top: 3px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
.schema-segment { font-weight: 600; }
.schema-hint { font-size: 12px; color: var(--app-text-muted); margin: 0; }
@media (max-width: 600px) { .schema-result { min-height: 65dvh; } .schema-items { max-height: 55dvh; } }
</style>
