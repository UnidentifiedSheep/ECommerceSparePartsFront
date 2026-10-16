export const productEventParts = ['Core', 'Characteristics', 'Dimensions', 'Weight'] as const

export type ProductEventPart = (typeof productEventParts)[number]

export function parseProductEventParts(value: unknown): ProductEventPart[] {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.trim()))) {
    const mask = Number(value)
    if (!Number.isInteger(mask) || mask < 1 || mask > 15) return []
    return productEventParts.filter((_, index) => (mask & (1 << index)) !== 0)
  }

  if (typeof value !== 'string') return []
  if (value.trim().toLowerCase() === 'all') return [...productEventParts]

  const names = value.split(',').map((part) => part.trim().toLowerCase())
  if (names.length === 0 || names.some((name) => !productEventParts.some((part) => part.toLowerCase() === name))) return []
  return productEventParts.filter((part) => names.includes(part.toLowerCase()))
}

export function formatProductEventParts(selected: readonly ProductEventPart[]): string {
  const parts = productEventParts.filter((part) => selected.includes(part))
  return parts.length === productEventParts.length ? 'All' : parts.join(', ')
}
