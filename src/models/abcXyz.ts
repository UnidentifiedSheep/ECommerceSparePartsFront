export const abcClasses = ['A', 'B', 'C'] as const
export const xyzClasses = ['X', 'Y', 'Z'] as const
export type AbcClass = typeof abcClasses[number]
export type XyzClass = typeof xyzClasses[number]
export type XyzFilter = XyzClass | 'Unclassified'
export const demandPatterns = ['Smooth', 'Erratic', 'Intermittent', 'Lumpy'] as const
export type DemandPattern = typeof demandPatterns[number]
export type PatternFilter = DemandPattern | 'Unclassified'
export interface AbcPatternCell { abc: AbcClass; pattern: DemandPattern | null; productsCount: number; value: number }
export interface AbcXyzCell { abc: AbcClass; xyz: XyzClass | null; productsCount: number; value: number }
export interface AbcXyzSummary { productsCount: number; periodsCount: number; totalValue: number; cells: AbcXyzCell[]; patternCells?: AbcPatternCell[] | null }
export interface AbcXyzPoint {
  productId: number; rank: number; value: number; share: number; cumulativeShare: number
  abc: AbcClass; xyz: XyzClass | null; quantity: number; revenue: number; coefficientOfVariation: number | null; periodsCount: number
  demandPattern?: DemandPattern | null; adi?: number | null; cv2?: number | null
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid analytics object')
  return value as Record<string, unknown>
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid analytics number')
  return value
}
function integer(value: unknown): number {
  const result = number(value)
  if (!Number.isInteger(result) || result < 0) throw new Error('Invalid analytics integer')
  return result
}
function abc(value: unknown): AbcClass {
  if (!abcClasses.includes(value as AbcClass)) throw new Error('Invalid ABC class')
  return value as AbcClass
}
function xyz(value: unknown): XyzClass | null {
  if (value == null) return null
  if (!xyzClasses.includes(value as XyzClass)) throw new Error('Invalid XYZ class')
  return value as XyzClass
}
function pattern(value: unknown): DemandPattern | null {
  if (value == null) return null
  if (!demandPatterns.includes(value as DemandPattern)) throw new Error('Invalid demand pattern')
  return value as DemandPattern
}
export function parseAbcXyzSummary(value: unknown): AbcXyzSummary {
  const data = record(value)
  if (!Array.isArray(data.cells)) throw new Error('Invalid analytics cells')
  if (data.patternCells != null && !Array.isArray(data.patternCells)) throw new Error('Invalid analytics pattern cells')
  return {
    productsCount: integer(data.productsCount), periodsCount: integer(data.periodsCount), totalValue: number(data.totalValue),
    cells: data.cells.map(value => { const cell = record(value); return { abc: abc(cell.abc), xyz: xyz(cell.xyz), productsCount: integer(cell.productsCount), value: number(cell.value) } }),
    patternCells: data.patternCells == null ? null : data.patternCells.map(value => { const cell = record(value); return { abc: abc(cell.abc), pattern: pattern(cell.pattern), productsCount: integer(cell.productsCount), value: number(cell.value) } }),
  }
}
export function parseAbcXyzPoint(value: unknown): AbcXyzPoint {
  const data = record(value)
  return {
    productId: integer(data.productId), rank: integer(data.rank), value: number(data.value), share: number(data.share), cumulativeShare: number(data.cumulativeShare),
    abc: abc(data.abc), xyz: xyz(data.xyz), quantity: number(data.quantity), revenue: number(data.revenue),
    coefficientOfVariation: data.coefficientOfVariation == null ? null : number(data.coefficientOfVariation), periodsCount: integer(data.periodsCount),
    demandPattern: pattern(data.demandPattern), adi: data.adi == null ? null : number(data.adi), cv2: data.cv2 == null ? null : number(data.cv2),
  }
}
export function analyticsParameters(value: unknown) { return record(value) }
