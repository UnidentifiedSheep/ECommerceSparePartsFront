export function importQuantity(value: unknown, allowZero = false): number | undefined {
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value).trim())) return undefined
  const count = Number(value)
  return Number.isInteger(count) && count >= (allowZero ? 0 : 1) && count <= 2147483647 ? count : undefined
}
export function importPriceCents(value: unknown, allowZero = false): number | undefined {
  if (!['string', 'number'].includes(typeof value) || !/^\d+(?:[.,]\d{1,2})?$/.test(String(value).trim())) return undefined
  const [whole = '', fraction = ''] = String(value).trim().replace(',', '.').split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents >= (allowZero ? 0 : 1) ? cents : undefined
}
