import { afterEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { subscribeGraphql } from './subscriptions'
import { subscribeDocumentChanges, type DocumentChangeListener } from './documentChanges'

vi.mock('./subscriptions', () => ({ subscribeGraphql: vi.fn(() => vi.fn()) }))
const stops: Array<() => void> = []
const listener = (): DocumentChangeListener => ({ changed: vi.fn(), reconnected: vi.fn(), unavailable: vi.fn() })
const user = { id: 'user-1', userName: 'alice', info: { name: 'Alice', surname: 'Smith', description: null } }
const organization = { id: 'org-1', type: 'BUSINESS', name: 'ACME', systemName: 'acme', isHidden: false, owner: user }
const currency = { id: 1, code: 'RUB', currencySign: '₽' }
const sale = { id: 'sale-1', buyer: user, organization, currency, storage: { code: 'MAIN' }, saleDatetime: '2026-11-05T08:00:00Z', totalSum: 1234, rowVersion: 7, state: 'COMPLETED' }
afterEach(() => { stops.splice(0).forEach(stop => stop()); vi.mocked(subscribeGraphql).mockClear() })

describe('shared document event streams', () => {
  it('shares three streams per session/domain and disposes after the final listener only', () => {
    const one = listener(); const two = listener()
    const a = subscribeDocumentChanges('sale', 'session', one)
    const b = subscribeDocumentChanges('sale', 'session', two)
    stops.push(a, b)
    expect(subscribeGraphql).toHaveBeenCalledTimes(3)
    const callbacks = vi.mocked(subscribeGraphql).mock.calls[1]![2]
    callbacks.next({ onSaleUpdated: { sale } } as never)
    expect(one.changed).toHaveBeenCalledWith(expect.objectContaining({ id: 'sale-1', type: 'updated', sale: expect.objectContaining({ totalSum: 1234, rowVersion: 7, state: 'Completed', storageCode: 'MAIN' }) }))
    expect(two.changed).toHaveBeenCalledWith(expect.objectContaining({ sale: expect.objectContaining({ totalSum: 1234 }) }))
    const selection = print(vi.mocked(subscribeGraphql).mock.calls[1]![0])
    expect(selection).toContain('totalSum')
    expect(selection).toContain('rowVersion')
    expect(selection).not.toContain('contents')
    a()
    for (const result of vi.mocked(subscribeGraphql).mock.results) expect(result.value).not.toHaveBeenCalled()
    b()
    for (const result of vi.mocked(subscribeGraphql).mock.results) expect(result.value).toHaveBeenCalledTimes(1)
    a(); b()
    for (const result of vi.mocked(subscribeGraphql).mock.results) expect(result.value).toHaveBeenCalledTimes(1)
  })

  it('uses purchaseId on purchase deletion, requests identifiers only and separates sessions', () => {
    const one = listener(); const two = listener()
    stops.push(subscribeDocumentChanges('purchase', 'one', one), subscribeDocumentChanges('purchase', 'two', two))
    expect(subscribeGraphql).toHaveBeenCalledTimes(6)
    const call = vi.mocked(subscribeGraphql).mock.calls[2]!
    expect(print(call[0])).toContain('purchaseId')
    expect(print(call[0])).not.toContain('contents')
    call[2].next({ onPurchaseDeleted: { purchaseId: 'purchase-1' } } as never)
    expect(one.changed).toHaveBeenCalledWith({ id: 'purchase-1', type: 'deleted' })
    expect(two.changed).not.toHaveBeenCalled()
  })

  it('maps purchase row fields and a soft-deleted sale directly from subscription payloads', () => {
    const purchases = listener(); const sales = listener()
    stops.push(subscribeDocumentChanges('purchase', 'one', purchases), subscribeDocumentChanges('sale', 'one', sales))
    const purchase = { id: 'purchase-1', supplier: user, supplierOrganization: organization, currency, storage: { code: 'MAIN' }, totalSum: 500, purchaseDatetime: sale.saleDatetime, logistics: null }
    vi.mocked(subscribeGraphql).mock.calls[1]![2].next({ onPurchaseUpdated: { purchase } } as never)
    expect(purchases.changed).toHaveBeenCalledWith(expect.objectContaining({ purchase: expect.objectContaining({ totalSum: 500, storageCode: 'MAIN', supplierOrganization: expect.objectContaining({ type: 'Business' }) }) }))
    vi.mocked(subscribeGraphql).mock.calls[5]![2].next({ onSaleDeleted: { sale: { ...sale, state: 'DELETED', rowVersion: 8 } } } as never)
    expect(sales.changed).toHaveBeenCalledWith(expect.objectContaining({ type: 'deleted', sale: expect.objectContaining({ state: 'Deleted', rowVersion: 8 }) }))
  })

  it('resyncs on reconnection, reports unavailable streams and shares their state with late listeners', () => {
    const one = listener()
    stops.push(subscribeDocumentChanges('sale', 'one', one))
    const streams = vi.mocked(subscribeGraphql).mock.calls.map(call => call[2])
    streams.forEach(stream => stream.connected())
    expect(one.reconnected).not.toHaveBeenCalled()
    streams[0]!.disconnected()
    expect(one.unavailable).toHaveBeenLastCalledWith(true)
    const late = listener()
    stops.push(subscribeDocumentChanges('sale', 'one', late))
    expect(late.unavailable).toHaveBeenCalledWith(true)
    streams[0]!.connected()
    expect(one.reconnected).toHaveBeenCalledOnce()
    expect(late.reconnected).toHaveBeenCalledOnce()
    expect(one.unavailable).toHaveBeenLastCalledWith(false)
  })
})
