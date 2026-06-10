<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Пользователи</h1>
        <p class="text-sm text-slate-500">Поиск, просмотр и управление привязкой складов.</p>
      </div>
      <el-button v-if="canCreateUsers" type="primary" @click="openCreateUserDialog">Создать пользователя</el-button>
    </div>

    <div class="p-4">
      <el-card shadow="hover">
        <el-row :gutter="20" align="bottom">
          <el-col :span="8">
            <label class="mb-2 block text-sm font-medium text-slate-700">Поиск</label>
            <el-input v-model="searchTerm" clearable placeholder="Имя, фамилия, логин или email" />
          </el-col>
          <el-col :span="6">
            <label class="mb-2 block text-sm font-medium text-slate-700">Роли</label>
            <el-select
              v-model="selectedRoleFilters"
              multiple
              filterable
              remote
              reserve-keyword
              clearable
              class="w-full"
              placeholder="Все роли"
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
          </el-col>
          <el-col :span="4">
            <el-button plain @click="resetFilters">Сбросить фильтры</el-button>
          </el-col>
        </el-row>
      </el-card>

      <div class="pt-4">
        <el-row :gutter="24">
          <el-col :span="14">
            <el-card shadow="hover" class="h-[760px]">
              <el-table
                ref="usersTableRef"
                :data="users"
                class="w-full"
                height="100%"
                highlight-current-row
                @current-change="selectUser"
              >
                <el-table-column prop="surname" label="Фамилия" min-width="140" />
                <el-table-column prop="name" label="Имя" min-width="140" />
                <el-table-column prop="userName" label="Логин" min-width="180" />
                <el-table-column label="Последний вход" min-width="170">
                  <template #default="{ row }">
                    {{ formatDate(row.lastLoginAt) }}
                  </template>
                </el-table-column>
              </el-table>

              <template #footer>
                <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
              </template>
            </el-card>
          </el-col>

          <el-col :span="10">
            <el-card shadow="hover" class="h-[760px] overflow-hidden">
              <template v-if="selectedUser">
                <div class="mb-4 rounded-xl bg-slate-50 p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-lg font-semibold text-slate-900">
                        {{ selectedUser.surname }} {{ selectedUser.name }}
                      </div>
                      <div class="mt-1 text-sm text-slate-500">{{ selectedUser.userName }}</div>
                    </div>
                  </div>
                </div>

                <div v-loading="detailsLoading" class="h-[calc(100%-96px)] overflow-auto pr-1">
                  <div class="grid grid-cols-2 gap-3 pb-4">
                    <div class="rounded-xl border border-slate-200 bg-white p-4">
                      <div class="text-xs uppercase tracking-wide text-slate-500">Скидка</div>
                      <div class="mt-2 text-2xl font-semibold text-slate-900">{{ discountText }}</div>
                      <el-button class="mt-3" size="small" @click="discountDialogOpen = true">Изменить</el-button>
                    </div>
                    <div class="rounded-xl border border-slate-200 bg-white p-4">
                      <div class="text-xs uppercase tracking-wide text-slate-500">Роли</div>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <el-tag v-for="role in userRoles" :key="role" round>{{ roleDisplayName(role) }}</el-tag>
                        <span v-if="userRoles.length === 0" class="text-sm text-slate-400">Нет ролей</span>
                      </div>
                    </div>
                  </div>

                  <el-divider content-position="left">Контакты</el-divider>
                    <div class="grid gap-3 pb-4">
                      <div v-for="email in userEmails" :key="email.email" class="rounded-xl bg-slate-50 p-3 text-sm">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-slate-900">{{ email.email }}</span>
                          <el-tag v-if="email.isPrimary" size="small" type="success">Основной</el-tag>
                          <el-tag size="small" :type="email.confirmed ? 'success' : 'warning'">
                            {{ email.confirmed ? 'Подтвержден' : 'Не подтвержден' }}
                          </el-tag>
                        </div>
                        <div class="mt-1 text-xs text-slate-500">{{ emailTypeLabel(email.emailType) }}</div>
                      </div>
                      <div v-if="userEmails.length === 0" class="text-sm text-slate-400">Почтовые адреса не найдены.</div>
                    </div>

                  <div class="flex items-center justify-between">
                    <el-divider content-position="left">Склады</el-divider>
                    <el-button size="small" type="primary" @click="openAddStorageDialog">Добавить склад</el-button>
                  </div>
                  <div class="grid gap-3 pb-4">
                    <div v-for="storage in userStorages" :key="storage.name" class="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                      <div>
                        <div class="font-medium text-slate-900">{{ storage.name }}</div>
                        <div class="text-sm text-slate-500">{{ storage.location || 'Локация не указана' }}</div>
                      </div>
                      <el-button size="small" type="danger" plain @click="detachStorage(storage.name)">Удалить</el-button>
                    </div>
                    <div v-if="userStorages.length === 0" class="text-sm text-slate-400">Склады не привязаны.</div>
                  </div>

                  <el-divider content-position="left">Права</el-divider>
                    <div class="flex flex-wrap gap-2">
                      <el-tag
                        v-for="permission in userPermissions"
                        :key="permission"
                        class="cursor-pointer"
                        effect="plain"
                        round
                        @click="openPermission(permission)"
                      >
                        {{ permission }}
                      </el-tag>
                    <span v-if="userPermissions.length === 0" class="text-sm text-slate-400">Нет прямых прав.</span>
                  </div>
                </div>
              </template>

              <template v-else>
                <el-empty description="Выберите пользователя слева, чтобы увидеть детали" />
              </template>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <el-dialog v-model="createUserDialogOpen" title="Создать пользователя" width="860" class="create-user-dialog">
      <el-form label-position="top">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Логин">
            <el-input v-model="createUserForm.userName" autocomplete="off" />
          </el-form-item>
          <el-form-item label="Пароль">
            <el-input v-model="createUserForm.password" type="password" show-password autocomplete="new-password" />
          </el-form-item>
          <el-form-item label="Имя">
            <el-input v-model="createUserForm.name" />
          </el-form-item>
          <el-form-item label="Фамилия">
            <el-input v-model="createUserForm.surname" />
          </el-form-item>
        </div>

        <el-form-item label="Описание">
          <el-input v-model="createUserForm.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="Роли">
          <el-select
            v-model="createUserForm.roles"
            multiple
            filterable
            remote
            reserve-keyword
            class="w-full"
            placeholder="Выберите роли"
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
              От {{ emailOptions.minEmailCount }} до {{ emailOptions.maxEmailCount }} адресов
            </div>
          </div>
          <el-button
            size="small"
            plain
            :disabled="createUserForm.emails.length >= emailOptions.maxEmailCount"
            @click="addCreateUserEmail"
          >
            Добавить email
          </el-button>
        </div>
        <div class="grid gap-3 pb-4">
          <div
            v-for="(email, index) in createUserForm.emails"
            :key="index"
            class="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div class="grid grid-cols-[minmax(0,1fr)_160px_auto] items-start gap-3">
              <el-form-item class="mb-0" label="Адрес">
                <el-input v-model="email.email" placeholder="email@example.com" />
              </el-form-item>
              <el-form-item class="mb-0" label="Тип">
                <el-select v-model="email.type" class="w-full">
                  <el-option label="Личная" value="Personal" />
                  <el-option label="Рабочая" value="Work" />
                  <el-option label="Неизвестно" value="Unknown" />
                </el-select>
              </el-form-item>
              <el-button
                class="mt-[30px]"
                :disabled="createUserForm.emails.length <= emailOptions.minEmailCount"
                type="danger"
                plain
                @click="removeCreateUserEmail(index)"
              >
                Удалить
              </el-button>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              <el-checkbox v-model="email.isPrimary" @change="setPrimaryCreateUserEmail(index)">Основной</el-checkbox>
              <el-checkbox v-model="email.isConfirmed">Подтвержден</el-checkbox>
            </div>
          </div>
          <div v-if="emailValidationMessage" class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {{ emailValidationMessage }}
          </div>
        </div>

        <div class="mb-2 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-900">Телефоны</div>
          <el-button size="small" plain @click="addCreateUserPhone">Добавить телефон</el-button>
        </div>
        <div class="grid gap-3">
          <div
            v-for="phoneIndex in createUserForm.phones.length"
            :key="phoneIndex"
            class="grid grid-cols-[1fr_auto] items-center gap-3"
          >
            <el-input v-model="createUserForm.phones[phoneIndex - 1]" placeholder="+7..." />
            <el-button type="danger" plain @click="removeCreateUserPhone(phoneIndex - 1)">Удалить</el-button>
          </div>
          <div v-if="createUserForm.phones.length === 0" class="rounded-xl bg-slate-50 p-3 text-sm text-slate-400">
            Телефоны не добавлены.
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="createUserDialogOpen = false">Отмена</el-button>
        <el-button type="primary" :disabled="!canSaveCreateUser" @click="saveCreateUser">Создать</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="storageDialogOpen" title="Добавить склад пользователю" width="520">
      <el-form label-position="top">
        <el-form-item label="Склад">
          <el-select v-model="storageToAttach" filterable class="w-full" placeholder="Выберите склад">
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
        <el-button @click="storageDialogOpen = false">Отмена</el-button>
        <el-button type="primary" @click="attachStorage">Добавить</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="discountDialogOpen" title="Изменить скидку" width="420">
      <el-form label-position="top">
        <el-form-item label="Новая скидка, %">
          <el-input-number v-model="discountFormValue" :min="0" :max="99" :precision="2" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="discountDialogOpen = false">Отмена</el-button>
        <el-button type="primary" @click="saveDiscount">Сохранить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import { GeneralSearchStrategy } from '@/enums/generalSearchStrategy.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { getRoles, type RoleModel } from '@/services/api/roles.ts'
