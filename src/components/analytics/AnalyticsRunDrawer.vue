<template>
  <el-drawer v-model="open" size="min(1120px, 100vw)" :title="definition?.name || t('analysisDetails.title')" destroy-on-close class="analysis-result-drawer">
    <div v-loading="loading" class="analysis-result">
      <DataLoadError v-if="error" :error="error" @retry="loadRun" />
      <el-empty v-else-if="notFound" :description="t('analysisDetails.notFound')" />
      <template v-else-if="run && !loading">
        <div class="result-heading">
          <div><strong>{{ t('analysisDetails.created') }}</strong> {{ date(run.createdAt) }}</div>
          <div class="result-actions">
            <el-button v-if="canPin" size="small" plain :loading="pinning" :type="run.isPinned ? 'warning' : 'default'" @click="togglePinned">{{ t(run.isPinned ? 'analysisDetails.unpin' : 'analysisDetails.pin') }}</el-button>
            <el-button size="small" plain :icon="Refresh" :disabled="pinning" @click="loadRun">{{ t('common.actions.refresh') }}</el-button>
          </div>
        </div>
        <el-radio-group v-if="supported" v-model="presentation" size="small" :aria-label="t('analysisSchema.presentation')"><el-radio-button value="matrix">{{ t('analysisDetails.matrix') }}</el-radio-button><el-radio-button value="table">{{ t('analysisSchema.tableView') }}</el-radio-button></el-radio-group>
        <el-alert v-if="!definition" :title="t('analysisSchema.missingDefinition')" type="info" :closable="false" />
        <SchemaAnalysisResult v-else-if="!supported || presentation === 'table'" :key="run.id" :run="run" :definition="definition" />
        <template v-else>
          <div class="result-summary" v-if="summary">
            <div><span>{{ t('analyticsRuns.productsCount') }}</span><strong>{{ number(summary.productsCount) }}</strong></div>
            <div><span>{{ t('analysisDetails.periods') }}</span><strong>{{ number(summary.periodsCount) }}</strong></div>
            <div><span>{{ t('analysisDetails.total') }} · {{ metric(parameters.abcMetric) }}</span><strong>{{ number(summary.totalValue) }}</strong></div>
          </div>
          <div class="result-metrics"><span>{{ month(parameters.from) }} — {{ month(parameters.to) }}</span><span>{{ t(parameters.granularity === 'Quarter' ? 'schemaInputs.enums.Quarter' : 'schemaInputs.enums.Month') }}</span><span>ABC: {{ metric(parameters.abcMetric) }}</span><span>XYZ: {{ metric(parameters.xyzMetric) }}</span><span>{{ t('analysisDetails.fullSummary') }}</span></div>
          <el-radio-group v-if="summary?.patternCells?.length" v-model="matrixMode" size="small" :aria-label="t('analysisDetails.matrixType')"><el-radio-button value="xyz">ABC / XYZ</el-radio-button><el-radio-button value="pattern">{{ t('analysisDetails.patternMatrix') }}</el-radio-button></el-radio-group>
          <div v-if="summary" class="matrix-scroll">
            <table class="analysis-matrix" :class="{ 'analysis-matrix--patterns': matrixMode === 'pattern' }" :aria-label="t(matrixMode === 'pattern' ? 'analysisDetails.patternMatrix' : 'analysisDetails.matrix')">
              <thead><tr><th scope="col">{{ matrixMode === 'pattern' ? 'ABC' : 'ABC / XYZ' }}</th><th v-for="column in matrixColumns" :key="column" scope="col">{{ columnLabel(column) }}</th></tr></thead>
              <tbody><tr v-for="row in abcClasses" :key="row"><th scope="row">{{ row }}</th><td v-for="column in matrixColumns" :key="column">
                <button type="button" :class="{ selected: isSelectedCell(row, column) }" :aria-pressed="isSelectedCell(row, column)" :aria-label="`${row} · ${columnLabel(column)}: ${cell(row, column)?.productsCount ?? 0}`" @click="selectCell(row, column)">
                  <strong>{{ number(cell(row, column)?.productsCount ?? 0) }}</strong><span>{{ number(cell(row, column)?.value ?? 0) }}</span>
                </button>
              </td></tr></tbody>
            </table>
          </div>
          <div class="result-filters">
            <el-select v-model="abc" clearable :placeholder="t('analysisDetails.allAbc')" :aria-label="t('analysisDetails.allAbc')"><el-option v-for="item in abcClasses" :key="item" :value="item" :label="item" /></el-select>
            <el-select v-model="xyz" clearable :placeholder="t('analysisDetails.allXyz')" :aria-label="t('analysisDetails.allXyz')"><el-option v-for="item in columns" :key="item" :value="item" :label="xyzLabel(item)" /></el-select>
            <el-select v-if="run.schemaVersion === 2" v-model="pattern" clearable :placeholder="t('analysisDetails.allPatterns')" :aria-label="t('analysisDetails.allPatterns')"><el-option v-for="item in patternColumns" :key="item" :value="item" :label="patternLabel(item)" /></el-select>
            <el-button plain :disabled="!abc && !xyz && !pattern" @click="abc = undefined; xyz = undefined; pattern = undefined">{{ t('common.actions.reset') }}</el-button>
          </div>
          <p class="result-hint">{{ t('analysisDetails.rankOrder') }}</p>
          <el-alert v-if="productsError" type="warning" :closable="false" :title="t('analysisDetails.productsError')" />
          <div ref="scrollElement" class="result-items" :aria-busy="itemsLoading" tabindex="0" @scroll.passive="loadNearEnd">
            <table v-if="points.length" class="result-table">
              <thead><tr><th scope="col">{{ t('analysisDetails.rank') }}</th><th scope="col">{{ t('analysisDetails.product') }}</th><th scope="col">ABC / XYZ</th><th v-if="run.schemaVersion === 2" scope="col">{{ t('analysisDetails.demandPattern') }}</th><th v-if="run.schemaVersion === 2" scope="col" :title="t('analysisDetails.adiHint')">ADI</th><th v-if="run.schemaVersion === 2" scope="col" :title="t('analysisDetails.cv2Hint')">CV²</th><th scope="col">{{ t('schemaInputs.enums.Quantity') }}</th><th scope="col">{{ t('analysisDetails.revenue') }}</th><th scope="col">{{ t('analysisDetails.share') }}</th><th scope="col">{{ t('analysisDetails.cumulative') }}</th><th scope="col">CV</th></tr></thead>
              <tbody><tr v-for="point in points" :key="point.productId">
                <td>{{ point.rank }}</td>
                <td class="result-product"><RouterLink v-if="products[point.productId]" :to="{ name: 'product-details', params: { id: point.productId } }">{{ products[point.productId]!.sku }}</RouterLink><span v-else>{{ t('analysisDetails.productFallback', { id: point.productId }) }}</span><small v-if="products[point.productId]">{{ products[point.productId]!.producer.name }} · {{ products[point.productId]!.name }}</small></td>
                <td><el-tag size="small" effect="plain">{{ point.abc }}{{ point.xyz || '—' }}</el-tag></td>
                <td v-if="run.schemaVersion === 2">{{ patternLabel(point.demandPattern || 'Unclassified') }}</td><td v-if="run.schemaVersion === 2">{{ point.adi == null ? '—' : number(point.adi) }}</td><td v-if="run.schemaVersion === 2">{{ point.cv2 == null ? '—' : number(point.cv2) }}</td>
                <td>{{ number(point.quantity) }}</td><td>{{ number(point.revenue) }}</td><td>{{ percent(point.share) }}</td><td>{{ percent(point.cumulativeShare) }}</td><td>{{ point.coefficientOfVariation == null ? '—' : percent(point.coefficientOfVariation) }}</td>
              </tr></tbody>
            </table>
            <el-empty v-if="!itemsLoading && !itemsError && !points.length" :description="t('analysisDetails.empty')" />
            <DataLoadError v-if="itemsError" :error="itemsError" @retry="loadItems(points.length === 0)" />
            <p v-if="itemsLoading" class="result-hint" role="status">{{ t('analyticsRuns.loading') }}</p>
          </div>
          <div class="result-hint">{{ t('analysisDetails.loaded', { count: points.length }) }}</div>
        </template>
      </template>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SchemaAnalysisResult from './SchemaAnalysisResult.vue'
