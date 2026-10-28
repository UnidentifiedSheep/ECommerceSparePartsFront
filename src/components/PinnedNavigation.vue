<template>
  <nav v-if="visible" ref="element" class="pinned-navigation" :style="pinStyle(store.preferences.barColor)" :aria-label="t('pinnedNavigation.title')">
    <div class="pinned-navigation__links">
      <RouterLink v-for="entry in store.visiblePins" :key="entry.path" v-slot="{ href, navigate }" :to="entry.path" custom>
        <a :href="href" class="pinned-navigation__link" :class="{ 'pinned-navigation__link--active': activePath === entry.path }"
          :style="pinStyle(entry.pin.color)" :title="entry.pin.label.trim() || t(entry.label)" :aria-label="entry.pin.label.trim() || t(entry.label)"
          :aria-current="activePath === entry.path ? 'page' : undefined" @click="navigate">
          <el-icon><component :is="entry.icon" /></el-icon>
          <span v-if="store.preferences.showLabels">{{ entry.pin.label.trim() || t(entry.label) }}</span>
        </a>
      </RouterLink>
    </div>
    <RouterLink to="/settings?section=pinned" class="pinned-navigation__settings" :aria-label="t('pinnedNavigation.configure')" :title="t('pinnedNavigation.configure')"><el-icon><Setting /></el-icon></RouterLink>
  </nav>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useMediaQuery, useResizeObserver } from '@vueuse/core'
import { Setting } from '@element-plus/icons-vue'
import { usePinnedNavigationStore } from '@/stores/pinnedNavigationStore'
import { activeNavigationPath } from '@/utils/navigation'
import { pinStyle } from '@/utils/pinnedNavigation'
import { useI18n } from '@/i18n'
const store = usePinnedNavigationStore()
const route = useRoute()
const { t } = useI18n()
const emit = defineEmits<{ 'dock-resize': [height: number] }>()
const element = ref<HTMLElement>()
const mobile = useMediaQuery('(max-width: 900px)')
const visible = computed(() => store.preferences.enabled && store.visiblePins.length > 0)
const activePath = computed(() => activeNavigationPath(route.path))
function measure() { emit('dock-resize', visible.value && mobile.value ? element.value?.getBoundingClientRect().height ?? 0 : 0) }
useResizeObserver(element, measure)
watch([visible, mobile], async () => { await nextTick(); measure() }, { immediate: true })
</script>
<style scoped>
.pinned-navigation { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 8px 16px; border-bottom: 1px solid var(--app-border); background: var(--pin-bg); }
.pinned-navigation__links { display: flex; flex: 1; min-width: 0; gap: 8px; overflow-x: auto; scrollbar-width: thin; scrollbar-color: var(--app-border-strong) transparent; }
.pinned-navigation__link { position: relative; display: inline-flex; flex: none; align-items: center; gap: 8px; min-height: 38px; max-width: 220px; padding: 7px 12px; border: 1px solid var(--pin-color); border-radius: 6px; background: var(--pin-bg); color: var(--pin-color); font-size: 14px; line-height: 1.4; text-decoration: none; }
.pinned-navigation__link span:not(.el-icon) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pinned-navigation__link--active { font-weight: 750; }
.pinned-navigation__link--active::after { position: absolute; right: 8px; bottom: 2px; left: 8px; height: 3px; border-radius: 2px; background: var(--pin-color); content: ''; }
.pinned-navigation__link:hover { filter: brightness(.96); }
.pinned-navigation__link:focus-visible, .pinned-navigation__settings:focus-visible { outline: 2px solid var(--pin-color); outline-offset: -3px; }
.pinned-navigation__settings { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 36px; height: 38px; border-radius: 6px; color: var(--pin-color); }
.pinned-navigation__settings:hover { background: var(--app-surface); }
@media (max-width: 900px) {
  .pinned-navigation { position: fixed; z-index: 40; right: 0; bottom: 0; left: 0; padding: 8px 12px calc(8px + env(safe-area-inset-bottom)); border-top: 1px solid var(--app-border-strong); border-bottom: 0; }
}
</style>
