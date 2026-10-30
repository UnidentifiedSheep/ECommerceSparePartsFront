<template>
  <el-dialog v-model="open" :title="t('purchases.jsonImport.title')" width="min(1100px, calc(100vw - 24px))" top="4vh" append-to-body destroy-on-close
    class="purchase-json-dialog" :before-close="guard.beforeClose" :close-on-click-modal="false" :close-on-press-escape="!busy" :show-close="!busy">
    <p class="purchase-json-hint">{{ t('purchases.jsonImport.hint') }}</p>
    <p><strong>{{ currency?.name }}</strong> · {{ storageCode }}</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <label for="purchase-import-json" class="purchase-json-label">{{ t('products.groupImport.jsonLabel') }}</label>
    <el-input id="purchase-import-json" v-model="raw" type="textarea" :rows="5" :disabled="busy || wrote" :placeholder="example" spellcheck="false" />
    <p class="purchase-json-hint">{{ t('purchases.jsonImport.limits', purchaseImportLimits) }}</p>
    <template v-if="data">
      <el-alert v-if="!currencyMatches" :title="t('purchases.jsonImport.currencyMismatch', { code: data.currency ?? '' })" type="error" :closable="false" show-icon />
      <el-alert v-if="needsReview" :title="t('purchases.jsonImport.reviewHint')" type="warning" :closable="false" show-icon />
      <el-table :data="visibleRows" :max-height="360" :aria-busy="busy">
        <el-table-column type="index" :index="rowIndex" width="50" />
        <el-table-column :label="t('products.sku')" min-width="130" prop="sku" />
        <el-table-column :label="t('common.labels.producer')" min-width="180">
          <template #default="{ row }">
            <div class="purchase-json-hint">{{ row.producer }}</div>
            <span v-if="row.productId">{{ row.producerLabel }}</span>
            <ProducerSelector v-else :model-value="row.manualProducerId ?? row.producerId" allow-create :disabled="busy" :aria-label="t('products.groupImport.producerFor', { sku: row.sku })" @update:model-value="selectProducer(row, $event)" />
          </template>
        </el-table-column>
        <el-table-column :label="t('common.labels.name')" min-width="230">
          <template #default="{ row }">
            <span v-if="row.productId">{{ row.productName || row.name }}</span>
            <el-input v-else v-model="row.name" :disabled="busy" maxlength="255" :aria-label="t('products.groupImport.nameFor', { sku: row.sku })" :aria-invalid="row.name.trim().length < 3" />
          </template>
        </el-table-column>
        <el-table-column prop="count" :label="t('common.labels.count')" width="80" align="right" />
        <el-table-column :label="t('common.labels.price')" width="130" align="right"><template #default="{ row }">{{ money(row.price) }}</template></el-table-column>
        <el-table-column :label="t('products.groupImport.status')" min-width="150">
          <template #default="{ row }">
            <el-tag :type="row.productId ? 'success' : 'warning'">{{ t(`products.groupImport.${row.productId ? row.created ? 'created' : 'found' : row.producerId ? 'newProduct' : 'unknownProducer'}`) }}</el-tag>
            <div v-if="row.returnedCount" class="purchase-json-hint">{{ t('purchases.jsonImport.returned', { count: row.returnedCount }) }}</div>
          </template>
        </el-table-column>
      </el-table>
      <div class="purchase-json-pagination" :inert="busy"><ZeroPagination v-model:page="page" v-model:size="size" :has-next="(page + 1) * size < data.group.rows.length" /></div>
      <p role="status">{{ t('sales.jsonImport.summary', { count: data.group.rows.length, total: money(total) }) }}</p>
      <p v-if="needsResolve" class="purchase-json-hint">{{ t('products.groupImport.recheckHint') }}</p>
      <p v-if="missing && !canCreate" class="purchase-json-hint">{{ t('products.groupImport.createPermission') }}</p>
      <p v-if="missing" class="purchase-json-hint">{{ t('purchases.jsonImport.createHint') }}</p>
      <el-checkbox v-if="needsReview" v-model="reviewed" :disabled="busy">{{ t('purchases.jsonImport.reviewed') }}</el-checkbox>
    </template>
    <template #footer>
      <div class="purchase-json-actions">
        <el-button :disabled="busy" @click="guard.requestClose">{{ t('common.actions.cancel') }}</el-button>
        <el-button :loading="busy" :disabled="busy || !raw.trim() || !canRead" @click="check">{{ t('products.groupImport.check') }}</el-button>
        <el-button type="primary" :disabled="busy || !ready" @click="apply">{{ t(missing ? 'purchases.jsonImport.createAndAdd' : 'purchases.jsonImport.add') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import { useDialogGuard } from '@/composables/useDialogGuard'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'
import type { CurrencyModel } from '@/models/currencyModel'
import type { ProductSearchModel } from '@/models/productSearchModel'
import { ProductImportIssue } from '@/models/productGroupImport'
import { parsePurchaseImport, purchaseCurrencyMatches, purchaseImportLimits, PurchaseImportIssue, type PurchaseImportData, type PurchaseImportRow } from '@/models/purchaseJsonImport'
import { executeProductCreation, resolveImportGroups } from '@/services/productGroupImport'

const props = defineProps<{ storageCode?: string; currency?: CurrencyModel }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ import: [rows: Array<{ product: ProductSearchModel; count: number; price: number }>] }>()
const { t, locale } = useI18n()
const { hasPermission } = usePermissions()
const canRead = computed(() => hasPermission('ARTICLES_GET_MAIN') && hasPermission('PURCHASE_CREATE') && !!props.storageCode && !!props.currency)
const canCreate = computed(() => hasPermission('ARTICLES_CREATE'))
const raw = ref(''), error = ref(''), busy = ref(false), wrote = ref(false), reviewed = ref(false), needsResolve = ref(false)
const data = ref<PurchaseImportData>()
const page = ref(0), size = ref(20)
const guard = useDialogGuard(open, busy, () => ({ raw: raw.value, rows: data.value?.group.rows.map(row => ({ name: row.name, producer: row.manualProducerId })) }))
const context = computed(() => JSON.stringify([props.currency?.id, props.storageCode]))
const currencyMatches = computed(() => !!data.value && purchaseCurrencyMatches(data.value.currency, props.currency))
const missing = computed(() => data.value?.group.rows.some(row => !row.productId) ?? false)
const needsReview = computed(() => !!data.value && (data.value.partial || !data.value.currency || data.value.group.rows.some(row => row.returnedCount > 0)))
const ready = computed(() => canRead.value && !!data.value && currencyMatches.value && !needsResolve.value && (!needsReview.value || reviewed.value)
  && (!missing.value || canCreate.value) && data.value.group.rows.every(row => row.producerId && (row.productId || row.name.trim().length >= 3)))
const visibleRows = computed(() => data.value?.group.rows.slice(page.value * size.value, (page.value + 1) * size.value) ?? [])
const total = computed(() => (data.value?.group.rows.reduce((sum, row) => sum + Math.round(row.price * 100) * row.count, 0) ?? 0) / 100)
const example = JSON.stringify({ type: 'purchase', supplier: 'Armtek', currency: 'RUB', products: [{ producer: 'ZEKKERT', sku: 'SR1035', name: t('common.labels.name'), count: 1, price: 651 }] }, null, 2)
function money(value: number) { return `${value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${props.currency?.currencySign ?? ''}`.trim() }
function rowIndex(index: number) { return page.value * size.value + index + 1 }
function message(cause: unknown) {
  return cause instanceof PurchaseImportIssue ? t(`purchases.jsonImport.errors.${cause.code}`, { row: cause.row, ...purchaseImportLimits })
    : cause instanceof ProductImportIssue ? t(`products.groupImport.errors.${cause.code}`, { group: '', row: '', ...cause.params })
      : cause instanceof Error ? cause.message : t('products.groupImport.failed')
}
function selectProducer(row: PurchaseImportRow, id?: number) {
  row.manualProducerId = id; row.producerId = undefined; row.productId = undefined; row.productName = undefined; row.created = false; needsResolve.value = true
}
async function check() {
  if (busy.value || !canRead.value) return false
  busy.value = true; error.value = ''
  const snapshot = context.value
  try {
    data.value ??= parsePurchaseImport(raw.value)
    data.value.group.done = false
    await resolveImportGroups([data.value.group])
    if (!open.value || context.value !== snapshot || !canRead.value) return false
    needsResolve.value = false
    return ready.value
  } catch (cause) { needsResolve.value = true; error.value = message(cause); return false }
  finally { busy.value = false }
}
async function apply() {
  if (!await check() || !data.value) return
  busy.value = true
  const snapshot = context.value
  try {
    await executeProductCreation([data.value.group], { canRead: () => canRead.value, canCreate: () => canCreate.value, canLink: () => false }, () => {}, () => { wrote.value = true })
    if (snapshot !== context.value || !canRead.value || !currencyMatches.value || data.value.group.rows.some(row => !row.productId || !row.producerId)) throw new ProductImportIssue('resolve')
    emit('import', data.value.group.rows.map(row => ({ product: { id: row.productId!, sku: row.sku, name: row.productName || row.name, producerId: row.producerId!, producerName: row.producerLabel, stock: 0 }, count: row.count, price: row.price })))
    guard.markClean(); open.value = false
  } catch (cause) { error.value = message(cause) }
  finally { busy.value = false }
}
watch(raw, () => { if (!wrote.value) { data.value = undefined; reviewed.value = false; error.value = ''; page.value = 0 } })
watch(context, () => { reviewed.value = false; error.value = '' })
watch(size, () => { page.value = 0 })
watch(open, value => { if (value) { wrote.value = false; raw.value = ''; data.value = undefined; error.value = ''; reviewed.value = false; needsResolve.value = false; page.value = 0 } })
</script>

<style>
.purchase-json-dialog { max-height: 92dvh; display: flex; flex-direction: column; }
.purchase-json-dialog .el-dialog__body { min-height: 0; overflow: auto; }
.purchase-json-dialog .el-dialog__footer { flex-shrink: 0; }
.purchase-json-hint { color: var(--el-text-color-secondary); font-size: var(--el-font-size-small); margin: 8px 0; }
.purchase-json-label { display: block; margin: 12px 0 6px; }
.purchase-json-pagination { margin-top: 12px; }
.purchase-json-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.purchase-json-actions .el-button + .el-button { margin-left: 0; }
</style>
