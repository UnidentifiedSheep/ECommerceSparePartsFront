<template>
  <el-dialog v-model="isOpen" :title="dialogTitle" width="520">
    <el-form label-position="top">
      <el-form-item :label="t('common.labels.product')">
        <div class="flex w-full gap-2">
          <el-input :model-value="selectedLabel" readonly :placeholder="t('products.details.selectContentProduct')" />
          <el-button v-if="!item" @click="selectorOpen = true">{{ t('products.pick') }}</el-button>
        </div>
      </el-form-item>
      <el-form-item :label="t('common.labels.count')">
        <el-input-number v-model="count" :min="1" :controls="false" class="w-full" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('common.actions.save') }}</el-button>
    </template>
  </el-dialog>

  <ProductSelectorDialog v-model="selectorOpen" @select="selectProduct" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import type { ProductContentModel } from '@/models/productModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { addProductContent, editProductContent } from '@/services/api/products.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  productId: number
  item?: ProductContentModel
}>()
const emit = defineEmits<{ saved: [] }>()
const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const selectedProduct = ref<ProductSearchModel | null>(null)
const selectorOpen = ref(false)
const count = ref(1)
const saving = ref(false)
const dialogTitle = computed(() => props.item
  ? t('products.details.editContentTitle')
  : t('products.details.addContentTitle'))
const selectedLabel = computed(() => {
  if (selectedProduct.value) return `${selectedProduct.value.sku} - ${selectedProduct.value.name}`
  if (props.item) return `${props.item.product.sku} - ${props.item.product.name}`
  return ''
})

function selectProduct(product: ProductSearchModel) {
  if (product.id === props.productId) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.sameProductForbidden'),
      type: 'warning',
    })
    return
  }
  selectedProduct.value = product
}

async function save() {
  if (!props.item && !selectedProduct.value) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.selectContentProduct'),
      type: 'warning',
    })
    return
  }
  saving.value = true
  try {
    if (props.item) {
      await editProductContent({
        productId: props.productId,
        childProductId: props.item.product.id,
        count: count.value,
      })
    } else if (selectedProduct.value) {
      await addProductContent({
        productId: props.productId,
        childProductId: selectedProduct.value.id,
        count: count.value,
      })
    }
    ElNotification({
      title: t('products.details.contentSavedTitle'),
      message: t('products.details.contentSavedMessage'),
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
  selectedProduct.value = null
  count.value = props.item?.quantity ?? 1
})
</script>
