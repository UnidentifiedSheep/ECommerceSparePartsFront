<template>
  <el-alert v-if="change" :title="t(change === 'deleted' ? 'common.live.deleted' : 'common.live.editChanged')" type="warning" :closable="false" show-icon>
    <p>{{ t(change === 'deleted' ? 'common.live.deletedDraft' : 'common.live.draftPreserved') }}</p>
    <el-button v-if="change !== 'deleted'" size="small" :loading="loading" @click="$emit('reload')">{{ t('common.live.reloadDocument') }}</el-button>
  </el-alert>
</template>
<script setup lang="ts">
import { useI18n } from '@/i18n'
defineProps<{ change?: 'updated' | 'deleted'; loading?: boolean }>()
defineEmits<{ reload: [] }>()
const { t } = useI18n()
</script>
