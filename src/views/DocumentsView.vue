<template>
  <div class="documents-page">
    <PageHeader :title="t('documents.title')" :description="t('documents.description')">
      <template #actions><el-button plain :loading="loading" @click="loadDefinitions()">{{ t('common.actions.refresh') }}</el-button></template>
    </PageHeader>

    <el-alert v-if="loadError" type="error" :title="loadError" show-icon :closable="false" class="documents-alert" />
    <div v-loading="loading" class="documents-layout">
      <section class="documents-list" :aria-label="t('documents.available')">
        <div class="documents-section-title">{{ t('documents.available') }}</div>
        <div class="documents-list__items">
          <el-empty v-if="!loading && definitions.length === 0" :description="t('documents.empty')" />
          <button
            v-for="definition in definitions"
            :key="definition.systemName"
            type="button"
            class="document-option"
            :class="{ 'document-option--selected': selected?.systemName === definition.systemName }"
            :aria-current="selected?.systemName === definition.systemName ? 'true' : undefined"
            @click="selectDefinition(definition)"
          >
            <span class="document-option__name">{{ definition.name }}</span>
            <span class="document-option__description">{{ definition.description }}</span>
            <span class="document-option__meta">{{ definition.documentGroup }} · {{ definition.supportedDocumentTypes.join(', ') }}</span>
          </button>
        </div>
      </section>

      <section class="documents-form" :aria-label="t('documents.form')">
        <template v-if="selected">
          <div class="documents-form__heading">
            <div><h2>{{ selected.name }}</h2><p>{{ selected.description }}</p></div>
          </div>
          <el-form class="documents-form__form" label-position="top" @submit.prevent="generate">
            <div class="documents-form__fields">
              <el-alert v-if="unsupportedFields.length" type="warning" :title="t('documents.unsupportedFields', { fields: unsupportedFields.join(', ') })" :closable="false" class="documents-alert" show-icon />
              <div class="documents-form__fields-inner">
                <el-form-item :label="t('documents.format')" required>
                  <el-select v-model="documentType" class="documents-field" :placeholder="t('documents.selectFormat')">
                    <el-option v-for="type in selected.supportedDocumentTypes" :key="type" :label="type" :value="type" />
                  </el-select>
                </el-form-item>
                <DynamicSchemaForm
                  :fields="formFields"
                  :model-value="fieldValues"
                  :empty-text="t('documents.noFields')"
                  :is-supported-selector="isSaleSelector"
                  :is-selector-loading="() => salesLoading"
                  :selector-options="() => saleOptions"
                  :selector-option-value="(_field, sale) => sale.id"
                  :selector-option-label="(_field, sale) => saleLabel(sale)"
                  :search-selector-options="(_field, query) => searchSales(query)"
                  :load-selector-options-on-open="(_field, open) => { if (open && !saleOptions.length) searchSales('') }"
                  @update-field="(name, value) => fieldValues[name] = value"
                />
              </div>
            </div>
            <div class="documents-form__actions">
              <el-button type="primary" native-type="submit" :loading="generating" :disabled="Boolean(unsupportedFields.length)">{{ t('documents.generate') }}</el-button>
            </div>
          </el-form>
        </template>
        <el-empty v-else :description="t('documents.choose')" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import DynamicSchemaForm from '@/components/schema/DynamicSchemaForm.vue'
import type { FieldValue } from '@/components/schema/DynamicSchemaForm.vue'
import type { SchemaUiField, SchemaInputControl, SchemaValueType } from '@/models/schemaModel.ts'
import { getSales, getSale } from '@/services/api/sales.ts'
import type { SaleModel } from '@/models/saleModel.ts'
import { createDocumentGenerationRequest, getAvailableDocuments, type DocumentDefinition } from '@/services/graphql/documents.ts'
import { getAcceptLanguage, useI18n } from '@/i18n'
import { formatLocalDateTime } from '@/utils/dateTime.ts'

const { t, locale } = useI18n()
const route = useRoute()
const definitions = ref<DocumentDefinition[]>([])
const selected = ref<DocumentDefinition | null>(null)
const documentType = ref<string>('')
const fieldValues = reactive<Record<string, FieldValue>>({})
const saleOptions = ref<SaleModel[]>([])
const salesLoading = ref(false)
const loading = ref(false)
const generating = ref(false)
const loadError = ref('')
let saleSearchVersion = 0

