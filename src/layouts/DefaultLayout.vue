<template>
  <div class="app-shell" :style="{ '--app-viewport-offset': `${topbarHeight + dockHeight}px`, '--app-dock-height': `${dockHeight}px` }">
    <aside class="app-shell__sidebar">
      <MainNavigation />
    </aside>

    <div class="app-shell__main">
      <div ref="topbar" class="app-shell__topbar">
        <MainHeader @open-menu="mobileMenuOpen = true" />
        <PinnedNavigation @dock-resize="dockHeight = $event" />
      </div>
      <RouterView />
    </div>

    <el-drawer
      v-model="mobileMenuOpen"
      direction="ltr"
      size="min(max(260px, 16.25rem), 88vw)"
      :with-header="false"
      class="main-nav-drawer"
    >
      <MainNavigation closable @close="mobileMenuOpen = false" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import MainHeader from '@/components/MainHeader.vue'
import MainNavigation from '@/components/MainNavigation.vue'
import PinnedNavigation from '@/components/PinnedNavigation.vue'
import { useResizeObserver } from '@vueuse/core'

const mobileMenuOpen = ref(false)
const topbar = ref<HTMLElement>()
const topbarHeight = ref(56)
const dockHeight = ref(0)
useResizeObserver(topbar, entries => { const entry = entries[0]; if (entry) topbarHeight.value = entry.contentRect.height })
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: max(252px, 15.75rem) minmax(0, 1fr);
  min-height: 100vh;
  background: var(--app-bg);
}

.app-shell__sidebar {
  min-width: 0;
  border-right: 1px solid var(--app-border);
  background: var(--app-surface-tinted);
}

.app-shell__main {
  min-width: 0;
  background: var(--app-bg);
  padding-bottom: var(--app-dock-height, 0px);
}
.app-shell__topbar { position: sticky; z-index: 25; top: 0; }

:deep(.main-nav-drawer .el-drawer__body) {
  padding: 0;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-shell__sidebar {
    display: none;
  }
}
</style>
