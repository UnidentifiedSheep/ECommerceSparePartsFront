<template>
  <el-popover ref="popoverRef" trigger="click" placement="bottom-start" width="auto" :show-arrow="false" :popper-style="{ padding: '4px' }">
    <div class="purchase-actions-menu">
      <button v-if="canEdit" type="button" :disabled="busy" @click="emitAction('edit')">
        <el-icon><Edit /></el-icon>
        {{ t('common.actions.edit') }}
      </button>
      <button v-if="canDelete" type="button" :disabled="busy" class="purchase-actions-menu__delete" @click="emitAction('delete')">
        <el-icon><Delete /></el-icon>
        {{ t('common.actions.delete') }}
      </button>
    </div>
    <template #reference>
      <el-button class="purchase-actions-trigger" :icon="MoreFilled" size="small" plain :aria-label="t('common.labels.actions')" :loading="busy" />
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Delete, Edit, MoreFilled } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'

defineProps<{ canEdit: boolean; canDelete: boolean; busy: boolean }>()
const emit = defineEmits<{ edit: []; delete: [] }>()
const { t } = useI18n()
const popoverRef = ref<{ hide: () => void } | null>(null)

function emitAction(action: 'edit' | 'delete') {
  popoverRef.value?.hide()
  if (action === 'edit') emit('edit')
  else emit('delete')
}
</script>

<style scoped>
.purchase-actions-trigger { width: 30px; height: 30px; padding: 0; }
.purchase-actions-menu { display: grid; min-width: 170px; }
.purchase-actions-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  border-radius: 4px;
  padding: 8px 10px;
  background: transparent;
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.purchase-actions-menu button:hover { background: var(--app-surface-muted, #f7f9fa); }
.purchase-actions-menu button:disabled { opacity: .5; cursor: not-allowed; }
.purchase-actions-menu__delete:hover { color: var(--el-color-danger); }
</style>
