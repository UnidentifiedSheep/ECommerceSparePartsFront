<template>
  <div class="delivery-page">
    <PageHeader :title="t('deliverySchedules.title')" :description="t('deliverySchedules.description')">
      <template #actions>
        <el-tooltip v-if="canEdit && canRead" :disabled="canListStorages" :content="t('deliverySchedules.storagePermissionRequired')">
          <span><el-button type="primary" :disabled="!canListStorages" @click="edit()">{{ t('common.actions.create') }}</el-button></span>
        </el-tooltip>
      </template>
    </PageHeader>
    <el-empty v-if="!canRead" :description="t('deliverySchedules.noPermission')" />
    <section v-else class="delivery-panel">
      <div class="delivery-filters"><el-select v-model="suppliers" multiple clearable :placeholder="t('deliverySchedules.supplier')" :aria-label="t('deliverySchedules.supplier')"><el-option v-for="supplier in deliverySuppliers" :key="supplier.value" :value="supplier.value" :label="supplier.label" /></el-select><el-input v-model="storageCode" clearable maxlength="128" :placeholder="t('deliverySchedules.storageCode')" :aria-label="t('deliverySchedules.storageCode')" /><el-button :loading="loading" @click="load(true)">{{ t('common.actions.refresh') }}</el-button></div>
      <div class="delivery-workspace">
        <div ref="scrollElement" class="delivery-list" :aria-busy="loading" @scroll.passive="loadNearEnd">
          <button
            v-for="row in visibleSchedules"
            :key="scheduleKey(row)"
            type="button"
            class="schedule-row"
            :aria-pressed="!!activeSchedule && scheduleKey(activeSchedule) === scheduleKey(row)"
            @click="activeSchedule = row"
          >
            <strong>{{ supplierLabel(row.supplier) }}</strong>
            <span>{{ row.storageCode }}</span>
          </button>
          <el-empty v-if="!loading && !error && !visibleSchedules.length" :description="t('deliverySchedules.empty')" :image-size="64" />
          <DataLoadError v-if="error" :error="error" @retry="load(rows.length === 0)" />
          <p v-if="loading" role="status">{{ t('deliverySchedules.loading') }}</p>
        </div>
        <section v-if="activeSchedule" class="delivery-detail">
          <div class="detail-header">
            <div>
              <h2>{{ supplierLabel(activeSchedule.supplier) }} · {{ activeSchedule.storageCode }}</h2>
              <p>{{ scheduleSummary(activeSchedule) }}</p>
            </div>
            <div v-if="canEdit" class="detail-actions">
              <el-button :disabled="changingException || deleting" @click="edit(activeSchedule)">{{ t('common.actions.edit') }}</el-button>
              <el-button type="danger" plain :disabled="changingException || deleting" @click="remove(activeSchedule)">{{ t('common.actions.delete') }}</el-button>
            </div>
          </div>
          <DeliveryScheduleCalendar
            :key="scheduleKey(activeSchedule)"
            :schedule="activeSchedule"
            :can-edit="canEdit"
            :busy="changingException || deleting"
            :local-offset="localOffset"
            @change-exception="toggleException"
          />
        </section>
        <el-empty v-else-if="!loading" :description="t('deliverySchedules.selectSchedule')" :image-size="64" />
      </div>
    </section>
    <DeliveryScheduleEditor v-model="editorOpen" :schedule="editingSchedule" @saved="saved" />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import DataLoadError from '@/components/common/DataLoadError.vue'
