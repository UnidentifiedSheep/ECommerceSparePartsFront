import { afterEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { subscribeGraphql } from './subscriptions'
import { subscribeDocumentChanges, type DocumentChangeListener } from './documentChanges'

vi.mock('./subscriptions', () => ({ subscribeGraphql: vi.fn(() => vi.fn()) }))
const stops: Array<() => void> = []
const listener = (): DocumentChangeListener => ({ changed: vi.fn(), reconnected: vi.fn(), unavailable: vi.fn() })
afterEach(() => { stops.splice(0).forEach(stop => stop()); vi.mocked(subscribeGraphql).mockClear() })

describe('shared document event streams', () => {
  it('shares three streams per session/domain and disposes after the final listener only', () => {
    const one = listener(); const two = listener()
    const a = subscribeDocumentChanges('sale', 'session', one)
    const b = subscribeDocumentChanges('sale', 'session', two)
    stops.push(a, b)
    expect(subscribeGraphql).toHaveBeenCalledTimes(3)
    const callbacks = vi.mocked(subscribeGraphql).mock.calls[1]![2]
    callbacks.next({ onSaleUpdated: { sale: { id: 'sale-1' } } } as never)
    expect(one.changed).toHaveBeenCalledWith({ id: 'sale-1', type: 'updated' })
    expect(two.changed).toHaveBeenCalledWith({ id: 'sale-1', type: 'updated' })
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
