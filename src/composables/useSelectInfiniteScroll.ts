import { nextTick, onBeforeUnmount } from 'vue'

function isScrollNearEnd(element: HTMLElement, threshold: number) {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - threshold
}

function findDropdownWrap(popperClass: string) {
  const popper = document.querySelector(`.${popperClass}`)
  return popper?.querySelector<HTMLElement>('.el-select-dropdown__wrap, .el-scrollbar__wrap')
}

function restoreScrollPosition(element: HTMLElement, scrollTop: number) {
  requestAnimationFrame(() => {
    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight)
    element.scrollTop = Math.min(scrollTop, maxScrollTop)
  })
}

export function useSelectInfiniteScroll(
  popperClass: string,
  loadMore: () => void | Promise<void>,
  threshold = 48,
) {
  let cleanup: (() => void) | undefined
  let isLoadingMore = false
  let cooldownTimer: number | undefined

  function detach() {
    if (cooldownTimer) {
      window.clearTimeout(cooldownTimer)
      cooldownTimer = undefined
    }
    cleanup?.()
    cleanup = undefined
  }

  async function attach() {
    detach()
    await nextTick()

    let frame = 0
    let attempts = 0

    const tryAttach = () => {
      const wrap = findDropdownWrap(popperClass)
      if (!wrap) {
        attempts += 1
        if (attempts < 6) {
          frame = requestAnimationFrame(tryAttach)
        }
        return
      }

      requestAnimationFrame(() => {
        wrap.scrollTop = 0
      })

      const onScroll = async () => {
        if (isLoadingMore || cooldownTimer) return
        if (isScrollNearEnd(wrap, threshold)) {
          isLoadingMore = true
          const currentScrollTop = wrap.scrollTop

          try {
            await loadMore()
            await nextTick()
            restoreScrollPosition(wrap, currentScrollTop)
          } finally {
            isLoadingMore = false
            cooldownTimer = window.setTimeout(() => {
              cooldownTimer = undefined
            }, 120)
          }
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
  let isLoadingMore = false
  let cooldownTimer: number | undefined

  const tryAttach = () => {
    const wrap = findDropdownWrap(popperClass)
    if (!wrap) {
      attempts += 1
      if (attempts < 6) {
        frame = requestAnimationFrame(tryAttach)
      }
      return
    }

    requestAnimationFrame(() => {
      wrap.scrollTop = 0
    })

    const onScroll = async () => {
      if (isLoadingMore || cooldownTimer) return
      if (isScrollNearEnd(wrap, threshold)) {
        isLoadingMore = true
        const currentScrollTop = wrap.scrollTop

        try {
          await loadMore()
          await nextTick()
          restoreScrollPosition(wrap, currentScrollTop)
        } finally {
          isLoadingMore = false
          cooldownTimer = window.setTimeout(() => {
            cooldownTimer = undefined
          }, 120)
        }
      }
    }

    wrap.addEventListener('scroll', onScroll, { passive: true })
    cleanup = () => wrap.removeEventListener('scroll', onScroll)
  }

  frame = requestAnimationFrame(tryAttach)

  return () => {
    cancelAnimationFrame(frame)
    if (cooldownTimer) {
      window.clearTimeout(cooldownTimer)
    }
    cleanup?.()
  }
}
