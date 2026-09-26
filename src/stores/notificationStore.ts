import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { listNotifications, seeNotifications, subscribeNotifications, type AppNotification } from '@/services/graphql/notifications.ts'
import { t } from '@/i18n'

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  const loading = ref(false)
  const connected = ref(false)
  const error = ref('')
  const hasMore = ref(true)
  const seeingIds = ref<number[]>([])
  const unreadCount = computed(() => items.value.filter((item) => !item.seenAt).length)
  let userId: string | undefined
  let generation = 0
  let cursor: string | null = null
  let initialized = false
  let stopSubscription: (() => void) | undefined
  let refreshPending = false
  let readBatchTimer: ReturnType<typeof setTimeout> | undefined
  let sendingReadBatch = false
  const queuedReadIds = new Set<number>()
  const pendingReads = new Map<number, {
    promise: Promise<void>
    resolve(): void
    reject(cause: unknown): void
  }>()

  function scheduleReadBatch() {
    if (readBatchTimer !== undefined) return
    readBatchTimer = setTimeout(() => {
      readBatchTimer = undefined
      void flushReadBatch()
    }, 500)
  }

  async function flushReadBatch() {
    if (sendingReadBatch || !queuedReadIds.size) return
    const currentGeneration = generation
    const ids = [...queuedReadIds]
    queuedReadIds.clear()
    sendingReadBatch = true
    try {
      await seeNotifications(ids)
      if (currentGeneration !== generation) return
      const seenAt = new Date().toISOString()
      for (const item of items.value) {
        if (ids.includes(item.id)) item.seenAt = seenAt
      }
      for (const id of ids) pendingReads.get(id)?.resolve()
    } catch (cause) {
      if (currentGeneration === generation) {
        for (const id of ids) pendingReads.get(id)?.reject(cause)
      }
    } finally {
      if (currentGeneration === generation) {
        for (const id of ids) pendingReads.delete(id)
        seeingIds.value = [...pendingReads.keys()]
        sendingReadBatch = false
        if (queuedReadIds.size && readBatchTimer === undefined) void flushReadBatch()
      }
    }
  }

  function merge(notifications: AppNotification[]) {
    const byId = new Map(items.value.map((item) => [item.id, item]))
    for (const item of notifications) {
      const existing = byId.get(item.id)
      byId.set(item.id, { ...item, seenAt: item.seenAt ?? existing?.seenAt ?? null })
    }
    items.value = [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id)
  }

  async function load(more = false) {
    if (!userId || (more && !hasMore.value)) return
    if (loading.value) {
      if (!more) refreshPending = true
      return
    }
    const currentGeneration = generation
    loading.value = true
    error.value = ''
    try {
      const notifications = await listNotifications(more ? cursor : null)
      if (currentGeneration !== generation) return
      merge(notifications)
      if (more || !initialized) {
        cursor = notifications[notifications.length - 1]?.createdAt ?? cursor
        hasMore.value = notifications.length === 20
      }
      initialized = true
    } catch (cause) {
      if (currentGeneration === generation) error.value = cause instanceof Error ? cause.message : t('notifications.loadError')
    } finally {
      if (currentGeneration === generation) {
        loading.value = false
        if (refreshPending) {
          refreshPending = false
          void load()
        }
      }
    }
  }

  async function markSeen(value: number | number[]) {
    const ids = [...new Set(Array.isArray(value) ? value : [value])].filter((id) => (
      items.value.some((item) => item.id === id && !item.seenAt)
    ))
    if (!ids.length) return
    const promises = ids.map((id) => {
      const existing = pendingReads.get(id)
      if (existing) return existing.promise
      let resolve!: () => void
      let reject!: (cause: unknown) => void
      const promise = new Promise<void>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
      })
      pendingReads.set(id, { promise, resolve, reject })
      queuedReadIds.add(id)
      return promise
    })
    seeingIds.value = [...pendingReads.keys()]
    if (queuedReadIds.size) scheduleReadBatch()
    await Promise.all(promises)
  }

  function cancelReadBatches() {
    if (readBatchTimer !== undefined) clearTimeout(readBatchTimer)
    readBatchTimer = undefined
    queuedReadIds.clear()
    for (const pending of pendingReads.values()) pending.resolve()
    pendingReads.clear()
    seeingIds.value = []
    sendingReadBatch = false
  }

  function stop() {
    generation += 1
    cancelReadBatches()
    stopSubscription?.()
    stopSubscription = undefined
    connected.value = false
    loading.value = false
    refreshPending = false
  }

  function start(nextUserId: string) {
    stop()
    if (userId !== nextUserId) {
      items.value = []
      cursor = null
      initialized = false
      hasMore.value = true
    }
    userId = nextUserId
    seeingIds.value = []
    const currentGeneration = generation
    stopSubscription = subscribeNotifications({
      created: (item) => { if (currentGeneration === generation && item.userId === userId) merge([item]) },
      connected: () => {
        if (currentGeneration !== generation) return
        connected.value = true
        void load()
      },
      disconnected: () => { if (currentGeneration === generation) connected.value = false },
      error: (cause) => { if (currentGeneration === generation) error.value = cause.message },
    })
    void load()
  }

  function reset() {
    stop()
    userId = undefined
    items.value = []
    seeingIds.value = []
    cursor = null
    initialized = false
    hasMore.value = true
    error.value = ''
  }

  return { items, loading, connected, error, hasMore, seeingIds, unreadCount, load, markSeen, start, reset }
})
