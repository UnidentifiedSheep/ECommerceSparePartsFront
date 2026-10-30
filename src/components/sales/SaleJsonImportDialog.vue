<template>
  <el-dialog v-model="open" :title="t('sales.jsonImport.title')" width="min(1040px, calc(100vw - 24px))" top="4vh"
    append-to-body destroy-on-close class="sale-json-dialog" :before-close="guard.beforeClose"
    :close-on-click-modal="false" :close-on-press-escape="!busy" :show-close="!busy">
    <p class="sale-json-hint">{{ t('sales.jsonImport.hint') }}</p>
    <p><strong>{{ currencyLabel }}</strong> · {{ storageCode }}</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <label class="sale-json-label" for="sale-import-json">{{ t('products.groupImport.jsonLabel') }}</label>
    <el-input id="sale-import-json" v-model="raw" type="textarea" :rows="6" :disabled="busy" :placeholder="example" spellcheck="false" />
    <p class="sale-json-hint">{{ t('sales.jsonImport.limit', saleImportLimits) }}</p>
    <template v-if="rows.length">
      <el-alert v-if="hasProblems" :title="t('sales.jsonImport.fixRows')" type="warning" :closable="false" show-icon />
      <el-table :data="visibleRows" :max-height="320" :aria-busy="busy">
        <el-table-column type="index" :index="rowIndex" width="50" />
        <el-table-column :label="t('common.labels.product')" min-width="240">
          <template #default="{ row }">
            <strong>{{ row.sku }}</strong> · {{ row.product?.producerName || row.producer }}
            <div class="sale-json-hint">{{ row.product?.name || t('sales.jsonImport.notFound') }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="count" :label="t('common.labels.count')" width="90" align="right" />
        <el-table-column :label="t('common.labels.price')" width="125" align="right">
          <template #default="{ row }">{{ money(row.price) }}</template>
        </el-table-column>
        <el-table-column :label="t('sales.available')" width="100" align="right">
          <template #default="{ row }">{{ row.product ? row.availableStock : '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('products.groupImport.status')" min-width="220">
          <template #default="{ row }">
            <el-tag v-if="!row.product" type="danger">{{ t('sales.jsonImport.notFound') }}</el-tag>
            <span v-else-if="saleImportStockExceeded(row)" class="sale-json-error">{{ t('sales.jsonImport.stockError', { count: row.requestedCount, stock: row.availableStock }) }}</span>
            <el-tag v-else type="success">{{ t('products.groupImport.found') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column width="52" fixed="right">
          <template #default="{ row }"><el-button :icon="Delete" text type="danger" :disabled="busy" :aria-label="t('products.groupImport.removeRow')" :title="t('products.groupImport.removeRow')" @click="removeRow(row)" /></template>
        </el-table-column>
      </el-table>
      <div class="sale-json-pagination" :inert="busy"><ZeroPagination v-model:page="page" v-model:size="size" :has-next="(page + 1) * size < rows.length" /></div>
      <p role="status">{{ t('sales.jsonImport.summary', { count: rows.length, total: money(total) }) }}</p>
    </template>
    <template #footer>
      <div class="sale-json-actions">
        <el-button :disabled="busy" @click="guard.requestClose">{{ t('common.actions.cancel') }}</el-button>
        <el-button :loading="busy" :disabled="busy || !raw.trim() || !canImport" @click="check">{{ t('products.groupImport.check') }}</el-button>
        <el-button type="primary" :disabled="busy || !rows.length || hasProblems || !canImport" @click="apply">{{ t('sales.jsonImport.add') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import { useDialogGuard } from '@/composables/useDialogGuard'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'
import { parseSaleImport, SaleImportIssue, saleImportLimits, saleImportStockExceeded, type SaleImportRow, type SaleImportInput } from '@/models/saleJsonImport'
import { prepareSaleImport, updateSaleImportCounts } from '@/services/saleJsonImport'

const props = defineProps<{ storageCode?: string; currencyId?: number; currencyLabel?: string; currencySign?: string; existing: Array<{ productId: number; count: number }> }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ import: [rows: SaleImportRow[]] }>()
const { t, locale } = useI18n()
const { hasPermission } = usePermissions()
const canImport = computed(() => !!props.storageCode && !!props.currencyId && hasPermission('ARTICLES_GET_MAIN') && hasPermission('SALES_CREATE'))
const raw = ref('')
const rows = ref<SaleImportRow[]>([])
const inputRows = ref<SaleImportInput[]>()
const error = ref('')
const busy = ref(false)
const page = ref(0)
const size = ref(20)
const guard = useDialogGuard(open, busy, () => ({ raw: raw.value, input: inputRows.value }))
const context = computed(() => JSON.stringify([props.storageCode, props.currencyId, props.existing]))
const hasProblems = computed(() => rows.value.some(row => !row.product || saleImportStockExceeded(row)))
const visibleRows = computed(() => rows.value.slice(page.value * size.value, (page.value + 1) * size.value))
const total = computed(() => rows.value.reduce((sum, row) => sum + Math.round(row.price * 100) * row.count, 0) / 100)
const example = JSON.stringify([{ count: '1', price: '5012,53', producer: 'Dayco', uniValue: '9PK4145HD' }], null, 2)
function money(value: number) { return `${value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${props.currencySign ?? ''}`.trim() }
function rowIndex(index: number) { return page.value * size.value + index + 1 }

function removeRow(row: SaleImportRow) {
  if (busy.value || !inputRows.value) return
  const index = rows.value.indexOf(row)
  if (index < 0) return
  rows.value.splice(index, 1)
  inputRows.value.splice(index, 1)
  updateSaleImportCounts(rows.value, props.existing)
  page.value = Math.min(page.value, Math.max(0, Math.ceil(rows.value.length / size.value) - 1))
  error.value = ''
}

async function check(): Promise<boolean> {
  if (busy.value || !canImport.value || !props.storageCode) return false
  busy.value = true
  error.value = ''
  rows.value = []
  page.value = 0
  const snapshot = context.value
  try {
    inputRows.value ??= parseSaleImport(raw.value)
    if (!inputRows.value.length) return false
    const result = await prepareSaleImport(inputRows.value, props.storageCode, props.existing)
    if (!open.value || snapshot !== context.value || !canImport.value) return false
    rows.value = result
    return !hasProblems.value
  } catch (cause) {
    error.value = cause instanceof SaleImportIssue ? t(`sales.jsonImport.errors.${cause.code}`, { row: cause.row, ...saleImportLimits })
      : cause instanceof Error ? cause.message : t('products.groupImport.failed')
    return false
  } finally { busy.value = false }
}
async function apply() {
  // Refresh stock and resolution before appending; preview never mutates a sale.
  if (!await check()) return
  emit('import', rows.value)
  guard.markClean()
  open.value = false
}
watch(raw, () => { inputRows.value = undefined; rows.value = []; error.value = ''; page.value = 0 })
watch(context, () => { rows.value = []; error.value = ''; page.value = 0 })
watch(size, () => { page.value = 0 })
watch(open, value => { if (value) { raw.value = ''; inputRows.value = undefined; rows.value = []; error.value = ''; page.value = 0 } })
</script>

<style>
.sale-json-dialog { max-height: 92dvh; display: flex; flex-direction: column; }
.sale-json-dialog .el-dialog__body { min-height: 0; overflow: auto; }
.sale-json-dialog .el-dialog__footer { flex-shrink: 0; }
.sale-json-hint { color: var(--el-text-color-secondary); font-size: var(--el-font-size-small); margin: 8px 0; }
.sale-json-label { display: block; margin: 12px 0 6px; }
.sale-json-pagination { margin-top: 12px; }
.sale-json-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.sale-json-actions .el-button + .el-button { margin-left: 0; }
.sale-json-error { color: var(--el-color-danger); }
</style>
