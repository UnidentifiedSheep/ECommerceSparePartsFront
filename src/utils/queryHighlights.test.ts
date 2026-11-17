import { describe, expect, it } from 'vitest'
import { queryMatchPreview, queryTextSegments } from './queryHighlights'

const matches = (text: string, query?: string, sku = false) => queryTextSegments(text, query, sku).filter(segment => segment.highlighted).map(segment => segment.text)

describe('document search highlights', () => {
  it('matches the complete literal phrase without case sensitivity', () => {
    expect(matches('Фильтр для MAN; фильтр ДЛЯ DAF', ' ФИЛЬТР для ')).toEqual(['Фильтр для', 'фильтр ДЛЯ'])
    expect(matches('Фильтр воздушный для MAN', 'фильтр для')).toEqual([])
  })

  it('maps normalized SKU matches back to the original separators', () => {
    expect(matches('AB-12.34/XX', 'ab1234', true)).toEqual(['AB-12.34'])
    expect(matches('АБ 12-34', 'аб-1234', true)).toEqual(['АБ 12-34'])
    expect(matches('Фильтр AB-12.34', 'ab1234')).toEqual([])
  })

  it('treats regex, HTML and highlight-marker characters as plain text', () => {
    for (const term of ['[x]', '.*', '<img>', '[[[']) expect(matches(`before ${term} after`, term)).toEqual([term])
  })

  it('merges overlapping occurrences and preserves all original characters', () => {
    expect(matches('banana', 'ana')).toEqual(['anana'])
    const text = '🙂İZ [деталь] AB-123'
    const segments = queryTextSegments(text, 'iz')
    expect(segments.map(segment => segment.text).join('')).toBe(text)
    expect(queryTextSegments(text, 'деталь').map(segment => segment.text).join('')).toBe(text)
  })

  it.each([undefined, '', '   '])('removes highlights when the query is %s', query => {
    expect(queryTextSegments('AB-123', query, true)).toEqual([{ text: 'AB-123', highlighted: false }])
    expect(queryMatchPreview('comment', query)).toBeUndefined()
  })

  it('does not turn punctuation-only SKU searches into matches', () => {
    expect(matches('AB-123', '--', true)).toEqual([])
  })

  it('shows context around a match deep inside a long comment', () => {
    const text = `${'a'.repeat(100)} needle ${'b'.repeat(100)}`
    const preview = queryMatchPreview(text, 'needle', 10)!
    expect(preview.startsWith('…')).toBe(true)
    expect(preview.endsWith('…')).toBe(true)
    expect(preview).toContain('needle')
    expect(preview.length).toBeLessThan(40)
    expect(queryMatchPreview(text, 'missing')).toBeUndefined()
  })
})
