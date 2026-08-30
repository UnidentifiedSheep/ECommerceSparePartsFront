<template>
  <button
    class="sortable-column-header"
    type="button"
    :title="title"
    :disabled="disabled"
    @click="emit('toggle', field, $event)"
  >
    {{ label }}
    <span v-if="direction">{{ direction === 'asc' ? '↑' : '↓' }}{{ priority }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { sortField } from '@/composables/useMultiSort.ts'

const props = withDefaults(defineProps<{
  label: string
  field: string
  sortBy: string[]
  title?: string
  disabled?: boolean
}>(), {
  title: undefined,
  disabled: false,
})

const emit = defineEmits<{ toggle: [field: string, event: MouseEvent] }>()

const currentIndex = computed(() => props.sortBy.findIndex(
  (item) => sortField(item) === props.field,
))
const current = computed(() => props.sortBy[currentIndex.value])
const direction = computed(() => {
  if (!current.value) return undefined
  return current.value.startsWith('-') || current.value.endsWith('_desc') ? 'desc' : 'asc'
})
const priority = computed(() => (
  currentIndex.value >= 0 && props.sortBy.length > 1 ? currentIndex.value + 1 : ''
))
</script>

<style scoped>
.sortable-column-header { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; padding: 0; color: inherit; font: inherit; cursor: pointer; }
.sortable-column-header:hover, .sortable-column-header:focus-visible { color: #0f172a; }
.sortable-column-header:focus-visible { outline: 2px solid #86bda4; outline-offset: 3px; }
.sortable-column-header span { color: #047857; font-variant-numeric: tabular-nums; font-weight: 750; }
.sortable-column-header:disabled { color: #94a3b8; cursor: default; }
</style>
