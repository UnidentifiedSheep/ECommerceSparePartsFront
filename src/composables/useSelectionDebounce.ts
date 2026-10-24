import { onScopeDispose } from 'vue'

// Delay the request, not the highlighted row. Cancelled waits always settle so
// callers waiting to edit/navigate cannot hang when the selection changes.
export function useSelectionDebounce(delay = 250) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let settle: ((ready: boolean) => void) | undefined
  let disposed = false

  function cancel() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    settle?.(false)
    settle = undefined
  }
  function wait(): Promise<boolean> {
    cancel()
    if (disposed) return Promise.resolve(false)
    return new Promise((resolve) => {
      settle = resolve
      timer = setTimeout(() => {
        timer = undefined
        settle = undefined
        resolve(true)
      }, delay)
    })
  }
  onScopeDispose(() => { disposed = true; cancel() })
  return { wait, cancel }
}
