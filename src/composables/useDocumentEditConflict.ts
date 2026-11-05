import { ref, watch } from 'vue'
import { useDocumentChanges } from './useDocumentChanges'
import type { DocumentKind } from '@/services/graphql/documentChanges'

export function useDocumentEditConflict(kind: DocumentKind, getId: () => string | undefined, saving: () => boolean) {
  const change = ref<'updated' | 'deleted'>()
  let revision = 0
  watch(getId, () => { change.value = undefined; ++revision }, { flush: 'sync' })
  useDocumentChanges(kind, {
    active: () => Boolean(getId()),
    changed: event => {
      if (event.id !== getId() || event.type === 'created' || change.value === 'deleted') return
      if (saving() && event.type !== 'deleted') return
      change.value = event.type
      ++revision
    },
    reconnected: () => { if (getId() && !saving()) { change.value ??= 'updated'; ++revision } },
  })
  return { change, version: () => revision, acknowledge: (version: number) => { if (revision === version) change.value = undefined } }
}
