<template>
  <el-popover
    v-model:visible="open"
    trigger="click"
    placement="bottom-start"
    :width="440"
    :disabled="disabled"
    popper-class="organization-selector-popper"
    @show="ensureOrganizations"
  >
    <template #reference>
      <button
        type="button"
        class="organization-selector-trigger"
        :class="{ 'is-disabled': disabled }"
        :disabled="disabled"
      >
        <span v-if="modelValue" class="selection-value">
          <strong>{{ modelValue.organization.name }}</strong>
          <span v-if="modelValue.member">{{ userName(modelValue.member.user) }}</span>
        </span>
        <span v-else class="selection-placeholder">{{ resolvedPlaceholder }}</span>
        <el-icon
          v-if="clearable && modelValue && !disabled"
          class="clear-selection"
          @click.stop="clearSelection"
        >
          <Close />
        </el-icon>
        <el-icon v-else class="trigger-arrow" :class="{ 'is-open': open }"><ArrowDown /></el-icon>
      </button>
    </template>

    <div class="organization-tree">
      <el-input
        v-model="searchTerm"
        :placeholder="t('organizations.searchPlaceholder')"
        clearable
        :prefix-icon="Search"
        @input="searchOrganizations"
      />

      <div v-loading="organizationsLoading" class="tree-scroll">
        <div v-if="!organizationsLoading && organizations.length === 0" class="tree-empty">
          {{ t('organizations.notFound') }}
        </div>

        <div v-for="organization in organizations" :key="organization.id" class="organization-branch">
          <div
            class="organization-row"
            :class="{ 'is-selected': modelValue?.organization.id === organization.id && !modelValue.member }"
            @click="handleOrganizationClick(organization)"
          >
            <el-icon
              v-if="organization.type !== 'Individual'"
              class="branch-arrow"
              :class="{ 'is-expanded': branch(organization.id).expanded }"
            >
              <CaretRight />
            </el-icon>
            <span v-else class="branch-leaf" aria-hidden="true" />
            <div class="organization-copy">
              <strong>{{ organization.name }}</strong>
              <span>{{ organizationMeta(organization) }}</span>
            </div>
            <el-button
              v-if="!memberRequired && organization.type !== 'Individual'"
              size="small"
              text
              type="primary"
              @click.stop="selectOrganization(organization)"
            >
              {{ t('organizations.selectOrganization') }}
            </el-button>
          </div>

          <div v-if="branch(organization.id).expanded" class="member-branch">
            <div v-if="branch(organization.id).loading && branch(organization.id).members.length === 0" class="branch-status">
              {{ t('organizations.loadingMembers') }}
            </div>
            <button
              v-for="member in branch(organization.id).members"
              :key="member.user.id"
              type="button"
              class="member-row"
              :class="{ 'is-selected': modelValue?.member?.user.id === member.user.id }"
              @click="selectMember(organization, member)"
            >
              <span class="member-avatar">{{ initials(member.user) }}</span>
              <span class="member-copy">
                <strong>{{ userName(member.user) }}</strong>
                <span>{{ t(`organizations.roles.${member.role}`) }}</span>
              </span>
              <el-icon v-if="modelValue?.member?.user.id === member.user.id"><Check /></el-icon>
            </button>
            <div
              v-if="!branch(organization.id).loading && branch(organization.id).members.length === 0"
              class="branch-status"
            >
              {{ t('organizations.noMembers') }}
            </div>
            <button
              v-if="branch(organization.id).hasNext"
              type="button"
              class="load-more"
              :disabled="branch(organization.id).loading"
              @click="loadMembers(organization.id)"
            >
              {{ branch(organization.id).loading ? t('organizations.loadingMembers') : t('organizations.loadMoreMembers') }}
            </button>
          </div>
        </div>

        <button
          v-if="organizationsHasNext"
          type="button"
          class="load-more organization-load-more"
          :disabled="organizationsLoading"
          @click="loadOrganizations(false)"
        >
          {{ t('organizations.loadMoreOrganizations') }}
        </button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ArrowDown, CaretRight, Check, Close, Search } from '@element-plus/icons-vue'
