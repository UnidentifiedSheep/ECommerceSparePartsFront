import type { DayOfWeek, Supplier } from '@/graphql/generated/graphql'
export const deliverySuppliers: Array<{ value: Supplier; label: string }> = [{ value: 'ARMTEK', label: 'Armtek' }, { value: 'FAVORIT_PARTS', label: 'Favorit Parts' }, { value: 'TMTR', label: 'Truck Motors' }]
export const deliveryWeekDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
