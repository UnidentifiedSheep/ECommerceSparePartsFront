<template>
  <button class="pin-menu-button" type="button" :aria-label="t(store.isPinned(path) ? 'pinnedNavigation.unpin' : 'pinnedNavigation.pin', { name: t(entry?.label ?? '') })"
    :title="t(store.isPinned(path) ? 'pinnedNavigation.unpin' : 'pinnedNavigation.pin', { name: t(entry?.label ?? '') })"
    :aria-pressed="store.isPinned(path)" @click.stop="store.toggle(path)" @keydown.enter.stop @keydown.space.stop>
    <el-icon><StarFilled v-if="store.isPinned(path)" /><Star v-else /></el-icon>
  </button>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { usePinnedNavigationStore } from '@/stores/pinnedNavigationStore'
import { navigationEntries } from '@/utils/navigation'
import { useI18n } from '@/i18n'
const props = defineProps<{ path: string }>()
const store = usePinnedNavigationStore()
const entry = computed(() => navigationEntries.find(item => item.path === props.path))
const { t } = useI18n()
</script>
<style scoped>
.pin-menu-button { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 28px; height: 28px; margin-left: auto; border: 0; border-radius: 4px; padding: 4px; background: transparent; color: var(--app-text-muted); cursor: pointer; }
.pin-menu-button:hover, .pin-menu-button[aria-pressed='true'] { color: var(--app-primary); background: var(--app-primary-soft); }
.pin-menu-button:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 1px; }
.pin-menu-button .el-icon { margin: 0; }
</style>
