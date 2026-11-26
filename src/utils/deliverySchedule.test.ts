import { describe, expect, it } from 'vitest'
import { deliveryDateOffset, deliveryScheduleDate, shiftDeliveryTime, shiftDeliveryWeekdays } from './deliverySchedule'

describe('delivery schedule clock time', () => {
  it.each([
    { utc: '22:15:30', offset: 180, local: '01:15:30' },
    { utc: '02:00:00', offset: -300, local: '21:00:00' },
    { utc: '20:45:01.1234567', offset: 330, local: '02:15:01.1234567' },
  ])('round-trips $utc UTC at offset $offset minutes', ({ utc, offset, local }) => {
    expect(shiftDeliveryTime(utc, offset)).toBe(local)
    expect(shiftDeliveryTime(local, -offset)).toBe(utc)
  })
})

describe('local delivery calendar', () => {
  it('maps a local Friday at the start of a month to the previous UTC day', () => {
    const dayOffset = deliveryDateOffset('22:00:00', 180)
    const localDate = new Date('2027-01-01T00:00:00Z')
    expect(shiftDeliveryWeekdays(['THURSDAY'], dayOffset)).toEqual(['FRIDAY'])
    expect(shiftDeliveryWeekdays(['FRIDAY'], -dayOffset)).toEqual(['THURSDAY'])
    expect(deliveryScheduleDate(localDate, dayOffset).toISOString()).toBe('2026-12-31T00:00:00.000Z')
  })

  it('maps a local Sunday to the next UTC day for a negative offset', () => {
    const dayOffset = deliveryDateOffset('02:00:00', -300)
    expect(shiftDeliveryWeekdays(['MONDAY'], dayOffset)).toEqual(['SUNDAY'])
    expect(deliveryScheduleDate(new Date('2026-11-29T00:00:00Z'), dayOffset).toISOString()).toBe('2026-11-30T00:00:00.000Z')
  })
})
