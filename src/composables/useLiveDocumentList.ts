import { onScopeDispose, ref, type Ref } from 'vue'
import { useDocumentChanges } from './useDocumentChanges'
import type { DocumentChange, DocumentKind } from '@/services/graphql/documentChanges'

export function useLiveDocumentList<T extends { id: string }>(kind: DocumentKind, options: {
  rows: Ref<T[]>
  selected: Ref<T | undefined>
  canReload(): boolean
  reload(resetPage?: boolean): Promise<void>
  document(change: DocumentChange): T | undefined
  requiresReload(previous: T, updated: T): boolean
  accepts?: (updated: T, previous: T) => boolean
  // Only used after reconnect, when events missed during the gap have no payload.
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
    changed: change => {
      const queued = changes.get(change.id)
      if (queued?.type === 'deleted') return
      const previous = queued && options.document(queued)
      const updated = options.document(change)
      if (previous && updated && options.accepts && !options.accepts(updated, previous)) return
      changes.set(change.id, change)
      schedule()
    },
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
      let needsReload = reconnect
      let selectedChanged = reconnect
      for (const change of batch) {
        const previous = options.rows.value.find(row => row.id === change.id)
        const updated = options.document(change)
        if (previous && updated && options.accepts && !options.accepts(updated, previous)) continue
        if (change.type === 'deleted') {
          if (!options.keepDeleted?.()) options.rows.value = options.rows.value.filter(row => row.id !== change.id)
          options.removed(change.id)
        }
        needsReload ||= change.type !== 'updated' || !previous || !updated || options.requiresReload(previous, updated)
        if (updated && (change.type !== 'deleted' || options.keepDeleted?.())) {
          const index = options.rows.value.findIndex(row => row.id === change.id)
          if (index >= 0) options.rows.value.splice(index, 1, updated)
          if (options.selected.value?.id === change.id) options.selected.value = updated
        }
        selectedChanged ||= change.id === selectedId
      }
      const reloadList = needsReload && options.canReload()
      if (reloadList) {
        await options.reload()
      } else if (needsReload) {
        pending.value = true
      }
      if (reconnect && !reloadList) {
        await Promise.allSettled(options.rows.value.map(async row => {
          const updated = await options.get(row.id)
          if (disposed) return
          const index = options.rows.value.indexOf(row)
          if (index < 0 || (options.accepts && !options.accepts(updated, row))) return
          options.rows.value.splice(index, 1, updated)
          if (options.selected.value?.id === row.id) options.selected.value = updated
        }))
      }
      if (!disposed && selectedId && options.selected.value?.id === selectedId && selectedChanged) await options.refreshSelected(options.selected.value)
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
