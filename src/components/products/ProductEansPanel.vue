<template>
  <div class="product-eans-panel">
    <div class="product-eans-panel__toolbar">
      <span>{{ t('products.details.eansCount', { count: eans.length }) }}</span>
      <el-button v-if="canEdit && !showInput" type="primary" plain @click="showInput = true">
        {{ t('products.details.addEan') }}
      </el-button>
    </div>

    <form v-if="showInput" class="product-eans-panel__form" @submit.prevent="submitEan">
      <el-input
        v-model="newEan"
        maxlength="14"
        :placeholder="t('products.details.eanPlaceholder')"
        :disabled="busy"
        autofocus
      />
      <el-button type="primary" native-type="submit" :loading="busy" :disabled="!canSubmitEan">
        {{ t('common.actions.add') }}
      </el-button>
      <el-button :disabled="busy" @click="closeInput">{{ t('common.actions.cancel') }}</el-button>
    </form>

    <ul v-if="eans.length" class="product-eans-panel__list">
      <li v-for="ean in eans" :key="ean" class="product-eans-panel__row">
        <span>{{ ean }}</span>
        <el-button
          v-if="canEdit"
          :icon="Delete"
          size="small"
          text
          type="danger"
          :disabled="busy"
          :aria-label="t('products.details.deleteEan', { ean })"
          @click="emit('delete', ean)"
        />
      </li>
    </ul>
    <el-empty v-else :description="t('products.details.noEans')" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  eans: string[]
  canEdit: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  add: [ean: string]
  delete: [ean: string]
}>()

const { t } = useI18n()
const newEan = ref('')
const showInput = ref(false)
const canSubmitEan = computed(() => {
  const ean = newEan.value.trim()
  return Boolean(ean) && !props.eans.includes(ean) && !props.busy
})

function submitEan() {
  if (canSubmitEan.value) emit('add', newEan.value.trim())
}

function closeInput() {
  newEan.value = ''
  showInput.value = false
}

watch(() => props.eans, (eans) => {
  if (newEan.value && eans.includes(newEan.value.trim())) closeInput()
})
</script>

<style scoped>
.product-eans-panel__toolbar {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0 12px;
  color: rgb(100 116 139);
  font-size: 14px;
}

.product-eans-panel__form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 560px;
  padding: 4px 0 12px;
}

.product-eans-panel__form .el-input {
  flex: 1 1 180px;
  min-width: 0;
}

.product-eans-panel__list {
  max-width: 560px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.product-eans-panel__row {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgb(226 232 240);
  color: rgb(15 23 42);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.product-eans-panel__row :deep(.el-button) {
  margin-right: 4px;
}
</style>
