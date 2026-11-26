import { describe, expect, it } from 'vitest'
import { shiftDeliveryTime } from './deliverySchedule'

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