const controlMap: Record<string, SchemaInputControl> = {
  UPLOAD_FILE: 'UploadFile', TEXT_FIELD: 'TextField', DATE_PICKER: 'DatePicker',
  ENTITY_SELECTOR: 'EntitySelector', ENUM_SELECTOR: 'EnumSelector', NAMED_OBJECT_SELECTOR: 'NamedObjectSelector',
}
const typeMap: Record<string, SchemaValueType> = {
  STRING: 'String', BOOLEAN: 'Boolean', INTEGER: 'Integer', NUMBER: 'Number',
  ENUM: 'Enum', ARRAY: 'Array', OBJECT: 'Object',
}
const documentTypeValue: Record<string, string> = { PDF: 'Pdf', EXCEL: 'Excel', HTML: 'Html', DOCX: 'Docx' }
const schemaFields = computed(() => selected.value?.requestSchema.fields.filter((field) => field.name !== 'documentType' && field.name !== 'culture') ?? [])
const unsupportedFields = computed(() => schemaFields.value
  .filter((field) => field.nestedSchema || field.type === 'ARRAY' || field.type === 'OBJECT' || field.control === 'UPLOAD_FILE'
    || ((field.control === 'ENTITY_SELECTOR' || field.control === 'ENUM_SELECTOR' || field.control === 'NAMED_OBJECT_SELECTOR')
      && !isSaleDependency(field)))
  .map((field) => field.label || field.name))
const formFields = computed<SchemaUiField[]>(() => schemaFields.value.map((field) => ({
  name: field.name,
  type: typeMap[field.type] ?? 'String',
  control: field.control ? controlMap[field.control] ?? null : null,
  label: field.label,
  labelKey: field.labelKey,
  description: field.description,
  descriptionKey: field.descriptionKey,
  required: field.required,
  accepts: field.accepts,
  dependency: field.dependency,
  dependsOnEntity: field.dependency?.entityName,
  dependsOnField: field.dependency?.fieldName ?? undefined,
})))

function isSaleDependency(field: { dependency?: { entityName: string; fieldName?: string | null } | null }) {
  return field.dependency?.entityName === 'Sale' && field.dependency.fieldName === 'id'
}
function isSaleSelector(field: SchemaUiField) { return isSaleDependency(field) }
function saleLabel(sale: SaleModel) {
  return `${formatLocalDateTime(sale.saleDatetime)} · ${sale.organization.name} · ${sale.totalSum} ${sale.currency.currencySign}`
}
async function searchSales(query: string) {
  const version = ++saleSearchVersion
  salesLoading.value = true
  try {
    const result = await getSales({ page: 0, limit: 20, searchTerm: query.trim() || undefined })
    if (version === saleSearchVersion) saleOptions.value = result.sales
  } catch (error) {
    if (version === saleSearchVersion) ElMessage.error(error instanceof Error ? error.message : t('documents.salesError'))
  } finally {
    if (version === saleSearchVersion) salesLoading.value = false
  }
}
function selectDefinition(definition: DocumentDefinition) {
  selected.value = definition
  documentType.value = definition.supportedDocumentTypes[0] ?? ''
  Object.keys(fieldValues).forEach((key) => delete fieldValues[key])
  if (definition.requestSchema.fields.some((field) => isSaleDependency(field)) && typeof route.query.saleId === 'string') {
    const field = definition.requestSchema.fields.find((item) => isSaleDependency(item))!
    fieldValues[field.name] = route.query.saleId
    void getSale(route.query.saleId).then((result) => {
      if (!saleOptions.value.some((sale) => sale.id === result.sale.id)) saleOptions.value.unshift(result.sale)
    }).catch(() => undefined)
  }
}
async function loadDefinitions(preserveForm = false) {
  loading.value = true
  loadError.value = ''
  try {
    definitions.value = await getAvailableDocuments()
    const current = definitions.value.find((item) => item.systemName === selected.value?.systemName)
      ?? definitions.value.find((item) => item.systemName === route.query.systemName)
      ?? definitions.value[0]
    if (current) {
      if (preserveForm && current.systemName === selected.value?.systemName) selected.value = current
      else selectDefinition(current)
    }
    else selected.value = null
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : t('documents.loadError')
  } finally { loading.value = false }
}
async function generate() {
  if (!selected.value || !documentType.value || unsupportedFields.value.length) return
  const request: Record<string, unknown> = {
    documentType: documentTypeValue[documentType.value],
    culture: getAcceptLanguage(),
  }
  for (const field of schemaFields.value) {
    const value = fieldValues[field.name]
    if (field.required && (value === undefined || value === null || value === '')) {
      ElMessage.warning(t('documents.requiredField', { field: field.label || field.name }))
      return
    }
    if (value !== undefined && value !== null && value !== '') request[field.name] = value
  }
  generating.value = true
  try {
    await createDocumentGenerationRequest(selected.value.systemName, request)
    ElNotification({
      title: t('common.labels.success'),
      message: t('documents.requestSubmitted'),
      type: 'success',
    })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('documents.generateError'))
  } finally { generating.value = false }
}
watch(locale, () => { void loadDefinitions(true) })
onMounted(() => { void loadDefinitions() })
</script>

