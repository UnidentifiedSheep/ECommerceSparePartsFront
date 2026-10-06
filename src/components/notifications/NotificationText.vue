<template>
  <p class="notification-text">
    <template v-for="(part, index) in parts" :key="index">
      <a
        v-if="part.href"
        :href="part.href"
        :target="part.external ? '_blank' : undefined"
        rel="noopener noreferrer"
      >{{ part.text }}</a>
      <span v-else>{{ part.text }}</span>
    </template>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

interface TextPart {
  text: string
  href?: string
  external?: boolean
}

const parts = computed<TextPart[]>(() => {
  const result: TextPart[] = []
  const pattern = /https?:\/\/[^\s<>"']+/gi
  let cursor = 0

  for (const match of props.text.matchAll(pattern)) {
    const start = match.index
    if (start > cursor) result.push({ text: props.text.slice(cursor, start) })

    const matched = match[0]
    const address = matched.replace(/[.,!?;:)\]}]+$/, '')
    try {
      const url = new URL(address)
      if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname) {
        result.push({ text: address, href: url.href, external: url.origin !== window.location.origin })
      } else {
        result.push({ text: address })
      }
    } catch {
      result.push({ text: address })
    }

    if (address.length < matched.length) result.push({ text: matched.slice(address.length) })
    cursor = start + matched.length
  }

  if (cursor < props.text.length) result.push({ text: props.text.slice(cursor) })
  return result
})
</script>

<style scoped>
.notification-text { margin: 0 0 8px; color: var(--el-text-color-primary); white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
.notification-text a { color: var(--el-color-primary); text-decoration: underline; text-underline-offset: 2px; }
.notification-text a:hover { color: var(--el-color-primary-dark-2); }
.notification-text a:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
</style>
