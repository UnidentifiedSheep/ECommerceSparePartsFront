<template>
  <el-dialog v-model="isOpen" title="Создание склада" width="500" align-center>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" label-position="top">
      <el-form-item label="Название" prop="name">
        <el-input v-model="form.name" />
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
    <div class="flex justify-center gap-3">
      <el-button type="primary" @click="onSubmit(formRef)">Создать</el-button>
      <el-button @click="isOpen = false">Отмена</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
import StorageTypeSelector from '@/components/selectors/StorageTypeSelector.vue'
import { StorageType } from '@/enums/storageType.ts'
import { createStorage, type CreateStorageRequest } from '@/services/api/storages.ts'

const emit = defineEmits<{
  created: [name: string]
}>()

const isOpen = defineModel<boolean>('is-open')
const formRef = ref<FormInstance>()
const form = reactive<CreateStorageRequest>({
  name: '',
  description: undefined,
  location: undefined,
  type: StorageType.Warehouse,
})

const rules = reactive<FormRules<CreateStorageRequest>>({
  name: [
    { required: true, message: 'Название обязательно', trigger: 'blur' },
    { min: 2, max: 128, message: 'Название должно содержать от 2 до 128 символов', trigger: 'blur' },
  ],
  description: [{ max: 256, message: 'Максимальная длина описания 256 символов', trigger: 'blur' }],
  location: [{ max: 256, message: 'Максимальная длина местоположения 256 символов', trigger: 'blur' }],
})

async function onSubmit(formEl: FormInstance | undefined) {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    const resp = await createStorage(form)
    ElNotification({
      title: 'Успех',
      message: `Склад '${resp.name}' успешно создан`,
      type: 'success',
    })
    isOpen.value = false
    emit('created', resp.name)
  })
}

watch(isOpen, (opened) => {
  if (!opened) return
  formRef.value?.resetFields()
})
</script>

<style scoped>
</style>
