import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useI18n } from '@/i18n'

export function useDialogGuard(open: Ref<boolean | undefined>, busy: Readonly<Ref<boolean>>, snapshot: () => unknown) {
  const { t } = useI18n()
  const auth = useAuthStore()
  const baseline = ref('')
  const ready = ref(false)
  let confirmation: Promise<boolean> | undefined
  const dirty = computed(() => open.value && ready.value && JSON.stringify(snapshot()) !== baseline.value)
  function markClean() { baseline.value = JSON.stringify(snapshot()); ready.value = true }
  watch(open, async (value) => {
    ready.value = false
    if (value) { await nextTick(); if (open.value) markClean() }
  }, { immediate: true })

  async function mayClose() {
    if (busy.value) return false
    if (!dirty.value) return true
    confirmation ??= ElMessageBox.confirm(t('common.messages.unsavedChanges'), t('common.messages.unsavedTitle'), {
      type: 'warning', confirmButtonText: t('common.messages.discardChanges'), cancelButtonText: t('common.actions.cancel'),
    }).then(() => !busy.value, () => false).finally(() => { confirmation = undefined })
    return confirmation
  }
  async function requestClose() { if (await mayClose()) open.value = false }
  function beforeClose(done: () => void) { void mayClose().then((allowed) => { if (allowed) done() }) }
  const router = useRouter()
  const unregister = router?.beforeEach(async (to, from) => !auth.isAuthenticated || to.path === from.path || !open.value || await mayClose())
  function beforeUnload(event: BeforeUnloadEvent) {
    if (open.value && (dirty.value || busy.value)) { event.preventDefault(); event.returnValue = '' }
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => { unregister?.(); window.removeEventListener('beforeunload', beforeUnload) })
  return { dirty, requestClose, beforeClose, markClean }
}
