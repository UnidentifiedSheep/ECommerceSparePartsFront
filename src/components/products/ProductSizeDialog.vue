<template>
  <el-dialog v-model="isOpen" :title="productSize ? 'Редактировать размер' : 'Задать размер'" width="520">
    <el-form label-position="top">
      <div class="grid grid-cols-3 gap-3">
        <el-form-item label="Длина">
          <el-input-number v-model="form.length" :min="0.01" :precision="2" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item label="Ширина">
          <el-input-number v-model="form.width" :min="0.01" :precision="2" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item label="Высота">
          <el-input-number v-model="form.height" :min="0.01" :precision="2" :controls="false" class="w-full" />
        </el-form-item>
      </div>

      <el-form-item label="Единица измерения">
        <el-select v-model="form.unit" class="w-full">
          <el-option v-for="unit in dimensionSetUnitOptions" :key="unit.value" :label="unit.label" :value="unit.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-between">
        <el-button v-if="productSize && canDelete" type="danger" plain :loading="isDeleting" @click="remove">Удалить</el-button>
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
import type { ProductSizeModel } from '@/models/productModel.ts'
import { deleteProductSize, setProductSize, type DimensionUnit } from '@/services/api/products.ts'
import { dimensionSetUnitOptions, toDimensionUnit } from '@/utils/measurementUnits.ts'

const props = defineProps<{
  productId: number
  productSize: ProductSizeModel | null
  canSave: boolean
  canDelete: boolean
}>()

const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  saved: []
}>()

const form = reactive<{
  length?: number
  width?: number
  height?: number
  unit: DimensionUnit
}>({
  unit: 2,
})
const isSaving = ref(false)
const isDeleting = ref(false)

function resetForm() {
  form.length = props.productSize?.length
  form.width = props.productSize?.width
  form.height = props.productSize?.height
  form.unit = toDimensionUnit(props.productSize?.unit)
}

async function save() {
  if (!form.length || !form.width || !form.height) {
    ElNotification({
      title: 'Проверьте размер',
      message: 'Длина, ширина и высота должны быть больше нуля.',
      type: 'warning',
    })
    return
  }

  isSaving.value = true
  try {
    await setProductSize(props.productId, {
      length: form.length,
      width: form.width,
      height: form.height,
      unit: form.unit,
    })

    ElNotification({
      title: 'Размер сохранен',
      message: 'Размеры продукта обновлены.',
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
    await ElMessageBox.confirm('Удалить размеры продукта?', 'Удаление размера', {
      confirmButtonText: 'Удалить',
      cancelButtonText: 'Отмена',
      type: 'warning',
    })
  } catch {
    return
  }

  isDeleting.value = true
  try {
    await deleteProductSize(props.productId)
    ElNotification({
      title: 'Размер удален',
      message: 'Размеры продукта удалены.',
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
