import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useDocumentChanges } from './useDocumentChanges'
import { useLiveDocumentList } from './useLiveDocumentList'
import { useDocumentEditConflict } from './useDocumentEditConflict'
import type { DocumentChange } from '@/services/graphql/documentChanges'

vi.mock('./useDocumentChanges', () => ({ useDocumentChanges: vi.fn(() => ({ unavailable: ref(false) })) }))
const scopes: ReturnType<typeof effectScope>[] = []
const callbacks = () => vi.mocked(useDocumentChanges).mock.lastCall![1]
const change = (id: string, type: DocumentChange['type'] = 'updated') => callbacks().changed({ id, type })
const row = { id: 'one', amount: 10 }
function setup(automatic = true) {
  const scope = effectScope(); scopes.push(scope)
  const rows = ref([row]); const selected = ref<typeof row>()
  const reload = vi.fn(async () => {})
  const get = vi.fn(async (id: string) => ({ id, amount: 20 }))
  const refreshSelected = vi.fn(async () => {})
  const removed = vi.fn()
  const state = scope.run(() => useLiveDocumentList('sale', { rows, selected, canReload: () => automatic, reload, get, refreshSelected, removed, syncSelection: vi.fn(async () => {}) }))!
  return { rows, selected, reload, get, refreshSelected, removed, ...state }
}
beforeEach(() => { vi.useFakeTimers(); vi.mocked(useDocumentChanges).mockClear() })
afterEach(() => { scopes.splice(0).forEach(scope => scope.stop()); vi.useRealTimers() })

describe('live document lists', () => {
  it('coalesces bursts and only refreshes selected contents when that document changed', async () => {
    const state = setup()
    state.selected.value = state.rows.value[0]
    for (let i = 0; i < 30; i++) { change('one'); await vi.advanceTimersByTimeAsync(20) }
    expect(state.reload).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(500)
    expect(state.reload).toHaveBeenCalledOnce()
    expect(state.refreshSelected).toHaveBeenCalledOnce()
    change('another', 'created')
    await vi.advanceTimersByTimeAsync(500)
    expect(state.refreshSelected).toHaveBeenCalledOnce()
  })

  it('preserves list order while scrolled and patches only affected visible documents', async () => {
    const state = setup(false)
    state.rows.value.push({ id: 'two', amount: 10 })
    change('new', 'created'); change('one'); change('outside')
    await vi.advanceTimersByTimeAsync(500)
    expect(state.reload).not.toHaveBeenCalled()
    expect(state.get).toHaveBeenCalledExactlyOnceWith('one')
    expect(state.rows.value).toEqual([{ id: 'one', amount: 20 }, { id: 'two', amount: 10 }])
    expect(state.pending.value).toBe(true)
    await state.applyPending()
    expect(state.reload).toHaveBeenCalledWith(true)
    expect(state.pending.value).toBe(false)
  })

  it('removes a deleted row without fetching a hard-deleted entity and retains deletion over late updates', async () => {
    const state = setup(false)
    change('one', 'deleted'); change('one', 'updated')
    await vi.advanceTimersByTimeAsync(500)
    expect(state.rows.value).toEqual([])
    expect(state.removed).toHaveBeenCalledWith('one')
    expect(state.get).not.toHaveBeenCalled()
  })

  it('catches up after reconnect and processes events arriving during a refresh sequentially', async () => {
    const state = setup()
    let finish!: () => void
    state.reload.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve }))
    callbacks().reconnected?.()
    await vi.advanceTimersByTimeAsync(500)
    change('one')
    await vi.advanceTimersByTimeAsync(500)
    expect(state.reload).toHaveBeenCalledOnce()
    finish()
    await vi.advanceTimersByTimeAsync(500)
    expect(state.reload).toHaveBeenCalledTimes(2)
  })

  it('discards a late row response after a manual list refresh replaced the row', async () => {
    const state = setup(false)
    let finish!: (value: typeof row) => void
    state.get.mockImplementation(() => new Promise(resolve => { finish = resolve }))
    change('one'); await vi.advanceTimersByTimeAsync(500)
    state.rows.value = [{ id: 'one', amount: 30 }]
    finish({ id: 'one', amount: 20 }); await vi.advanceTimersByTimeAsync(0)
    expect(state.rows.value[0]?.amount).toBe(30)
  })

  it('keeps a retry action if selected content refresh fails and releases the update guard', async () => {
    const state = setup()
    state.selected.value = state.rows.value[0]
    state.refreshSelected.mockRejectedValueOnce(new Error('Offline'))
    change('one')
    await vi.advanceTimersByTimeAsync(500)
    expect(state.pending.value).toBe(true)
    expect(state.updating.value).toBe(false)
    await state.applyPending()
    expect(state.pending.value).toBe(false)
  })
})

describe('live editing conflicts', () => {
  it('flags only the edited document, ignores own writes, keeps deletion sticky and resets on close', () => {
    const scope = effectScope(); scopes.push(scope)
    const id = ref<string | undefined>('one'); const saving = ref(false)
    const conflict = scope.run(() => useDocumentEditConflict('purchase', () => id.value, () => saving.value))!
    change('two'); expect(conflict.change.value).toBeUndefined()
    saving.value = true; change('one'); expect(conflict.change.value).toBeUndefined()
    saving.value = false; change('one'); expect(conflict.change.value).toBe('updated')
    const version = conflict.version()
    change('one', 'deleted'); change('one')
    conflict.acknowledge(version)
    expect(conflict.change.value).toBe('deleted')
    id.value = undefined
    expect(conflict.change.value).toBeUndefined()
  })
})
