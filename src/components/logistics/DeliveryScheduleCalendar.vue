<template>
  <section class="schedule-calendar" :aria-label="t('deliverySchedules.calendar')">
    <div class="calendar-toolbar">
      <el-button :aria-label="t('deliverySchedules.previousMonth')" @click="moveMonth(-1)">‹</el-button>
      <strong aria-live="polite">{{ formatMonth(month) }}</strong>
      <el-button :aria-label="t('deliverySchedules.nextMonth')" @click="moveMonth(1)">›</el-button>
    </div>

    <div class="day-details" aria-live="polite">
      <template v-if="selectedDay">
        <span><strong>{{ formatDate(selectedDay.date) }}</strong> · {{ statusLabel(selectedDay.status) }}</span>
        <el-button
          v-if="canEdit && selectedDay.actionable"
          :type="selectedDay.status === 'exception' ? 'primary' : 'danger'"
          plain
          :loading="busy"
          @click="emit('changeException', selectedDay.utcDate, selectedDay.status !== 'exception')"
        >
          {{ t(selectedDay.status === 'exception' ? 'deliverySchedules.restoreDelivery' : 'deliverySchedules.cancelDelivery') }}
        </el-button>
        <span v-else-if="selectedDay.status !== 'off'" class="day-hint">
          {{ t(canEdit ? 'deliverySchedules.pastDelivery' : 'deliverySchedules.readOnlyCalendar') }}
        </span>
      </template>
      <span v-else-if="canEdit" class="day-hint">{{ t('deliverySchedules.pickDeliveryDay') }}</span>
      <span v-else class="day-hint">{{ t('deliverySchedules.readOnlyCalendar') }}</span>
    </div>

    <div class="calendar-grid">
      <span v-for="day in deliveryWeekDays" :key="day" class="weekday">{{ t(`deliverySchedules.week.${day}`) }}</span>
      <template v-for="(day, index) in cells" :key="day?.date ?? `empty-${index}`">
        <span v-if="!day" aria-hidden="true" />
        <button
          v-else
          type="button"
          class="calendar-day"
          :class="day.status"
          :aria-label="`${formatDate(day.date)} · ${statusLabel(day.status)}`"
          :aria-pressed="selectedDate?.getTime() === day.date.getTime()"
          :aria-current="day.date.getTime() === today.getTime() ? 'date' : undefined"
          @click="selectedDate = day.date"
        >
          {{ day.date.getUTCDate() }}
          <span aria-hidden="true" class="day-marker">{{ markers[day.status] }}</span>
        </button>
      </template>
    </div>

    <div class="calendar-legend">
      <span class="delivery">● {{ t('deliverySchedules.deliveryDay') }}</span>
      <span class="exception">× {{ t('deliverySchedules.exceptionDay') }}</span>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n'
import type { DeliverySchedule } from '@/services/api/deliverySchedules'
import { deliveryDateOffset, deliveryScheduleDate, deliveryWeekDays } from '@/utils/deliverySchedule'

type DayStatus = 'delivery' | 'exception' | 'off'
const props = defineProps<{ schedule: DeliverySchedule; canEdit: boolean; busy: boolean; localOffset: number }>()
const emit = defineEmits<{ changeException: [date: string, add: boolean] }>()
const { t, locale } = useI18n()
const markers: Record<DayStatus, string> = { delivery: '●', exception: '×', off: '' }
const statusKeys: Record<DayStatus, string> = {
  delivery: 'deliverySchedules.deliveryDay',
  exception: 'deliverySchedules.exceptionDay',
  off: 'deliverySchedules.noDeliveryDay',
}
const statusLabel = (status: DayStatus) => t(statusKeys[status])
const now = new Date()
const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
const todayUtc = now.toISOString().slice(0, 10)
const month = ref(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)))
const selectedDate = ref<Date>()
const formatDate = (date: Date) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
const formatMonth = (date: Date) => new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(date)

function moveMonth(step: number) {
  month.value = new Date(Date.UTC(month.value.getUTCFullYear(), month.value.getUTCMonth() + step, 1))
  selectedDate.value = undefined
}

const cells = computed(() => {
  const year = month.value.getUTCFullYear()
  const monthIndex = month.value.getUTCMonth()
  const leadingDays = (month.value.getUTCDay() + 6) % 7
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const dayOffset = deliveryDateOffset(props.schedule.arrivalTime, props.localOffset)
  const exceptions = new Set(props.schedule.exceptions)
  return Array.from({ length: leadingDays + dayCount }, (_, index) => {
    const day = index - leadingDays + 1
    if (day < 1) return null
    const date = new Date(Date.UTC(year, monthIndex, day))
    const utcDay = deliveryScheduleDate(date, dayOffset)
    const utcDate = utcDay.toISOString().slice(0, 10)
    const weekday = deliveryWeekDays[(utcDay.getUTCDay() + 6) % 7]!
    const hasDelivery = props.schedule.days.includes(weekday)
    const status: DayStatus = exceptions.has(utcDate) ? 'exception' : hasDelivery ? 'delivery' : 'off'
    return { date, utcDate, status, actionable: status === 'exception' || (hasDelivery && utcDate >= todayUtc) }
  })
})
const selectedDay = computed(() => {
  const stamp = selectedDate.value?.getTime()
  return stamp === undefined ? undefined : cells.value.find(day => day?.date.getTime() === stamp)
})
</script>

<style scoped>
.calendar-toolbar, .calendar-legend, .day-details { display: flex; align-items: center; gap: 12px; }
.calendar-toolbar { justify-content: space-between; margin-bottom: 12px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.weekday { padding: 4px 0; text-align: center; font-size: .8em; color: var(--app-text-muted); }
.calendar-day {
  display: grid; justify-items: center; align-content: center; gap: 2px;
  min-height: 46px; border: 1px solid var(--app-border); border-radius: 6px;
  color: var(--el-text-color-regular); background: var(--app-surface); cursor: pointer;
}
.calendar-day:hover, .calendar-day[aria-pressed="true"] { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.calendar-day[aria-current="date"] { font-weight: 700; }
.calendar-day:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
.day-marker { min-height: 1em; line-height: 1; }
.delivery .day-marker, .calendar-legend .delivery { color: var(--el-color-success); }
.exception .day-marker, .calendar-legend .exception { color: var(--el-color-danger); }
.calendar-legend { margin-top: 14px; flex-wrap: wrap; }
.calendar-legend { font-size: .82em; }
.day-details { justify-content: space-between; flex-wrap: wrap; min-height: 52px; padding: 6px 10px; margin-bottom: 8px; border: 1px solid var(--app-border); border-radius: 6px; }
.day-hint { color: var(--app-text-muted); font-size: .9em; }
.day-details :deep(.el-button) { max-width: 100%; height: auto; min-height: 32px; white-space: normal; }
</style>
