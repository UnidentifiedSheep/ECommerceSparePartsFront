<template>
  <div class="dynamic-schema-form">
    <template v-if="fields.length > 0">
      <el-form-item
        v-for="field in fields"
        :key="field.name"
        :required="Boolean(field.required)"
        class="dynamic-schema-field"
      >
        <template #label>
          <span class="dynamic-schema-label">
            {{ fieldLabel(field) }}
            <el-tooltip v-if="field.description" :content="field.description" placement="top">
              <button type="button" class="dynamic-schema-help" :aria-label="field.description">
                <el-icon><InfoFilled /></el-icon>
              </button>
            </el-tooltip>
          </span>
        </template>

        <template v-if="field.control === 'UploadFile'">
          <div class="dynamic-upload">
            <el-select
              :model-value="modelValue[field.name]"
              filterable
              clearable
              :placeholder="t('common.placeholders.selectUploadedFile')"
              :loading="Boolean(uploadLoading)"
              class="w-full"
              @update:model-value="(value: FieldValue) => setFieldValue(field.name, value)"
              @visible-change="(isOpen: boolean) => emit('upload-visible-change', isOpen)"
            >
              <el-option
                v-for="file in uploadOptions(field)"
                :key="String(fileValue(file))"
                :label="fileLabel(file)"
                :value="fileValue(file)"
              >
                <div class="dynamic-upload-option">
                  <span>{{ fileLabel(file) }}</span>
                  <small v-if="fileMeta(file)">{{ fileMeta(file) }}</small>
                </div>
              </el-option>
            </el-select>

            <div class="dynamic-upload-actions">
              <input
                :ref="(el) => setFileInputRef(field.name, el)"
                type="file"
                class="dynamic-hidden-file-input"
                :accept="field.accepts?.join(',')"
                @change="(event) => handleFileChange(field, event)"
              />
              <el-button plain :loading="uploadingField === field.name" @click="chooseLocalFile(field.name)">
                {{ t('common.actions.uploadFile') }}
              </el-button>
              <el-button plain :loading="Boolean(uploadLoading)" @click="emit('refresh-uploads')">
                {{ t('common.actions.refreshList') }}
              </el-button>
              <el-button v-if="uploadsHasMore" plain :loading="Boolean(uploadLoading)" @click="emit('load-more-uploads')">
                {{ t('common.actions.loadMore') }}
              </el-button>
            </div>
          </div>
        </template>

        <el-input
          v-else-if="field.control === 'TextField'"
          :model-value="modelValue[field.name] as string | number | undefined"
          clearable
          :placeholder="field.description || field.name"
          @update:model-value="(value: string) => setFieldValue(field.name, value)"
        />

        <el-date-picker
          v-else-if="field.control === 'DatePicker'"
          :model-value="modelValue[field.name] as string | undefined"
          type="date"
          format="DD.MM.YYYY"
          value-format="YYYY-MM-DD"
          :teleported="false"
          class="w-full"
          :placeholder="field.description || field.name"
          @update:model-value="(value: string | null) => setFieldValue(field.name, value)"
        />

        <template v-else-if="isSelectorControl(field)">
          <el-select
            v-if="isSupportedSelector(field)"
            :model-value="modelValue[field.name]"
            filterable
            clearable
            :remote="field.dependsOnEntity === 'Product'"
            :remote-method="(query: string) => searchSelectorOptions(field, query)"
            class="w-full"
            :loading="isSelectorLoading(field)"
            :placeholder="field.description || field.name"
            :teleported="false"
            :popper-class="selectorPopperClass(field)"
            @update:model-value="(value: FieldValue) => setFieldValue(field.name, value)"
            @visible-change="(isOpen: boolean) => handleSelectorVisibleChange(field, isOpen)"
          >
            <el-option
              v-for="option in selectorOptions(field)"
              :key="String(selectorOptionValue(field, option))"
              :label="selectorOptionLabel(field, option)"
              :value="selectorOptionValue(field, option)"
            />
          </el-select>
          <el-input
            v-else
            :model-value="modelValue[field.name] as string | number | undefined"
            :placeholder="field.description || field.name"
            @update:model-value="(value: string) => setFieldValue(field.name, value)"
          />
        </template>

        <el-switch
          v-else-if="field.type === 'boolean'"
          :model-value="Boolean(modelValue[field.name])"
          @update:model-value="(value: boolean) => setFieldValue(field.name, value)"
        />

        <el-input-number
          v-else-if="isNumberField(field)"
          :model-value="modelValue[field.name] as number | undefined"
          class="w-full"
          controls-position="right"
          @update:model-value="(value: number | null) => setFieldValue(field.name, value)"
        />

        <el-input
          v-else
          :model-value="modelValue[field.name] as string | number | undefined"
          :placeholder="field.description || field.name"
          @update:model-value="(value: string) => setFieldValue(field.name, value)"
        />

      </el-form-item>
    </template>

    <el-empty v-else :description="emptyText" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { attachSelectDropdownInfiniteScroll } from '@/composables/useSelectInfiniteScroll.ts'
import { useI18n } from '@/i18n'

export type FieldValue = string | number | boolean | null

export interface DynamicSchemaField {
  name: string
  type: string
  label?: string
  description?: string
  required?: boolean
  control?: string
  dependsOnEntity?: string
  dependsOnField?: string
  accepts?: string[]
}

type SelectorOption = any
type UploadOption = any

