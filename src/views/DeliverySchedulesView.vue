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
      <div class="delivery-workspace">
        <aside class="delivery-sidebar">
          <div class="delivery-filters">
            <el-input v-model="searchText" clearable :prefix-icon="Search" :placeholder="t('deliverySchedules.search')" :aria-label="t('deliverySchedules.search')" />
            <el-button :icon="Refresh" :loading="loading" :aria-label="t('common.actions.refresh')" @click="load(true)" />
          </div>
          <div ref="scrollElement" class="delivery-list" :aria-busy="loading" @scroll.passive="loadNearEnd">
          <button
            v-for="row in visibleSchedules"
            :key="scheduleKey(row)"
            type="button"
            class="schedule-row"
            :aria-pressed="!!activeSchedule && scheduleKey(activeSchedule) === scheduleKey(row)"
            @click="activeSchedule = row"
          >
            <span>{{ supplierLabel(row.supplier) }} · {{ row.storageCode }}</span>
          </button>
          <el-empty v-if="!loading && !waitingForSearchPages && !error && !visibleSchedules.length" :description="t('deliverySchedules.empty')" :image-size="64" />
          <DataLoadError v-if="error" :error="error" @retry="load(rows.length === 0)" />
          <p v-if="loading || waitingForSearchPages" role="status">{{ t('deliverySchedules.loading') }}</p>
          </div>
        </aside>
        <section v-if="activeSchedule" class="delivery-detail">
          <div class="detail-header">
            <div class="detail-title">
              <h2>{{ supplierLabel(activeSchedule.supplier) }} · {{ activeSchedule.storageCode }}</h2>
              <p>{{ scheduleSummary(activeSchedule) }}</p>
            </div>
            <div v-if="canEdit" class="detail-actions">
              <el-button size="small" :icon="EditPen" :disabled="changingException || deleting" @click="edit(activeSchedule)">{{ t('common.actions.edit') }}</el-button>
              <el-dropdown trigger="click" :disabled="changingException || deleting">
                <el-button size="small" :icon="MoreFilled" :aria-label="t('common.labels.actions')" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="remove(activeSchedule)">{{ t('common.actions.delete') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
import { computed, h, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, MoreFilled, Refresh, Search } from '@element-plus/icons-vue'
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
const searchText = ref(''), searchTerm = ref(''), rows = ref<DeliverySchedule[]>([]), loading = ref(false), deleting = ref(false), hasMore = ref(false)
const activeSchedule = ref<DeliverySchedule>(), editingSchedule = ref<DeliverySchedule>()
const visibleSchedules = computed(() => {
  const active = activeSchedule.value
  const all = active && !rows.value.some(row => scheduleKey(row) === scheduleKey(active))
    ? [active, ...rows.value]
    : rows.value
  return all.filter(matchesSearch)
})
const waitingForSearchPages = computed(() => !!searchTerm.value && hasMore.value)
const changingException = ref(false)
const editorOpen = ref(false), scrollElement = ref<HTMLElement>(), error = ref<DataLoadErrorKind | null>(null)
let page = 0, version = 0, disposed = false, controller: AbortController | undefined
let undoMessage: { key: string; date: string; close: () => void } | undefined
onScopeDispose(() => { disposed = true; ++version; controller?.abort(); undoMessage?.close() })
async function load(reset: boolean) {
  if (disposed || !canRead.value || (!reset && (loading.value || !hasMore.value))) return
  const request = ++version; controller?.abort(); controller = new AbortController()
  if (reset) { rows.value = []; page = 0; hasMore.value = false }
  const nextPage = reset ? 0 : page + 1
  loading.value = true; error.value = null
  try {
    const result = await getDeliverySchedules({ page: nextPage, size: 20 }, controller.signal)
    if (request !== version || disposed) return
    const existing = new Set(rows.value.map(scheduleKey))
    rows.value.push(...result.filter(row => !existing.has(scheduleKey(row))))
    page = nextPage
    hasMore.value = result.length === 20
    const active = activeSchedule.value
    activeSchedule.value = active
      ? rows.value.find(row => scheduleKey(row) === scheduleKey(active)) ?? active
      : visibleSchedules.value[0]
  }
  catch (cause) { if (request === version && !disposed) error.value = classifyDataLoadError(cause) }
  finally { if (request === version && !disposed) loading.value = false }
}
const applySearch = useDebounceFn(() => {
  searchTerm.value = searchText.value.trim().toLowerCase()
  if (!activeSchedule.value || !matchesSearch(activeSchedule.value)) activeSchedule.value = visibleSchedules.value[0]
  loadNearEnd()
}, 250)
watch(searchText, () => void applySearch())
watch(canRead, () => { void load(true) }, { immediate: true })
function loadNearEnd() { const el = scrollElement.value; if (el && !error.value && (waitingForSearchPages.value || el.scrollHeight - el.scrollTop - el.clientHeight < 100)) void load(false) }
watch([loading, scrollElement], async () => { await nextTick(); loadNearEnd() }, { flush: 'post' })
useResizeObserver(scrollElement, loadNearEnd)
function scheduleKey(row: DeliverySchedule) { return JSON.stringify([row.supplier, row.storageCode]) }
function supplierLabel(supplier: Supplier) { return deliverySuppliers.find(item => item.value === supplier)?.label ?? supplier }
function matchesSearch(row: DeliverySchedule) {
  const label = `${supplierLabel(row.supplier)} ${row.storageCode}`.toLowerCase()
  return searchTerm.value.split(/\s+/).every(part => label.includes(part))
}
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
  searchText.value = ''
  searchTerm.value = ''
  void load(true)
}
function toggleException(date: string, add: boolean, dateLabel: string) {
  const schedule = activeSchedule.value
  if (schedule) void setException(schedule, date, add, dateLabel)
}
function showUndo(schedule: DeliverySchedule, date: string, dateLabel: string) {
  undoMessage?.close()
  const { close } = ElMessage.success({
    duration: 8000,
    showClose: true,
    message: () => h('span', { style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' } }, [
      t('deliverySchedules.cancelledNotice', { date: dateLabel }),
      h(ElButton, {
        link: true,
        type: 'primary',
        disabled: changingException.value || deleting.value || !canEdit.value,
        onClick: () => void setException(schedule, date, false, dateLabel),
      }, () => t('deliverySchedules.undoCancellation')),
    ]),
  })
  undoMessage = { key: scheduleKey(schedule), date, close }
}
async function setException(schedule: DeliverySchedule, date: string, add: boolean, dateLabel: string) {
  if (disposed || !canEdit.value || changingException.value || deleting.value) return
  changingException.value = true
  try {
    const result = await changeDeliveryException({ supplier: schedule.supplier, storageCode: schedule.storageCode, date }, add)
    if (disposed) return
    updateSchedule(result)
    if (add) showUndo(result, date, dateLabel)
    else if (undoMessage?.key === scheduleKey(result) && undoMessage.date === date) {
      undoMessage.close()
      undoMessage = undefined
    }
  } catch (cause) {
    if (!disposed) ElMessage.error(cause instanceof Error ? cause.message : t('deliverySchedules.saveError'))
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
    if (undoMessage?.key === scheduleKey(row)) {
      undoMessage.close()
      undoMessage = undefined
    }
    if (activeSchedule.value && scheduleKey(activeSchedule.value) === scheduleKey(row)) activeSchedule.value = undefined
    await load(true)
  }
  catch (cause) { ElMessage.error(cause instanceof Error ? cause.message : t('deliverySchedules.saveError')) }
  finally { deleting.value = false }
}
</script>
<style scoped>
.delivery-page { padding: 24px; }
.delivery-panel { border: 1px solid var(--app-border); background: var(--app-surface); border-radius: 8px; }
.delivery-workspace { display: grid; grid-template-columns: minmax(170px, 218px) minmax(0, 1fr); }
.delivery-sidebar { min-width: 0; padding: 10px; border-inline-end: 1px solid var(--app-border); }
.delivery-filters, .detail-header, .detail-title, .detail-actions { display: flex; align-items: center; gap: 8px; }
.delivery-filters { margin-bottom: 6px; }
.delivery-filters .el-button { margin: 0; padding-inline: 7px; }
.delivery-list { max-height: 57dvh; overflow: auto; padding: 2px; }
.schedule-row {
  width: 100%; display: block; text-align: start; padding: 7px 8px;
  border-bottom: 1px solid var(--app-border); color: var(--el-text-color-regular);
  background: transparent; cursor: pointer; overflow-wrap: anywhere;
}
.schedule-row:hover, .schedule-row[aria-pressed="true"] { background: var(--el-color-primary-light-9); }
.schedule-row[aria-pressed="true"] { color: var(--el-color-primary); font-weight: 650; }
.schedule-row:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
.delivery-detail { min-width: 0; padding: 10px 14px 14px; }
.detail-header { justify-content: space-between; flex-wrap: wrap; padding-bottom: 8px; border-bottom: 1px solid var(--app-border); }
.detail-title { flex-wrap: wrap; }
.detail-title h2 { margin: 0; font-size: 1.05em; overflow-wrap: anywhere; }
.detail-title p { margin: 0; color: var(--app-text-muted); font-size: .87em; }
@media (max-width: 700px) {
  .delivery-page { padding: 12px; }
  .delivery-workspace { grid-template-columns: minmax(0, 1fr); }
  .delivery-sidebar { border-inline-end: 0; border-bottom: 1px solid var(--app-border); }
  .delivery-list { max-height: 22dvh; }
  .delivery-detail { padding-inline: 8px; }
}
</style>
