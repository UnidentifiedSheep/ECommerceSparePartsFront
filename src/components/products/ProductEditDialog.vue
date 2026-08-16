<template>
  <el-dialog v-model="isOpen" :title="t('products.editTitle')" width="620">
    <el-form label-position="top">
      <div class="grid grid-cols-[minmax(0,1fr)_220px] gap-3">
        <el-form-item :label="t('products.sku')">
          <el-input v-model="form.sku" />
        </el-form-item>

        <el-form-item :label="t('products.indicator')">
          <div class="flex h-8 items-center gap-2">
            <el-color-picker v-model="form.indicator" show-alpha />
            <el-button v-if="form.indicator" size="small" text @click="form.indicator = null">{{ t('products.clear') }}</el-button>
          </div>
        </el-form-item>
      </div>

      <el-form-item :label="t('common.labels.name')">
        <div class="product-name-editor">
          <el-input v-model="form.name" />
          <div v-if="availableAlternativeNames.length" class="product-name-alternatives">
            <span>{{ t('products.alternativeNames') }}</span>
            <el-select
              v-model="selectedAlternativeName"
              clearable
              filterable
              :placeholder="t('products.selectAlternativeName')"
              @change="useAlternativeName"
            >
              <el-option
                v-for="option in availableAlternativeNames"
                :key="option.name"
                :label="option.name"
                :value="option.name"
              >
                <div class="product-name-option">
                  <span>{{ option.name }}</span>
                  <em>{{ t('products.nameSourcesCount', { count: option.usages.length }) }}</em>
                </div>
              </el-option>
            </el-select>
            <p>{{ t('products.alternativeNamesHint') }}</p>
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="t('common.labels.producer')">
        <ProducerSelector v-model="form.producerId" />
      </el-form-item>

      <el-form-item :label="t('common.labels.description')">
        <el-input v-model="form.description" type="textarea" :rows="3" maxlength="255" show-word-limit />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="isOpen = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="isSaving" @click="save">{{ t('common.actions.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import type { ProductModel } from '@/models/productModel.ts'
import { editProduct } from '@/services/api/products.ts'
import { useI18n } from '@/i18n'
import type { CatalogueNameGroup } from '@/utils/catalogueCandidateNames.ts'

const props = defineProps<{
  product: ProductModel
  alternativeNames?: CatalogueNameGroup[]
}>()

const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const emit = defineEmits<{
  saved: []
}>()

const form = reactive<{
  sku: string
  name: string
  producerId?: number
  description: string
  indicator: string | null
}>({
  sku: '',
  name: '',
  producerId: undefined,
  description: '',
  indicator: null,
})
const isSaving = ref(false)
const selectedAlternativeName = ref<string>()
const availableAlternativeNames = computed(() => (
  (props.alternativeNames ?? []).filter((option) => (
    option.name.toLocaleLowerCase() !== props.product.name.trim().toLocaleLowerCase()
  ))
))

function resetForm() {
  form.sku = props.product.sku
  form.name = props.product.name
  form.producerId = props.product.producerId
  form.description = props.product.description ?? ''
  form.indicator = props.product.indicator ?? null
  selectedAlternativeName.value = undefined
}

function useAlternativeName(name?: string) {
  if (name) form.name = name
}

async function save() {
  const sku = form.sku.trim()
  const name = form.name.trim()

  if (sku.length < 3 || !name || !form.producerId) {
    ElNotification({
      title: t('products.checkProductTitle'),
      message: t('products.checkProductMessage'),
      type: 'warning',
    })
    return
  }

  isSaving.value = true
  try {
    await editProduct({
      id: props.product.id,
      sku,
      name,
      producerId: form.producerId,
      description: form.description.trim() || null,
      indicator: form.indicator,
    })

    ElNotification({
      title: t('products.productUpdatedTitle'),
      message: t('products.changesSaved'),
      type: 'success',
    })

    emit('saved')
    isOpen.value = false
  } finally {
    isSaving.value = false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
})
</script>

<style scoped>
.product-name-editor { display: grid; width: 100%; gap: 9px; }
.product-name-alternatives { display: grid; gap: 6px; border-left: 2px solid var(--app-border-strong); padding-left: 10px; }
.product-name-alternatives > span { color: #475569; font-size: 12px; font-weight: 650; }
.product-name-alternatives > p { margin: 0; color: #64748b; font-size: 12px; line-height: 1.4; }
.product-name-option { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 16px; }
.product-name-option span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-name-option em { flex: 0 0 auto; color: #64748b; font-size: 12px; font-style: normal; }
</style>
