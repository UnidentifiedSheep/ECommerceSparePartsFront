<template>
  <el-popover
    v-if="comment?.trim()"
    v-model:visible="visible"
    trigger="click"
    role="dialog"
    placement="bottom-start"
    width="min(360px, calc(100vw - 24px))"
    :title="t('common.labels.comment')"
    @keydown.esc.stop.prevent="visible = false"
  >
    <template #reference>
      <el-button
        class="position-comment-trigger"
        :icon="ChatLineSquare"
        type="primary"
        text
        size="small"
        :aria-label="t('common.labels.comment')"
        :aria-expanded="visible"
        :title="t('common.labels.comment')"
        @click.stop
        @keydown.esc.stop.prevent="visible = false"
      />
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
  flex: none;
  width: 24px;
  height: 24px;
  margin-left: 0;
  padding: 0;
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
