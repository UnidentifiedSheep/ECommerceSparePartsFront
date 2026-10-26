import { nextTick, type Ref } from 'vue'

const controls = 'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="menu"], [role="slider"]'

export function useTableArrowNavigation<T extends { id: string | number }>(options: {
  rows: Readonly<Ref<T[]>>
  selected: Readonly<Ref<T | null | undefined>>
  busy: Readonly<Ref<boolean>>
  root: () => HTMLElement | undefined
  select: (row: T) => unknown
  activate?: (row: T) => unknown
  onBoundary?: (direction: -1 | 1) => void | Promise<void>
}) {
  let boundaryPending = false
  function scrollToSelected() {
    void nextTick(() => {
      const selected = options.rows.value.findIndex((row) => row.id === options.selected.value?.id)
      options.root()?.querySelectorAll<HTMLElement>('.el-table__body-wrapper tbody tr')[selected]
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }
  function isControl(target: EventTarget | null) {
    return !!(target as HTMLElement | null)?.closest?.(controls)
  }
  function onKeydown(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key) || event.defaultPrevented
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isControl(event.target)
      || options.busy.value || boundaryPending || !options.rows.value.length) return
    const rows = options.rows.value
    const current = rows.findIndex((row) => row.id === options.selected.value?.id)
    if (event.key === 'Enter') {
      if (current >= 0 && options.activate) {
        event.preventDefault()
        void options.activate(rows[current]!)
      }
      return
    }
    event.preventDefault()
    const index = current < 0 ? (event.key === 'ArrowDown' ? 0 : rows.length - 1)
      : Math.max(0, Math.min(rows.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)))
    if (current === index) {
      // Holding an arrow stops at the edge; a fresh press changes the page.
      if (!options.onBoundary || event.repeat) return
      boundaryPending = true
      return Promise.resolve().then(() => options.onBoundary!(event.key === 'ArrowDown' ? 1 : -1))
        .finally(() => { boundaryPending = false })
    }
    void options.select(rows[index]!)
    scrollToSelected()
  }

  function onRowClick(_row: T, _column: unknown, event: MouseEvent) {
    if (!isControl(event.target)) options.root()?.focus({ preventScroll: true })
  }
  return { onKeydown, onRowClick, scrollToSelected }
}
