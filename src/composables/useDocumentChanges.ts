import { onScopeDispose, ref, watch } from 'vue'
import { usePermissions } from './usePermissions'
import { useAuthStore } from '@/stores/authStore'
import { subscribeDocumentChanges, type DocumentKind, type DocumentChange } from '@/services/graphql/documentChanges'

export function useDocumentChanges(kind: DocumentKind, options: {
  active?: () => boolean
  changed(change: DocumentChange): void
  reconnected?(): void
}) {
  const auth = useAuthStore()
  const { hasPermission } = usePermissions()
  const unavailable = ref(false)
  let stop: (() => void) | undefined
  watch(() => [auth.sessionId, hasPermission(kind === 'sale' ? 'SALES_GET' : 'PURCHASE_GET') && (options.active?.() ?? true)] as const, ([sessionId, enabled]) => {
    stop?.()
    stop = undefined
    unavailable.value = false
    if (sessionId && enabled) stop = subscribeDocumentChanges(kind, sessionId, {
      changed: options.changed,
      reconnected: () => options.reconnected?.(),
      unavailable: value => { unavailable.value = value },
    })
  }, { immediate: true, flush: 'sync' })
  onScopeDispose(() => stop?.())
  return { unavailable }
}
