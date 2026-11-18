<template>
  <template v-if="reference"><RouterLink :to="reference.to">{{ reference.label }}</RouterLink><small v-if="reference.description">{{ reference.description }}</small></template>
  <AnalysisSchemaValue v-else :field="field" :value="value" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SchemaField } from '@/models/schemaModel'
import type { AnalysisDataPoint } from '@/services/api/analytics'
import { analysisReference } from '@/utils/analysisReferences'
import AnalysisSchemaValue from './AnalysisSchemaValue.vue'
const props = defineProps<{ point: AnalysisDataPoint; field: SchemaField; value: unknown }>()
const reference = computed(() => analysisReference(props.point, props.field.name, props.value))
</script>
