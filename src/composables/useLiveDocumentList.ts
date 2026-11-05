import { onScopeDispose, ref, type Ref } from 'vue'
import { useDocumentChanges } from './useDocumentChanges'
import type { DocumentChange, DocumentKind } from '@/services/graphql/documentChanges'

export function useLiveDocumentList<T extends { id: string }>(kind: DocumentKind, options: {
  rows: Ref<T[]>
  selected: Ref<T | undefined>
  canReload(): boolean
  reload(resetPage?: boolean): Promise<void>
  get(id: string): Promise<T>
  refreshSelected(row: T): Promise<unknown>
  removed(id: string): void
  keepDeleted?: () => boolean
  syncSelection(): Promise<void>
}) {
  const pending = ref(false)
  const updating = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  let disposed = false
  let resync = false
  const changes = new Map<string, DocumentChange>()
  function schedule() {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => { timer = undefined; void flush() }, 500)
  }
  const { unavailable } = useDocumentChanges(kind, {
    changed: change => { if (changes.get(change.id)?.type !== 'deleted') changes.set(change.id, change); schedule() },
    reconnected: () => { resync = true; schedule() },
  })
  async function flush() {
    if (disposed || running) return
    running = true
    updating.value = true
    const batch = [...changes.values()]
    changes.clear()
    const reconnect = resync
    resync = false
    const selectedId = options.selected.value?.id
    try {
      for (const change of batch.filter(change => change.type === 'deleted')) {
        if (!options.keepDeleted?.()) options.rows.value = options.rows.value.filter(row => row.id !== change.id)
        options.removed(change.id)
      }
      if (options.canReload()) {
        await options.reload()
        if (!disposed && selectedId && options.selected.value?.id === selectedId && (reconnect || batch.some(change => change.id === selectedId))) {
          await options.refreshSelected(options.selected.value)
        }
      } else {
        pending.value = true
        const ids = new Set(batch.filter(change => change.type !== 'created').map(change => change.id))
        if (reconnect) options.rows.value.forEach(row => ids.add(row.id))
        await Promise.allSettled([...ids].map(async id => {
          const row = options.rows.value.find(row => row.id === id)
          if (!row) return
          const updated = await options.get(id)
          if (disposed) return
          const index = options.rows.value.indexOf(row)
          if (index >= 0) options.rows.value.splice(index, 1, updated)
          if (options.selected.value?.id === id) await options.refreshSelected(updated)
        }))
      }
    } catch { if (!disposed) pending.value = true }
    finally {
      if (!disposed) await options.syncSelection()
      updating.value = false
      running = false
      if (!disposed && (changes.size || resync)) schedule()
    }
  }
  async function applyPending() {
    if (running) return
    running = true
    pending.value = false
    updating.value = true
    try {
      await options.reload(true)
      if (!disposed && options.selected.value) await options.refreshSelected(options.selected.value)
      if (!disposed) await options.syncSelection()
    } catch { pending.value = true }
    finally {
      updating.value = false
      running = false
      if (!disposed && (changes.size || resync)) schedule()
    }
  }
  onScopeDispose(() => { disposed = true; if (timer !== undefined) clearTimeout(timer) })
  return { pending, unavailable, applyPending, updating }
}
