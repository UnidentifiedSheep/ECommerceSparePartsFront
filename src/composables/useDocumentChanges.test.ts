import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, reactive, ref } from 'vue'
import { subscribeDocumentChanges } from '@/services/graphql/documentChanges'
import { useDocumentChanges } from './useDocumentChanges'

const auth = reactive({ sessionId: 'session-one' as string | null })
const allowed = ref(false)
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth }))
vi.mock('./usePermissions', () => ({ usePermissions: () => ({ hasPermission: () => allowed.value }) }))
vi.mock('@/services/graphql/documentChanges', () => ({ subscribeDocumentChanges: vi.fn(() => vi.fn()) }))
const scopes: ReturnType<typeof effectScope>[] = []
beforeEach(() => { auth.sessionId = 'session-one'; allowed.value = false; vi.mocked(subscribeDocumentChanges).mockClear() })
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

describe('document subscription lifecycle', () => {
  it('requires read permission and an active surface; releases subscriptions on close and disposal', () => {
    const scope = effectScope(); scopes.push(scope)
    const active = ref(false)
    scope.run(() => useDocumentChanges('sale', { active: () => active.value, changed: vi.fn() }))
    active.value = true
    expect(subscribeDocumentChanges).not.toHaveBeenCalled()
    allowed.value = true
    expect(subscribeDocumentChanges).toHaveBeenCalledTimes(1)
    active.value = false
    expect(vi.mocked(subscribeDocumentChanges).mock.results[0]!.value).toHaveBeenCalledOnce()
    active.value = true
    scope.stop()
    expect(vi.mocked(subscribeDocumentChanges).mock.results[1]!.value).toHaveBeenCalledOnce()
  })

  it('replaces the listener on account/session changes and stops on permission loss', () => {
    allowed.value = true
    const scope = effectScope(); scopes.push(scope)
    scope.run(() => useDocumentChanges('purchase', { changed: vi.fn() }))
    auth.sessionId = 'session-two'
    expect(vi.mocked(subscribeDocumentChanges).mock.results[0]!.value).toHaveBeenCalledOnce()
    expect(vi.mocked(subscribeDocumentChanges).mock.calls[1]?.slice(0, 2)).toEqual(['purchase', 'session-two'])
    allowed.value = false
    expect(vi.mocked(subscribeDocumentChanges).mock.results[1]!.value).toHaveBeenCalledOnce()
  })
})
