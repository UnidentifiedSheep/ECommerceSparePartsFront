import { subscribeGraphql } from './subscriptions'
import { SaleCreatedDocument, SaleUpdatedDocument, SaleDeletedDocument, PurchaseCreatedDocument, PurchaseUpdatedDocument, PurchaseDeletedDocument } from '@/graphql/generated/graphql'
import { mapSale, mapPurchase } from './operationMapping'
import type { SaleModel } from '@/models/saleModel'
import type { PurchaseModel } from '@/models/purchaseModel'

export type DocumentKind = 'sale' | 'purchase'
export interface DocumentChange {
  id: string
  type: 'created' | 'updated' | 'deleted'
  sale?: SaleModel
  purchase?: PurchaseModel
}
export interface DocumentChangeListener {
  changed(change: DocumentChange): void
  reconnected(): void
  unavailable(value: boolean): void
}

// Share streams between the page, its editor and sale history within one session.
const channels = new Map<string, { listeners: Set<DocumentChangeListener>; unavailable: boolean; stop(): void }>()
export function subscribeDocumentChanges(kind: DocumentKind, sessionId: string, listener: DocumentChangeListener) {
  const key = `${sessionId}:${kind}`
  let channel = channels.get(key)
  if (!channel) {
    const listeners = new Set<DocumentChangeListener>([listener])
    const connected = new Set<number>()
    const previouslyConnected = new Set<number>()
    const broadcast = (fn: (listener: DocumentChangeListener) => void) => listeners.forEach(fn)
    let unavailable = false
    function availability(value: boolean) {
      unavailable = value
      const current = channels.get(key)
      if (current) current.unavailable = value
      broadcast(listener => listener.unavailable(value))
    }
    const callbacks = (index: number) => ({
      connected: () => {
        connected.add(index)
        if (connected.size === 3) availability(false)
        if (previouslyConnected.has(index)) broadcast(listener => listener.reconnected())
        previouslyConnected.add(index)
      },
      disconnected: () => {
        connected.delete(index)
        if (previouslyConnected.has(index)) availability(true)
      },
      error: () => availability(true),
    })
    const event = (change: DocumentChange) => broadcast(listener => listener.changed(change))
    const stops = kind === 'sale' ? [
      subscribeGraphql(SaleCreatedDocument, {}, { ...callbacks(0), next: data => event({ type: 'created', id: data.onSaleCreated.sale.id, sale: mapSale(data.onSaleCreated.sale) }) }),
      subscribeGraphql(SaleUpdatedDocument, {}, { ...callbacks(1), next: data => event({ type: 'updated', id: data.onSaleUpdated.sale.id, sale: mapSale(data.onSaleUpdated.sale) }) }),
      subscribeGraphql(SaleDeletedDocument, {}, { ...callbacks(2), next: data => event({ type: 'deleted', id: data.onSaleDeleted.sale.id, sale: mapSale(data.onSaleDeleted.sale) }) }),
    ] : [
      subscribeGraphql(PurchaseCreatedDocument, {}, { ...callbacks(0), next: data => event({ type: 'created', id: data.onPurchaseCreated.purchase.id, purchase: mapPurchase(data.onPurchaseCreated.purchase) }) }),
      subscribeGraphql(PurchaseUpdatedDocument, {}, { ...callbacks(1), next: data => event({ type: 'updated', id: data.onPurchaseUpdated.purchase.id, purchase: mapPurchase(data.onPurchaseUpdated.purchase) }) }),
      subscribeGraphql(PurchaseDeletedDocument, {}, { ...callbacks(2), next: data => event({ type: 'deleted', id: data.onPurchaseDeleted.purchaseId }) }),
    ]
    channel = { listeners, unavailable, stop: () => stops.forEach(stop => stop()) }
    channels.set(key, channel)
  } else { channel.listeners.add(listener); listener.unavailable(channel.unavailable) }
  const owner = channel
  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    owner.listeners.delete(listener)
    if (!owner.listeners.size) { owner.stop(); channels.delete(key) }
  }
}
