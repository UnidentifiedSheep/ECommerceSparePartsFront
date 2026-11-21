import type {
  CharacteristicSortField, DocumentGenerationRequestSortField,
  OrganizationSortField, ProductGroupSortField, ProductPriceOptionSortField,
  ProductSortField, PurchaseSortField, SaleContentSortField, SaleSortField,
  SearchCatalogueCandidateSortField, SearchProductSortField, StorageContentSortField,
} from '@/graphql/generated/graphql'

// Registered fields in backend master bb6f8254. Keep Main and Search distinct.
export const sortFields = {
  Characteristic: ['ID', 'NAME', 'NORMALIZED_NAME'],
  DocumentGenerationRequest: ['REQUEST_ID', 'JOB_ID', 'REQUESTER_ID', 'DOCUMENT_SYSTEM_NAME', 'CREATED_AT', 'GENERATED_AT', 'EXPIRES_AT'],
  Organization: ['ID', 'NAME', 'SYSTEM_NAME', 'TYPE', 'APPROXIMATE_BALANCE'],
  ProductGroup: ['ID', 'NAME', 'NORMALIZED_NAME'],
  ProductPriceOption: ['SCORE'],
  Product: ['ID', 'SKU', 'NAME', 'PRODUCER_NAME', 'INDICATOR', 'POPULARITY', 'STOCK'],
  Purchase: ['DATE_TIME', 'TOTAL_SUM', 'ID'],
  SaleContent: ['SALE_CONTENT_ID', 'STORAGE_CODE', 'QUANTITY', 'ORIGINAL_PRICE', 'DISCOUNTED_PRICE', 'SALE_DATE', 'ORGANIZATION_MATCH'],
  Sale: ['DATE_TIME', 'TOTAL_SUM', 'ID'],
  SearchCatalogueCandidate: ['ID', 'SKU', 'PRODUCER_ID'],
  SearchProduct: ['ID', 'SKU', 'PRODUCER_ID', 'STOCK', 'LENGTH', 'WIDTH', 'HEIGHT', 'VOLUME', 'WEIGHT'],
  StorageContent: ['ID', 'PRODUCT_ID', 'STORAGE_CODE', 'COUNT', 'BUY_PRICE', 'PURCHASE_DATETIME', 'CURRENCY_ID', 'AVAILABLE_COUNT'],
} as const satisfies {
  Characteristic: readonly CharacteristicSortField[]; DocumentGenerationRequest: readonly DocumentGenerationRequestSortField[];
  Organization: readonly OrganizationSortField[]; ProductGroup: readonly ProductGroupSortField[];
  ProductPriceOption: readonly ProductPriceOptionSortField[]; Product: readonly ProductSortField[]; Purchase: readonly PurchaseSortField[];
  SaleContent: readonly SaleContentSortField[]; Sale: readonly SaleSortField[]; SearchCatalogueCandidate: readonly SearchCatalogueCandidateSortField[];
  SearchProduct: readonly SearchProductSortField[]; StorageContent: readonly StorageContentSortField[];
}
type SortEntity = keyof typeof sortFields
export interface SortExpression { field: string; isDescending: boolean; argument?: string | null }
type TypedSort<K extends SortEntity> = Omit<SortExpression, 'field'> & { field: typeof sortFields[K][number] }

export function gqlSort<K extends SortEntity>(entity: K, expressions?: readonly (string | SortExpression)[], storageCode?: string): TypedSort<K>[] | undefined {
  if (!expressions) return undefined
  return expressions.flatMap(expression => {
    const sort = typeof expression === 'string' ? {
      field: expression.replace(/^[+-]/, '').replace(/_(asc|desc)$/i, ''),
      isDescending: expression.startsWith('-') || /_desc$/i.test(expression),
    } : expression
    let name = sort.field.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
    if (entity === 'Product' && name === 'COUNT') name = 'STOCK' // Old saved cross sorting.
    const field = sortFields[entity].find(value => value === name)
    // Stale preferences and unsupported fields must not break the entire list.
    if (!field) return []
    const argument = field === 'STOCK' && (entity === 'Product' || entity === 'SearchProduct') ? storageCode?.trim() || sort.argument : sort.argument
    return [{ ...sort, field, ...(argument != null ? { argument } : {}) }]
  })
}