import { setAnalyticsRunPinned } from '@/services/api/analytics'
import DataLoadError from '@/components/common/DataLoadError.vue'
import { useI18n } from '@/i18n'
import { usePermissions } from '@/composables/usePermissions'
import { useAnalysisResult } from '@/composables/useAnalysisResult'
import { abcClasses, demandPatterns, type AbcClass, type XyzFilter, type PatternFilter } from '@/models/abcXyz'
const props = defineProps<{ runId?: string }>()
const emit = defineEmits<{ pinned: [value: { id: string; isPinned: boolean }] }>()
const open = defineModel<boolean>({ default: false })
const { t, locale } = useI18n()
const { hasPermission } = usePermissions()
const enabled = computed(() => open.value && hasPermission('CHARTS_GET'))
const selectedId = computed(() => props.runId)
const canReadProducts = computed(() => hasPermission('ARTICLES_GET_MAIN'))
const canPin = computed(() => hasPermission('ANALYTICS_RUNS_EDIT'))
const pinning = ref(false)
const presentation = ref<'matrix' | 'table'>('matrix')
const matrixMode = ref<'xyz' | 'pattern'>('xyz')
watch(selectedId, () => { presentation.value = 'matrix'; matrixMode.value = 'xyz' })
const { run, definition, summary, parameters, points, products, loading, itemsLoading, hasMore, notFound, error, itemsError, productsError, abc, xyz, pattern, supported, loadRun, loadItems } = useAnalysisResult(selectedId, enabled, canReadProducts)
const columns: XyzFilter[] = ['X', 'Y', 'Z', 'Unclassified']
const patternColumns: PatternFilter[] = [...demandPatterns, 'Unclassified']
type MatrixColumn = XyzFilter | PatternFilter
const matrixColumns = computed<MatrixColumn[]>(() => matrixMode.value === 'pattern' ? patternColumns : columns)
const scrollElement = ref<HTMLElement>()
async function togglePinned() {
  if (!run.value || pinning.value || !canPin.value || !enabled.value) return
  const id = run.value.id, value = !run.value.isPinned
  pinning.value = true
  try {
    const result = await setAnalyticsRunPinned(id, value)
    if (run.value?.id === id) run.value = { ...run.value, isPinned: result.isPinned }
    emit('pinned', result)
    ElMessage.success(t(result.isPinned ? 'analysisDetails.pinnedSuccess' : 'analysisDetails.unpinnedSuccess'))
  } catch (cause) { ElMessage.error(cause instanceof Error ? cause.message : t('analysisDetails.pinError')) }
  finally { pinning.value = false }
}
function xyzLabel(value: XyzFilter) { return value === 'Unclassified' ? t('schemaInputs.enums.Unclassified') : value }
function patternLabel(value: PatternFilter) { return t(`schemaInputs.enums.${value}`) }
function columnLabel(value: MatrixColumn) { return matrixMode.value === 'pattern' ? patternLabel(value as PatternFilter) : xyzLabel(value as XyzFilter) }
function cell(row: AbcClass, column: MatrixColumn) {
  const value = column === 'Unclassified' ? null : column
  return matrixMode.value === 'pattern' ? summary.value?.patternCells?.find(item => item.abc === row && item.pattern === value) : summary.value?.cells.find(item => item.abc === row && item.xyz === value)
}
function isSelectedCell(row: AbcClass, column: MatrixColumn) { return abc.value === row && (matrixMode.value === 'pattern' ? pattern.value : xyz.value) === column }
function selectCell(row: AbcClass, column: MatrixColumn) {
  const selected = isSelectedCell(row, column)
  abc.value = selected ? undefined : row
  if (matrixMode.value === 'pattern') pattern.value = selected ? undefined : column as PatternFilter
  else xyz.value = selected ? undefined : column as XyzFilter
}
function number(value: number) { return value.toLocaleString(locale.value, { maximumFractionDigits: 2 }) }
function percent(value: number) { return value.toLocaleString(locale.value, { style: 'percent', maximumFractionDigits: 1 }) }
function metric(value: unknown) { return t(value === 'Quantity' ? 'schemaInputs.enums.Quantity' : 'analysisDetails.revenue') }
function date(value: string) { return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function month(value: unknown) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : '—' }
function loadNearEnd() { const element = scrollElement.value; if (element && !itemsLoading.value && !itemsError.value && hasMore.value && element.scrollHeight - element.scrollTop - element.clientHeight < 100) void loadItems(false) }
watch([itemsLoading, scrollElement], async () => { await nextTick(); loadNearEnd() }, { flush: 'post' })
useResizeObserver(scrollElement, loadNearEnd)
</script>

