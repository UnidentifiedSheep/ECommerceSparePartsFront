<template>
  <div class="app-shell">
    <aside class="app-shell__sidebar">
      <MainNavigation />
    </aside>

    <div class="app-shell__main">
      <MainHeader @open-menu="mobileMenuOpen = true" />
      <RouterView />
    </div>

    <el-drawer
      v-model="mobileMenuOpen"
      direction="ltr"
      size="min(260px, 88vw)"
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

const mobileMenuOpen = ref(false)
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
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
}

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
