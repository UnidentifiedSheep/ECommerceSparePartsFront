<template>
  <el-dialog v-model="open" :title="t('deliverySchedules.title')" width="min(620px, 96vw)" :before-close="guard.beforeClose">
    <el-form label-position="top" :disabled="busy || !canEdit" @submit.prevent="save">
      <el-form-item :label="t('deliverySchedules.supplier')" required><el-select v-model="form.supplier" :disabled="!!current"><el-option v-for="supplier in deliverySuppliers" :key="supplier.value" :value="supplier.value" :label="supplier.label" /></el-select></el-form-item>
      <el-form-item :label="t('deliverySchedules.storageCode')" required>
        <el-input v-if="current" :model-value="current.storageCode" disabled />
        <StorageSelector
          v-else-if="open"
          v-model="form.storageCode"
          :type="StorageType.Warehouse"
          :disabled="busy || !canEdit"
        />
      </el-form-item>
      <el-form-item :label="t('deliverySchedules.days')" required><el-checkbox-group v-model="form.days"><el-checkbox v-for="day in deliveryWeekDays" :key="day" :value="day">{{ t(`deliverySchedules.week.${day}`) }}</el-checkbox></el-checkbox-group></el-form-item>
      <el-form-item :label="t('deliverySchedules.arrivalTime')" required>
        <el-time-picker
          v-model="localArrivalTime"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
          :clearable="false"
          :aria-label="t('deliverySchedules.arrivalTime')"
        />
        <p v-if="form.arrivalTime" class="arrival-hint">
          {{ t('deliverySchedules.arrivalTimeHint', { time: form.arrivalTime }) }}
        </p>
      </el-form-item>
      <template v-if="current">
        <h3>{{ t('deliverySchedules.exceptions') }}</h3><p>{{ t('deliverySchedules.exceptionsHint') }}</p>
        <div class="exception-entry"><el-date-picker v-model="exceptionDate" type="date" value-format="YYYY-MM-DD" :placeholder="t('deliverySchedules.exceptionDate')" :aria-label="t('deliverySchedules.exceptionDate')" /><el-button :disabled="!exceptionDate" @click="changeException(exceptionDate, true)">{{ t('common.actions.add') }}</el-button></div>
        <el-empty v-if="!current.exceptions.length" :description="t('deliverySchedules.noExceptions')" :image-size="40" />
        <div v-for="date in current.exceptions" :key="date" class="exception-entry"><span>{{ formatDate(date) }}</span><el-button link type="danger" @click="changeException(date, false)">{{ t('common.actions.delete') }}</el-button></div>
      </template>
    </el-form>
    <template #footer><el-button :disabled="busy" @click="guard.requestClose">{{ t('common.actions.close') }}</el-button><el-button v-if="canEdit" type="primary" :loading="busy" :disabled="!form.storageCode || !form.days.length || !form.arrivalTime" @click="save">{{ t('common.actions.save') }}</el-button></template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
import { usePermissions } from '@/composables/usePermissions'
import { useDialogGuard } from '@/composables/useDialogGuard'
import StorageSelector from '@/components/selectors/StorageSelector.vue'
import { StorageType } from '@/enums/storageType'
import { saveDeliverySchedule, changeDeliveryException, type DeliverySchedule, type DeliveryScheduleInput } from '@/services/api/deliverySchedules'
import { deliverySuppliers, deliveryWeekDays, shiftDeliveryTime } from '@/utils/deliverySchedule'
const props = defineProps<{ schedule?: DeliverySchedule }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [value: DeliverySchedule, created: boolean] }>()
const { t, locale } = useI18n()
const { hasPermission } = usePermissions()
const canEdit = computed(() => hasPermission('DELIVERY_SCHEDULES_EDIT'))
const defaultArrivalTime = '23:59:59'
const form = reactive<Omit<DeliveryScheduleInput, 'storageCode'> & { storageCode?: string }>({
  supplier: 'ARMTEK', days: [], arrivalTime: defaultArrivalTime,
})
const utcOffset = ref(new Date().getTimezoneOffset())
const localArrivalTime = computed<string>({
  get: () => shiftDeliveryTime(form.arrivalTime, -utcOffset.value).slice(0, 8),
  set: (value) => {
    if (value && value !== localArrivalTime.value) form.arrivalTime = shiftDeliveryTime(value, utcOffset.value)
  },
})
const current = ref<DeliverySchedule>(), busy = ref(false), exceptionDate = ref<string>('')
const guard = useDialogGuard(open, busy, () => form)
watch(open, value => {
  if (!value) return
  utcOffset.value = new Date().getTimezoneOffset()
  const schedule = props.schedule
  current.value = schedule
  form.supplier = schedule?.supplier ?? 'ARMTEK'
  form.storageCode = schedule?.storageCode
  form.days = [...(schedule?.days ?? [])]
  form.arrivalTime = schedule?.arrivalTime ?? defaultArrivalTime
  exceptionDate.value = ''
  guard.markClean()
})
function formatDate(value: string) { return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)) }
async function save() {
  const storageCode = form.storageCode
  if (busy.value || !canEdit.value || !storageCode || !form.days.length || !form.arrivalTime) return
  busy.value = true
  try { const created = !current.value; const result = await saveDeliverySchedule({ ...form, storageCode, days: [...form.days] }, !created); current.value = result; emit('saved', result, created); guard.markClean(); ElMessage.success(t('deliverySchedules.saved')) }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : t('deliverySchedules.saveError')) }
  finally { busy.value = false }
}
async function changeException(date: string, add: boolean) {
  if (!current.value || busy.value || !canEdit.value) return
  busy.value = true
  try { const result = await changeDeliveryException({ supplier: current.value.supplier, storageCode: current.value.storageCode, date }, add); current.value = result; exceptionDate.value = ''; emit('saved', result, false) }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : t('deliverySchedules.saveError')) }
  finally { busy.value = false }
}
</script>
<style scoped>
.arrival-hint { flex-basis: 100%; margin: 4px 0 0; line-height: 1.4; }
h3 { font-size: 15px; margin-top: 18px; } p { color: var(--app-text-muted); font-size: 13px; } .exception-entry { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 10px 0; }
</style>
