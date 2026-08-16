<template>
  <span class="search-highlighted-text">
    <template v-for="(segment, index) in segments" :key="index">
      <mark v-if="segment.highlighted" class="search-highlight">{{ segment.text }}</mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
}>()

interface TextSegment {
  text: string
  highlighted: boolean
}

const markerStart = '[[['
const markerEnd = ']]]'

const segments = computed<TextSegment[]>(() => {
  const result: TextSegment[] = []
  let cursor = 0

  while (cursor < props.text.length) {
    const start = props.text.indexOf(markerStart, cursor)
    if (start < 0) {
      result.push({ text: props.text.slice(cursor), highlighted: false })
      break
    }

    if (start > cursor) {
      result.push({ text: props.text.slice(cursor, start), highlighted: false })
    }

    const contentStart = start + markerStart.length
    const end = props.text.indexOf(markerEnd, contentStart)
    if (end < 0) {
      result.push({ text: props.text.slice(start), highlighted: false })
      break
    }

    result.push({ text: props.text.slice(contentStart, end), highlighted: true })
    cursor = end + markerEnd.length
  }

  return result.length > 0 ? result : [{ text: props.text, highlighted: false }]
})
</script>

<style scoped>
.search-highlighted-text {
  display: inline;
}

.search-highlight {
  border-radius: 2px;
  background: #dff4e8;
  padding: 0 1px;
  color: #065f46;
  font: inherit;
  font-weight: 700;
}
</style>
