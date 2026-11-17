export interface QueryTextSegment { text: string; highlighted: boolean }

function searchableText(text: string, sku: boolean) {
  let value = ''
  const starts: number[] = []
  const ends: number[] = []
  let offset = 0
  for (const character of text) {
    const start = offset
    offset += character.length
    // Match the backend SKU normalization; punctuation remains in the displayed text.
    if (sku && !/[a-zA-Z0-9а-яА-Я]/.test(character)) continue
    const folded = character.toLowerCase()
    value += folded
    for (let index = 0; index < folded.length; index++) { starts.push(start); ends.push(offset) }
  }
  return { value, starts, ends }
}

export function queryTextSegments(text: string, query?: string, sku = false): QueryTextSegment[] {
  const term = searchableText(query?.trim() ?? '', sku).value
  if (!term) return [{ text, highlighted: false }]
  const source = searchableText(text, sku)
  const ranges: Array<{ start: number; end: number }> = []
  for (let from = 0; from < source.value.length;) {
    const index = source.value.indexOf(term, from)
    if (index < 0) break
    const start = source.starts[index]!
    const end = source.ends[index + term.length - 1]!
    const previous = ranges[ranges.length - 1]
    if (previous && start <= previous.end) previous.end = Math.max(previous.end, end)
    else ranges.push({ start, end })
    from = index + 1
  }
  const result: QueryTextSegment[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start > cursor) result.push({ text: text.slice(cursor, range.start), highlighted: false })
    result.push({ text: text.slice(range.start, range.end), highlighted: true })
    cursor = range.end
  }
  if (cursor < text.length || !result.length) result.push({ text: text.slice(cursor), highlighted: false })
  return result
}

export function queryMatchPreview(text: string | null | undefined, query?: string, context = 40): string | undefined {
  if (!text) return
  const segments = queryTextSegments(text, query)
  const matchIndex = segments.findIndex(segment => segment.highlighted)
  if (matchIndex < 0) return
  const start = segments.slice(0, matchIndex).reduce((sum, segment) => sum + segment.text.length, 0)
  const from = Math.max(0, start - context)
  const to = Math.min(text.length, start + segments[matchIndex]!.text.length + context)
  return `${from ? '…' : ''}${text.slice(from, to)}${to < text.length ? '…' : ''}`
}