const props = withDefaults(defineProps<{
  fields: DynamicSchemaField[]
  modelValue: Record<string, FieldValue>
  emptyText: string
  uploadFiles?: UploadOption[]
  uploadLoading?: boolean
  uploadingField?: string | null
  uploadsHasMore?: boolean
  isSupportedSelector?: (field: DynamicSchemaField) => boolean
  isSelectorLoading?: (field: DynamicSchemaField) => boolean
  selectorOptions?: (field: DynamicSchemaField) => SelectorOption[]
  selectorOptionValue?: (field: DynamicSchemaField, option: SelectorOption) => string | number
  selectorOptionLabel?: (field: DynamicSchemaField, option: SelectorOption) => string
  searchSelectorOptions?: (field: DynamicSchemaField, query: string) => void
  loadSelectorOptionsOnOpen?: (field: DynamicSchemaField, isOpen: boolean) => void | Promise<void>
  loadMoreSelectorOptions?: (field: DynamicSchemaField) => void | Promise<void>
}>(), {
  uploadFiles: () => [],
  uploadLoading: false,
  uploadingField: null,
  uploadsHasMore: false,
  isSupportedSelector: () => false,
  isSelectorLoading: () => false,
  selectorOptions: () => [],
  selectorOptionValue: (_field, option) => String(option.value ?? option.id ?? ''),
  selectorOptionLabel: (_field, option) => String(option.label ?? option.name ?? option.value ?? option.id ?? ''),
  searchSelectorOptions: () => undefined,
  loadSelectorOptionsOnOpen: () => undefined,
  loadMoreSelectorOptions: undefined,
})

const emit = defineEmits<{
  'update-field': [name: string, value: FieldValue]
  'upload-file': [field: DynamicSchemaField, file: File]
  'upload-visible-change': [isOpen: boolean]
  'refresh-uploads': []
  'load-more-uploads': []
  'selector-load-more': [field: DynamicSchemaField]
}>()

const { t } = useI18n()
const fileInputRefs = new Map<string, HTMLInputElement>()
const selectorPopperPrefix = `dynamic-schema-selector-${Math.random().toString(36).slice(2)}`
const selectorScrollCleanups = new Map<string, () => void>()

onBeforeUnmount(() => {
  selectorScrollCleanups.forEach((cleanup) => cleanup())
  selectorScrollCleanups.clear()
})

function fieldLabel(field: DynamicSchemaField) {
  return field.label || field.name
}

function isSelectorControl(field: DynamicSchemaField) {
  return field.control === 'EntitySelector'
    || field.control === 'EnumSelector'
    || field.control === 'NamedObjectSelector'
}

function isNumberField(field: DynamicSchemaField) {
  if (['TextField', 'DatePicker', 'EntitySelector', 'EnumSelector', 'NamedObjectSelector'].includes(field.control ?? '')) {
    return false
  }
  return ['int', 'integer', 'long', 'float', 'double', 'decimal', 'number'].includes(field.type.toLowerCase())
}

function uploadOptions(field: DynamicSchemaField) {
  const accepts = field.accepts?.map((item) => item.toLowerCase()) ?? []
  if (accepts.length === 0) return props.uploadFiles

  return props.uploadFiles.filter((file) => accepts.some((accept) => fileLabel(file).toLowerCase().endsWith(accept)))
}

function fileValue(file: UploadOption) {
  return String(file.key ?? file.name ?? file.id ?? '')
}

function fileLabel(file: UploadOption) {
  return String(file.key ?? file.name ?? file.id ?? '')
}

function fileMeta(file: UploadOption) {
  if (typeof file.size !== 'number') return ''

  const units = ['B', 'KB', 'MB', 'GB']
  let value = file.size
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function setFieldValue(name: string, value: FieldValue) {
  emit('update-field', name, value)
}

function selectorPopperClass(field: DynamicSchemaField) {
  return `${selectorPopperPrefix}-${field.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

async function handleSelectorVisibleChange(field: DynamicSchemaField, isOpen: boolean) {
  await props.loadSelectorOptionsOnOpen(field, isOpen)

  selectorScrollCleanups.get(field.name)?.()
  selectorScrollCleanups.delete(field.name)

  if (!isOpen) return

  const cleanup = await attachSelectDropdownInfiniteScroll(
    selectorPopperClass(field),
    () => {
      if (props.loadMoreSelectorOptions) {
        return props.loadMoreSelectorOptions(field)
      }
      emit('selector-load-more', field)
    },
  )
  selectorScrollCleanups.set(field.name, cleanup)
}

function setFileInputRef(fieldName: string, el: unknown) {
  if (el instanceof HTMLInputElement) {
    fileInputRefs.set(fieldName, el)
  }
}

function chooseLocalFile(fieldName: string) {
  fileInputRefs.get(fieldName)?.click()
}

function handleFileChange(field: DynamicSchemaField, event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  emit('upload-file', field, file)
}
</script>

<style scoped>
.dynamic-schema-form {
  display: grid;
  gap: 0;
}

.dynamic-schema-field {
  margin-bottom: 18px;
}

.dynamic-schema-field:last-child {
  margin-bottom: 0;
}

.dynamic-schema-field :deep(.el-form-item__content) {
  display: block;
}

.dynamic-schema-field :deep(.el-select),
.dynamic-schema-field :deep(.el-date-editor),
.dynamic-schema-field :deep(.el-input-number) {
  width: 100%;
}

.dynamic-schema-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dynamic-schema-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #94a3b8;
  cursor: help;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.dynamic-schema-help:hover {
  color: #475569;
}

.dynamic-upload {
  display: grid;
  gap: 10px;
}

.dynamic-upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dynamic-upload-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.dynamic-upload-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dynamic-upload-option small {
  color: #94a3b8;
}

.dynamic-hidden-file-input {
  display: none;
}
</style>