<style scoped>
:global(.analysis-result-drawer .el-drawer__header) { padding: 16px; margin-bottom: 0; border-bottom: 1px solid var(--app-border); }
:global(.analysis-result-drawer .el-drawer__body) { padding: 16px; min-width: 0; overflow-x: hidden; }
.analysis-result { min-height: 160px; min-width: 0; display: flex; flex-direction: column; gap: 14px; height: 100%; }
.result-heading, .result-filters, .result-metrics { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.result-heading { justify-content: space-between; font-size: 12px; color: var(--app-text-muted); }
.result-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.result-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.result-summary > div { display: grid; gap: 6px; padding: 12px; background: var(--app-bg-soft); border: 1px solid var(--app-border); border-radius: 6px; }
.result-summary span, .result-metrics, .result-hint { font-size: 12px; color: var(--app-text-muted); }
.result-summary strong { font-size: 20px; font-variant-numeric: tabular-nums; }
.matrix-scroll { min-width: 0; overflow-x: auto; flex: none; }
.analysis-matrix { width: 100%; min-width: 420px; border-collapse: collapse; table-layout: fixed; font-size: 12px; }
.analysis-matrix--patterns { min-width: 650px; }
.analysis-matrix th { color: var(--app-text-muted); padding: 6px; }
.analysis-matrix th:first-child { width: 70px; }
.analysis-matrix td { padding: 3px; }
.analysis-matrix button { display: grid; gap: 3px; width: 100%; border: 1px solid var(--app-border); background: var(--app-bg-soft); border-radius: 5px; padding: 7px; color: var(--app-text); cursor: pointer; }
.analysis-matrix button:hover, .analysis-matrix button.selected { background: var(--app-primary-soft); border-color: var(--app-primary); }
.analysis-matrix button:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 1px; }
.analysis-matrix button span { color: var(--app-text-muted); font-variant-numeric: tabular-nums; }
.result-filters .el-select { width: 180px; }
.result-items { flex: 1; min-height: 140px; min-width: 0; overflow: auto; overscroll-behavior: contain; }
.result-table { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 850px; font-size: 12px; }
.result-table th { position: sticky; top: 0; z-index: 1; background: var(--app-surface); color: var(--app-text-muted); text-align: left; }
.result-table th, .result-table td { padding: 10px 8px; border-bottom: 1px solid var(--app-border); font-variant-numeric: tabular-nums; }
.result-product { max-width: 260px; min-width: 200px; }
.result-product a { color: var(--app-primary); font-weight: 600; }
.result-product small { display: block; color: var(--app-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 3px; }
.result-hint { margin: 0; }
@media (max-width: 600px) { .analysis-result { height: auto; min-height: 100%; } .result-items { max-height: 55dvh; flex: none; } .result-summary { gap: 6px; } .result-summary strong { font-size: 16px; } .result-filters .el-select { flex: 1; min-width: 120px; } }
</style>
