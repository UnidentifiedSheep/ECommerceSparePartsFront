<template>
  <div class="product-sku">
    <span class="product-sku__indicator" :style="indicatorStyle" />
    <span class="product-sku__text">{{ sku }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sku: string
  indicator?: string | null
}>()

const indicatorStyle = computed(() => ({
  backgroundColor: props.indicator || '#94a3b8',
}))
</script>

<style scoped>
.product-sku {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.product-sku__indicator {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.8);
  box-shadow: 0 0 0 1px rgb(15 23 42 / 0.08);
}

.product-sku__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: #0f172a;
}
</style>
