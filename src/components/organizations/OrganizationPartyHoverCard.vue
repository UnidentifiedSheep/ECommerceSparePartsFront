<template>
  <el-popover
    v-model:visible="visible"
    :placement="placement"
    :trigger="popoverTrigger"
    :fallback-placements="fallbackPlacements"
    :show-after="350"
    :hide-after="180"
    :show-arrow="true"
    :enterable="true"
    :focus-on-target="true"
    :persistent="false"
    :offset="10"
    role="dialog"
    width="320"
    popper-class="organization-party-hover-card-popper"
  >
    <template #reference>
      <button
        class="organization-party-reference"
        :class="`organization-party-reference--${triggerEntity}`"
        type="button"
        @click.stop="handleReferenceClick"
      >
        <slot>
          <strong>{{ referenceLabel }}</strong>
        </slot>
      </button>
    </template>

    <div class="organization-party-card" data-testid="organization-party-card">
      <div class="organization-party-card__organization">
        <div class="organization-party-card__mark" aria-hidden="true">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="organization-party-card__identity">
          <strong>{{ organization.name || organization.systemName }}</strong>
          <span>
            <el-icon><OfficeBuilding /></el-icon>
            {{ organizationTypeLabel }} · {{ organization.systemName }}
          </span>
        </div>
        <OrganizationApproximateBalance :organization="organization" />
      </div>

      <div v-if="user" class="organization-party-card__user">
        <div class="organization-party-card__user-mark" aria-hidden="true">
          {{ userInitials }}
        </div>
        <div class="organization-party-card__user-copy">
          <span>{{ t('organizations.operationParticipant') }}</span>
          <strong>{{ userDisplayName }}</strong>
          <span>{{ user.userName }}</span>
          <p v-if="user.description">{{ user.description }}</p>
        </div>
      </div>

      <div class="organization-party-card__actions">
        <button
          type="button"
          class="organization-party-card__action"
          :class="{ 'is-primary': triggerEntity === 'organization' }"
          @click.stop="openOrganization"
        >
          <el-icon><OfficeBuilding /></el-icon>
          <span>{{ t('organizations.openOrganization') }}</span>
          <el-icon class="organization-party-card__action-arrow"><ArrowRight /></el-icon>
        </button>
        <button
          v-if="user"
          type="button"
          class="organization-party-card__action"
          :class="{ 'is-primary': triggerEntity === 'user' }"
          @click.stop="openUser"
        >
          <el-icon><User /></el-icon>
          <span>{{ t('organizations.openUser') }}</span>
          <el-icon class="organization-party-card__action-arrow"><ArrowRight /></el-icon>
        </button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { ArrowRight, OfficeBuilding, User } from '@element-plus/icons-vue'
import OrganizationApproximateBalance from '@/components/organizations/OrganizationApproximateBalance.vue'
import type { OrganizationModel } from '@/models/organizationModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { useI18n } from '@/i18n'

const props = withDefaults(defineProps<{
  organization: OrganizationModel
  user?: UserModel
  placement?: 'top-start' | 'right-start' | 'bottom-start' | 'left-start'
  triggerEntity?: 'organization' | 'user'
}>(), {
  user: undefined,
  placement: 'right-start',
  triggerEntity: 'organization',
})

const router = useRouter()
const { t } = useI18n()
const visible = ref(false)
const isCoarsePointer = useMediaQuery('(pointer: coarse)')
const popoverTrigger = computed(() => (
  isCoarsePointer.value ? 'click' as const : ['hover', 'focus'] as const
))
const fallbackPlacements = computed(() => {
  if (props.placement.startsWith('right')) return ['left-start', 'bottom-start', 'top-start'] as const
  if (props.placement.startsWith('left')) return ['right-start', 'bottom-start', 'top-start'] as const
  return ['right-start', 'left-start', 'bottom-start'] as const
})
const userDisplayName = computed(() => {
  if (!props.user) return ''
  return [props.user.surname, props.user.name].filter(Boolean).join(' ') || props.user.userName
})
const referenceLabel = computed(() => (
  props.triggerEntity === 'user' && props.user
    ? userDisplayName.value
    : props.organization.name || props.organization.systemName
))
const organizationTypeLabel = computed(() => t(`organizations.types.${props.organization.type}`))
const userInitials = computed(() => {
  if (!props.user) return '?'
  return [props.user.surname, props.user.name]
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.trim().charAt(0))
    .join('')
    .toUpperCase() || props.user.userName.charAt(0).toUpperCase()
})

async function handleReferenceClick() {
  if (isCoarsePointer.value) return
  if (props.triggerEntity === 'user' && props.user) await openUser()
  else await openOrganization()
}

async function openOrganization() {
  visible.value = false
  await router.push({ name: 'organizations', query: { organizationId: props.organization.id } })
}

async function openUser() {
  if (!props.user) return
  visible.value = false
  await router.push({ name: 'users', query: { userId: props.user.id } })
}
</script>

<style scoped>
.organization-party-reference {
  display: inline-flex;
  max-width: 100%;
  overflow: hidden;
  border-radius: 4px;
  border: 0;
  padding: 1px 2px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.organization-party-reference strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.organization-party-reference strong { color: #0f172a; font-weight: 700; }
.organization-party-reference--user strong { color: #64748b; font-size: 12px; font-weight: 500; }
.organization-party-reference:hover,
.organization-party-reference:focus-visible { background: #ecfdf5; outline: none; }
.organization-party-reference:hover strong,
.organization-party-reference:focus-visible strong { color: #047857; text-decoration: underline; text-underline-offset: 3px; }

.organization-party-card__organization {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.organization-party-card__mark {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid #0f766e;
  border-radius: 8px;
  background: #0f766e;
  color: #ffffff;
  font-size: 17px;
}

.organization-party-card__identity { min-width: 0; display: grid; gap: 2px; }
.organization-party-card__identity strong { overflow: hidden; color: #0f172a; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.organization-party-card__identity span { display: flex; align-items: center; gap: 4px; overflow: hidden; color: #64748b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.organization-party-card__identity span .el-icon { flex: none; }

.organization-party-card__user {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 9px;
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.organization-party-card__user-mark {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #dcfce7;
  color: #166534;
  font-size: 11px;
  font-weight: 750;
}
.organization-party-card__user-copy { min-width: 0; display: grid; gap: 2px; }
.organization-party-card__user-copy > span { overflow: hidden; color: #64748b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.organization-party-card__user-copy strong { color: #0f172a; font-size: 13px; }
.organization-party-card__user-copy p { margin: 4px 0 0; color: #475569; font-size: 12px; line-height: 1.4; }

.organization-party-card__actions {
  display: grid;
  gap: 2px;
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.organization-party-card__action {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  border-radius: 6px;
  padding: 7px 8px;
  background: transparent;
  color: #475569;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.organization-party-card__action:hover,
.organization-party-card__action:focus-visible { background: #f1f5f9; color: #0f172a; outline: none; }
.organization-party-card__action.is-primary { color: #047857; font-weight: 650; }
.organization-party-card__action-arrow { color: #94a3b8; }
</style>
