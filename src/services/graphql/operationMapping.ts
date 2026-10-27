import type { SaleFieldsFragment, PurchaseFieldsFragment, SaleContentFieldsFragment, PurchaseContentFieldsFragment, TransactionFieldsFragment } from '@/graphql/generated/graphql'
import { mapGqlUser, mapGqlOrganization } from './partyMapping'
import type { SaleModel, SaleContentModel } from '@/models/saleModel'
import type { PurchaseModel, PurchaseContentModel } from '@/models/purchaseModel'
import type { BalanceTransactionModel } from '@/services/api/balances'

export function modelEnum(value: string) {
  return value.toLowerCase().split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
}
export function mapSale(sale: SaleFieldsFragment): SaleModel {
  return { ...sale, buyer: mapGqlUser(sale.buyer), organization: mapGqlOrganization(sale.organization), storageCode: sale.storage.code, state: modelEnum(sale.state) as SaleModel['state'] }
}
export function mapPurchase(purchase: PurchaseFieldsFragment): PurchaseModel {
  return {
    ...purchase, supplier: mapGqlUser(purchase.supplier), supplierOrganization: mapGqlOrganization(purchase.supplierOrganization), storageCode: purchase.storage.code,
    logistics: purchase.logistics ? { ...purchase.logistics, pricingModel: modelEnum(purchase.logistics.pricingModel) as NonNullable<PurchaseModel['logistics']>['pricingModel'], routeType: modelEnum(purchase.logistics.routeType) as NonNullable<PurchaseModel['logistics']>['routeType'] } : null,
  }
}
export function mapSaleContent(content: SaleContentFieldsFragment): SaleContentModel {
  return { ...content, product: { id: content.product.id, sku: content.product.sku, name: content.product.name, producerName: content.product.producer.name } }
}
export function mapPurchaseContent(content: PurchaseContentFieldsFragment): PurchaseContentModel {
  return { ...content, product: { id: content.product.id, sku: content.product.sku, name: content.product.name, producerName: content.product.producer.name } }
}
export function mapTransaction(transaction: TransactionFieldsFragment): BalanceTransactionModel {
  return {
    ...transaction, sender: mapGqlOrganization(transaction.sender), receiver: mapGqlOrganization(transaction.receiver), currencyId: transaction.currency.id,
    type: ({ TRANSFER: 'Transfer', REFUND: 'Refund', FEE: 'Fee', ADJUSTMENT: 'Adjustment' } as const)[transaction.type],
    sourceType: ({ MANUAL: 'Manual', PURCHASE: 'Purchase', SALE: 'Sale', LOGISTIC: 'Logistic' } as const)[transaction.sourceType],
    status: (transaction.isCompleted ? 1 : 0) | (transaction.isReversed ? 4 : 0),
  }
}
