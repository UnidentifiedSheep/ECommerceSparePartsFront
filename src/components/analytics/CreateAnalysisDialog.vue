<template>
  <el-dialog v-model="open" :title="t('analysisCreate.title')" width="min(720px, 96vw)" :before-close="guard.beforeClose">
    <el-form label-position="top" :disabled="saving" @submit.prevent="submit">
      <el-form-item :label="t('analyticsRuns.analysisType')" required>
        <el-select v-model="selectedType" :placeholder="t('analyticsRuns.analysisType')" :disabled="saving"><el-option v-for="item in definitions" :key="item.systemName" :label="item.name" :value="item.systemName" /></el-select>
      </el-form-item>
      <DataLoadError v-if="error" :error="error" @retry="loadDefinition" />
      <div v-loading="loading" class="analysis-create-form">
        <p v-if="definition" class="analysis-create-description">{{ definition.description }}</p>
        <DynamicSchemaForm :fields="fields" :model-value="values" :empty-text="t('analysisCreate.selectType')" @update-field="(name, value) => values[name] = value" />
        <div v-if="windowValidation" aria-live="polite">
          <p v-if="windowValidation.periods !== null" class="analysis-create-description">{{ t('analysisCreate.windowPeriods', { count: windowValidation.periods }) }}</p>
          <el-alert v-if="windowValidation.error" type="warning" :closable="false" :title="t(`analysisCreate.${windowValidation.error}`, { count: windowValidation.periods ?? 0 })" />
        </div>
      </div>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="guard.requestClose">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!definition || loading || !!error || !canCreate || !!windowValidation?.error" @click="submit">{{ t('analysisCreate.submit') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onScopeDispose, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import DynamicSchemaForm, { type FieldValue } from '@/components/schema/DynamicSchemaForm.vue'
import DataLoadError from '@/components/common/DataLoadError.vue'
import { getAnalysisDefinition, type AnalysisConfiguration, type AnalysisDefinition } from '@/services/api/analytics'
import { createServiceJob, type JobModel } from '@/services/api/jobs'
import { useDialogGuard } from '@/composables/useDialogGuard'
import { usePermissions } from '@/composables/usePermissions'
import { useI18n } from '@/i18n'
import { toSchemaUiFields } from '@/models/schemaModel'
import { analysisFormDefaults, serializeAnalysisForm, isEmptyAnalysisValue, abcXyzWindow } from '@/utils/analysisForm'
import { parseSchemaInputValue } from '@/utils/schemaInputs'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'

const props = defineProps<{ definitions: AnalysisDefinition[] }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [value: { job: JobModel; analysisType: string; name: string }] }>()
const { t } = useI18n()
const { hasPermission } = usePermissions()
const canCreate = computed(() => hasPermission('CHARTS_GET') && hasPermission('JOBS_CREATE'))
const selectedType = ref('')
const definition = shallowRef<AnalysisConfiguration | null>(null)
const fields = computed(() => definition.value ? toSchemaUiFields(definition.value.parametersSchema.fields) : [])
const values = reactive<Record<string, FieldValue>>({})
const windowValidation = computed(() => definition.value?.systemName === 'AbcXyz' ? abcXyzWindow(values) : null)
const loading = ref(false), saving = ref(false)
const error = ref<DataLoadErrorKind | null>(null)
let requestId = 0
let controller: AbortController | undefined
const guard = useDialogGuard(open, saving, () => [selectedType.value, values])
onScopeDispose(() => { ++requestId; controller?.abort() })

async function loadDefinition() {
  const request = ++requestId
  controller?.abort()
  definition.value = null; error.value = null; loading.value = false
  for (const name of Object.keys(values)) delete values[name]
  if (!open.value || !selectedType.value || !canCreate.value) return
  controller = new AbortController()
  loading.value = true
  try {
    const result = await getAnalysisDefinition(selectedType.value, controller.signal)
    if (request !== requestId) return
    if (!result) { error.value = 'failed'; return }
    definition.value = result
    Object.assign(values, analysisFormDefaults(result.systemName, result.parametersSchema.fields))
    await nextTick()
    if (request === requestId) guard.markClean()
  } catch (cause) { if (request === requestId) error.value = classifyDataLoadError(cause) }
  finally { if (request === requestId) loading.value = false }
}
watch(open, (value) => {
  if (value) {
    const type = props.definitions[0]?.systemName || ''
    if (selectedType.value === type) void loadDefinition()
    else selectedType.value = type
  } else { ++requestId; controller?.abort() }
})
watch(selectedType, () => { void loadDefinition() })

async function submit() {
  if (!canCreate.value || !definition.value || loading.value || saving.value || !open.value) return
  const invalid = fields.value.find(field => {
    if (isEmptyAnalysisValue(values[field.name])) return field.required
    try { parseSchemaInputValue(field, values[field.name]); return false } catch { return true }
  })
  if (invalid) { ElMessage.warning(t('schemaInputs.invalidField', { field: invalid.label || invalid.name })); return }
  if (windowValidation.value?.error) { ElMessage.warning(t(`analysisCreate.${windowValidation.value.error}`, { count: windowValidation.value.periods ?? 0 })); return }
  saving.value = true
  try {
    const inputState = serializeAnalysisForm(fields.value, values)
    const config = definition.value
    const result = await createServiceJob('main', { systemName: config.lrtSystemName, inputState, maxAttempts: 3 })
    emit('created', { job: result.job, analysisType: config.systemName, name: config.name })
    open.value = false
    ElMessage.success(t('analysisCreate.submitted'))
  } catch (cause) { ElMessage.error(cause instanceof Error ? cause.message : t('analysisCreate.failed')) }
  finally { saving.value = false }
}
</script>

<style scoped>
.analysis-create-description { color: var(--app-text-muted); font-size: 13px; margin: 0 0 16px; }
.analysis-create-form :deep(.dynamic-schema-form) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
@media (max-width: 540px) { .analysis-create-form :deep(.dynamic-schema-form) { grid-template-columns: 1fr; } }
</style>
