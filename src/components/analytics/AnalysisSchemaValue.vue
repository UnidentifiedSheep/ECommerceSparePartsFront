<template>
  <span v-if="depth >= 8">{{ t('analysisSchema.tooDeep') }}</span>
  <span v-else-if="value == null">—</span>
  <div v-else-if="Array.isArray(value)" class="schema-array">
    <span v-if="value.length === 0">{{ t('analysisSchema.empty') }}</span>
    <table v-else-if="fields.length">
      <thead><tr><th v-for="column in fields" :key="column.name" scope="col">{{ column.label || column.name }}</th></tr></thead>
      <tbody><tr v-for="(entry, index) in value" :key="index"><td v-for="column in fields" :key="column.name"><AnalysisSchemaValue :value="property(entry, column.name)" :field="column" :depth="depth + 1" /></td></tr></tbody>
    </table>
    <ul v-else><li v-for="(entry, index) in value" :key="index"><AnalysisSchemaValue :value="entry" :field="field" :depth="depth + 1" /></li></ul>
  </div>
  <dl v-else-if="typeof value === 'object'" class="schema-values">
    <template v-for="column in objectFields" :key="column.name"><dt :title="column.description || undefined">{{ column.label || column.name }}</dt><dd><AnalysisSchemaValue :value="property(value, column.name)" :field="column" :depth="depth + 1" /></dd></template>
  </dl>
  <span v-else>{{ formatAnalysisValue(value, field) }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ObjectSchema, SchemaField } from '@/models/schemaModel'
import { useI18n } from '@/i18n'
import { formatAnalysisValue } from '@/utils/analysisSchema'
const props = withDefaults(defineProps<{ value: unknown; schema?: ObjectSchema; field?: SchemaField; depth?: number }>(), { schema: undefined, field: undefined, depth: 0 })
const { t } = useI18n()
const fields = computed(() => props.schema?.fields ?? props.field?.nestedSchema?.fields ?? [])
const objectFields = computed<SchemaField[]>(() => fields.value.length ? fields.value : Object.keys(props.value as object).map(name => ({ name, label: name, type: 'String', required: false, accepts: [] })))
function property(value: unknown, name: string): unknown { return value && typeof value === 'object' ? (value as Record<string, unknown>)[name] : undefined }
</script>

<style scoped>
.schema-values { display: grid; grid-template-columns: minmax(110px, 1fr) minmax(0, 2fr); gap: 8px 16px; margin: 0; font-size: 12px; }
.schema-values dt { color: var(--app-text-muted); }
.schema-values dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
.schema-array { min-width: 0; max-width: 100%; overflow: auto; }
.schema-array table { width: 100%; border-collapse: collapse; font-size: 12px; }
.schema-array th, .schema-array td { padding: 8px; text-align: left; border-bottom: 1px solid var(--app-border); white-space: nowrap; }
.schema-array th { color: var(--app-text-muted); }
.schema-array ul { margin: 0; padding-left: 18px; }
</style>
