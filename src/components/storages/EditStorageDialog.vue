<template>
  <el-dialog v-model="isOpen" title="Редактирование склада" width="520" align-center>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Название">
        <el-input :model-value="storage?.name" disabled />
      </el-form-item>
      <el-form-item label="Описание" prop="description">
        <el-input v-model="form.description" />
      </el-form-item>
      <el-form-item label="Местоположение" prop="location">
        <el-input v-model="form.location" />
      </el-form-item>
      <el-form-item label="Тип" prop="type">
        <StorageTypeSelector v-model="form.type" :clearable="false" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="isOpen = false">Отмена</el-button>
      <el-button type="primary" @click="submit(formRef)">Сохранить</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
import StorageTypeSelector from '@/components/selectors/StorageTypeSelector.vue'
import { StorageType } from '@/enums/storageType.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { editStorage } from '@/services/api/storages.ts'

const emit = defineEmits<{
  updated: []
}>()

const isOpen = defineModel<boolean>('is-open')

const props = defineProps<{
  storage?: StorageModel
}>()

const formRef = ref<FormInstance>()
const form = reactive({
  description: '',
  location: '',
  type: StorageType.Warehouse,
})

const rules = reactive<FormRules<typeof form>>({
  description: [{ max: 256, message: 'Максимальная длина описания 256 символов', trigger: 'blur' }],
  location: [{ max: 256, message: 'Максимальная длина местоположения 256 символов', trigger: 'blur' }],
})

watch([() => isOpen.value, () => props.storage], ([open, storage]) => {
  if (!open || !storage) return
  form.description = storage.description ?? ''
  form.location = storage.location ?? ''
  form.type = storage.type
})

async function submit(formEl?: FormInstance) {
  if (!formEl || !props.storage) return

  const valid = await formEl.validate().catch(() => false)
  if (!valid) return

  await editStorage({
    storageName: props.storage.name,
    description: form.description,
    location: form.location,
    type: form.type,
  })

  ElNotification({
    title: 'Успех',
    message: `Склад '${props.storage.name}' обновлён`,
    type: 'success',
  })

  emit('updated')
  isOpen.value = false
}
</script>