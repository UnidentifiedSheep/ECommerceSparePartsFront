<template>
  <el-dialog v-model="isOpen" :title="productWeight ? 'Редактировать вес' : 'Задать вес'" width="440">
    <el-form label-position="top">
      <el-form-item label="Вес">
        <el-input-number v-model="form.weight" :min="0.01" :precision="2" :controls="false" class="w-full" />
      </el-form-item>

      <el-form-item label="Единица измерения">
        <el-select v-model="form.unit" class="w-full">
          <el-option v-for="unit in weightSetUnitOptions" :key="unit.value" :label="unit.label" :value="unit.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-between">
        <el-button v-if="productWeight && canDelete" type="danger" plain :loading="isDeleting" @click="remove">Удалить</el-button>
        <span v-else />
        <div class="flex gap-2">
          <el-button @click="isOpen = false">Отмена</el-button>
          <el-button v-if="canSave" type="primary" :loading="isSaving" @click="save">Сохранить</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { ProductWeightModel } from '@/models/productModel.ts'
import { deleteProductWeight, setProductWeight, type WeightUnit } from '@/services/api/products.ts'
import { toWeightUnit, weightSetUnitOptions } from '@/utils/measurementUnits.ts'

const props = defineProps<{
  productId: number
  productWeight: ProductWeightModel | null
  canSave: boolean
  canDelete: boolean
}>()

const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  saved: []
}>()

const form = reactive<{
  weight?: number
  unit: WeightUnit
}>({
  unit: 1,
})
const isSaving = ref(false)
const isDeleting = ref(false)

function resetForm() {
  form.weight = props.productWeight?.weight
  form.unit = toWeightUnit(props.productWeight?.unit)
}

async function save() {
  if (!form.weight) {
    ElNotification({
      title: 'Проверьте вес',
      message: 'Вес должен быть больше нуля.',
      type: 'warning',
    })
    return
  }

  isSaving.value = true
  try {
    await setProductWeight(props.productId, {
      weight: form.weight,
      unit: form.unit,
    })

    ElNotification({
      title: 'Вес сохранен',
      message: 'Вес продукта обновлен.',
      type: 'success',
    })

    emit('saved')
    isOpen.value = false
  } finally {
    isSaving.value = false
  }
}

async function remove() {
  try {
    await ElMessageBox.confirm('Удалить вес продукта?', 'Удаление веса', {
      confirmButtonText: 'Удалить',
      cancelButtonText: 'Отмена',
      type: 'warning',
    })
  } catch {
    return
  }

  isDeleting.value = true
  try {
    await deleteProductWeight(props.productId)
    ElNotification({
      title: 'Вес удален',
      message: 'Вес продукта удален.',
      type: 'success',
    })
    emit('saved')
    isOpen.value = false
  } finally {
    isDeleting.value = false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
})
</script>
