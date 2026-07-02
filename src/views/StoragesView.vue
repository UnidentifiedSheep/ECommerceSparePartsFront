<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <PageHeader :title="t('storages.title')" :description="t('storages.description')" />

    <div class="p-4">
      <el-card shadow="never">
        <el-row :gutter="20" align="bottom">
          <el-col :span="8">
            <label for="search-field" class="mb-2 block text-sm font-medium text-slate-700">{{ t('common.labels.search') }}</label>
            <el-input v-model="searchField" id="search-field" clearable :placeholder="t('storages.searchPlaceholder')" />
          </el-col>
          <el-col :span="6">
            <label for="storage-type" class="mb-2 block text-sm font-medium text-slate-700">{{ t('storages.storageType') }}</label>
            <StorageTypeSelector v-model="storageType" id="storage-type" />
          </el-col>
          <el-col :span="4">
            <el-button plain @click="resetFilters">{{ t('storages.resetFilters') }}</el-button>
          </el-col>
        </el-row>
      </el-card>

      <div class="pt-4">
        <el-row :gutter="24">
          <el-col :span="14">
            <StoragesViewer
              v-model:selected-storage="selectedStorage"
              :storage-type="storageType"
              :search-field="searchField"
              shadow="never"
              class="h-[760px]"
            />
          </el-col>
          <el-col :span="10">
            <el-card shadow="never" class="h-[760px]">
              <template v-if="selectedStorage">
                <div class="mb-4 rounded-lg bg-slate-50 p-4">
                  <div class="text-lg font-semibold text-slate-900">{{ selectedStorage.name }}</div>
                  <div class="mt-1 text-sm text-slate-500">
                    {{ selectedStorage.location || t('storages.locationMissing') }}
                  </div>
                </div>

                <el-tabs v-model="currentTab">
                  <el-tab-pane name="storage-owners">
                    <template #label>
                      <span>
                        <el-icon><User /></el-icon>
                        <span class="pl-1">{{ t('storages.owners') }}</span>
                      </span>
                    </template>
                    <StorageOwnersViewer v-model:storage="selectedStorage" />
                  </el-tab-pane>
                  <el-tab-pane name="storage-routes">
                    <template #label>
                      <span>
                        <el-icon><IconRoute /></el-icon>
                        <span class="pl-1">{{ t('storages.routes') }}</span>
                      </span>
                    </template>
                    <StorageRoutesViewer v-model:storage="selectedStorage" />
                  </el-tab-pane>
                </el-tabs>
              </template>

              <template v-else>
                <el-empty :description="t('storages.selectToView')" />
              </template>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from '@element-plus/icons-vue'
import { ref } from 'vue'
import StorageTypeSelector from '@/components/selectors/StorageTypeSelector.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import IconRoute from '@/components/icons/IconRoute.vue'
import StoragesViewer from '@/components/storages/StoragesViewer.vue'
import StorageOwnersViewer from '@/components/storages/StorageOwnersViewer.vue'
import StorageRoutesViewer from '@/components/storages/StorageRoutesViewer.vue'
import { StorageType } from '@/enums/storageType.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const storageType = ref<StorageType | undefined>()
const searchField = ref<string | undefined>()
const selectedStorage = ref<StorageModel | undefined>()
const currentTab = ref('storage-owners')

function resetFilters() {
  storageType.value = undefined
  searchField.value = undefined
}
</script>

<style scoped>
</style>