import type {
  OrganizationMemberModel,
  OrganizationModel,
  OrganizationSelection,
  OrganizationType,
} from '@/models/organizationModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { getOrganizationMembers, getOrganizations } from '@/services/api/organizations.ts'
import { useI18n } from '@/i18n'

interface MemberBranch {
  expanded: boolean
  loading: boolean
  loaded: boolean
  page: number
  hasNext: boolean
  members: OrganizationMemberModel[]
}

const props = withDefaults(defineProps<{
  modelValue?: OrganizationSelection
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  memberRequired?: boolean
  types?: OrganizationType[]
}>(), {
  modelValue: undefined,
  placeholder: undefined,
  clearable: true,
  disabled: false,
  memberRequired: true,
  types: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: OrganizationSelection | undefined]
}>()

const { t } = useI18n()
const organizationLimit = 20
const memberLimit = 20
const open = ref(false)
const searchTerm = ref('')
const organizations = ref<OrganizationModel[]>([])
const organizationsPage = ref(0)
const organizationsHasNext = ref(true)
const organizationsLoading = ref(false)
const branches = reactive<Record<string, MemberBranch>>({})
let organizationsRequestId = 0

const resolvedPlaceholder = computed(() => props.placeholder ?? (
  props.memberRequired ? t('organizations.selectMember') : t('organizations.selectOrganization')
))

const searchOrganizations = useDebounceFn(() => loadOrganizations(true), 250)

function branch(organizationId: string) {
  return branches[organizationId] ??= {
    expanded: false,
    loading: false,
    loaded: false,
    page: 0,
    hasNext: true,
    members: [],
  }
}

function ensureOrganizations() {
  if (organizations.value.length === 0) void loadOrganizations(true)
}

async function loadOrganizations(reset: boolean) {
  if (organizationsLoading.value && !reset) return
  const requestId = ++organizationsRequestId
  if (reset) {
    organizationsPage.value = 0
    organizationsHasNext.value = true
  }
  if (!organizationsHasNext.value) return

  organizationsLoading.value = true
  try {
    const response = await getOrganizations({
      searchTerm: searchTerm.value,
      types: props.types.length > 0 ? props.types : undefined,
      page: organizationsPage.value,
      limit: organizationLimit,
      sortBy: 'Name',
    })
    if (requestId !== organizationsRequestId) return

    if (reset) organizations.value = []
    const existingIds = new Set(organizations.value.map((organization) => organization.id))
    organizations.value.push(...response.organizations.filter((organization) => !existingIds.has(organization.id)))
    ensureSelectedOrganization()
    organizationsHasNext.value = response.organizations.length === organizationLimit
    organizationsPage.value += 1
  } finally {
    if (requestId === organizationsRequestId) organizationsLoading.value = false
  }
}

function handleOrganizationClick(organization: OrganizationModel) {
  if (organization.type === 'Individual') {
    selectMember(organization, organization.owner)
    return
  }

  void toggleOrganization(organization)
}

async function toggleOrganization(organization: OrganizationModel) {
  const state = branch(organization.id)
  state.expanded = !state.expanded
  if (state.expanded && !state.loaded) await loadMembers(organization.id)
}

async function loadMembers(organizationId: string) {
  const state = branch(organizationId)
  if (state.loading || !state.hasNext) return

  state.loading = true
  try {
    const response = await getOrganizationMembers({
      organizationId,
      page: state.page,
      limit: memberLimit,
    })
    const existingIds = new Set(state.members.map((member) => member.user.id))
    state.members.push(...response.members.filter((member) => !existingIds.has(member.user.id)))
    state.hasNext = response.members.length === memberLimit
    state.page += 1
    state.loaded = true
  } finally {
    state.loading = false
  }
}

function selectOrganization(organization: OrganizationModel) {
  emit('update:modelValue', { organization })
  open.value = false
}

function selectMember(organization: OrganizationModel, member: OrganizationMemberModel) {
  emit('update:modelValue', { organization, member })
  open.value = false
}

function clearSelection() {
  emit('update:modelValue', undefined)
}

