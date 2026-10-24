import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useTableArrowNavigation } from './useTableArrowNavigation'

function setup() {
  const rows = ref([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
  const selected = ref<{ id: string }>(), busy = ref(false)
  const scrolls = rows.value.map(() => ({ scrollIntoView: vi.fn() }))
  const root = { querySelectorAll: () => scrolls, focus: vi.fn() }
  const select = vi.fn((row: { id: string }) => { selected.value = row })
  const navigation = useTableArrowNavigation({ rows, selected, busy, select, root: () => root as unknown as HTMLElement })
  function key(key: string, options: Partial<KeyboardEvent> = {}, control = false) {
    const event = { key, preventDefault: vi.fn(), target: { closest: () => control ? {} : null }, ...options } as unknown as KeyboardEvent
    navigation.onKeydown(event); return event
  }
  return { rows, selected, busy, scrolls, root, select, key, ...navigation }
}

describe('table arrow navigation', () => {
  it('selects the first/next/previous row and keeps it in view', async () => {
    const table = setup()
    table.key('ArrowDown'); expect(table.selected.value?.id).toBe('a')
    table.key('ArrowDown'); expect(table.selected.value?.id).toBe('b')
    await nextTick(); expect(table.scrolls[1]!.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
    table.key('ArrowUp'); expect(table.selected.value?.id).toBe('a')
  })
  it('starts at the last row on ArrowUp when nothing is selected', () => {
    const table = setup(); table.key('ArrowUp'); expect(table.selected.value?.id).toBe('c')
  })
  it('stays within the loaded rows without wrapping or reloading details', () => {
    const table = setup(); table.key('ArrowUp'); table.select.mockClear()
    const event = table.key('ArrowDown')
    expect(event.preventDefault).toHaveBeenCalledOnce(); expect(table.select).not.toHaveBeenCalled()
  })
  it('ignores fields, buttons, and dropdown controls', () => {
    const table = setup(); const event = table.key('ArrowDown', {}, true)
    expect(table.select).not.toHaveBeenCalled(); expect(event.preventDefault).not.toHaveBeenCalled()
  })
  it('does not intercept shortcuts, handled keys, or unrelated keys', () => {
    const table = setup()
    for (const option of [{ ctrlKey: true }, { shiftKey: true }, { altKey: true }, { metaKey: true }, { defaultPrevented: true }]) table.key('ArrowDown', option)
    table.key('Enter'); table.key('ArrowLeft')
    expect(table.select).not.toHaveBeenCalled()
  })
  it('waits for a loaded list and does nothing for an empty list', () => {
    const table = setup(); table.busy.value = true; table.key('ArrowDown')
    table.busy.value = false; table.rows.value = []; table.key('ArrowDown')
    expect(table.select).not.toHaveBeenCalled()
  })
  it('focuses a clicked row without moving the page, preserving control focus', () => {
    const table = setup()
    table.onRowClick({ id: 'b' }, null, { target: { closest: () => null } } as unknown as MouseEvent)
    expect(table.root.focus).toHaveBeenCalledWith({ preventScroll: true })
    table.root.focus.mockClear()
    table.onRowClick({ id: 'b' }, null, { target: { closest: () => ({}) } } as unknown as MouseEvent)
    expect(table.root.focus).not.toHaveBeenCalled()
  })
})
