export interface SaleCreationValidationInput {
  buyerSelected: boolean
  buyerMemberSelected: boolean
  currencyId?: number
  storageCode?: string
  date?: string | null
  stockLoading: boolean
  stockLoadFailed: boolean
  importing: boolean
  items: Array<{
    productId?: number
    count?: number
    available: number
    price?: number
    discountedPrice?: number
  }>
}

export type SaleCreationIssueCode = 'buyer' | 'buyerMember' | 'currency' | 'storage' | 'date' | 'items' | 'stockLoading' | 'stockLoadFailed' | 'importing' | 'product' | 'count' | 'stock' | 'price' | 'discount'
export interface SaleCreationIssue { code: SaleCreationIssueCode; position?: number }

export function saleCreationIssue(input: SaleCreationValidationInput): SaleCreationIssue | undefined {
  if (!input.buyerSelected) return { code: 'buyer' }
  if (!input.buyerMemberSelected) return { code: 'buyerMember' }
  if (!input.storageCode?.trim()) return { code: 'storage' }
  if (!Number.isSafeInteger(input.currencyId) || input.currencyId! <= 0) return { code: 'currency' }
  if (!input.date || !Number.isFinite(new Date(input.date).getTime())) return { code: 'date' }
  if (!input.items.length) return { code: 'items' }
  if (input.importing) return { code: 'importing' }
  if (input.stockLoading) return { code: 'stockLoading' }
  if (input.stockLoadFailed) return { code: 'stockLoadFailed' }
  const invalidCount = input.items.findIndex(item => !Number.isSafeInteger(item.count) || item.count! <= 0)
  if (invalidCount >= 0) return { code: 'count', position: invalidCount + 1 }
  for (const [index, item] of input.items.entries()) {
    const position = index + 1
    if (!item.productId || item.productId <= 0) return { code: 'product', position }
    if (!Number.isFinite(item.available) || item.count! > item.available) return { code: 'stock', position }
    if (item.price == null || !Number.isFinite(item.price) || item.price <= 0) return { code: 'price', position }
    const effectivePrice = item.discountedPrice ?? item.price
    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0 || effectivePrice > item.price) return { code: 'discount', position }
  }
}