function ensureSelectedOrganization() {
  const selected = props.modelValue?.organization
  if (selected && !organizations.value.some((organization) => organization.id === selected.id)) {
    organizations.value.unshift(selected)
  }
}

function userName(user: UserModel) {
  return [user.surname, user.name].filter(Boolean).join(' ') || user.userName
}

function initials(user: UserModel) {
  const parts = [user.name, user.surname].filter(Boolean)
  return (parts.map((part) => part[0]).join('').slice(0, 2) || user.userName.slice(0, 2)).toUpperCase()
}

function organizationMeta(organization: OrganizationModel) {
  const type = t(`organizations.types.${organization.type}`)
  const generatedSystemName = /^(individual|business|system)-[0-9a-f-]+$/i.test(organization.systemName)
  return generatedSystemName || organization.systemName === organization.name
    ? type
    : `${organization.systemName} · ${type}`
}

watch(() => props.modelValue, ensureSelectedOrganization)
watch(() => props.types, () => void loadOrganizations(true), { deep: true })
</script>

<style scoped>
.organization-selector-trigger {
  width: 100%;
  height: 32px;
  min-height: 32px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 1px 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  font: inherit;
  line-height: 1;
  text-align: left;
}

.organization-selector-trigger:hover:not(.is-disabled) { border-color: var(--el-border-color-hover); }
.organization-selector-trigger.is-disabled { cursor: not-allowed; background: var(--el-disabled-bg-color); }
.selection-value { min-width: 0; flex: 1; display: flex; align-items: baseline; gap: 6px; overflow: hidden; }
.selection-value strong, .selection-value span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selection-value span { color: var(--el-text-color-secondary); font-size: 12px; }
.selection-placeholder { flex: 1; color: var(--el-text-color-placeholder); }
.trigger-arrow, .clear-selection { flex: none; color: var(--el-text-color-placeholder); transition: transform 150ms ease; }
.trigger-arrow.is-open { transform: rotate(180deg); }
.clear-selection:hover { color: var(--el-text-color-primary); }
.organization-tree { display: grid; gap: 10px; }
.tree-scroll { min-height: 72px; max-height: 286px; overflow-y: auto; overscroll-behavior: contain; }
.tree-empty, .branch-status { padding: 16px 12px; color: var(--el-text-color-secondary); font-size: 13px; text-align: center; }
.organization-branch + .organization-branch { border-top: 1px solid var(--el-border-color-lighter); }
.organization-row { min-height: 44px; display: flex; align-items: center; gap: 8px; padding: 5px 6px; cursor: pointer; }
.organization-row:hover, .organization-row.is-selected { background: var(--el-fill-color-light); }
.branch-arrow { flex: none; color: var(--el-text-color-secondary); transition: transform 150ms ease; }
.branch-arrow.is-expanded { transform: rotate(90deg); }
.branch-leaf { width: 14px; height: 14px; flex: none; position: relative; }
.branch-leaf::after { content: ''; position: absolute; inset: 5px; border-radius: 50%; background: var(--el-color-primary); }
.organization-copy, .member-copy { min-width: 0; flex: 1; display: grid; gap: 2px; }
.organization-copy strong, .member-copy strong { overflow: hidden; color: var(--el-text-color-primary); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.organization-copy span, .member-copy span { overflow: hidden; color: var(--el-text-color-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.member-branch { margin: 0 6px 8px 17px; padding-left: 13px; border-left: 1px solid var(--el-border-color); }
.member-row { width: 100%; min-height: 40px; display: flex; align-items: center; gap: 9px; padding: 5px 8px; border: 0; border-radius: 6px; background: transparent; text-align: left; cursor: pointer; }
.member-row:hover, .member-row.is-selected { background: var(--el-fill-color-light); }
.member-avatar { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 5px; background: var(--el-fill-color-dark); color: var(--el-text-color-regular); font-size: 10px; font-weight: 700; }
.load-more { width: 100%; padding: 8px; border: 0; background: transparent; color: var(--el-color-primary); font-size: 12px; cursor: pointer; }
.load-more:disabled { color: var(--el-text-color-placeholder); cursor: wait; }
.organization-load-more { border-top: 1px solid var(--el-border-color-lighter); }
</style>
