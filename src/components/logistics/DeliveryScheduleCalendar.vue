<template>
  <section class="schedule-calendar" :aria-label="t('deliverySchedules.calendar')">
    <div class="calendar-toolbar">
      <div class="month-nav">
        <el-button :icon="ArrowLeft" :aria-label="t('deliverySchedules.previousMonth')" @click="moveMonth(-1)" />
        <strong aria-live="polite">{{ formatMonth(month) }}</strong>
        <el-button :icon="ArrowRight" :aria-label="t('deliverySchedules.nextMonth')" @click="moveMonth(1)" />
      </div>
      <el-button size="small" @click="goToToday">{{ t('deliverySchedules.today') }}</el-button>
    </div>

    <div class="calendar-grid">
      <span v-for="day in deliveryWeekDays" :key="day" class="weekday">{{ t(`deliverySchedules.week.${day}`) }}</span>
      <template v-for="(day, index) in cells" :key="day?.date ?? `empty-${index}`">
        <span v-if="!day" aria-hidden="true" />
        <button
          v-else
          type="button"
          class="calendar-day"
          :class="[day.status, { 'calendar-day--past': day.date < today }]"
          :aria-label="`${formatDate(day.date)} · ${statusLabel(day.status)}`"
          :aria-pressed="selectedDate?.getTime() === day.date.getTime()"
          :aria-current="day.date.getTime() === today.getTime() ? 'date' : undefined"
          aria-haspopup="dialog"
          :aria-expanded="selectedDate?.getTime() === day.date.getTime()"
          @click="selectDay(day.date, $event)"
        >
          <span class="day-number">{{ day.date.getUTCDate() }}</span>
          <span v-if="day.status !== 'off'" class="day-chip" aria-hidden="true">
            <template v-if="day.status === 'delivery'">{{ arrivalLabel }}</template>
            <template v-else>
              <el-icon><Close /></el-icon>
              <span class="exception-text">{{ statusLabel(day.status) }}</span>
            </template>
          </span>
        </button>
      </template>
    </div>

    <el-popover
      :visible="!!selectedDay"
      :virtual-ref="anchor"
      virtual-triggering
      placement="right-start"
      :width="224"
      :persistent="false"
    >
      <div v-if="selectedDay" ref="dayDetails" class="day-details" role="dialog" :aria-label="formatDate(selectedDay.date)">
        <strong>{{ formatDate(selectedDay.date) }}<template v-if="selectedDay.status === 'delivery'"> · {{ arrivalLabel }}</template></strong>
        <span class="day-status" aria-live="polite">{{ statusLabel(selectedDay.status) }}</span>
        <el-button
          v-if="canEdit && selectedDay.actionable"
          :type="selectedDay.status === 'exception' ? 'primary' : 'danger'"
          link
          :loading="busy"
          @click="emit('changeException', selectedDay.utcDate, selectedDay.status !== 'exception')"
        >
          {{ t(selectedDay.status === 'exception' ? 'deliverySchedules.restoreDelivery' : 'deliverySchedules.cancelDeliveryShort') }}
        </el-button>
        <span v-else-if="selectedDay.status !== 'off'" class="day-hint">
          {{ t(canEdit ? 'deliverySchedules.pastDelivery' : 'deliverySchedules.readOnlyCalendar') }}
        </span>
      </div>
    </el-popover>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ArrowLeft, ArrowRight, Close } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'
import type { DeliverySchedule } from '@/services/api/deliverySchedules'
import { deliveryDateOffset, deliveryScheduleDate, deliveryWeekDays, shiftDeliveryTime } from '@/utils/deliverySchedule'

type DayStatus = 'delivery' | 'exception' | 'off'
const props = defineProps<{ schedule: DeliverySchedule; canEdit: boolean; busy: boolean; localOffset: number }>()
const emit = defineEmits<{ changeException: [date: string, add: boolean] }>()
const { t, locale } = useI18n()
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
const anchor = ref<HTMLElement>()
const dayDetails = ref<HTMLElement>()
const arrivalLabel = computed(() => {
  const time = shiftDeliveryTime(props.schedule.arrivalTime, props.localOffset).slice(0, 8)
  return time.endsWith(':00') ? time.slice(0, 5) : time
})

function closeDay(restoreFocus = false) {
  if (restoreFocus) anchor.value?.focus()
  selectedDate.value = undefined
  anchor.value = undefined
}

onClickOutside(dayDetails, () => closeDay(), { ignore: [anchor] })
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !selectedDate.value) return
  event.preventDefault()
  closeDay(true)
})

async function selectDay(date: Date, event: MouseEvent) {
  if (selectedDate.value?.getTime() === date.getTime()) {
    closeDay()
    return
  }
  anchor.value = event.currentTarget as HTMLElement
  selectedDate.value = date
  if (event.detail === 0) {
    await nextTick()
    dayDetails.value?.querySelector('button')?.focus()
  }
}

function goToToday() {
  const date = new Date()
  month.value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1))
  closeDay()
}
const formatDate = (date: Date) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
const formatMonth = (date: Date) => new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(date)

function moveMonth(step: number) {
  month.value = new Date(Date.UTC(month.value.getUTCFullYear(), month.value.getUTCMonth() + step, 1))
  closeDay()
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
.calendar-toolbar, .month-nav { display: flex; align-items: center; gap: 8px; }
.calendar-toolbar { justify-content: center; flex-wrap: wrap; margin-block: 8px 12px; }
.month-nav { gap: 12px; }
.month-nav strong { min-width: 9em; text-align: center; }
.month-nav .el-button { width: 28px; height: 28px; padding: 0; margin: 0; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.weekday { padding: 4px 6px 8px; font-size: .82em; color: var(--app-text-muted); }
.calendar-grid > span[aria-hidden="true"], .calendar-day { border-top: 1px solid var(--app-border); }
.calendar-day {
  display: flex; flex-direction: column; gap: 3px; align-items: flex-start; min-width: 0;
  min-height: 43px; padding: 4px 6px; border-radius: 0; line-height: 1.2;
  color: var(--el-text-color-regular); background: transparent; cursor: pointer;
}
.calendar-day:hover, .calendar-day[aria-pressed="true"] { background: var(--el-color-primary-light-9); }
.calendar-day[aria-pressed="true"] { box-shadow: inset 0 0 0 1px var(--el-color-primary); border-radius: 4px; }
.calendar-day[aria-current="date"] .day-number { font-weight: 750; color: var(--el-color-primary); }
.calendar-day:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
.calendar-day--past:not([aria-pressed="true"]) { opacity: .67; }
.day-chip {
  display: inline-flex; align-items: center; gap: 2px; max-width: 100%;
  border-radius: 4px; padding: 2px 4px; white-space: nowrap; font-size: .76em;
  background: var(--el-color-success-light-9); color: var(--el-color-success-dark-2);
}
.exception .day-chip { color: var(--el-color-danger-dark-2); background: var(--el-color-danger-light-9); }
.exception-text { overflow: hidden; text-overflow: ellipsis; }
.day-details { display: grid; gap: 4px; }
.day-details .el-button { justify-self: start; min-height: 24px; margin: 0; }
.day-status, .day-hint { color: var(--app-text-muted); font-size: .85em; }
@media (max-width: 580px) {
  .calendar-day { padding-inline: 3px; }
  .day-chip { padding-inline: 2px; }
  .exception-text { display: none; }
}
</style>
