import { computed, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { defaultAppearance, parseAppearance, type Appearance } from '@/utils/appearance'

export const useAppearanceStore = defineStore('appearance', () => {
  const auth = useAuthStore()
  const appearance = ref<Appearance>({ ...defaultAppearance })
  const storageFailed = ref(false)
  const key = computed(() => auth.user?.id ? `app.appearance.${auth.user.id}` : null)
  function apply() {
    document.documentElement.style.setProperty('--app-font-scale', String(appearance.value.fontScale / 100))
    document.documentElement.dataset.accent = appearance.value.accent
  }
  function load() {
    storageFailed.value = false
    try { appearance.value = parseAppearance(key.value ? localStorage.getItem(key.value) : null) }
    catch { appearance.value = { ...defaultAppearance }; storageFailed.value = true }
    apply()
  }
  function update(value: Appearance) {
    appearance.value = parseAppearance(JSON.stringify(value))
    apply()
    if (!key.value) return
    try { localStorage.setItem(key.value, JSON.stringify(appearance.value)); storageFailed.value = false }
    catch { storageFailed.value = true }
  }
  function reset() { update({ ...defaultAppearance }) }
  function sync(event: StorageEvent) { if (event.key === key.value || event.key === null) load() }
  watch(key, load, { immediate: true, flush: 'sync' })
  window.addEventListener('storage', sync)
  onScopeDispose(() => window.removeEventListener('storage', sync))
  return { appearance, storageFailed, update, reset }
})
