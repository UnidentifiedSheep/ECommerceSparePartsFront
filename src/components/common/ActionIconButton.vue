<template>
  <el-tooltip :content="label" placement="top" :show-after="250">
    <el-button
      class="action-icon-button"
      :class="`action-icon-button--${tone}`"
      :aria-label="label"
      :disabled="disabled"
      :loading="loading"
      :type="buttonType"
      size="small"
      plain
      @click="emit('click', $event)"
    >
      <el-icon>
        <component :is="icon" />
      </el-icon>
    </el-button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  icon: Component
  tone?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  loading?: boolean
}>(), {
  tone: 'default',
  disabled: false,
  loading: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonType = computed(() => {
  if (props.tone === 'danger') return 'danger'
  if (props.tone === 'primary') return 'primary'
  return undefined
})
</script>

<style scoped>
.action-icon-button {
  width: 30px;
  height: 30px;
  padding: 0;
}

.action-icon-button :deep(.el-icon) {
  margin: 0;
}

.action-icon-button--default {
  color: #475569;
}
</style>
