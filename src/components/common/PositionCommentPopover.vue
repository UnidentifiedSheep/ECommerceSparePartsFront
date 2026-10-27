<template>
  <el-popover
    v-if="comment?.trim()"
    v-model:visible="visible"
    :trigger="['hover', 'focus']"
    role="tooltip"
    placement="bottom-start"
    width="min(360px, calc(100vw - 24px))"
    @keydown.esc.stop.prevent="visible = false"
  >
    <template #reference>
      <span
        class="position-comment-trigger"
        tabindex="0"
        title=""
        :aria-label="t('common.labels.comment')"
        @click.stop
        @keydown.esc.stop.prevent="visible = false"
      >
        <el-icon aria-hidden="true"><ChatLineSquare /></el-icon>
      </span>
    </template>
    <div class="position-comment-text">{{ comment }}</div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChatLineSquare } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'

const props = defineProps<{ comment?: string | null }>()
const { t } = useI18n()
const visible = ref(false)

watch(() => props.comment, () => { visible.value = false })
</script>

<style scoped>
.position-comment-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin-left: 0;
  padding: 0;
  color: var(--el-color-primary);
  cursor: help;
}
.position-comment-trigger:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
  border-radius: var(--el-border-radius-small);
}
.position-comment-trigger :deep(.el-icon) { font-size: 16px; }
.position-comment-text {
  max-height: min(280px, 50dvh);
  overflow: auto;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
