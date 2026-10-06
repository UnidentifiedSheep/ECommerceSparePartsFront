<template>
  <el-popover
    ref="popoverRef"
    trigger="click"
    placement="bottom-start"
    width="auto"
    :show-arrow="false"
    :popper-style="{ padding: '4px' }"
    popper-class="sale-actions-popover"
    @hide="handleMenuHide"
  >
    <el-cascader-panel
      :key="panelVersion"
      class="sale-actions-panel"
      :model-value="null"
      :options="menuOptions"
      :props="menuProps"
      @expand-change="handleExpand"
      @change="handleAction"
    >
      <template #default="{ data }">
        <span class="sale-menu-label">
          <el-icon v-if="data.value === 'print'"><Printer /></el-icon>
          <el-icon v-else-if="data.value === 'edit'"><Edit /></el-icon>
          <el-icon v-else-if="data.value === 'delete'"><Delete /></el-icon>
          {{ data.label }}
        </span>
      </template>
    </el-cascader-panel>
    <template #reference>
      <el-button
        class="sale-actions-trigger"
        :icon="MoreFilled"
        size="small"
        plain
        :aria-label="t('common.labels.actions')"
        :loading="busy || printing"
      />
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Delete, Edit, MoreFilled, Printer } from '@element-plus/icons-vue'
import type { DocumentType } from '@/graphql/generated/graphql.ts'
import { createSingleSaleDocumentRequest, getSingleSaleDocumentTypes } from '@/services/graphql/documents.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  saleId: string
  canPrint: boolean
  canEdit: boolean
  canDelete: boolean
  deleted: boolean
  busy: boolean
}>()
const emit = defineEmits<{ edit: []; delete: [] }>()
const { t } = useI18n()
const popoverRef = ref<{ hide: () => void } | null>(null)
const panelVersion = ref(0)
const formats = ref<DocumentType[]>([])
const loadingFormats = ref(false)
const formatsLoaded = ref(false)
const loadError = ref('')
const printing = ref(false)
const menuProps = { expandTrigger: 'hover' as const, emitPath: false, showPrefix: false, hoverThreshold: 100 }
let loadVersion = 0

const menuOptions = computed(() => {
  const options: Array<{ value: string; label: string; disabled?: boolean; children?: Array<{ value: string; label: string; disabled?: boolean }> }> = []

  if (props.canPrint) {
    const children = loadingFormats.value || !formatsLoaded.value && !loadError.value
      ? [{ value: 'loading', label: t('documents.loadingFormats'), disabled: true }]
      : loadError.value
        ? [{ value: 'retry', label: t('documents.retry') }]
        : formats.value.length
          ? formats.value.map((format) => ({ value: `format:${format}`, label: format }))
          : [{ value: 'empty', label: t('documents.noFormats'), disabled: true }]
    options.push({ value: 'print', label: t('sales.printDocument'), children })
  }
  if (props.canEdit) options.push({ value: 'edit', label: t('common.actions.edit'), disabled: props.deleted })
  if (props.canDelete) options.push({ value: 'delete', label: t('common.actions.delete'), disabled: props.deleted })

  return options
})

function handleExpand(path: Array<string | number>) {
  if (path[0] === 'print' && !formatsLoaded.value && !loadingFormats.value && !loadError.value) void loadFormats()
}

async function loadFormats() {
  const version = ++loadVersion
  loadingFormats.value = true
  loadError.value = ''
  try {
    const supported = await getSingleSaleDocumentTypes()
    if (version === loadVersion) {
      formats.value = supported
      formatsLoaded.value = true
    }
  } catch (error) {
    if (version === loadVersion) loadError.value = error instanceof Error ? error.message : t('documents.loadError')
  } finally {
    if (version === loadVersion) loadingFormats.value = false
  }
}

function handleAction(value: unknown) {
  if (typeof value !== 'string') return
  if (value === 'retry') {
    void loadFormats()
    return
  }
  if (value === 'edit' && props.canEdit && !props.deleted) {
    popoverRef.value?.hide()
    emit('edit')
  } else if (value === 'delete' && props.canDelete && !props.deleted) {
    popoverRef.value?.hide()
    emit('delete')
  } else if (value.startsWith('format:') && props.canPrint) {
    const format = formats.value.find((item) => item === value.slice(7))
    if (format) {
      popoverRef.value?.hide()
      void printDocument(format)
    }
  }
}

function handleMenuHide() {
  ++loadVersion
  formats.value = []
  loadingFormats.value = false
  formatsLoaded.value = false
  loadError.value = ''
  ++panelVersion.value
}

async function printDocument(format: DocumentType) {
  if (printing.value) return
  printing.value = true
  try {
    await createSingleSaleDocumentRequest(props.saleId, format)
    ElNotification({ title: t('common.labels.success'), message: t('documents.requestSubmitted'), type: 'success' })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('documents.generateError'))
  } finally {
    printing.value = false
  }
}

onBeforeUnmount(() => { ++loadVersion })
</script>

<style scoped>
.sale-actions-trigger { width: 30px; height: 30px; padding: 0; }
.sale-actions-panel { border: 0; box-shadow: none; }
.sale-actions-panel :deep(.el-cascader-menu) { width: 190px; min-width: 190px; height: auto; min-height: 0; }
.sale-actions-panel :deep(.el-cascader-menu__wrap.el-scrollbar__wrap) { height: auto; max-height: 240px; }
.sale-actions-panel :deep(.el-cascader-menu__list) { min-height: 0; }
.sale-actions-panel :deep(.el-cascader-node) { height: 34px; padding: 0 10px; }
.sale-actions-panel :deep(.el-cascader-node__label) { padding: 0; }
.sale-menu-label { display: inline-flex; align-items: center; gap: 8px; }
.sale-menu-label .el-icon { flex: none; font-size: 14px; }
</style>
