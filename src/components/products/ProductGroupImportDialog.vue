<template>
  <el-dialog v-model="open" :title="t('products.groupImport.title')" width="min(1180px, calc(100vw - 24px))" top="4vh"
    append-to-body destroy-on-close :before-close="guard.beforeClose" :close-on-click-modal="false" :close-on-press-escape="!busy" :show-close="!busy" class="group-import-dialog">
    <p class="group-import-hint">{{ t('products.groupImport.hint') }}</p>
    <el-button link type="primary" :disabled="busy" @click="extensionOpen = true">{{ t('products.supplierExtension.title') }}</el-button>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="group-import-alert" />
    <el-alert v-if="complete && stage === 'review'" :title="t('products.groupImport.complete')" type="success" :closable="false" show-icon class="group-import-alert" />

    <section v-if="stage === 'input'" :inert="busy">
      <label class="group-import-label" for="product-group-json">{{ t('products.groupImport.jsonLabel') }}</label>
      <el-input id="product-group-json" v-model="raw" type="textarea" :rows="10" :placeholder="example" spellcheck="false" />
      <p class="group-import-hint">{{ t('products.groupImport.limits', importLimits) }}</p>
    </section>
    <section v-else>
      <div class="group-import-toolbar">
        <label class="group-import-group">
          <span>{{ t('products.groupImport.group') }}</span>
          <el-select v-model="groupIndex" :disabled="busy" :aria-label="t('products.groupImport.group')">
            <el-option v-for="(group, index) in groups" :key="index" :value="index"
              :label="`${t('products.groupImport.groupNumber', { number: index + 1 })} · ${group.supplier || t('products.groupImport.noSupplier')}${group.done ? ' · ' + t('products.groupImport.done') : ''}`" />
          </el-select>
        </label>
        <span class="group-import-summary">{{ t('products.groupImport.summary', { groups: groups.length, products: rowCount, duplicates: duplicateCount }) }}</span>
      </div>
      <p class="group-import-hint">{{ t('products.groupImport.fullCrossHint') }}</p>
      <el-table v-if="activeGroup" :data="visibleRows" :max-height="420" :aria-busy="busy" class="group-import-table">
        <el-table-column type="index" width="54" :index="rowIndex" />
        <el-table-column :label="t('products.sku')" min-width="140">
          <template #default="{ row }"><strong>{{ row.sku }}</strong></template>
        </el-table-column>
        <el-table-column :label="t('common.labels.producer')" min-width="230">
          <template #default="{ row }">
            <span v-if="!row.producerLabel || row.producer.toUpperCase() !== row.producerLabel.toUpperCase()" class="group-import-source">{{ row.producer }}</span>
            <span v-if="row.productId || activeGroup.done">{{ row.producerLabel }}</span>
            <ProducerSelector v-else :model-value="row.manualProducerId ?? row.producerId" allow-create :disabled="busy"
              :aria-label="t('products.groupImport.producerFor', { sku: row.sku })" @update:model-value="selectProducer(row, $event)" />
          </template>
        </el-table-column>
        <el-table-column :label="t('common.labels.name')" min-width="260">
          <template #default="{ row }">
            <span v-if="row.productId">{{ row.productName || row.name }}</span>
            <el-input v-else v-model="row.name" maxlength="255" :disabled="busy || activeGroup.done" :aria-invalid="row.name.trim().length < 3" :aria-label="t('products.groupImport.nameFor', { sku: row.sku })" />
          </template>
        </el-table-column>
        <el-table-column :label="t('products.groupImport.status')" width="170">
          <template #default="{ row }">
            <el-tag :type="row.productId ? 'success' : row.producerId ? 'info' : 'warning'">{{ t(`products.groupImport.${rowStatus(row)}`) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="group-import-pagination" :inert="busy"><ZeroPagination v-model:page="page" v-model:size="size" :has-next="(page + 1) * size < (activeGroup?.rows.length ?? 0)" /></div>
      <p v-if="needsResolve" class="group-import-hint" role="status">{{ t('products.groupImport.recheckHint') }}</p>
      <p v-if="invalidNames" class="group-import-hint">{{ t('products.groupImport.errors.name') }}</p>
      <p v-if="!canCreate && hasMissing" class="group-import-hint">{{ t('products.groupImport.createPermission') }}</p>
      <p v-if="!canLink && groups.some(group => !group.done && group.rows.length > 1)" class="group-import-hint">{{ t('products.groupImport.linkPermission') }}</p>
    </section>

    <template #footer>
      <div class="group-import-footer">
        <span v-if="busy && progress" role="status" aria-live="polite">{{ t('products.groupImport.progress', { group: progress.group + 1, total: groups.length, phase: t(`products.groupImport.phases.${progress.phase}`) }) }}</span>
        <span v-else-if="stage === 'review'" role="status" class="group-import-result">
          <span>{{ t('products.groupImport.processed', { done: groups.filter(group => group.done).length, total: groups.length }) }}</span>
          <small>{{ t('products.groupImport.resultSummary', { found: knownCount - createdCount, created: createdCount }) }}</small>
        </span>
        <div class="group-import-actions">
          <el-button :disabled="busy" @click="guard.requestClose">{{ t('common.actions.close') }}</el-button>
          <el-button v-if="stage === 'review' && !wrote" :disabled="busy" @click="stage = 'input'">{{ t('common.actions.back') }}</el-button>
          <el-button v-if="stage === 'input'" type="primary" :loading="busy" :disabled="!raw.trim() || !canRead" @click="prepare">{{ t('products.groupImport.check') }}</el-button>
          <template v-else-if="!complete">
            <el-button :loading="busy && !executing" :disabled="busy || !canRead" @click="recheck">{{ t('products.groupImport.recheck') }}</el-button>
            <el-button type="primary" :loading="executing" :disabled="!ready || busy" @click="run">{{ t(wrote ? 'products.groupImport.resume' : 'products.groupImport.start') }}</el-button>
          </template>
        </div>
      </div>
    </template>
  </el-dialog>
  <SupplierExtensionDialog v-model="extensionOpen" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import SupplierExtensionDialog from '@/components/products/SupplierExtensionDialog.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import { useDialogGuard } from '@/composables/useDialogGuard'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'
import { importLimits, parseProductImport, ProductImportIssue, type ProductImportGroup, type ProductImportRow } from '@/models/productGroupImport'
import { executeProductImport, resolveImportGroups, type ImportProgress } from '@/services/productGroupImport'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()
const { hasPermission } = usePermissions()
const canRead = computed(() => hasPermission('ARTICLES_GET_MAIN'))
const canCreate = computed(() => hasPermission('ARTICLES_CREATE'))
const canLink = computed(() => hasPermission('ARTICLE_CROSSES_CREATE'))
const raw = ref('')
const extensionOpen = ref(false)
const groups = ref<ProductImportGroup[]>([])
const stage = ref<'input' | 'review'>('input')
const groupIndex = ref(0)
const page = ref(0)
const size = ref(20)
const busy = ref(false)
const executing = ref(false)
const wrote = ref(false)
const needsResolve = ref(false)
const error = ref('')
const progress = ref<ImportProgress>()
const activeGroup = computed(() => groups.value[groupIndex.value])
const visibleRows = computed(() => activeGroup.value?.rows.slice(page.value * size.value, (page.value + 1) * size.value) ?? [])
const rowCount = computed(() => groups.value.reduce((count, group) => count + group.rows.length, 0))
const duplicateCount = computed(() => groups.value.reduce((count, group) => count + group.duplicates, 0))
const knownCount = computed(() => new Set(groups.value.flatMap(group => group.rows.flatMap(row => row.productId === undefined ? [] : [row.productId]))).size)
const createdIds = computed(() => new Set(groups.value.flatMap(group => group.rows.flatMap(row => row.created && row.productId !== undefined ? [row.productId] : []))))
const createdCount = computed(() => createdIds.value.size)
const complete = computed(() => groups.value.length > 0 && groups.value.every(group => group.done))
const pendingRows = computed(() => groups.value.filter(group => !group.done).flatMap(group => group.rows))
const hasMissing = computed(() => pendingRows.value.some(row => !row.productId))
const invalidNames = computed(() => pendingRows.value.some(row => !row.productId && (row.name.trim().length < 3 || row.name.trim().length > 255)))
const ready = computed(() => canRead.value && !needsResolve.value && !complete.value && groups.value.length > 0
  && pendingRows.value.every(row => row.producerId) && !invalidNames.value
  && (!hasMissing.value || canCreate.value) && (canLink.value || groups.value.filter(group => !group.done).every(group => group.rows.length < 2)))
const example = computed(() => JSON.stringify({ supplier: 'Armtek', products: [{ producer: 'MAN', sku: '9048305903', name: t('common.labels.name') }] }, null, 2))
const guard = useDialogGuard(open, busy, () => [raw.value, groups.value])
function message(cause: unknown) { return cause instanceof ProductImportIssue ? t(`products.groupImport.errors.${cause.code}`, { group: '', row: '', ...cause.params }) : cause instanceof Error ? cause.message : t('products.groupImport.failed') }
function updateProgress(value: ImportProgress) { progress.value = value; groupIndex.value = value.group }
function rowIndex(index: number) { return page.value * size.value + index + 1 }
function rowStatus(row: ProductImportRow) {
  if (!row.productId) return row.producerId ? 'newProduct' : 'unknownProducer'
  return createdIds.value.has(row.productId) ? 'created' : 'found'
}

async function prepare() {
  if (busy.value || !canRead.value) return
  error.value = ''
  try {
    groups.value = parseProductImport(raw.value)
    stage.value = 'review'
    groupIndex.value = 0
    await recheck()
  } catch (cause) { error.value = message(cause) }
}

async function recheck() {
  if (busy.value || !canRead.value) return
  busy.value = true
  needsResolve.value = true
  error.value = ''
  try {
    await resolveImportGroups(groups.value, updateProgress)
    needsResolve.value = false
    const firstPending = groups.value.findIndex(group => !group.done && group.rows.some(row => !row.producerId || (!row.productId && row.name.trim().length < 3)))
    groupIndex.value = firstPending >= 0 ? firstPending : Math.max(0, groups.value.findIndex(group => !group.done))
    if (firstPending >= 0) {
      const firstRow = groups.value[firstPending]!.rows.findIndex(row => !row.producerId || (!row.productId && row.name.trim().length < 3))
      await nextTick()
      page.value = Math.floor(firstRow / size.value)
    }
  }
  catch (cause) { error.value = message(cause) }
  finally { busy.value = false }
}

function selectProducer(row: ProductImportRow, id: number | undefined) {
  row.manualProducerId = id
  row.producerId = id
  row.productId = undefined
  row.productName = undefined
  row.created = false
  needsResolve.value = true
}

async function run() {
  if (busy.value || !ready.value) return
  busy.value = true
  executing.value = true
  error.value = ''
  let changed = false
  try {
    await executeProductImport(groups.value, { canRead: () => canRead.value, canCreate: () => canCreate.value, canLink: () => canLink.value }, updateProgress, () => { wrote.value = true; changed = true })
    guard.markClean()
  } catch (cause) { error.value = message(cause) }
  finally { busy.value = false; executing.value = false; if (changed) emit('saved') }
}

watch([groupIndex, size], () => { page.value = 0 })
watch(open, value => {
  if (!value) return
  raw.value = ''; groups.value = []; stage.value = 'input'; groupIndex.value = 0; page.value = 0
  wrote.value = false; needsResolve.value = false; error.value = ''; progress.value = undefined
})
</script>

<style scoped>
:global(.group-import-dialog) { display: flex; flex-direction: column; max-height: 92dvh; }
:global(.group-import-dialog .el-dialog__body) { min-height: 0; overflow: auto; }
:global(.group-import-dialog .el-dialog__footer) { flex-shrink: 0; }
.group-import-hint { margin: 0 0 14px; color: var(--app-text-muted); font-size: 13px; line-height: 1.5; }
.group-import-label { display: block; margin-bottom: 8px; font-weight: 600; }
.group-import-alert { margin-bottom: 14px; }
.group-import-toolbar { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.group-import-group { display: grid; min-width: 240px; gap: 6px; font-weight: 600; }
.group-import-summary { color: var(--app-text-muted); font-size: 13px; }
.group-import-source { display: block; margin-bottom: 4px; color: var(--app-text-muted); font-size: 12px; }
.group-import-pagination { margin: 12px 0; }
.group-import-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; text-align: left; }
.group-import-actions { display: flex; flex-wrap: wrap; justify-content: end; gap: 8px; margin-left: auto; }
.group-import-actions :deep(.el-button) { margin-left: 0; }
.group-import-result { display: grid; gap: 4px; }
.group-import-result small { color: var(--app-text-muted); }
@media (max-width: 600px) { .group-import-group { width: 100%; min-width: 0; } .group-import-actions { justify-content: start; } }
</style>
