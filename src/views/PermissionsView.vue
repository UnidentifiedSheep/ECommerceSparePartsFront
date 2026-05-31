<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Разрешения</h1>
        <p class="text-sm text-slate-500">Справочник permissions, доступных в системе.</p>
      </div>
    </div>

    <div class="p-4">
      <el-card shadow="hover">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Список разрешений</h2>
              <p class="text-sm text-slate-500">Данные из GET /main/permissions</p>
            </div>
            <el-input
              v-model="searchTerm"
              clearable
              placeholder="Поиск по имени или описанию"
              class="max-w-sm"
            />
          </div>
        </template>

        <el-table :data="filteredPermissions" stripe>
          <el-table-column prop="name" label="Permission" min-width="280" />
          <el-table-column label="Описание" min-width="420">
            <template #default="{ row }">
              {{ row.description || '—' }}
            </template>
          </el-table-column>
        </el-table>

        <template #footer>
          <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { PermissionModel } from '@/models/permissionModel.ts'
import { getPermissions } from '@/services/api/permissions.ts'

const route = useRoute()
const permissions = ref<PermissionModel[]>([])
const searchTerm = ref(getSearchQuery())
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const isLoading = ref(false)

const filteredPermissions = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return permissions.value

  return permissions.value.filter((permission) => {
    return [permission.name, permission.description ?? ''].some((value) => value.toLowerCase().includes(query))
  })
})

async function loadPermissions(resetPage: boolean) {
  if (isLoading.value) return

  isLoading.value = true
  try {
    if (resetPage) page.value = 0
    const requestSize = searchTerm.value.trim() ? 100 : limit.value

    const resp = await getPermissions({
      page: page.value,
      size: requestSize,
    })

    permissions.value = resp.permissions
    hasNext.value = resp.permissions.length === requestSize
  } finally {
    isLoading.value = false
  }
}

watch(limit, async () => loadPermissions(true))
watch(page, async () => loadPermissions(false))
watch(
  () => route.query.search,
  async () => {
    searchTerm.value = getSearchQuery()
    await loadPermissions(true)
  },
)
onMounted(async () => loadPermissions(true))

function getSearchQuery() {
  const search = route.query.search
  return typeof search === 'string' ? search : ''
}
</script>

<style scoped>
</style>
