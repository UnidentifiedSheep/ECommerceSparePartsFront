<template>
  <el-dialog v-model="isOpen" :title="dialogTitle" width="520">
    <el-form label-position="top">
      <el-form-item :label="t('products.characteristic')">
        <CharacteristicSelector v-model="form.characteristicId" :selected-name="item?.name" :disabled="Boolean(item)" />
      </el-form-item>
      <el-form-item :label="t('common.labels.value')">
        <el-input
          v-model="form.value"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :placeholder="t('products.details.characteristicValuePlaceholder')"
          maxlength="128"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('common.actions.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import type { ProductCharacteristicModel } from '@/models/productModel.ts'
import { addProductCharacteristic, editProductCharacteristic } from '@/services/api/products.ts'
import CharacteristicSelector from '@/components/selectors/CharacteristicSelector.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  productId: number
  item?: ProductCharacteristicModel
}>()
const emit = defineEmits<{ saved: [] }>()
const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const saving = ref(false)
const form = reactive<{ characteristicId: number | undefined; value: string }>({ characteristicId: undefined, value: '' })
const dialogTitle = computed(() => props.item
  ? t('products.details.editCharacteristicTitle')
  : t('products.details.addCharacteristicTitle'))

async function save() {
  const characteristicId = form.characteristicId
  const value = form.value.trim()
  if (!characteristicId || value.length < 3 || value.length > 128) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.fillCharacteristic'),
      type: 'warning',
    })
    return
  }
  saving.value = true
  try {
    if (props.item) {
      await editProductCharacteristic({
        productId: props.productId,
        characteristicId: props.item.characteristicId,
        value,
      })
    } else {
      await addProductCharacteristic({ productId: props.productId, characteristicId, value })
    }
    ElNotification({
      title: t('products.details.characteristicSavedTitle'),
      message: t('products.details.characteristicSavedMessage'),
      type: 'success',
    })
    isOpen.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

watch(isOpen, (open) => {
  if (!open) return
  form.characteristicId = props.item?.characteristicId
  form.value = props.item?.value ?? ''
})
</script>
