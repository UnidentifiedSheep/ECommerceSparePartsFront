import { subscribeGraphql } from './subscriptions'
import { SaleCreatedDocument, SaleUpdatedDocument, SaleDeletedDocument, PurchaseCreatedDocument, PurchaseUpdatedDocument, PurchaseDeletedDocument } from '@/graphql/generated/graphql'

export type DocumentKind = 'sale' | 'purchase'
export interface DocumentChange { id: string; type: 'created' | 'updated' | 'deleted' }
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
    const event = (type: DocumentChange['type'], id: string) => broadcast(listener => listener.changed({ type, id }))
    const stops = kind === 'sale' ? [
      subscribeGraphql(SaleCreatedDocument, {}, { ...callbacks(0), next: data => event('created', data.onSaleCreated.sale.id) }),
      subscribeGraphql(SaleUpdatedDocument, {}, { ...callbacks(1), next: data => event('updated', data.onSaleUpdated.sale.id) }),
      subscribeGraphql(SaleDeletedDocument, {}, { ...callbacks(2), next: data => event('deleted', data.onSaleDeleted.sale.id) }),
    ] : [
      subscribeGraphql(PurchaseCreatedDocument, {}, { ...callbacks(0), next: data => event('created', data.onPurchaseCreated.purchase.id) }),
      subscribeGraphql(PurchaseUpdatedDocument, {}, { ...callbacks(1), next: data => event('updated', data.onPurchaseUpdated.purchase.id) }),
      subscribeGraphql(PurchaseDeletedDocument, {}, { ...callbacks(2), next: data => event('deleted', data.onPurchaseDeleted.purchaseId) }),
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
