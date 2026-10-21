<template>
  <div class="user-column-filter">
    <el-input
      v-if="editing || value.trim()"
      ref="inputRef"
      v-model="value"
      size="small"
      clearable
      :placeholder="label"
      :aria-label="t('users.filterByField', { field: label })"
      @focus="editing = true"
      @blur="editing = false"
      @keydown.esc.stop.prevent="finishEditing"
    />
    <button v-else type="button" class="user-column-filter__trigger" :aria-label="t('users.filterByField', { field: label })" @click="startEditing">
      <span>{{ label }}</span>
      <el-icon aria-hidden="true"><Search /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import type { InputInstance } from 'element-plus'
import { useI18n } from '@/i18n'

defineProps<{ label: string }>()
const value = defineModel<string>({ required: true })
const { t } = useI18n()
const editing = ref(false)
const inputRef = ref<InputInstance>()

async function startEditing() {
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
}

function finishEditing() {
  inputRef.value?.blur()
  editing.value = false
}
</script>

<style scoped>
.user-column-filter { height: 28px; display: flex; align-items: center; min-width: 0; }
.user-column-filter :deep(.el-input) { font-weight: 400; }
.user-column-filter__trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; height: 28px; padding: 0 6px; border: 0; border-radius: 4px; background: transparent; color: inherit; font: inherit; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; }
.user-column-filter__trigger span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-column-filter__trigger .el-icon { flex: none; opacity: 0; }
.user-column-filter__trigger:hover, .user-column-filter__trigger:focus-visible { background: var(--app-primary-soft); color: var(--app-primary); }
.user-column-filter__trigger:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 1px; }
.user-column-filter__trigger:hover .el-icon, .user-column-filter__trigger:focus-visible .el-icon { opacity: 1; }
@media (hover: none) { .user-column-filter__trigger .el-icon { opacity: 1; } }
</style>
