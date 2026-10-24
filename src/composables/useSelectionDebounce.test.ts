import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useSelectionDebounce } from './useSelectionDebounce'

function setup() {
  vi.useFakeTimers()
  const scope = effectScope()
  const debounce = scope.run(() => useSelectionDebounce())!
  return { scope, ...debounce }
}

afterEach(() => vi.useRealTimers())

describe('selection request debounce', () => {
  it('waits for a pause and only loads the last selection in a held-key burst', async () => {
    const debounce = setup()
    const load = vi.fn()
    const waits: Promise<void>[] = []
    for (let row = 0; row < 30; row++) {
      waits.push(debounce.wait().then(ready => { if (ready) load(row) }))
      await vi.advanceTimersByTimeAsync(30)
    }
    expect(load).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(219)
    expect(load).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await Promise.all(waits)
    expect(load.mock.calls).toEqual([[29]])
    debounce.scope.stop()
  })

  it('settles a superseded wait without allowing its request', async () => {
    const debounce = setup()
    const first = debounce.wait()
    await vi.advanceTimersByTimeAsync(200)
    const last = debounce.wait()
    expect(await first).toBe(false)
    await vi.advanceTimersByTimeAsync(250)
    expect(await last).toBe(true)
    debounce.scope.stop()
  })

  it('cancels pending requests on close and allows a later selection', async () => {
    const debounce = setup()
    const pending = debounce.wait()
    debounce.cancel()
    debounce.cancel()
    expect(await pending).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    const reopened = debounce.wait()
    await vi.advanceTimersByTimeAsync(250)
    expect(await reopened).toBe(true)
    debounce.scope.stop()
  })

  it('cancels on unmount and prevents queued continuations from starting another request', async () => {
    const debounce = setup()
    const pending = debounce.wait()
    debounce.scope.stop()
    expect(await pending).toBe(false)
    expect(await debounce.wait()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })
})
