import type { DayOfWeek, Supplier } from '@/graphql/generated/graphql'
export const deliverySuppliers: Array<{ value: Supplier; label: string }> = [{ value: 'ARMTEK', label: 'Armtek' }, { value: 'FAVORIT_PARTS', label: 'Favorit Parts' }, { value: 'TMTR', label: 'Truck Motors' }]
export const deliveryWeekDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

// A recurring time has no date. Apply a fixed offset for the current view
// and wrap at midnight while preserving seconds and their fractional part.
export function shiftDeliveryTime(time: string, offsetMinutes: number): string {
  if (!time) return ''
  const [hours, minutes, seconds = '00'] = time.split(':')
  const minutesPerDay = 24 * 60
  const shifted = Number(hours) * 60 + Number(minutes) + offsetMinutes
  const localMinutes = ((shifted % minutesPerDay) + minutesPerDay) % minutesPerDay
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(localMinutes / 60))}:${pad(localMinutes % 60)}:${seconds}`
}

export function deliveryDateOffset(utcTime: string, offsetMinutes: number): number {
  const [hours, minutes] = utcTime.split(':').map(Number)
  return Math.floor(((hours ?? 0) * 60 + (minutes ?? 0) + offsetMinutes) / (24 * 60))
}

export function shiftDeliveryWeekdays(days: readonly DayOfWeek[], offsetDays: number): DayOfWeek[] {
  return deliveryWeekDays.filter((_, index) =>
    days.includes(deliveryWeekDays[(index - offsetDays + 7) % 7]!),
  )
}

export function deliveryScheduleDate(localDate: Date, dayOffset: number): Date {
  return new Date(Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate() - dayOffset))
}
