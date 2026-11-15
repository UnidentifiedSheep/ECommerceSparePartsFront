<template>
  <span><template v-for="(segment, index) in segments" :key="index"><mark v-if="segment.highlighted" class="query-highlight">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { queryMatchPreview, queryTextSegments } from '@/utils/queryHighlights'

const props = defineProps<{ text: string; query?: string; sku?: boolean; preview?: boolean }>()
const segments = computed(() => queryTextSegments(props.preview ? queryMatchPreview(props.text, props.query, 16) ?? props.text : props.text, props.query, props.sku))
</script>

<style scoped>
.query-highlight { border-radius: 2px; padding: 0 1px; background: #fde047; color: #422006; font: inherit; font-weight: 700; }
</style>
