<template>
  <el-dialog
    v-model="isOpen"
    append-to-body
    :title="t('producers.createTitle')"
    width="min(480px, calc(100vw - 24px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    @opened="nameInput?.focus()"
    @closed="emit('closed')"
  >
    <el-alert v-if="saveError" class="mb-4" :title="saveError" type="error" :closable="false" show-icon />
    <el-form label-position="top" :disabled="saving" @submit.prevent="save">
      <el-form-item :label="t('common.labels.name')" required :error="nameError">
        <el-input ref="nameInput" v-model="name" maxlength="64" :aria-invalid="Boolean(nameError)" />
      </el-form-item>
      <el-form-item :label="t('common.labels.description')">
        <el-input v-model="description" type="textarea" :rows="3" maxlength="500" show-word-limit />
      </el-form-item>
      <button type="submit" hidden />
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!canCreate" @click="save">{{ t('common.actions.create') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElNotification, type InputInstance } from 'element-plus'
import { createProducer } from '@/services/api/producers.ts'
import type { ProducerModel } from '@/models/producerModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{ initialName: string }>()
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{ created: [producer: ProducerModel]; closed: [] }>()
const { t } = useI18n()
const { hasPermission } = usePermissions()
const canCreate = computed(() => hasPermission('PRODUCERS_CREATE'))
const nameInput = ref<InputInstance>()
const name = ref('')
const description = ref('')
const saving = ref(false)
const attempted = ref(false)
const saveError = ref('')
const nameError = computed(() => attempted.value && (name.value.trim().length < 2 || name.value.trim().length > 64)
  ? t('producers.nameLength') : '')

async function save() {
  if (saving.value || !canCreate.value) return
  attempted.value = true
  saveError.value = ''
  if (nameError.value) {
    await nextTick()
    nameInput.value?.focus()
    return
  }
  saving.value = true
  try {
    const response = await createProducer({ name: name.value.trim(), description: description.value.trim() || null })
    emit('created', response.producer)
    isOpen.value = false
    ElNotification({ title: t('common.labels.success'), message: t('producers.created'), type: 'success' })
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : t('producers.createError')
  } finally {
    saving.value = false
  }
}

watch(isOpen, (open) => {
  if (!open) return
  name.value = props.initialName
  description.value = ''
  attempted.value = false
  saveError.value = ''
}, { immediate: true })
</script>
