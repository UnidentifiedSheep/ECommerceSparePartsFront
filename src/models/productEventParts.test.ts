import { describe, expect, it } from 'vitest'
import { formatProductEventParts, parseProductEventParts, productEventParts } from './productEventParts.ts'

describe('product event parts', () => {
  it('round-trips every supported bitmask', () => {
    for (let mask = 1; mask <= 15; mask += 1) {
      const expected = productEventParts.filter((_, index) => (mask & (1 << index)) !== 0)
      expect(parseProductEventParts(mask)).toEqual(expected)
      expect(parseProductEventParts(String(mask))).toEqual(expected)
      expect(parseProductEventParts(formatProductEventParts(expected))).toEqual(expected)
    }
  })

  it('normalizes names and serializes selections in canonical order', () => {
    expect(parseProductEventParts(' weight, core, CORE ')).toEqual(['Core', 'Weight'])
    expect(formatProductEventParts(['Weight', 'Core'])).toBe('Core, Weight')
    expect(formatProductEventParts(productEventParts)).toBe('All')
    expect(parseProductEventParts('all')).toEqual(productEventParts)
  })

  it.each([0, 16, -1, 1.5, null, 'Unknown', 'Core, Unknown', ''])('rejects unsupported value %s', (value) => {
    expect(parseProductEventParts(value)).toEqual([])
  })
})
