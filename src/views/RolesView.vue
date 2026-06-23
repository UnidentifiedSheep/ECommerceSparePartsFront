<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('roles.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('roles.description') }}</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">{{ t('roles.create') }}</el-button>
    </div>

    <div class="p-4">
      <el-card shadow="hover">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ t('roles.listTitle') }}</h2>
              <p class="text-sm text-slate-500">{{ t('roles.sourceHint') }}</p>
            </div>
            <div class="flex items-center gap-2">
              <el-input
                v-model="searchTerm"
                clearable
                :placeholder="t('roles.searchPlaceholder')"
                class="w-72"
                @keyup.enter="loadRolesPage(true)"
              />
              <el-button :loading="isLoading" @click="loadRolesPage(true)">
                {{ t('common.actions.refresh') }}
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          v-loading="isLoading"
          :data="roles"
          stripe
          highlight-current-row
        >
          <el-table-column prop="systemName" :label="t('roles.systemName')" min-width="220" />
          <el-table-column :label="t('common.labels.name')" min-width="220">
            <template #default="{ row }">
              {{ row.localizedName || row.systemName }}
            </template>
          </el-table-column>
          <el-table-column :label="t('common.labels.description')" min-width="320">
            <template #default="{ row }">
              {{ row.description || '—' }}
            </template>
          </el-table-column>
          <el-table-column :label="t('common.labels.actions')" width="260" align="right" fixed="right">
            <template #default="{ row }">
              <div class="flex justify-end gap-2">
                <el-button size="small" @click="openEditDialog(row)">{{ t('common.actions.edit') }}</el-button>
                <el-button size="small" type="primary" plain @click="openPermissionDialog(row)">
                  {{ t('roles.addPermission') }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <template #footer>
          <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
        </template>
      </el-card>
    </div>

    <el-dialog v-model="roleDialogOpen" :title="roleDialogTitle" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('roles.name')">
          <el-input v-model="roleForm.name" :disabled="roleDialogMode === 'edit'" />
        </el-form-item>
        <el-form-item :label="t('common.labels.description')">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :disabled="!canSaveRole" :loading="isSavingRole" @click="saveRole">
          {{ t('common.actions.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogOpen" :title="permissionDialogTitle" width="560">
      <div v-loading="roleDetailsLoading" class="grid gap-4">
        <section>
          <div class="mb-2 text-sm font-semibold text-slate-900">{{ t('roles.currentPermissions') }}</div>
          <div v-if="rolePermissions.length > 0" class="flex max-h-44 flex-wrap gap-2 overflow-auto rounded-lg bg-slate-50 p-3">
            <el-tooltip
              v-for="permission in rolePermissions"
              :key="permission.systemName"
              :content="permission.description || permission.systemName"
              placement="top"
            >
              <el-tag effect="plain" round>{{ permission.name }}</el-tag>
            </el-tooltip>
          </div>
          <div v-else class="rounded-lg bg-slate-50 p-3 text-sm text-slate-400">
            {{ t('roles.noPermissions') }}
          </div>
        </section>

        <el-form label-position="top">
        <el-form-item :label="t('permissions.title')">
          <el-select
            v-model="permissionToAdd"
            filterable
            class="w-full"
            :loading="permissionsLoading"
            :placeholder="t('roles.selectPermission')"
          >
            <el-option
              v-for="permission in availablePermissions"
              :key="permission.systemName"
              :label="permissionOptionLabel(permission)"
              :value="permission.systemName"
            />
          </el-select>
        </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="permissionDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :disabled="!permissionToAdd || roleDetailsLoading" :loading="isAddingPermission" @click="addPermission">
          {{ t('common.actions.add') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { PermissionModel } from '@/models/permissionModel.ts'
import { getPermissions } from '@/services/api/permissions.ts'
import {
  addPermissionToRole,
  getRole,
  getRoles,
  type RoleModel,
  upsertRole,
} from '@/services/api/roles.ts'
import { useI18n } from '@/i18n'

type RoleDialogMode = 'create' | 'edit'

const { locale, t } = useI18n()
const roles = ref<RoleModel[]>([])
const permissions = ref<PermissionModel[]>([])
const searchTerm = ref('')
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const isLoading = ref(false)
const roleDialogOpen = ref(false)
const roleDialogMode = ref<RoleDialogMode>('create')
const isSavingRole = ref(false)
const permissionDialogOpen = ref(false)
const permissionsLoading = ref(false)
const isAddingPermission = ref(false)
const roleDetailsLoading = ref(false)
const selectedRole = ref<RoleModel | null>(null)
const rolePermissions = ref<PermissionModel[]>([])
const permissionToAdd = ref('')
let rolesRequestId = 0
let permissionsRequestId = 0
let roleDetailsRequestId = 0

const roleForm = reactive({
  name: '',
  description: '',
})

const roleDialogTitle = computed(() => (
  roleDialogMode.value === 'create' ? t('roles.createTitle') : t('roles.editTitle')
))
const permissionDialogTitle = computed(() => (
  selectedRole.value
    ? t('roles.addPermissionTitle', { role: selectedRole.value.localizedName || selectedRole.value.systemName })
    : t('roles.addPermission')
))
const canSaveRole = computed(() => roleForm.name.trim() !== '')
const rolePermissionNames = computed(() => new Set(rolePermissions.value.map((permission) => permission.systemName)))
const availablePermissions = computed(() => (
  permissions.value.filter((permission) => !rolePermissionNames.value.has(permission.systemName))
))

function openCreateDialog() {
  roleDialogMode.value = 'create'
  roleForm.name = ''
  roleForm.description = ''
  roleDialogOpen.value = true
}

function openEditDialog(role: RoleModel) {
  roleDialogMode.value = 'edit'
  roleForm.name = role.systemName
  roleForm.description = role.description ?? ''
  roleDialogOpen.value = true
}

async function openPermissionDialog(role: RoleModel) {
  selectedRole.value = role
  rolePermissions.value = []
  permissionToAdd.value = ''
  permissionDialogOpen.value = true
  await Promise.all([
    permissions.value.length === 0 ? loadPermissions() : Promise.resolve(),
    loadRoleDetails(role.systemName),
  ])
}

async function loadRolesPage(resetPage = false) {
  const requestId = ++rolesRequestId
  isLoading.value = true
  try {
    if (resetPage) page.value = 0
    const resp = await getRoles({
      searchTerm: searchTerm.value.trim() || undefined,
      page: page.value,
      size: limit.value,
    })
    if (requestId !== rolesRequestId) return
    roles.value = resp.roles
    hasNext.value = resp.roles.length === limit.value
  } finally {
    if (requestId === rolesRequestId) {
      isLoading.value = false
    }
  }
}

async function loadPermissions() {
  const requestId = ++permissionsRequestId
  permissionsLoading.value = true
  try {
    const resp = await getPermissions()
    if (requestId !== permissionsRequestId) return
    permissions.value = resp.permissions
  } finally {
    if (requestId === permissionsRequestId) {
      permissionsLoading.value = false
    }
  }
}

async function loadRoleDetails(roleSystemName: string) {
  const requestId = ++roleDetailsRequestId
  roleDetailsLoading.value = true
  try {
    const resp = await getRole(roleSystemName)
    if (requestId !== roleDetailsRequestId) return
    selectedRole.value = resp.role
    rolePermissions.value = resp.permissions
  } finally {
    if (requestId === roleDetailsRequestId) {
      roleDetailsLoading.value = false
    }
  }
}

async function saveRole() {
  if (!canSaveRole.value || isSavingRole.value) return

  isSavingRole.value = true
  try {
    await upsertRole({
      name: roleForm.name.trim(),
      description: roleForm.description.trim() || null,
    })
    roleDialogOpen.value = false
    await loadRolesPage()
    ElNotification({
      title: t('common.labels.success'),
      message: roleDialogMode.value === 'create' ? t('roles.created') : t('roles.updated'),
      type: 'success',
    })
  } finally {
    isSavingRole.value = false
  }
}

async function addPermission() {
  if (!selectedRole.value || !permissionToAdd.value || isAddingPermission.value) return

  isAddingPermission.value = true
  try {
    await addPermissionToRole(selectedRole.value.systemName, permissionToAdd.value)
    const addedPermission = permissions.value.find((permission) => permission.systemName === permissionToAdd.value)
    if (addedPermission && !rolePermissionNames.value.has(addedPermission.systemName)) {
      rolePermissions.value = [...rolePermissions.value, addedPermission]
    }
    permissionToAdd.value = ''
    ElNotification({
      title: t('common.labels.success'),
      message: t('roles.permissionAdded'),
      type: 'success',
    })
  } finally {
    isAddingPermission.value = false
  }
}

function permissionOptionLabel(permission: PermissionModel) {
  return `${permission.name} (${permission.systemName})`
}

watch(page, async () => loadRolesPage())
watch(limit, async () => loadRolesPage(true))
watch(locale, async () => {
  await Promise.all([
    loadRolesPage(),
    loadPermissions(),
  ])
})

onMounted(async () => {
  await Promise.all([
    loadRolesPage(),
    loadPermissions(),
  ])
})
</script>
