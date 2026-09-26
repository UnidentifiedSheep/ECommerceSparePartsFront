import { onScopeDispose, watch, type Ref } from 'vue'

const readDelay = 1500
const visibleRatio = 0.8

export function useNotificationAutoRead(
  root: Ref<HTMLElement | undefined>,
  active: Readonly<Ref<boolean>>,
  unreadIds: Readonly<Ref<number[]>>,
  markRead: (ids: number[]) => Promise<void>,
) {
  const visibleSince = new Map<number, number>()
  const observed = new Map<number, HTMLElement>()
  let observer: IntersectionObserver | undefined
  let interval: ReturnType<typeof setInterval> | undefined
  let generation = 0

  function stop() {
    generation += 1
    observer?.disconnect()
    observer = undefined
    if (interval !== undefined) clearInterval(interval)
    interval = undefined
    visibleSince.clear()
    observed.clear()
  }

  function syncItems() {
    if (!observer || !root.value) return
    const unread = new Set(unreadIds.value)
    for (const [id, element] of observed) {
      if (!unread.has(id) || !element.isConnected) {
        observer.unobserve(element)
        observed.delete(id)
        visibleSince.delete(id)
      }
    }
    for (const element of root.value.querySelectorAll<HTMLElement>('[data-notification-id]')) {
      const id = Number(element.dataset.notificationId)
      if (unread.has(id) && !observed.has(id)) {
        observed.set(id, element)
        observer.observe(element)
      }
    }
  }

  function isCurrentlyVisible(id: number) {
    const element = observed.get(id)
    if (!element || !root.value) return false
    const bounds = element.getBoundingClientRect()
    const viewport = root.value.getBoundingClientRect()
    const width = Math.max(0, Math.min(bounds.right, viewport.right, window.innerWidth) - Math.max(bounds.left, viewport.left, 0))
    const height = Math.max(0, Math.min(bounds.bottom, viewport.bottom, window.innerHeight) - Math.max(bounds.top, viewport.top, 0))
    return bounds.width > 0 && bounds.height > 0 && width * height / (bounds.width * bounds.height) >= visibleRatio
  }

  watch([root, active], ([element, enabled]) => {
    stop()
    if (!element || !enabled) return
    const currentGeneration = generation
    observer = new IntersectionObserver((entries) => {
      if (generation !== currentGeneration || !active.value) return
      for (const entry of entries) {
        const id = Number((entry.target as HTMLElement).dataset.notificationId)
        if (entry.isIntersecting && entry.intersectionRatio >= visibleRatio) {
          if (!visibleSince.has(id)) visibleSince.set(id, performance.now())
        } else visibleSince.delete(id)
      }
    }, { root: element, threshold: [0, visibleRatio, 1] })
    syncItems()
    interval = setInterval(() => {
      if (!active.value || document.visibilityState !== 'visible' || !document.hasFocus()) {
        visibleSince.clear()
        return
      }
      const now = performance.now()
      const ids: number[] = []
      for (const [id, since] of visibleSince) {
        if (!isCurrentlyVisible(id)) {
          visibleSince.delete(id)
          continue
        }
        if (now - since >= readDelay && unreadIds.value.includes(id)) {
          ids.push(id)
          visibleSince.delete(id)
        }
      }
      if (ids.length) void markRead(ids)
    }, 250)
  }, { flush: 'post', immediate: true })

  watch(unreadIds, syncItems, { flush: 'post' })
  onScopeDispose(stop)
}
