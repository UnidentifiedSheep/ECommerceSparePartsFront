import { nextTick, ref, watch } from 'vue'

export function useDocumentLineNavigation(selectorOpen: () => boolean) {
  const root = ref<HTMLElement>()
  let pendingIndex: number | undefined
  let selectorClosing = selectorOpen()
  watch(selectorOpen, open => { if (open) selectorClosing = true })

  function focusField(index: number, field: 'count' | 'price') {
    const input = root.value?.querySelector<HTMLInputElement>(`[data-line-index="${index}"] [data-line-field="${field}"] input:not(:disabled)`)
    if (!input) return false
    input.focus()
    input.select()
    input.scrollIntoView({ block: 'nearest' })
    return true
  }

  async function focusPending() {
    selectorClosing = false
    await nextTick()
    if (pendingIndex !== undefined && !selectorOpen() && focusField(pendingIndex, 'count')) pendingIndex = undefined
  }

  async function focusQuantity(index: number) {
    pendingIndex = index
    await nextTick()
    if (!selectorClosing && !selectorOpen()) await focusPending()
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.isComposing || !(event.target instanceof HTMLInputElement)) return
    const field = event.target.closest<HTMLElement>('[data-line-field]')?.dataset.lineField
    const row = event.target.closest<HTMLElement>('[data-line-index]')
    if (!row || (field !== 'count' && field !== 'price')) return
    event.preventDefault()
    event.stopPropagation()
    if (event.repeat) return
    const index = Number(row.dataset.lineIndex)
    if (field === 'count') focusField(index, 'price')
    else if (!focusField(index + 1, 'count')) root.value?.querySelector<HTMLButtonElement>('[data-add-product]:not(:disabled)')?.click()
  }

  return { root, focusQuantity, focusPending, onKeydown }
}
