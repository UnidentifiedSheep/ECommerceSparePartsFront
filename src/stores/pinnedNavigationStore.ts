import { computed, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { usePermissions } from '@/composables/usePermissions'
import { navigationEntries, canAccessNavigation } from '@/utils/navigation'
import { defaultPinnedNavigation, parsePinnedNavigation, type PinnedNavigationPreferences, type NavigationPin } from '@/utils/pinnedNavigation'

export const usePinnedNavigationStore = defineStore('pinnedNavigation', () => {
  const auth = useAuthStore()
  const { hasPermission } = usePermissions()
  const preferences = ref(defaultPinnedNavigation())
  const storageFailed = ref(false)
  const key = computed(() => auth.user?.id ? `app.pinned-navigation.${auth.user.id}` : null)
  const availableEntries = computed(() => auth.user ? navigationEntries.filter(entry => canAccessNavigation(entry, hasPermission)) : [])
  const visiblePins = computed(() => preferences.value.pins.flatMap(pin => {
    const entry = availableEntries.value.find(item => item.path === pin.path)
    return entry ? [{ ...entry, pin }] : []
  }))
  function load() {
    storageFailed.value = false
    try { preferences.value = parsePinnedNavigation(key.value ? localStorage.getItem(key.value) : null) }
    catch { preferences.value = defaultPinnedNavigation(); storageFailed.value = true }
  }
  function update(value: PinnedNavigationPreferences) {
    if (!key.value) return
    preferences.value = parsePinnedNavigation(JSON.stringify(value))
    try { localStorage.setItem(key.value, JSON.stringify(preferences.value)); storageFailed.value = false }
    catch { storageFailed.value = true }
  }
  function isPinned(path: string) { return preferences.value.pins.some(pin => pin.path === path) }
  function toggle(path: string) {
    if (!availableEntries.value.some(entry => entry.path === path)) return
    update({ ...preferences.value, pins: isPinned(path) ? preferences.value.pins.filter(pin => pin.path !== path) : [...preferences.value.pins, { path, label: '', color: 'theme' }] })
  }
  function edit(path: string, patch: Partial<Pick<NavigationPin, 'label' | 'color'>>) {
    if (!availableEntries.value.some(entry => entry.path === path)) return
    update({ ...preferences.value, pins: preferences.value.pins.map(pin => pin.path === path ? { ...pin, ...patch } : pin) })
  }
  function move(path: string, direction: -1 | 1) {
    const visible = visiblePins.value.map(entry => entry.path)
    const position = visible.indexOf(path)
    if (position < 0) return
    const target = visible[position + direction]
    if (!target) return
    const pins = [...preferences.value.pins]
    const from = pins.findIndex(pin => pin.path === path), to = pins.findIndex(pin => pin.path === target)
    const item = pins.splice(from, 1)[0]!
    pins.splice(to, 0, item)
    update({ ...preferences.value, pins })
  }
  function sync(event: StorageEvent) { if (event.key === key.value || event.key === null) load() }
  watch(key, load, { immediate: true, flush: 'sync' })
  window.addEventListener('storage', sync)
  onScopeDispose(() => window.removeEventListener('storage', sync))
  return { preferences, availableEntries, visiblePins, storageFailed, update, toggle, isPinned, edit, move }
})
