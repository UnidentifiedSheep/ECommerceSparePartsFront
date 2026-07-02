<template>
  <header class="page-header">
    <div class="page-header__text">
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: var(--app-header-bg);
  padding: 16px 24px;
}

.page-header__text {
  min-width: 0;
}

.page-header h1 {
  margin: 0;
  color: var(--app-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.page-header p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.page-header__actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 720px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
    padding: 14px 16px;
  }

  .page-header__actions {
    justify-content: flex-start;
  }
}
</style>
