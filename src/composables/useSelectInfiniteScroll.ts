import { nextTick, onBeforeUnmount } from 'vue'

function isScrollNearEnd(element: HTMLElement, threshold: number) {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - threshold
}

export function useSelectInfiniteScroll(
  popperClass: string,
  loadMore: () => void | Promise<void>,
  threshold = 48,
) {
  let cleanup: (() => void) | undefined

  function detach() {
    cleanup?.()
    cleanup = undefined
  }

  async function attach() {
    detach()
    await nextTick()

    let frame = 0
    let attempts = 0

    const tryAttach = () => {
      const popper = document.querySelector(`.${popperClass}`)
      const wrap = popper?.querySelector<HTMLElement>('.el-select-dropdown__wrap, .el-scrollbar__wrap')
      if (!wrap) {
        attempts += 1
        if (attempts < 6) {
          frame = requestAnimationFrame(tryAttach)
        }
        return
      }

      const onScroll = () => {
        if (isScrollNearEnd(wrap, threshold)) {
          void loadMore()
        }
      }

      wrap.addEventListener('scroll', onScroll, { passive: true })
      cleanup = () => wrap.removeEventListener('scroll', onScroll)
    }

    frame = requestAnimationFrame(tryAttach)
    cleanup = () => cancelAnimationFrame(frame)
  }

  onBeforeUnmount(detach)

  return {
    attach,
    detach,
  }
}

export async function attachSelectDropdownInfiniteScroll(
  popperClass: string,
  loadMore: () => void | Promise<void>,
  threshold = 48,
) {
  await nextTick()

  let cleanup: (() => void) | undefined
  let frame = 0
  let attempts = 0

  const tryAttach = () => {
    const popper = document.querySelector(`.${popperClass}`)
    const wrap = popper?.querySelector<HTMLElement>('.el-select-dropdown__wrap, .el-scrollbar__wrap')
    if (!wrap) {
      attempts += 1
      if (attempts < 6) {
        frame = requestAnimationFrame(tryAttach)
      }
      return
    }

    const onScroll = () => {
      if (isScrollNearEnd(wrap, threshold)) {
        void loadMore()
      }
    }

    wrap.addEventListener('scroll', onScroll, { passive: true })
    cleanup = () => wrap.removeEventListener('scroll', onScroll)
  }

  frame = requestAnimationFrame(tryAttach)

  return () => {
    cancelAnimationFrame(frame)
    cleanup?.()
  }
}