import { getStorages } from '@/services/api/storages.ts'
import type { UserEmailModel } from '@/services/api/users.ts'
import {
  addStorageToUser,
  changeUserDiscount,
  createUser,
  getEmailOptions,
  getUserDiscount,
  getUserFullInfo,
  getUsers,
  getUserStorages,
  removeStorageFromUser,
} from '@/services/api/users.ts'

interface CreateUserEmailForm {
  email: string
  type: string
  isPrimary: boolean
  isConfirmed: boolean
}

const users = ref<UserModel[]>([])
const usersTableRef = ref<TableInstance>()
const route = useRoute()
const router = useRouter()
const { hasPermission } = usePermissions()
const canCreateUsers = computed(() => hasPermission('USERS_CREATE'))
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
const userStorages = ref<StorageModel[]>([])
const userDiscount = ref<number>(0)

const allStorages = ref<StorageModel[]>([])
const storageDialogOpen = ref(false)
const storageToAttach = ref<string>()
const discountDialogOpen = ref(false)
const discountFormValue = ref<number>(0)
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
  phones: [] as string[],
})

const discountText = computed(() => `${(userDiscount.value * 100).toFixed(2)}%`)
const filledCreateUserEmails = computed(() => (
  createUserForm.emails.filter((email) => email.email.trim() !== '')
))
const emailValidationMessage = computed(() => {
  const count = filledCreateUserEmails.value.length
  if (count < emailOptions.minEmailCount) return `Добавьте минимум ${emailOptions.minEmailCount} email.`
  if (count > emailOptions.maxEmailCount) return `Можно добавить максимум ${emailOptions.maxEmailCount} email.`
  if (!filledCreateUserEmails.value.some((email) => email.isPrimary)) return 'Выберите основной email.'
  return ''
})
const canSaveCreateUser = computed(() => (
  createUserForm.userName.trim() !== ''
  && createUserForm.password.trim() !== ''
  && createUserForm.name.trim() !== ''
  && createUserForm.surname.trim() !== ''
  && emailValidationMessage.value === ''
))
const attachableStorages = computed(() => {
  const attached = new Set(userStorages.value.map((storage) => storage.name))
  return allStorages.value.filter((storage) => !attached.has(storage.name))
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

function emailTypeLabel(type?: string | null) {
  switch (type) {
    case 'Personal':
      return 'Личная'
    case 'Work':
      return 'Рабочая'
    case 'Unknown':
      return 'Неизвестно'
    default:
      return type || 'Не указан'
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Нет данных'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
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
  createUserForm.phones.push('')
}

function removeCreateUserPhone(index: number) {
  createUserForm.phones.splice(index, 1)
}

async function loadRoles(searchTerm?: string) {
  if (rolesLoading.value) return

  rolesLoading.value = true
  try {
    const resp = await getRoles({
      searchTerm: searchTerm?.trim() || undefined,
      page: 0,
      size: 100,
    })
    roleOptions.value = resp.roles
  } finally {
    rolesLoading.value = false
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
  userStorages.value = []
  userDiscount.value = 0
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
    ])

    selectedUser.value = fullInfo.user
    userRoles.value = fullInfo.roles
    userPermissions.value = fullInfo.permissions
    userEmails.value = fullInfo.emails
    userStorages.value = storages.storages
    userDiscount.value = discount.discount
    discountFormValue.value = discount.discount * 100
  } finally {
    detailsLoading.value = false
  }
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
      .map((phone) => phone.trim())
      .filter((phone) => phone !== ''),
    roles: createUserForm.roles,
  })

  users.value = [
    resp.user,
    ...users.value.filter((user) => user.id !== resp.user.id),
  ]

  createUserDialogOpen.value = false
  await selectUser(resp.user)

  ElNotification({
    title: 'Успех',
    message: 'Пользователь создан',
    type: 'success',
  })
}

async function loadAllStorages() {
  const resp = await getStorages({ page: 0, limit: 200 })
  allStorages.value = resp.storages
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

async function attachStorage() {
  if (!selectedUser.value || !storageToAttach.value) return

  await addStorageToUser({
    userId: selectedUser.value.id,
    storageName: storageToAttach.value,
  })

  ElNotification({
    title: 'Успех',
    message: 'Склад привязан к пользователю',
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
    title: 'Успех',
    message: 'Склад отвязан от пользователя',
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
    title: 'Успех',
    message: 'Скидка обновлена',
    type: 'success',
  })
}

watch(limit, async () => loadUsers(true))
watch(page, async () => loadUsers(false))
watch(searchTerm, () => loadUsersDebounced())
watch(selectedRoleFilters, async () => loadUsers(true))
watch(() => route.query.userId, async () => selectUserFromRoute())
onMounted(async () => {
  await Promise.all([loadUsers(true), loadAllStorages(), loadRoles(), loadEmailOptions()])
  await selectUserFromRoute()
})
</script>

<style scoped>
:deep(.create-user-dialog .el-dialog__body) {
  max-height: min(760px, calc(100vh - 180px));
  overflow-y: auto;
}
</style>
