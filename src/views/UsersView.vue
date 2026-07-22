<template>
  <div class="users-page">
    <PageHeader :title="t('users.title')" :description="t('users.description')">
      <template #actions>
        <el-button v-if="canCreateUsers" type="primary" @click="openCreateUserDialog">{{ t('users.createUser') }}</el-button>
      </template>
    </PageHeader>

    <div class="users-content">
      <section class="users-panel users-filter-panel">
        <div class="users-filter-toolbar">
          <div class="users-filter-toolbar__search">
            <label class="users-field-label">{{ t('common.labels.search') }}</label>
            <el-input v-model="searchTerm" clearable :placeholder="t('users.searchPlaceholder')" />
          </div>
          <div class="users-filter-toolbar__roles">
            <label class="users-field-label">{{ t('common.labels.roles') }}</label>
            <el-select
              v-model="selectedRoleFilters"
              multiple
              filterable
              remote
              reserve-keyword
              clearable
              class="w-full"
              :placeholder="t('users.allRoles')"
              :loading="rolesLoading"
              :remote-method="searchRoles"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role.systemName"
                :label="roleOptionLabel(role)"
                :value="role.systemName"
              />
            </el-select>
          </div>
          <el-button class="users-filter-toolbar__action" plain @click="resetFilters">{{ t('users.resetFilters') }}</el-button>
        </div>
      </section>

      <div class="users-workspace">
        <section class="users-panel users-list-panel">
          <header class="users-panel-header">
            <div>
              <h2>{{ t('users.title') }}</h2>
              <p>{{ users.length.toLocaleString(locale) }} · {{ t('common.labels.page', { page: page + 1 }) }}</p>
            </div>
          </header>

          <el-table
            ref="usersTableRef"
            v-loading="usersLoading"
            :data="users"
            class="users-table"
            height="100%"
            highlight-current-row
            @current-change="selectUser"
          >
            <el-table-column prop="surname" :label="t('common.labels.surname')" min-width="140" />
            <el-table-column prop="name" :label="t('common.labels.firstName')" min-width="140" />
            <el-table-column prop="userName" :label="t('common.labels.login')" min-width="180" />
            <el-table-column :label="t('users.lastLogin')" min-width="170">
              <template #default="{ row }">
                {{ formatDate(row.lastLoginAt) }}
              </template>
            </el-table-column>
          </el-table>

          <footer class="users-panel-footer">
            <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
          </footer>
        </section>

        <section class="users-panel users-details-panel">
          <template v-if="selectedUser">
            <div class="user-details-header">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="user-details-title">
                    {{ selectedUser.surname }} {{ selectedUser.name }}
                  </div>
                  <div class="user-details-subtitle">{{ selectedUser.userName }}</div>
                </div>
                <el-dropdown trigger="click" @command="handleUserAction">
                  <el-button :icon="MoreFilled" circle plain />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-if="canEditUserInfo"
                        command="editInfo"
                        :icon="Edit"
                      >
                        {{ t('users.editInfo') }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <div v-loading="detailsLoading" class="users-details-scroll">
                  <div class="grid grid-cols-2 gap-3 pb-4">
                    <div class="rounded-lg border border-slate-200 bg-white p-4">
                      <div class="text-sm font-medium text-slate-600">{{ t('users.discount') }}</div>
                      <div class="mt-2 text-2xl font-semibold text-slate-900">{{ discountText }}</div>
                      <el-button class="mt-3" size="small" @click="discountDialogOpen = true">{{ t('common.actions.change') }}</el-button>
                    </div>
                    <div class="rounded-lg border border-slate-200 bg-white p-4">
                      <div class="flex items-center justify-between gap-2">
                        <div class="text-sm font-medium text-slate-600">{{ t('common.labels.roles') }}</div>
                        <el-button
                          v-if="canManageUserRoles"
                          size="small"
                          plain
                          @click="openAddRoleDialog"
                        >
                          {{ t('users.addRole') }}
                        </el-button>
                      </div>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <el-tag
                          v-for="role in userRoles"
                          :key="role"
                          round
                          :closable="canRemoveUserRole(role)"
                          :disable-transitions="true"
                          @close="confirmRemoveRole(role)"
                        >
                          {{ roleDisplayName(role) }}
                        </el-tag>
                        <span v-if="userRoles.length === 0" class="text-sm text-slate-400">{{ t('users.noRoles') }}</span>
                      </div>
                    </div>
                  </div>

                  <section v-if="canViewOrganizations" class="pb-4">
                    <el-divider content-position="left">{{ t('users.organizations') }}</el-divider>
                    <div v-loading="userOrganizationsLoading" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <button
                        v-for="organization in userOrganizations"
                        :key="organization.id"
                        type="button"
                        class="flex w-full items-center justify-between gap-3 border-0 border-b border-slate-100 bg-white px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                        @click="openOrganization(organization.id)"
                      >
                        <span class="min-w-0 truncate text-sm font-medium text-slate-900">{{ organization.name }}</span>
                        <span class="shrink-0 text-xs text-slate-500">
                          {{ t(`organizations.types.${organization.type}`) }}
                        </span>
                      </button>
                      <div v-if="!userOrganizationsLoading && userOrganizations.length === 0" class="px-3 py-4 text-center text-sm text-slate-400">
                        {{ userOrganizationsError || t('users.noOrganizations') }}
                      </div>
                    </div>
                    <el-button
                      v-if="userOrganizationsHasNext"
                      class="mt-2"
                      size="small"
                      text
                      type="primary"
                      :loading="userOrganizationsLoading"
                      @click="loadMoreUserOrganizations"
                    >
                      {{ t('users.loadMoreOrganizations') }}
                    </el-button>
                  </section>

                  <el-divider content-position="left">{{ t('users.contacts') }}</el-divider>
                    <div class="grid gap-3 pb-4">
                      <div v-for="email in userEmails" :key="email.email" class="rounded-lg bg-slate-50 p-3 text-sm">
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                              <span class="break-all font-medium text-slate-900">{{ email.email }}</span>
                              <el-tag v-if="email.isPrimary" size="small" type="success">{{ t('users.primary') }}</el-tag>
                              <el-tag size="small" :type="email.confirmed ? 'success' : 'warning'">
                                {{ email.confirmed ? t('users.confirmed') : t('users.notConfirmed') }}
                              </el-tag>
                            </div>
                            <div class="mt-1 text-xs text-slate-500">{{ emailTypeLabel(email.emailType) }}</div>
                          </div>
                          <el-button
                            v-if="canManageUserEmails"
                            size="small"
                            type="danger"
                            plain
                            :loading="removingEmail === email.email"
                            @click="confirmRemoveEmail(email.email)"
                          >
                            {{ t('common.actions.delete') }}
                          </el-button>
                        </div>
                      </div>
                      <div v-if="userEmails.length === 0" class="text-sm text-slate-400">{{ t('users.noEmails') }}</div>
                    </div>

                    <div class="grid gap-3 pb-4">
                      <div v-for="phone in userPhones" :key="phone.number" class="rounded-lg bg-slate-50 p-3 text-sm">
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                              <span class="break-all font-medium text-slate-900">{{ phone.number }}</span>
                              <el-tag v-if="phone.isPrimary" size="small" type="success">{{ t('users.primary') }}</el-tag>
                              <el-tag size="small" :type="phone.isConfirmed ? 'success' : 'warning'">
                                {{ phone.isConfirmed ? t('users.confirmed') : t('users.notConfirmed') }}
                              </el-tag>
                            </div>
                            <div class="mt-1 text-xs text-slate-500">{{ phoneTypeLabel(phone.type) }}</div>
                          </div>
                        </div>
                      </div>
                      <div v-if="userPhones.length === 0" class="text-sm text-slate-400">{{ t('users.noPhones') }}</div>
                    </div>

                  <div class="flex items-center justify-between">
                    <el-divider content-position="left">{{ t('users.storages') }}</el-divider>
                    <el-button size="small" type="primary" @click="openAddStorageDialog">{{ t('users.addStorage') }}</el-button>
                  </div>
                  <div class="grid gap-3 pb-4">
                    <div v-for="storage in userStorages" :key="storage.name" class="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <div>
                        <div class="font-medium text-slate-900">{{ storage.name }}</div>
                        <div class="text-sm text-slate-500">{{ storage.location || t('users.locationMissing') }}</div>
                      </div>
                      <el-button size="small" type="danger" plain @click="detachStorage(storage.name)">{{ t('common.actions.delete') }}</el-button>
                    </div>
                    <div v-if="userStorages.length === 0" class="text-sm text-slate-400">{{ t('users.noStorages') }}</div>
                  </div>

                  <el-collapse v-model="openDetailsSections" class="user-details-collapse">
                    <el-collapse-item name="permissions">
                      <template #title>
                        <div class="flex w-full items-center justify-between pr-3">
                          <span class="text-sm font-semibold text-slate-900">{{ t('users.permissions') }}</span>
                          <el-button
                            size="small"
                            type="primary"
                            plain
                            @click.stop="openAddPermissionDialog"
                          >
                            {{ t('users.addPermission') }}
                          </el-button>
                        </div>
                      </template>

                      <div class="flex flex-wrap gap-2 pb-4">
                        <el-tooltip
                          v-for="permission in userPermissions"
                          :key="permission"
                          placement="top"
                          :show-after="300"
                        >
                          <template #content>
                            <div class="max-w-[320px]">
                              <div class="font-semibold">{{ permissionTooltipTitle(permission) }}</div>
                              <div class="mt-1 text-xs opacity-80">{{ permission }}</div>
                              <div class="mt-2 text-sm">{{ permissionTooltipDescription(permission) }}</div>
                            </div>
                          </template>
                          <el-tag
                            class="cursor-pointer"
                            effect="plain"
                            round
                            closable
                            :disable-transitions="true"
                            @click="openPermission(permission)"
                            @close="confirmRemovePermission(permission)"
                          >
                            {{ permission }}
                          </el-tag>
                        </el-tooltip>
                        <span v-if="userPermissions.length === 0" class="text-sm text-slate-400">{{ t('users.noDirectPermissions') }}</span>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </template>

              <template v-else>
                <el-empty :description="t('users.selectToView')" />
              </template>
        </section>
      </div>
    </div>

    <el-dialog v-model="createUserDialogOpen" :title="t('users.createUser')" width="860" class="create-user-dialog">
      <el-form label-position="top">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="t('common.labels.login')">
            <el-input v-model="createUserForm.userName" autocomplete="off" />
          </el-form-item>
          <el-form-item :label="t('common.labels.password')">
            <el-input v-model="createUserForm.password" type="password" show-password autocomplete="new-password" />
          </el-form-item>
          <el-form-item :label="t('common.labels.firstName')">
            <el-input v-model="createUserForm.name" />
          </el-form-item>
          <el-form-item :label="t('common.labels.surname')">
            <el-input v-model="createUserForm.surname" />
          </el-form-item>
        </div>

        <el-form-item :label="t('common.labels.description')">
          <el-input v-model="createUserForm.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item :label="t('common.labels.roles')">
          <el-select
            v-model="createUserForm.roles"
            multiple
            filterable
            remote
            reserve-keyword
            class="w-full"
            :placeholder="t('users.selectRoles')"
            :loading="rolesLoading"
            :remote-method="searchRoles"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.systemName"
              :label="roleOptionLabel(role)"
              :value="role.systemName"
            />
          </el-select>
        </el-form-item>

        <div class="mb-2 flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-slate-900">Email</div>
            <div class="text-xs text-slate-500">
              {{ t('users.emailsRange', { min: emailOptions.minEmailCount, max: emailOptions.maxEmailCount }) }}
            </div>
          </div>
          <el-button
            size="small"
            plain
            :disabled="createUserForm.emails.length >= emailOptions.maxEmailCount"
            @click="addCreateUserEmail"
          >
            {{ t('users.addEmail') }}
          </el-button>
        </div>
        <div class="grid gap-3 pb-4">
          <div
            v-for="(email, index) in createUserForm.emails"
            :key="index"
            class="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div class="grid grid-cols-[minmax(0,1fr)_160px_auto] items-start gap-3">
              <el-form-item class="mb-0" :label="t('common.labels.address')">
                <el-input v-model="email.email" placeholder="email@example.com" />
              </el-form-item>
              <el-form-item class="mb-0" :label="t('common.labels.type')">
                <el-select v-model="email.type" class="w-full">
                  <el-option :label="t('users.personalEmail')" value="Personal" />
                  <el-option :label="t('users.workEmail')" value="Work" />
                  <el-option :label="t('users.unknownEmail')" value="Unknown" />
                </el-select>
              </el-form-item>
              <el-button
                class="mt-[30px]"
                :disabled="createUserForm.emails.length <= emailOptions.minEmailCount"
                type="danger"
                plain
                @click="removeCreateUserEmail(index)"
              >
                {{ t('common.actions.delete') }}
              </el-button>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              <el-checkbox v-model="email.isPrimary" @change="setPrimaryCreateUserEmail(index)">{{ t('users.primary') }}</el-checkbox>
              <el-checkbox v-model="email.isConfirmed">{{ t('users.confirmed') }}</el-checkbox>
            </div>
          </div>
          <div v-if="emailValidationMessage" class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {{ emailValidationMessage }}
          </div>
        </div>

        <div class="mb-2 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-900">{{ t('users.phones') }}</div>
          <el-button size="small" plain @click="addCreateUserPhone">{{ t('users.addPhone') }}</el-button>
        </div>
        <div class="grid gap-3">
          <div
            v-for="(phone, index) in createUserForm.phones"
            :key="index"
            class="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div class="grid grid-cols-[minmax(0,1fr)_160px_auto] items-start gap-3">
              <el-form-item class="mb-0" :label="t('users.phoneNumber')">
                <el-input v-model="phone.number" placeholder="+7..." />
              </el-form-item>
              <el-form-item class="mb-0" :label="t('common.labels.type')">
                <el-select v-model="phone.type" class="w-full">
                  <el-option :label="t('users.personalPhone')" value="Personal" />
                  <el-option :label="t('users.workPhone')" value="Work" />
                  <el-option :label="t('users.unknownPhone')" value="Unknown" />
                </el-select>
              </el-form-item>
              <el-button
                class="mt-[30px]"
                type="danger"
                plain
                @click="removeCreateUserPhone(index)"
              >
                {{ t('common.actions.delete') }}
              </el-button>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              <el-checkbox v-model="phone.isPrimary" @change="setPrimaryCreateUserPhone(index)">{{ t('users.primary') }}</el-checkbox>
              <el-checkbox v-model="phone.isConfirmed">{{ t('users.confirmed') }}</el-checkbox>
            </div>
          </div>
          <div v-if="createUserForm.phones.length === 0" class="rounded-lg bg-slate-50 p-3 text-sm text-slate-400">
            {{ t('users.noPhones') }}
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="createUserDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :disabled="!canSaveCreateUser" @click="saveCreateUser">{{ t('common.actions.create') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="storageDialogOpen" :title="t('users.addStorageToUser')" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.storage')">
          <el-select v-model="storageToAttach" filterable class="w-full" :placeholder="t('users.selectStorage')">
            <el-option
              v-for="storage in attachableStorages"
              :key="storage.name"
              :label="storage.name"
              :value="storage.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="storageDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="attachStorage">{{ t('common.actions.add') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="discountDialogOpen" :title="t('users.editDiscount')" width="420">
      <el-form label-position="top">
        <el-form-item :label="t('users.newDiscount')">
          <el-input-number v-model="discountFormValue" :min="0" :max="99" :precision="2" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="discountDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="saveDiscount">{{ t('common.actions.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editInfoDialogOpen" :title="t('users.editInfo')" width="560">
      <el-form label-position="top">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="t('common.labels.firstName')" required>
            <el-input v-model="editInfoForm.name" />
          </el-form-item>
          <el-form-item :label="t('common.labels.surname')" required>
            <el-input v-model="editInfoForm.surname" />
          </el-form-item>
        </div>

        <el-form-item :label="t('common.labels.description')">
          <el-input v-model="editInfoForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editInfoDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="!canSaveEditInfo"
          :loading="editInfoSaving"
          @click="saveUserInfo"
        >
          {{ t('common.actions.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogOpen" :title="t('users.addRole')" width="560">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.roles')">
          <el-select
            v-model="roleToAttach"
            filterable
            remote
            reserve-keyword
            class="w-full"
            :placeholder="t('users.selectRole')"
            :loading="rolesLoading"
            :remote-method="searchRoles"
          >
            <el-option
              v-for="role in attachableRoles"
              :key="role.systemName"
              :label="roleOptionLabel(role)"
              :value="role.systemName"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="!roleToAttach"
          :loading="roleAttachLoading"
          @click="attachRole"
        >
          {{ t('common.actions.add') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogOpen" :title="t('users.addPermission')" width="560">
      <el-form label-position="top">
        <el-form-item :label="t('permissions.title')">
          <el-select
            v-model="permissionToAttach"
            filterable
            class="w-full"
            :placeholder="t('users.selectPermission')"
          >
            <el-option
              v-for="permission in attachablePermissions"
              :key="permission.systemName"
              :label="permissionOptionLabel(permission)"
              :value="permission.systemName"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          :disabled="!permissionToAttach"
          :loading="permissionAttachLoading"
          @click="attachPermission"
        >
          {{ t('common.actions.add') }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Edit, MoreFilled } from '@element-plus/icons-vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { GeneralSearchStrategy } from '@/enums/generalSearchStrategy.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import type { OrganizationModel } from '@/models/organizationModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { getRoles, type RoleModel } from '@/services/api/roles.ts'
import { getStorages } from '@/services/api/storages.ts'
import { getPermissions } from '@/services/api/permissions.ts'
import type { PermissionModel } from '@/models/permissionModel.ts'
import type { UserEmailModel } from '@/services/api/users.ts'
import {
  addPermissionToUser,
  addRoleToUser,
  addStorageToUser,
  changeUserDiscount,
  createUser,
  editUserInfo,
  getEmailOptions,
  getUserDiscount,
  getUserFullInfo,
  getUserOrganizations,
  getUsers,
  getUserStorages,
  removeEmailFromUser,
  removePermissionFromUser,
  removeRoleFromUser,
  removeStorageFromUser,
  type UserPhoneModel,
} from '@/services/api/users.ts'
import { useI18n } from '@/i18n'

interface CreateUserEmailForm {
  email: string
  type: string
  isPrimary: boolean
  isConfirmed: boolean
}

interface CreateUserPhoneForm {
  number: string
  type: string
  isPrimary: boolean
  isConfirmed: boolean
}

const users = ref<UserModel[]>([])
const usersTableRef = ref<TableInstance>()
const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { hasPermission } = usePermissions()
const canCreateUsers = computed(() => hasPermission('USERS_CREATE'))
const canEditUserInfo = canCreateUsers
const canManageUserEmails = computed(() => hasPermission('USERS_MAILS_CREATE'))
const canManageUserRoles = computed(() => hasPermission('USERS_ROLES_CREATE'))
const canViewOrganizations = computed(() => hasPermission('ORGANIZATIONS_GET'))
const selectedUser = ref<UserModel>()
const searchTerm = ref<string>()
const selectedRoleFilters = ref<string[]>([])
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const usersLoading = ref(false)
const detailsLoading = ref(false)

const userRoles = ref<string[]>([])
const userPermissions = ref<string[]>([])
const userEmails = ref<UserEmailModel[]>([])
const userPhones = ref<UserPhoneModel[]>([])
const userStorages = ref<StorageModel[]>([])
const userOrganizations = ref<OrganizationModel[]>([])
const userOrganizationsPage = ref(0)
const userOrganizationsHasNext = ref(false)
const userOrganizationsLoading = ref(false)
const userOrganizationsError = ref('')
const userDiscount = ref<number>(0)
const permissionsCatalog = ref<PermissionModel[]>([])
const openDetailsSections = ref<string[]>([])
let permissionsCatalogRequestId = 0
let rolesRequestId = 0

const allStorages = ref<StorageModel[]>([])
const storageDialogOpen = ref(false)
const storageToAttach = ref<string>()
const discountDialogOpen = ref(false)
const editInfoDialogOpen = ref(false)
const permissionDialogOpen = ref(false)
const roleDialogOpen = ref(false)
const permissionAttachLoading = ref(false)
const roleAttachLoading = ref(false)
const editInfoSaving = ref(false)
const removingEmail = ref('')
const discountFormValue = ref<number>(0)
const permissionToAttach = ref('')
const roleToAttach = ref('')
const createUserDialogOpen = ref(false)
const rolesLoading = ref(false)
const roleOptions = ref<RoleModel[]>([])
const emailOptions = reactive({
  minEmailCount: 1,
  maxEmailCount: 5,
})

const createUserForm = reactive({
  userName: '',
  password: '',
  name: '',
  surname: '',
  description: '',
  roles: [] as string[],
  emails: [] as CreateUserEmailForm[],
  phones: [] as CreateUserPhoneForm[],
})

const editInfoForm = reactive({
  name: '',
  surname: '',
  description: '',
})

const discountText = computed(() => `${(userDiscount.value * 100).toFixed(2)}%`)
const filledCreateUserEmails = computed(() => (
  createUserForm.emails.filter((email) => email.email.trim() !== '')
))
const emailValidationMessage = computed(() => {
  const count = filledCreateUserEmails.value.length
  if (count < emailOptions.minEmailCount) return t('users.minEmails', { count: emailOptions.minEmailCount })
  if (count > emailOptions.maxEmailCount) return t('users.maxEmails', { count: emailOptions.maxEmailCount })
  if (!filledCreateUserEmails.value.some((email) => email.isPrimary)) return t('users.choosePrimaryEmail')
  return ''
})
const canSaveCreateUser = computed(() => (
  createUserForm.userName.trim() !== ''
  && createUserForm.password.trim() !== ''
  && createUserForm.name.trim() !== ''
  && createUserForm.surname.trim() !== ''
  && emailValidationMessage.value === ''
))
const canSaveEditInfo = computed(() => (
  editInfoForm.name.trim() !== ''
  && editInfoForm.surname.trim() !== ''
  && !editInfoSaving.value
))
const attachableStorages = computed(() => {
  const attached = new Set(userStorages.value.map((storage) => storage.name))
  return allStorages.value.filter((storage) => !attached.has(storage.name))
})
const permissionsBySystemName = computed(() => new Map(
  permissionsCatalog.value.map((permission) => [permission.systemName, permission]),
))
const attachablePermissions = computed(() => {
  const attached = new Set(userPermissions.value)
  return permissionsCatalog.value.filter((permission) => !attached.has(permission.systemName))
})
const attachableRoles = computed(() => {
  const attached = new Set(userRoles.value)
  return roleOptions.value.filter((role) => !isSystemRole(role) && !attached.has(role.systemName))
})

const loadUsersDebounced = useDebounceFn(async () => {
  await loadUsers(true)
}, 300)

function roleDisplayName(systemName: string) {
  const role = roleOptions.value.find((item) => item.systemName === systemName)
  return role?.localizedName || role?.systemName || systemName
}

function roleOptionLabel(role: RoleModel) {
  const name = role.localizedName || role.systemName
  return role.description ? `${name} — ${role.description}` : name
}

function normalizeRoleName(value?: string | null) {
  return (value ?? '').trim().toLocaleLowerCase()
}

function isSystemRole(role: RoleModel | string) {
  if (typeof role === 'string') {
    return normalizeRoleName(role) === 'system'
  }

  const systemName = normalizeRoleName(role.systemName)
  const localizedName = normalizeRoleName(role.localizedName)
  return systemName === 'system'
    || localizedName === 'system'
    || localizedName === 'система'
    || localizedName === 'sistem'
}

function canRemoveUserRole(role: string) {
  return canManageUserRoles.value && !isSystemRole(role)
}

function emailTypeLabel(type?: string | null) {
  switch (type) {
    case 'Personal':
      return t('users.personalEmail')
    case 'Work':
      return t('users.workEmail')
    case 'Unknown':
      return t('users.unknownEmail')
    default:
      return type || t('users.notSpecified')
  }
}

function phoneTypeLabel(type?: string | null) {
  switch (type) {
    case 'Personal':
      return t('users.personalPhone')
    case 'Work':
      return t('users.workPhone')
    case 'Unknown':
      return t('users.unknownPhone')
    default:
      return type || t('users.notSpecified')
  }
}

function permissionTooltipTitle(systemName: string) {
  return permissionsBySystemName.value.get(systemName)?.name || systemName
}

function permissionTooltipDescription(systemName: string) {
  return permissionsBySystemName.value.get(systemName)?.description || t('users.noPermissionDescription')
}

function permissionOptionLabel(permission: PermissionModel) {
  return `${permission.name} (${permission.systemName})`
}

function formatDate(value?: string | null) {
  if (!value) return t('users.noData')

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function resetFilters() {
  searchTerm.value = undefined
  selectedRoleFilters.value = []
}

function resetCreateUserForm() {
  createUserForm.userName = ''
  createUserForm.password = ''
  createUserForm.name = ''
  createUserForm.surname = ''
  createUserForm.description = ''
  createUserForm.roles = []
  createUserForm.emails = []
  for (let index = 0; index < Math.max(emailOptions.minEmailCount, 1); index += 1) {
    createUserForm.emails.push(createDefaultEmail(index === 0))
  }
  createUserForm.phones = []
}

function createDefaultEmail(isPrimary = false): CreateUserEmailForm {
  return {
    email: '',
    type: 'Personal',
    isPrimary,
    isConfirmed: false,
  }
}

function createDefaultPhone(isPrimary = false): CreateUserPhoneForm {
  return {
    number: '',
    type: 'Personal',
    isPrimary,
    isConfirmed: false,
  }
}

async function openCreateUserDialog() {
  await loadEmailOptions()
  resetCreateUserForm()
  createUserDialogOpen.value = true
  await loadRoles()
}

function addCreateUserEmail() {
  if (createUserForm.emails.length >= emailOptions.maxEmailCount) return

  createUserForm.emails.push({
    email: '',
    type: 'Personal',
    isPrimary: createUserForm.emails.length === 0,
    isConfirmed: false,
  })
}

function removeCreateUserEmail(index: number) {
  if (createUserForm.emails.length <= emailOptions.minEmailCount) return

  const wasPrimary = createUserForm.emails[index]?.isPrimary
  createUserForm.emails.splice(index, 1)

  if (wasPrimary && createUserForm.emails.length > 0) {
    const firstEmail = createUserForm.emails[0]
    if (firstEmail) firstEmail.isPrimary = true
  }
}

function setPrimaryCreateUserEmail(index: number) {
  if (!createUserForm.emails[index]?.isPrimary) return

  createUserForm.emails.forEach((email, emailIndex) => {
    email.isPrimary = emailIndex === index
  })
}

function addCreateUserPhone() {
  createUserForm.phones.push(createDefaultPhone(createUserForm.phones.length === 0))
}

function removeCreateUserPhone(index: number) {
  const wasPrimary = createUserForm.phones[index]?.isPrimary
  createUserForm.phones.splice(index, 1)

  if (wasPrimary && createUserForm.phones.length > 0) {
    const firstPhone = createUserForm.phones[0]
    if (firstPhone) firstPhone.isPrimary = true
  }
}

function setPrimaryCreateUserPhone(index: number) {
  if (!createUserForm.phones[index]?.isPrimary) return

  createUserForm.phones.forEach((phone, phoneIndex) => {
    phone.isPrimary = phoneIndex === index
  })
}

async function loadRoles(searchTerm?: string, force = false) {
  if (rolesLoading.value && !force) return

  const requestId = ++rolesRequestId
  rolesLoading.value = true
  try {
    const resp = await getRoles({
      searchTerm: searchTerm?.trim() || undefined,
      page: 0,
      size: 100,
    })
    if (requestId !== rolesRequestId) return
    roleOptions.value = resp.roles
  } finally {
    if (requestId === rolesRequestId) {
      rolesLoading.value = false
    }
  }
}

const searchRoles = useDebounceFn(async (query: string) => {
  await loadRoles(query)
}, 250)

async function loadEmailOptions() {
  const resp = await getEmailOptions()
  emailOptions.minEmailCount = resp.emailOptions.minEmailCount
  emailOptions.maxEmailCount = resp.emailOptions.maxEmailCount
}

async function loadUsers(resetPage: boolean) {
  if (usersLoading.value) return

  usersLoading.value = true
  try {
    if (resetPage) page.value = 0

    const resp = await getUsers({
      page: page.value,
      limit: limit.value,
      searchMethod: GeneralSearchStrategy.General,
      searchTerm: searchTerm.value,
      roles: selectedRoleFilters.value.length > 0 ? selectedRoleFilters.value : undefined,
    })

    users.value = resp.users
    hasNext.value = resp.users.length === limit.value

    if (selectedUser.value) {
      const nextSelectedUser = resp.users.find((user) => user.id === selectedUser.value?.id)
      selectedUser.value = nextSelectedUser
      if (!nextSelectedUser) clearDetails()
    }
  } finally {
    usersLoading.value = false
  }
}

function clearDetails() {
  userRoles.value = []
  userPermissions.value = []
  userEmails.value = []
  userPhones.value = []
  userStorages.value = []
  userOrganizations.value = []
  userOrganizationsPage.value = 0
  userOrganizationsHasNext.value = false
  userOrganizationsError.value = ''
  userDiscount.value = 0
  openDetailsSections.value = []
}

async function selectUser(user?: UserModel) {
  selectedUser.value = user
  await nextTick()
  usersTableRef.value?.setCurrentRow(user)

  if (!user) {
    clearDetails()
    return
  }

  detailsLoading.value = true
  try {
    const [fullInfo, storages, discount] = await Promise.all([
      getUserFullInfo(user.id),
      getUserStorages(user.id),
      getUserDiscount(user.id),
      loadUserOrganizations(user.id, true),
    ])

    selectedUser.value = fullInfo.user
    userRoles.value = fullInfo.roles
    userPermissions.value = fullInfo.permissions
    userEmails.value = fullInfo.emails
    userPhones.value = fullInfo.phones
    userStorages.value = storages.storages
    userDiscount.value = discount.discount
    discountFormValue.value = discount.discount * 100
    openDetailsSections.value = []
  } finally {
    detailsLoading.value = false
  }
}

async function loadUserOrganizations(userId: string, reset: boolean) {
  if (!canViewOrganizations.value || userOrganizationsLoading.value) return

  if (reset) {
    userOrganizations.value = []
    userOrganizationsPage.value = 0
    userOrganizationsHasNext.value = true
    userOrganizationsError.value = ''
  }
  if (!userOrganizationsHasNext.value) return

  userOrganizationsLoading.value = true
  try {
    const response = await getUserOrganizations(userId, {
      page: userOrganizationsPage.value,
      limit: 10,
      sortBy: 'Name',
    })
    const existingIds = new Set(userOrganizations.value.map((organization) => organization.id))
    userOrganizations.value.push(...response.organizations.filter((organization) => !existingIds.has(organization.id)))
    userOrganizationsHasNext.value = response.organizations.length === 10
    userOrganizationsPage.value += 1
  } catch {
    userOrganizationsHasNext.value = false
    userOrganizationsError.value = t('users.organizationsLoadError')
  } finally {
    userOrganizationsLoading.value = false
  }
}

async function loadMoreUserOrganizations() {
  if (!selectedUser.value) return
  await loadUserOrganizations(selectedUser.value.id, false)
}

function openOrganization(organizationId: string) {
  router.push({ name: 'organizations', query: { organizationId } })
}

async function reloadSelectedUserFullInfo() {
  if (!selectedUser.value) return

  const fullInfo = await getUserFullInfo(selectedUser.value.id)
  selectedUser.value = fullInfo.user
  users.value = users.value.map((user) => (user.id === fullInfo.user.id ? fullInfo.user : user))
  userRoles.value = fullInfo.roles
  userPermissions.value = fullInfo.permissions
  userEmails.value = fullInfo.emails
  userPhones.value = fullInfo.phones
}

async function selectUserFromRoute() {
  const userId = typeof route.query.userId === 'string' ? route.query.userId : undefined
  if (!userId) return

  const existingUser = users.value.find((user) => user.id === userId)
  if (existingUser) {
    await selectUser(existingUser)
    return
  }

  const fullInfo = await getUserFullInfo(userId)
  users.value = [
    fullInfo.user,
    ...users.value.filter((user) => user.id !== fullInfo.user.id),
  ]
  await selectUser(fullInfo.user)
}

async function saveCreateUser() {
  if (!canSaveCreateUser.value) return

  const resp = await createUser({
    userName: createUserForm.userName.trim(),
    password: createUserForm.password,
    userInfo: {
      name: createUserForm.name.trim(),
      surname: createUserForm.surname.trim(),
      description: createUserForm.description.trim() || null,
    },
    emails: filledCreateUserEmails.value
      .map((email) => ({
        email: email.email.trim(),
        type: email.type,
        isPrimary: email.isPrimary,
        isConfirmed: email.isConfirmed,
      })),
    phones: createUserForm.phones
      .filter((phone) => phone.number.trim() !== '')
      .map((phone) => ({
        number: phone.number.trim(),
        type: phone.type,
        isPrimary: phone.isPrimary,
        isConfirmed: phone.isConfirmed,
      })),
    roles: createUserForm.roles,
  })

  users.value = [
    resp.user,
    ...users.value.filter((user) => user.id !== resp.user.id),
  ]

  createUserDialogOpen.value = false
  await selectUser(resp.user)

  ElNotification({
    title: t('common.labels.success'),
    message: t('users.created'),
    type: 'success',
  })
}

async function loadAllStorages() {
  const resp = await getStorages({ page: 0, limit: 200 })
  allStorages.value = resp.storages
}

async function loadPermissionsCatalog() {
  const requestId = ++permissionsCatalogRequestId
  const resp = await getPermissions()
  if (requestId !== permissionsCatalogRequestId) return
  permissionsCatalog.value = resp.permissions
}

function openAddStorageDialog() {
  storageToAttach.value = undefined
  storageDialogOpen.value = true
}

function openPermission(permission: string) {
  router.push({
    name: 'permissions',
    query: { search: permission },
  })
}

function openAddPermissionDialog() {
  permissionToAttach.value = ''
  permissionDialogOpen.value = true
}

async function openAddRoleDialog() {
  roleToAttach.value = ''
  roleDialogOpen.value = true
  await loadRoles(undefined, true)
}

function openEditInfoDialog() {
  if (!selectedUser.value) return

  editInfoForm.name = selectedUser.value.name
  editInfoForm.surname = selectedUser.value.surname
  editInfoForm.description = selectedUser.value.description ?? ''
  editInfoDialogOpen.value = true
}

function handleUserAction(command: string) {
  if (command === 'editInfo') {
    openEditInfoDialog()
    return
  }
}

function applyUserInfo(userId: string, userInfo: { name: string; surname: string; description?: string | null }) {
  const normalizedInfo = {
    name: userInfo.name,
    surname: userInfo.surname,
    description: userInfo.description ?? undefined,
  }

  const patchUser = (user: UserModel): UserModel => ({
    ...user,
    userInfo: normalizedInfo,
    name: normalizedInfo.name,
    surname: normalizedInfo.surname,
    description: normalizedInfo.description,
  })

  users.value = users.value.map((user) => (user.id === userId ? patchUser(user) : user))
  if (selectedUser.value?.id === userId) {
    selectedUser.value = patchUser(selectedUser.value)
  }
}

async function saveUserInfo() {
  if (!selectedUser.value || !canSaveEditInfo.value) return

  const userId = selectedUser.value.id
  editInfoSaving.value = true
  try {
    const response = await editUserInfo({
      userId,
      userInfo: {
        name: editInfoForm.name.trim(),
        surname: editInfoForm.surname.trim(),
        description: editInfoForm.description.trim() || null,
      },
    })
    applyUserInfo(userId, response.userInfo)
    editInfoDialogOpen.value = false
    ElNotification({
      title: t('common.labels.success'),
      message: t('users.infoUpdated'),
      type: 'success',
    })
  } finally {
    editInfoSaving.value = false
  }
}

async function attachPermission() {
  if (!selectedUser.value || !permissionToAttach.value || permissionAttachLoading.value) return

  permissionAttachLoading.value = true
  try {
    await addPermissionToUser({
      userId: selectedUser.value.id,
      permission: permissionToAttach.value,
    })
    if (!userPermissions.value.includes(permissionToAttach.value)) {
      userPermissions.value = [...userPermissions.value, permissionToAttach.value]
    }
    permissionDialogOpen.value = false
    ElNotification({
      title: t('common.labels.success'),
      message: t('users.permissionAdded'),
      type: 'success',
    })
  } finally {
    permissionAttachLoading.value = false
  }
}

async function attachRole() {
  if (!selectedUser.value || !roleToAttach.value || roleAttachLoading.value) return

  roleAttachLoading.value = true
  try {
    await addRoleToUser({
      userId: selectedUser.value.id,
      roleName: roleToAttach.value,
    })
    await reloadSelectedUserFullInfo()
    roleDialogOpen.value = false
    ElNotification({
      title: t('common.labels.success'),
      message: t('users.roleAdded'),
      type: 'success',
    })
  } finally {
    roleAttachLoading.value = false
  }
}

async function confirmRemoveRole(role: string) {
  if (!selectedUser.value || !canRemoveUserRole(role)) return

  try {
    await ElMessageBox.confirm(
      t('users.removeRoleConfirm', { role: roleDisplayName(role) }),
      t('users.removeRoleTitle'),
      {
        confirmButtonText: t('common.actions.delete'),
        cancelButtonText: t('common.actions.cancel'),
        type: 'warning',
      },
    )
  } catch {
    return
  }

  await removeRoleFromUser({
    userId: selectedUser.value.id,
    roleName: role,
  })
  await reloadSelectedUserFullInfo()
  ElNotification({
    title: t('common.labels.success'),
    message: t('users.roleRemoved'),
    type: 'success',
  })
}

async function confirmRemovePermission(permission: string) {
  if (!selectedUser.value) return

  try {
    await ElMessageBox.confirm(
      t('users.removePermissionConfirm', { permission }),
      t('users.removePermissionTitle'),
      {
        confirmButtonText: t('common.actions.delete'),
        cancelButtonText: t('common.actions.cancel'),
        type: 'warning',
      },
    )
  } catch {
    return
  }

  await removePermissionFromUser({
    userId: selectedUser.value.id,
    permission,
  })
  userPermissions.value = userPermissions.value.filter((item) => item !== permission)
  ElNotification({
    title: t('common.labels.success'),
    message: t('users.permissionRemoved'),
    type: 'success',
  })
}

async function confirmRemoveEmail(email: string) {
  if (!selectedUser.value || removingEmail.value) return

  try {
    await ElMessageBox.confirm(
      t('users.removeEmailConfirm', { email }),
      t('users.removeEmailTitle'),
      {
        confirmButtonText: t('common.actions.delete'),
        cancelButtonText: t('common.actions.cancel'),
        type: 'warning',
      },
    )
  } catch {
    return
  }

  removingEmail.value = email
  try {
    await removeEmailFromUser({
      userId: selectedUser.value.id,
      email,
    })
    userEmails.value = userEmails.value.filter((item) => item.email !== email)
    ElNotification({
      title: t('common.labels.success'),
      message: t('users.emailRemoved'),
      type: 'success',
    })
  } finally {
    removingEmail.value = ''
  }
}

async function attachStorage() {
  if (!selectedUser.value || !storageToAttach.value) return

  await addStorageToUser({
    userId: selectedUser.value.id,
    storageName: storageToAttach.value,
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('users.storageAttached'),
    type: 'success',
  })

  storageDialogOpen.value = false
  userStorages.value = (await getUserStorages(selectedUser.value.id)).storages
}

async function detachStorage(storageName: string) {
  if (!selectedUser.value) return

  await removeStorageFromUser({
    userId: selectedUser.value.id,
    storageName,
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('users.storageDetached'),
    type: 'success',
  })

  userStorages.value = userStorages.value.filter((storage) => storage.name !== storageName)
}

async function saveDiscount() {
  if (!selectedUser.value) return

  await changeUserDiscount({
    userId: selectedUser.value.id,
    newDiscountRate: discountFormValue.value / 100,
  })

  userDiscount.value = discountFormValue.value / 100
  discountDialogOpen.value = false

  ElNotification({
    title: t('common.labels.success'),
    message: t('users.discountUpdated'),
    type: 'success',
  })
}

watch(limit, async () => loadUsers(true))
watch(page, async () => loadUsers(false))
watch(searchTerm, () => loadUsersDebounced())
watch(selectedRoleFilters, async () => loadUsers(true))
watch(locale, async () => {
  await Promise.all([
    loadPermissionsCatalog(),
    loadRoles(undefined, true),
  ])
})
watch(() => route.query.userId, async () => selectUserFromRoute())
onMounted(async () => {
  await Promise.all([loadUsers(true), loadAllStorages(), loadRoles(), loadEmailOptions(), loadPermissionsCatalog()])
  await selectUserFromRoute()
})
</script>

<style scoped>
.users-page {
  min-height: calc(100vh - 56px);
  background: #f7f8fa;
}

.users-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.users-panel {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.users-filter-panel {
  padding: 16px;
}

.users-filter-toolbar {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(240px, 360px) max-content;
  align-items: end;
  gap: 12px;
}

.users-filter-toolbar__search,
.users-filter-toolbar__roles {
  min-width: 0;
}

.users-field-label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.users-workspace {
  display: grid;
  grid-template-columns: minmax(520px, 58%) minmax(360px, 42%);
  gap: 16px;
  min-height: min(760px, calc(100vh - 220px));
}

.users-list-panel,
.users-details-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.users-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 16px;
}

.users-panel-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}

.users-panel-header p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 13px;
}

.users-table {
  flex: 1;
}

.users-table :deep(.el-table__header th) {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
}

.users-table :deep(.el-table__cell) {
  padding-top: 11px;
  padding-bottom: 11px;
}

.users-panel-footer {
  border-top: 1px solid #e2e8f0;
  padding: 12px 16px;
}

.user-details-header {
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 16px;
}

.user-details-title {
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.user-details-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 13px;
}

.users-details-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

:deep(.create-user-dialog .el-dialog__body) {
  max-height: min(760px, calc(100vh - 180px));
  overflow-y: auto;
}

.user-details-collapse {
  border-top: 1px solid rgb(226 232 240);
  border-bottom: 0;
}

.user-details-collapse :deep(.el-collapse-item__header) {
  background: transparent;
}

.user-details-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

@media (max-width: 1180px) {
  .users-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .users-content {
    padding: 12px;
  }

  .users-filter-panel,
  .users-details-scroll,
  .user-details-header {
    padding: 12px;
  }

  .users-filter-toolbar {
    grid-template-columns: 1fr;
  }

  .users-filter-toolbar__action {
    width: 100%;
  }

  .users-filter-toolbar__action :deep(.el-button),
  .users-filter-toolbar__action {
    width: 100%;
  }
}
</style>