<style scoped>
.documents-page { display: flex; height: calc(100dvh - 56px); min-height: 0; flex-direction: column; overflow: hidden; }
.documents-page > :deep(.page-header) { flex: 0 0 auto; }
.documents-layout { display: grid; flex: 1; min-height: 0; grid-template-columns: minmax(270px, 320px) minmax(0, 1fr); overflow: hidden; margin: 16px 24px 24px; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-surface); }
.documents-list { display: grid; min-width: 0; min-height: 0; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; border-right: 1px solid var(--app-border); }
.documents-section-title { padding: 16px 18px; border-bottom: 1px solid var(--app-border); color: var(--el-text-color-secondary); font-size: 13px; font-weight: 650; }
.documents-list__items { min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.document-option { display: flex; flex-direction: column; gap: 5px; width: 100%; border: 0; border-bottom: 1px solid var(--app-border); background: transparent; padding: 15px 18px; cursor: pointer; text-align: left; }
.document-option:hover { background: var(--app-bg-soft); }
.document-option--selected, .document-option--selected:hover { background: var(--app-primary-soft); box-shadow: inset 3px 0 0 var(--app-primary); }
.document-option:focus-visible { outline: 2px solid var(--app-primary); outline-offset: -2px; }
.document-option__name { color: var(--el-text-color-primary); font-weight: 650; }
.document-option__description, .document-option__meta { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.45; }
.document-option__meta { margin-top: 3px; }
.documents-form { display: flex; min-width: 0; min-height: 0; flex-direction: column; overflow: hidden; }
.documents-form__heading { flex: 0 0 auto; border-bottom: 1px solid var(--app-border); padding: 18px 24px; }
.documents-form__heading h2 { margin: 0 0 4px; color: var(--app-text); font-size: 18px; font-weight: 650; }
.documents-form__heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.documents-form__form { display: grid; flex: 1; min-height: 0; grid-template-rows: minmax(0, 1fr) auto; }
.documents-form__fields { min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; padding: 22px 24px; }
.documents-form__fields-inner { max-width: 760px; }
.documents-field { width: 100%; }
.documents-form__actions { display: flex; justify-content: flex-end; border-top: 1px solid var(--app-border); background: var(--app-surface); padding: 12px 24px; }
.documents-alert { margin: 16px 24px 0; }
.documents-form__fields .documents-alert { margin: 0 0 16px; }
@media (max-width: 760px) {
  .documents-page { height: auto; min-height: calc(100dvh - 56px); overflow: visible; }
  .documents-layout { display: flex; min-height: 0; flex-direction: column; overflow: visible; margin: 14px 16px 18px; }
  .documents-list { min-height: 0; border-right: 0; border-bottom: 1px solid var(--app-border); }
  .documents-list__items { max-height: 250px; }
  .documents-form { overflow: visible; }
  .documents-form__form { display: block; }
  .documents-form__fields { overflow: visible; padding: 18px; }
  .documents-form__heading { padding: 16px 18px; }
  .documents-form__actions { padding: 12px 18px; }
}
</style>
