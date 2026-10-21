import { nextTick, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'

export interface QueryBinding {
  read: () => unknown
  restore: (value: unknown) => void | Promise<void>
}

export function queryField<T>(target: Ref<T>, decode: (value: unknown) => T, encode: (value: T) => unknown = (value) => value): QueryBinding {
  const initial = JSON.parse(JSON.stringify(encode(target.value) ?? null))
  return { read: () => encode(target.value), restore: (value) => { target.value = decode(value === undefined ? initial : value) } }
}

// One query parameter leaves detail links and unrelated query parameters intact.
export function useListQueryState(fields: Record<string, QueryBinding>, reload: () => Promise<unknown>) {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const restoring = ref(true)
  const path = route.path
  let initialized = false
  let version = 0
  let restoreQueue: Promise<unknown> = Promise.resolve()
  let appliedQuery: unknown
  const capture = () => JSON.stringify(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.read()])))
  const defaults = capture()

  async function restore() {
    const currentVersion = ++version
    restoring.value = true
    const raw = route.query.filters
    appliedQuery = raw
    const operation = restoreQueue.then(async () => {
      let state: Record<string, unknown> = {}
      try {
        if (typeof raw === 'string' && raw.length <= 16000) {
          const parsed: unknown = JSON.parse(raw)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) state = parsed as Record<string, unknown>
        }
      } catch { /* An invalid URL falls back to the page defaults. */ }
      const outcomes = await Promise.allSettled(Object.entries(fields).map(([key, field]) => field.restore(state[key])))
      await nextTick()
      if (currentVersion !== version) return false
      restoring.value = false
      if (outcomes.some((result) => result.status === 'rejected')) ElMessage.warning(t('common.messages.restoreFiltersError'))
      return true
    })
    restoreQueue = operation
    return operation
  }

  watch(capture, async (serialized) => {
    if (!initialized || restoring.value || route.path !== path) return
    const filters = serialized === defaults ? undefined : serialized
    if (route.query.filters === filters) return
    appliedQuery = filters
    await router.replace({ query: { ...route.query, filters } })
  }, { flush: 'post' })
  watch(() => route.query.filters, async (value) => {
    if (!initialized || value === appliedQuery || route.path !== path) return
    if (await restore()) await reload()
  })

  async function restoreInitial() {
    await restore()
    initialized = true
  }
  return { restoring, restoreInitial }
}
