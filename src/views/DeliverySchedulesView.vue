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
      <div ref="scrollElement" class="delivery-list" :aria-busy="loading" @scroll.passive="loadNearEnd">
        <table v-if="rows.length"><thead><tr><th>{{ t('deliverySchedules.supplier') }}</th><th>{{ t('deliverySchedules.storageCode') }}</th><th>{{ t('deliverySchedules.days') }}</th><th>{{ t('deliverySchedules.arrivalTime') }}</th><th>{{ t('deliverySchedules.exceptions') }}</th><th>{{ t('common.labels.actions') }}</th></tr></thead><tbody><tr v-for="row in rows" :key="`${row.supplier}:${row.storageCode}`"><td>{{ deliverySuppliers.find(item => item.value === row.supplier)?.label || row.supplier }}</td><td>{{ row.storageCode }}</td><td>{{ deliveryWeekDays.filter(day => row.days.includes(day)).map(day => t(`deliverySchedules.week.${day}`)).join(', ') }}</td><td>{{ shiftDeliveryTime(row.arrivalTime, localOffset).slice(0, 8) }}</td><td>{{ row.exceptions.length }}</td><td><el-button link @click="edit(row)">{{ t('common.actions.open') }}</el-button><el-button v-if="canEdit" link type="danger" :disabled="deleting" @click="remove(row)">{{ t('common.actions.delete') }}</el-button></td></tr></tbody></table>
        <el-empty v-if="!loading && !error && !rows.length" :description="t('deliverySchedules.empty')" />
        <DataLoadError v-if="error" :error="error" @retry="load(rows.length === 0)" />
        <p v-if="loading" role="status">{{ t('deliverySchedules.loading') }}</p>
      </div>
    </section>
    <DeliveryScheduleEditor v-model="editorOpen" :schedule="selected" @saved="saved" />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import DataLoadError from '@/components/common/DataLoadError.vue'
import DeliveryScheduleEditor from '@/components/logistics/DeliveryScheduleEditor.vue'
import { getDeliverySchedules, deleteDeliverySchedule, type DeliverySchedule } from '@/services/api/deliverySchedules'
import type { Supplier } from '@/graphql/generated/graphql'
import { deliverySuppliers, deliveryWeekDays, shiftDeliveryTime } from '@/utils/deliverySchedule'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'
const { t } = useI18n()
const localOffset = -new Date().getTimezoneOffset()
const { hasPermission } = usePermissions()
const canRead = computed(() => hasPermission('DELIVERY_SCHEDULES_GET')), canEdit = computed(() => hasPermission('DELIVERY_SCHEDULES_EDIT'))
const canListStorages = computed(() => hasPermission('STORAGES_GET'))
const suppliers = ref<Supplier[]>([]), storageCode = ref(''), rows = ref<DeliverySchedule[]>([]), loading = ref(false), deleting = ref(false), hasMore = ref(false)
const editorOpen = ref(false), selected = ref<DeliverySchedule>(), scrollElement = ref<HTMLElement>(), error = ref<DataLoadErrorKind | null>(null)
let page = 0, version = 0, disposed = false, controller: AbortController | undefined
onScopeDispose(() => { disposed = true; ++version; controller?.abort() })
async function load(reset: boolean) {
  if (disposed || !canRead.value || (!reset && (loading.value || !hasMore.value))) return
  const request = ++version; controller?.abort(); controller = new AbortController()
  if (reset) { rows.value = []; page = 0; hasMore.value = false }
  const nextPage = reset ? 0 : page + 1
  loading.value = true; error.value = null
  try { const result = await getDeliverySchedules({ suppliers: [...suppliers.value], storageCode: storageCode.value, page: nextPage, size: 20 }, controller.signal); if (request !== version || disposed) return; rows.value.push(...result); page = nextPage; hasMore.value = result.length === 20 }
  catch (cause) { if (request === version && !disposed) error.value = classifyDataLoadError(cause) }
  finally { if (request === version && !disposed) loading.value = false }
}
const reload = useDebounceFn(() => { void load(true) }, 300)
watch([suppliers, storageCode], () => { ++version; controller?.abort(); error.value = null; hasMore.value = false; void reload() }, { deep: true })
watch(canRead, () => { void load(true) }, { immediate: true })
function loadNearEnd() { const el = scrollElement.value; if (el && !error.value && el.scrollHeight - el.scrollTop - el.clientHeight < 100) void load(false) }
watch([loading, scrollElement], async () => { await nextTick(); loadNearEnd() }, { flush: 'post' })
useResizeObserver(scrollElement, loadNearEnd)
function edit(row?: DeliverySchedule) { selected.value = row; editorOpen.value = true }
function saved(row: DeliverySchedule, created: boolean) { if (created || loading.value) void load(true); else rows.value = rows.value.map(item => item.supplier === row.supplier && item.storageCode === row.storageCode ? row : item) }
async function remove(row: DeliverySchedule) {
  if (deleting.value || !canEdit.value) return
  try { await ElMessageBox.confirm(t('deliverySchedules.deleteConfirm', { code: row.storageCode, supplier: deliverySuppliers.find(item => item.value === row.supplier)?.label || row.supplier }), t('common.actions.delete'), { type: 'warning' }) } catch { return }
  deleting.value = true
  try { await deleteDeliverySchedule(row.supplier, row.storageCode); await load(true) }
  catch (cause) { ElMessage.error(cause instanceof Error ? cause.message : t('deliverySchedules.saveError')) }
  finally { deleting.value = false }
}
</script>
<style scoped>
.delivery-page { padding: 24px; } .delivery-panel { padding: 16px; border: 1px solid var(--app-border); background: var(--app-surface); border-radius: 8px; } .delivery-filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; } .delivery-filters .el-select, .delivery-filters .el-input { width: 260px; max-width: 100%; } .delivery-list { max-height: 70dvh; min-height: 160px; overflow: auto; } table { width: 100%; border-collapse: collapse; font-size: 13px; } th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid var(--app-border); } th { position: sticky; top: 0; background: var(--app-surface); z-index: 1; } @media (max-width: 600px) { .delivery-page { padding: 12px; } table { min-width: 650px; } }
</style>
