<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('permissions.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('permissions.description') }}</p>
      </div>
    </div>

    <div class="p-4">
      <el-card shadow="hover">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ t('permissions.listTitle') }}</h2>
              <p class="text-sm text-slate-500">{{ t('permissions.sourceHint') }}</p>
            </div>
            <el-input
              v-model="searchTerm"
              clearable
              :placeholder="t('permissions.searchPlaceholder')"
              class="max-w-sm"
            />
          </div>
        </template>

        <el-table v-loading="isLoading" :data="filteredPermissions" stripe>
          <el-table-column prop="systemName" :label="t('permissions.systemName')" min-width="260" />
          <el-table-column prop="name" :label="t('common.labels.name')" min-width="260" />
          <el-table-column :label="t('common.labels.description')" min-width="420">
            <template #default="{ row }">
              {{ row.description || '—' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { PermissionModel } from '@/models/permissionModel.ts'
import { getPermissions } from '@/services/api/permissions.ts'
import { useI18n } from '@/i18n'

const route = useRoute()
const { locale, t } = useI18n()
const permissions = ref<PermissionModel[]>([])
const searchTerm = ref(getSearchQuery())
const isLoading = ref(false)
let permissionsRequestId = 0

const filteredPermissions = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return permissions.value

  return permissions.value.filter((permission) => {
    return [permission.systemName, permission.name, permission.description ?? '']
      .some((value) => value.toLowerCase().includes(query))
  })
})

async function loadPermissions() {
  if (isLoading.value) return

  const requestId = ++permissionsRequestId
  isLoading.value = true
  try {
    const resp = await getPermissions()
    if (requestId !== permissionsRequestId) return
    permissions.value = resp.permissions
  } finally {
    if (requestId === permissionsRequestId) {
      isLoading.value = false
    }
  }
}

watch(
  () => route.query.search,
  async () => {
    searchTerm.value = getSearchQuery()
  },
)
watch(locale, async () => loadPermissions())
onMounted(async () => loadPermissions())

function getSearchQuery() {
  const search = route.query.search
  return typeof search === 'string' ? search : ''
}
</script>

<style scoped>
</style>
