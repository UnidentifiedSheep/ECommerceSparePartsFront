export function productStockColor(stock: number): string {
  if (!Number.isFinite(stock) || stock <= 0) return '#b91c1c'
  const ratio = Math.min(1, Math.max(0, Math.log(stock) / Math.log(50)))
  const blue = [29, 78, 216]
  const green = [4, 120, 87]
  const channels = blue.map((start, index) => Math.round(start + (green[index]! - start) * ratio))
  return `rgb(${channels.join(', ')})`
}
