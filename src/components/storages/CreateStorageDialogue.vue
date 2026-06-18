<template>
  <el-dialog v-model="isOpen" :title="t('storages.createTitle')" width="500" align-center>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" label-position="top">
      <el-form-item :label="t('common.labels.name')" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item :label="t('common.labels.description')" prop="description">
        <el-input v-model="form.description" />
      </el-form-item>
      <el-form-item :label="t('storages.location')" prop="location">
        <el-input v-model="form.location" />
      </el-form-item>
      <el-form-item :label="t('common.labels.type')" prop="type">
        <StorageTypeSelector v-model="form.type" :clearable="false" />
      </el-form-item>
    </el-form>
    <div class="flex justify-center gap-3">
      <el-button type="primary" @click="onSubmit(formRef)">{{ t('common.actions.create') }}</el-button>
      <el-button @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
import StorageTypeSelector from '@/components/selectors/StorageTypeSelector.vue'
import { StorageType } from '@/enums/storageType.ts'
import { createStorage, type CreateStorageRequest } from '@/services/api/storages.ts'
import { useI18n } from '@/i18n'

const emit = defineEmits<{
  created: [name: string]
}>()

const { t } = useI18n()
const isOpen = defineModel<boolean>('is-open')
const formRef = ref<FormInstance>()
const form = reactive<CreateStorageRequest>({
  name: '',
  description: undefined,
  location: undefined,
  type: StorageType.Warehouse,
})

const rules = computed<FormRules<CreateStorageRequest>>(() => ({
  name: [
    { required: true, message: t('storages.validation.nameRequired'), trigger: 'blur' },
    { min: 2, max: 128, message: t('storages.validation.nameLength'), trigger: 'blur' },
  ],
  description: [{ max: 256, message: t('storages.validation.descriptionMax'), trigger: 'blur' }],
  location: [{ max: 256, message: t('storages.validation.locationMax'), trigger: 'blur' }],
}))

async function onSubmit(formEl: FormInstance | undefined) {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    const resp = await createStorage(form)
    ElNotification({
      title: t('common.labels.success'),
      message: t('storages.created', { name: resp.name }),
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