import DeliveryScheduleEditor from '@/components/logistics/DeliveryScheduleEditor.vue'
import DeliveryScheduleCalendar from '@/components/logistics/DeliveryScheduleCalendar.vue'
import { getDeliverySchedules, deleteDeliverySchedule, changeDeliveryException, type DeliverySchedule } from '@/services/api/deliverySchedules'
import type { Supplier } from '@/graphql/generated/graphql'
import { deliverySuppliers, shiftDeliveryTime, deliveryDateOffset, shiftDeliveryWeekdays } from '@/utils/deliverySchedule'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'
const { t } = useI18n()
const localOffset = -new Date().getTimezoneOffset()
const { hasPermission } = usePermissions()
const canRead = computed(() => hasPermission('DELIVERY_SCHEDULES_GET')), canEdit = computed(() => hasPermission('DELIVERY_SCHEDULES_EDIT'))
const canListStorages = computed(() => hasPermission('STORAGES_GET'))
const suppliers = ref<Supplier[]>([]), storageCode = ref(''), rows = ref<DeliverySchedule[]>([]), loading = ref(false), deleting = ref(false), hasMore = ref(false)
const activeSchedule = ref<DeliverySchedule>(), editingSchedule = ref<DeliverySchedule>()
const visibleSchedules = computed(() => {
  const active = activeSchedule.value
  return active && !rows.value.some(row => scheduleKey(row) === scheduleKey(active))
    ? [active, ...rows.value]
    : rows.value
})
const changingException = ref(false)
const editorOpen = ref(false), scrollElement = ref<HTMLElement>(), error = ref<DataLoadErrorKind | null>(null)
let page = 0, version = 0, disposed = false, controller: AbortController | undefined
onScopeDispose(() => { disposed = true; ++version; controller?.abort() })
async function load(reset: boolean) {
  if (disposed || !canRead.value || (!reset && (loading.value || !hasMore.value))) return
  const request = ++version; controller?.abort(); controller = new AbortController()
  if (reset) { rows.value = []; page = 0; hasMore.value = false }
  const nextPage = reset ? 0 : page + 1
  loading.value = true; error.value = null
  try {
    const result = await getDeliverySchedules({ suppliers: [...suppliers.value], storageCode: storageCode.value, page: nextPage, size: 20 }, controller.signal)
    if (request !== version || disposed) return
    const existing = new Set(rows.value.map(scheduleKey))
    rows.value.push(...result.filter(row => !existing.has(scheduleKey(row))))
    page = nextPage
    hasMore.value = result.length === 20
    const active = activeSchedule.value
    activeSchedule.value = active
      ? rows.value.find(row => scheduleKey(row) === scheduleKey(active)) ?? active
      : rows.value[0]
  }
  catch (cause) { if (request === version && !disposed) error.value = classifyDataLoadError(cause) }
  finally { if (request === version && !disposed) loading.value = false }
}
const reload = useDebounceFn(() => { void load(true) }, 300)
watch([suppliers, storageCode], () => {
  ++version
  controller?.abort()
  error.value = null
  hasMore.value = false
  const active = activeSchedule.value
  if (active && ((suppliers.value.length && !suppliers.value.includes(active.supplier))
    || (storageCode.value.trim() && active.storageCode !== storageCode.value.trim()))) activeSchedule.value = undefined
  void reload()
}, { deep: true })
watch(canRead, () => { void load(true) }, { immediate: true })
function loadNearEnd() { const el = scrollElement.value; if (el && !error.value && el.scrollHeight - el.scrollTop - el.clientHeight < 100) void load(false) }
watch([loading, scrollElement], async () => { await nextTick(); loadNearEnd() }, { flush: 'post' })
useResizeObserver(scrollElement, loadNearEnd)
function scheduleKey(row: DeliverySchedule) { return JSON.stringify([row.supplier, row.storageCode]) }
function supplierLabel(supplier: Supplier) { return deliverySuppliers.find(item => item.value === supplier)?.label ?? supplier }
function scheduleSummary(row: DeliverySchedule) {
  const weekdays = shiftDeliveryWeekdays(row.days, deliveryDateOffset(row.arrivalTime, localOffset))
  const days = weekdays.map(day => t(`deliverySchedules.week.${day}`)).join(', ')
  return `${days} · ${shiftDeliveryTime(row.arrivalTime, localOffset).slice(0, 8)}`
}
function edit(row?: DeliverySchedule) {
  editingSchedule.value = row
  editorOpen.value = true
}
function updateSchedule(row: DeliverySchedule) {
  const key = scheduleKey(row)
  rows.value = rows.value.map(item => scheduleKey(item) === key ? row : item)
  if (activeSchedule.value && scheduleKey(activeSchedule.value) === key) activeSchedule.value = row
}
function saved(row: DeliverySchedule, created: boolean) {
  if (!created) {
    updateSchedule(row)
    return
  }
  activeSchedule.value = row
  if (suppliers.value.length || storageCode.value) {
    suppliers.value = []
    storageCode.value = ''
  } else {
    void load(true)
  }
}
async function toggleException(date: string, add: boolean) {
  const schedule = activeSchedule.value
  if (!schedule || !canEdit.value || changingException.value || deleting.value) return
  changingException.value = true
  try {
    const result = await changeDeliveryException({ supplier: schedule.supplier, storageCode: schedule.storageCode, date }, add)
    updateSchedule(result)
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : t('deliverySchedules.saveError'))
  } finally {
    changingException.value = false
  }
}
async function remove(row: DeliverySchedule) {
  if (deleting.value || !canEdit.value) return
  try { await ElMessageBox.confirm(t('deliverySchedules.deleteConfirm', { code: row.storageCode, supplier: deliverySuppliers.find(item => item.value === row.supplier)?.label || row.supplier }), t('common.actions.delete'), { type: 'warning' }) } catch { return }
  deleting.value = true
  try {
    await deleteDeliverySchedule(row.supplier, row.storageCode)
    if (activeSchedule.value && scheduleKey(activeSchedule.value) === scheduleKey(row)) activeSchedule.value = undefined
    await load(true)
  }
  catch (cause) { ElMessage.error(cause instanceof Error ? cause.message : t('deliverySchedules.saveError')) }
  finally { deleting.value = false }
}
</script>
<style scoped>
.delivery-page { padding: 24px; }
.delivery-panel { padding: 16px; border: 1px solid var(--app-border); background: var(--app-surface); border-radius: 8px; }
.delivery-filters, .detail-header, .detail-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.delivery-filters { margin-bottom: 16px; }
.delivery-filters .el-select, .delivery-filters .el-input { width: 260px; max-width: 100%; }
.delivery-workspace { display: grid; grid-template-columns: minmax(180px, 260px) minmax(0, 1fr); gap: 16px; }
.delivery-list { max-height: 65dvh; overflow: auto; padding: 2px; }
.schedule-row {
  width: 100%; display: grid; gap: 2px; text-align: start; padding: 10px 12px; margin-bottom: 4px;
  border: 1px solid transparent; border-radius: 6px; color: var(--el-text-color-regular);
  background: transparent; cursor: pointer; overflow-wrap: anywhere;
}
.schedule-row span, .detail-header p { color: var(--app-text-muted); }
.schedule-row:hover, .schedule-row[aria-pressed="true"] { border-color: var(--app-border); background: var(--el-color-primary-light-9); }
.schedule-row:focus-visible { outline: 2px solid var(--el-color-primary); }
.delivery-detail { min-width: 0; padding-inline-start: 16px; border-inline-start: 1px solid var(--app-border); }
.detail-header { justify-content: space-between; margin-bottom: 16px; }
.detail-header h2 { margin: 0; font-size: 1.15em; overflow-wrap: anywhere; }
.detail-header p { margin: 4px 0 0; }
.detail-actions .el-button { margin: 0; }
@media (max-width: 700px) {
  .delivery-page { padding: 12px; }
  .delivery-workspace { grid-template-columns: minmax(0, 1fr); }
  .delivery-list { max-height: 28dvh; }
  .delivery-detail { border-inline-start: 0; padding-inline-start: 0; border-top: 1px solid var(--app-border); padding-top: 16px; }
}
</style>
