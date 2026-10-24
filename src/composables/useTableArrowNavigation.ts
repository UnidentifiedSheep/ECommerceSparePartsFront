import { nextTick, type Ref } from 'vue'

const controls = 'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="menu"], [role="slider"]'

export function useTableArrowNavigation<T extends { id: string | number }>(options: {
  rows: Readonly<Ref<T[]>>
  selected: Readonly<Ref<T | null | undefined>>
  busy: Readonly<Ref<boolean>>
  root: () => HTMLElement | undefined
  select: (row: T) => unknown
}) {
  function isControl(target: EventTarget | null) {
    return !!(target as HTMLElement | null)?.closest?.(controls)
  }
  function onKeydown(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key) || event.defaultPrevented
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isControl(event.target)
      || options.busy.value || !options.rows.value.length) return
    event.preventDefault()
    const rows = options.rows.value
    const current = rows.findIndex((row) => row.id === options.selected.value?.id)
    const index = current < 0 ? (event.key === 'ArrowDown' ? 0 : rows.length - 1)
      : Math.max(0, Math.min(rows.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)))
    if (current === index) return
    void options.select(rows[index]!)
    void nextTick(() => {
      const selected = rows.findIndex((row) => row.id === options.selected.value?.id)
      options.root()?.querySelectorAll<HTMLElement>('.el-table__body-wrapper tbody tr')[selected]
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }
  function onRowClick(_row: T, _column: unknown, event: MouseEvent) {
    if (!isControl(event.target)) options.root()?.focus({ preventScroll: true })
  }
  return { onKeydown, onRowClick }
}
