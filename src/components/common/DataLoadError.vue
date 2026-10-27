<template>
  <div class="data-load-error" role="alert">
    <strong>{{ t(error === 'forbidden' ? 'common.loadError.forbiddenTitle' : 'common.loadError.failedTitle') }}</strong>
    <p>{{ t(error === 'forbidden' ? 'common.loadError.forbiddenDescription' : 'common.loadError.failedDescription') }}</p>
    <el-button v-if="error !== 'forbidden'" size="small" plain @click="emit('retry')">
      {{ t('common.loadError.retry') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n'
import type { DataLoadErrorKind } from '@/utils/dataLoadError'

defineProps<{ error: DataLoadErrorKind }>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<style scoped>
.data-load-error {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.data-load-error p {
  max-width: 60ch;
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
</style>
