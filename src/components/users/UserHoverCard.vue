<template>
  <el-popover
    placement="top-start"
    trigger="hover"
    width="300"
    popper-class="user-hover-card-popper"
    @show="loadUser"
  >
    <template #reference>
      <button class="user-hover-card-reference" type="button" @click.stop>
        <slot>{{ displayName }}</slot>
      </button>
    </template>

    <div v-loading="state.loading" class="user-hover-card">
      <template v-if="resolvedUser">
        <div class="user-hover-card__header">
          <div class="user-hover-card__avatar" aria-hidden="true">
            {{ initials }}
          </div>
          <div class="user-hover-card__identity">
            <div class="user-hover-card__name">{{ displayName }}</div>
            <div class="user-hover-card__login">{{ resolvedUser.userName }}</div>
          </div>
        </div>

        <div v-if="displayRoles.length > 0" class="user-hover-card__roles">
          <el-tag
            v-for="role in displayRoles"
            :key="role"
            size="small"
            effect="plain"
          >
            {{ role }}
          </el-tag>
        </div>

        <div class="user-hover-card__footer">
          <el-button size="small" plain @click.stop="openUser">
            {{ t('common.actions.open') }}
          </el-button>
        </div>
      </template>

      <template v-else-if="state.error">
        <div class="user-hover-card__muted">{{ state.error }}</div>
      </template>

      <template v-else>
        <div class="user-hover-card__muted">{{ t('sales.loading') }}</div>
      </template>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { UserModel } from '@/models/userModel.ts'
import { getUserFullInfo } from '@/services/api/users.ts'
import { getRoles, type RoleModel } from '@/services/api/roles.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  user?: UserModel
  userId?: string
}>()

const router = useRouter()
const { t } = useI18n()

const userCache = reactive<Record<string, {
  loading: boolean
  user?: UserModel
  roles: string[]
  error?: string
}>>({})

let rolesPromise: Promise<RoleModel[]> | undefined
const rolesBySystemName = new Map<string, RoleModel>()

const targetUserId = computed(() => props.user?.id ?? props.userId)
const state = computed(() => {
  const id = targetUserId.value ?? ''
  if (!userCache[id]) {
    userCache[id] = {
      loading: false,
      roles: [],
    }
  }
  return userCache[id]
})
const resolvedUser = computed(() => state.value.user ?? props.user)
const displayName = computed(() => {
  const user = resolvedUser.value
  if (!user) return targetUserId.value ?? ''

  const fullName = `${user.surname} ${user.name}`.trim()
  return fullName || user.userName
})
const initials = computed(() => {
  const user = resolvedUser.value
  if (!user) return '?'

  const first = user.surname?.trim().charAt(0) || user.userName?.trim().charAt(0) || '?'
  const second = user.name?.trim().charAt(0) || ''
  return `${first}${second}`.toUpperCase()
})
const displayRoles = computed(() => (
  state.value.roles.map((role) => {
    const roleInfo = rolesBySystemName.get(role)
    return roleInfo?.localizedName || roleInfo?.systemName || role
  })
))

async function loadRolesOnce() {
  if (rolesBySystemName.size > 0) return

  if (!rolesPromise) {
    rolesPromise = getRoles({ page: 0, size: 100 })
      .then((response) => response.roles)
      .finally(() => {
        rolesPromise = undefined
      })
  }

  const roles = await rolesPromise
  rolesBySystemName.clear()
  roles.forEach((role) => rolesBySystemName.set(role.systemName, role))
}

async function loadUser() {
  const id = targetUserId.value
  if (!id || state.value.loading || state.value.user || state.value.error) return

  state.value.loading = true
  try {
    const [response] = await Promise.all([
      getUserFullInfo(id),
      loadRolesOnce(),
    ])
    state.value.user = response.user
    state.value.roles = response.roles
  } catch (error) {
    state.value.error = error instanceof Error ? error.message : t('common.messages.unexpectedError')
  } finally {
    state.value.loading = false
  }
}

async function openUser() {
  const id = targetUserId.value
  if (!id) return

  await router.push({
    name: 'users',
    query: { userId: id },
  })
}
</script>

<style scoped>
.user-hover-card-reference {
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  color: #0f172a;
  font: inherit;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.user-hover-card-reference:hover {
  color: #1d4ed8;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.user-hover-card {
  min-height: 46px;
}

.user-hover-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-hover-card__avatar {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  color: #334155;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 750;
}

.user-hover-card__identity {
  min-width: 0;
}

.user-hover-card__name {
  overflow: hidden;
  color: #0f172a;
  font-size: 14px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-hover-card__login,
.user-hover-card__muted {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.user-hover-card__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.user-hover-card__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}
</style>
