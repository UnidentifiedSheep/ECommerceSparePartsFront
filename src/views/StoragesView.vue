<template>
  <div class="min-h-[calc(100vh-var(--app-viewport-offset,56px))] bg-slate-50">
    <PageHeader :title="t('storages.title')" :description="t('storages.description')" />
    <div class="p-4">
      <el-card shadow="never">
        <el-row :gutter="20" align="bottom">
          <el-col :span="8">
            <label for="search-field" class="mb-2 block text-sm font-medium text-slate-700">{{ t('common.labels.search') }}</label>
            <el-input id="search-field" v-model="searchField" clearable :placeholder="t('storages.searchPlaceholder')" />
          </el-col>
          <el-col :span="6">
            <label for="storage-type" class="mb-2 block text-sm font-medium text-slate-700">{{ t('storages.storageType') }}</label>
            <StorageTypeSelector id="storage-type" v-model="storageType" />
          </el-col>
          <el-col :span="4"><el-button plain @click="resetFilters">{{ t('storages.resetFilters') }}</el-button></el-col>
        </el-row>
      </el-card>
      <StoragesViewer :storage-type="storageType" :search-field="searchField" shadow="never" class="mt-4 h-[760px]" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StorageTypeSelector from '@/components/selectors/StorageTypeSelector.vue'
import StoragesViewer from '@/components/storages/StoragesViewer.vue'
import type { StorageType } from '@/enums/storageType'
import { useI18n } from '@/i18n'
const { t } = useI18n()
const storageType = ref<StorageType>()
const searchField = ref<string>()
function resetFilters() { storageType.value = undefined; searchField.value = undefined }
</script>
