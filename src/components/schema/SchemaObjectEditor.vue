<template>
  <div class="schema-object-editor">
    <fieldset v-for="(row, index) in rows" :key="keys[index]">
      <legend v-if="multiple">{{ t('schemaInputs.item', { index: index + 1 }) }}</legend>
      <slot :row="row" :update="(name, value) => update(index, name, value)" />
      <el-button v-if="multiple || !required" link type="danger" @click="remove(index)">
        {{ t('common.actions.delete') }}
      </el-button>
    </fieldset>
    <el-button v-if="multiple || !rows.length" size="small" plain @click="add">
      {{ t('common.actions.add') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/i18n'
import type { SchemaField } from '@/models/schemaModel'
import type { FieldValue } from './DynamicSchemaForm.vue'

type Row = Record<string, unknown>
const props = defineProps<{ field: SchemaField; value: FieldValue }>()
const emit = defineEmits<{ change: [value: FieldValue] }>()
defineSlots<{ default(props: { row: Row; update: (name: string, value: unknown) => void }): unknown }>()
const { t } = useI18n()
const multiple = computed(() => props.field.type === 'Array')
const required = computed(() => props.field.required)
const rows = computed<Row[]>(() => {
  if (typeof props.value !== 'string' || !props.value.trim()) return []
  try {
    const parsed: unknown = JSON.parse(props.value)
    const items = multiple.value ? parsed : [parsed]
    return Array.isArray(items)
      ? items.filter((item): item is Row => item !== null && typeof item === 'object' && !Array.isArray(item))
      : []
  } catch {
    return []
  }
})

const keys = ref<number[]>([])
let nextKey = 0
watch(() => rows.value.length, (length) => {
  keys.value = Array.from({ length }, (_, index) => keys.value[index] ?? nextKey++)
}, { immediate: true })

function publish(next: Row[]) {
  emit('change', multiple.value ? JSON.stringify(next) : next[0] ? JSON.stringify(next[0]) : null)
}
function add() {
  publish([...rows.value, {}])
}
function remove(index: number) {
  keys.value.splice(index, 1)
  publish(rows.value.filter((_, position) => position !== index))
}
function update(index: number, name: string, value: unknown) {
  publish(rows.value.map((row, position) => position === index ? { ...row, [name]: value } : row))
}
</script>

<style scoped>
.schema-object-editor { display: grid; gap: 10px; width: 100%; min-width: 0; }
.schema-object-editor > .el-button { justify-self: start; }
fieldset { min-width: 0; margin: 0; padding: 10px 12px; border: 1px solid var(--app-border); border-radius: 6px; }
legend { padding-inline: 4px; font-weight: 600; }
</style>
