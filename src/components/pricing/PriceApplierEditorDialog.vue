<template>
  <el-dialog
    v-model="visible"
    class="price-applier-editor"
    :title="isEditing ? t('priceAppliers.editRule') : t('priceAppliers.createRule')"
    width="min(1040px, calc(100vw - 24px))"
    top="3vh"
    destroy-on-close
    @closed="resetForm"
  >
    <el-form label-position="top" @submit.prevent>
      <el-form-item :label="t('common.labels.name')" required>
        <el-input
          v-model="form.name"
          maxlength="128"
          show-word-limit
          :placeholder="t('priceAppliers.namePlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('priceAppliers.systemName')" required>
        <el-input
          v-model="form.systemName"
          :disabled="isEditing"
          maxlength="128"
          :placeholder="t('priceAppliers.systemNamePlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('priceAppliers.builder.title')" required>
        <div class="builder-field">
          <div class="field-hint">{{ t('priceAppliers.builder.hint') }}</div>
          <JsonLogicBuilder v-model="logicRoot" />
          <el-collapse class="json-preview">
            <el-collapse-item name="json" :title="t('priceAppliers.builder.preview')">
              <pre>{{ dslLogic }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-form-item>

      <div class="usage-heading">{{ t('priceAppliers.usages') }}</div>
      <div class="usage-options">
        <label v-for="usage in usages" :key="usage" class="usage-option">
          <el-checkbox v-model="form.usages[usage]" />
          <span>
            <strong>{{ t(`priceAppliers.usage.${usage}`) }}</strong>
            <span>{{ t(`priceAppliers.usageDescription.${usage}`) }}</span>
          </span>
        </label>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="isSaving" @click="save">
        {{ t('common.actions.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
import JsonLogicBuilder from '@/components/pricing/JsonLogicBuilder.vue'
import {
  createNode,
  parseJsonLogic,
  serializeJsonLogic,
  type LogicNode,
} from '@/components/pricing/jsonLogicBuilder.ts'
import {
  PriceOfferSourceType,
  type PriceApplierModel,
  type UpsertPriceApplierStateModel,
  upsertPriceApplier,
} from '@/services/api/priceAppliers.ts'

const props = defineProps<{
  modelValue: boolean
  applier: PriceApplierModel | null
  initialUsage: PriceOfferSourceType
  suggestedOrders: Record<PriceOfferSourceType, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [applier: PriceApplierModel]
}>()

const { t } = useI18n()
const usages = [PriceOfferSourceType.Supplier, PriceOfferSourceType.OurWarehouse] as const
const isSaving = ref(false)
const logicRoot = ref<LogicNode>(createNode('variable'))
const form = reactive({
  name: '',
  systemName: '',
  usages: {
    [PriceOfferSourceType.Supplier]: false,
    [PriceOfferSourceType.OurWarehouse]: false,
  },
})

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const isEditing = computed(() => props.applier !== null)
const dslLogic = computed(() => JSON.stringify(serializeJsonLogic(logicRoot.value), null, 2))

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    form.name = props.applier?.name ?? ''
    form.systemName = props.applier?.systemName ?? ''
    logicRoot.value = props.applier?.dslLogic
      ? parseJsonLogic(JSON.parse(props.applier.dslLogic))
      : createNode('variable')
    for (const usage of usages) {
      form.usages[usage] = props.applier
        ? props.applier.states.some((state) => state.usage === usage)
        : usage === props.initialUsage
    }
  },
)

function resetForm() {
  form.name = ''
  form.systemName = ''
  logicRoot.value = createNode('variable')
  form.usages.Supplier = false
  form.usages.OurWarehouse = false
}

async function save() {
  const name = form.name.trim()
  const systemName = form.systemName.trim()
  if (!name) {
    ElMessage.warning(t('priceAppliers.nameRequired'))
    return
  }
  if (!systemName) {
    ElMessage.warning(t('priceAppliers.systemNameRequired'))
    return
  }
  const states: UpsertPriceApplierStateModel[] = usages
    .filter((usage) => form.usages[usage])
    .map((usage) => {
      const existing = props.applier?.states.find((state) => state.usage === usage)
      return {
        usage,
        order: existing?.order ?? props.suggestedOrders[usage],
        enabled: existing?.enabled ?? true,
      }
    })

  if (states.length === 0) {
    ElMessage.warning(t('priceAppliers.usageRequired'))
    return
  }

  isSaving.value = true
  try {
    const applier = await upsertPriceApplier({ name, systemName, dslLogic: dslLogic.value, states })
    ElMessage.success(t('priceAppliers.ruleSaved'))
    emit('saved', applier)
    visible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('priceAppliers.saveError'))
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.field-hint {
  margin-bottom: 8px;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.builder-field {
  width: 100%;
}

.json-preview {
  margin-top: 10px;
}

.json-preview pre {
  overflow: auto;
  max-height: 220px;
  margin: 0;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: #f8fafc;
  padding: 10px;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
}

.usage-heading {
  margin-bottom: 8px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 650;
}

.usage-options {
  display: grid;
  gap: 8px;
}

.usage-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
}

.usage-option > span {
  display: grid;
  gap: 2px;
}

.usage-option strong {
  color: var(--app-text);
  font-size: 14px;
}

.usage-option span span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 400;
}
</style>

<style>
.price-applier-editor.el-dialog {
  display: flex;
  max-height: 94vh;
  flex-direction: column;
  margin-bottom: 0;
}

.price-applier-editor .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.price-applier-editor .el-dialog__footer {
  flex: 0 0 auto;
  border-top: 1px solid var(--app-border);
  padding-top: 14px;
}
</style>
