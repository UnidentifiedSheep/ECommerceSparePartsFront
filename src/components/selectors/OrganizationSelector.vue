<template>
  <el-popover
    :visible="open"
    :trigger-keys="[]"
    :tabindex="-1"
    placement="bottom-start"
    width="min(440px, calc(100vw - 24px))"
    :disabled="disabled"
    popper-class="organization-selector-popper"
  >
    <template #reference>
      <div
        ref="triggerElement"
        class="organization-selector-trigger"
        :class="{ 'is-disabled': disabled, 'is-open': open, 'has-selection': modelValue && !open }"
        :title="modelValue && !open ? selectionTitle(modelValue) : undefined"
        @click="openSelector"
        @focusout="onFocusOut"
      >
        <input
          ref="searchInput"
          class="organization-selector-input"
          :value="open ? searchTerm : modelValue ? selectionPrimary(modelValue) : ''"
          :placeholder="open && modelValue ? selectionPrimary(modelValue) : resolvedPlaceholder"
          :disabled="disabled"
          :aria-label="resolvedPlaceholder"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="tree"
          :aria-expanded="open"
          :aria-controls="treeId"
          autocomplete="off"
          maxlength="200"
          @focus="openSelector"
          @beforeinput="openSelector"
          @input="onSearchInput"
          @keydown="onSearchKeydown"
        />
        <span v-if="modelValue && !open" class="selection-value" :title="selectionTitle(modelValue)">
          <strong>{{ selectionPrimary(modelValue) }}</strong>
          <span>{{ selectionSecondary(modelValue) }}</span>
          <OrganizationApproximateBalance :organization="modelValue.organization" />
        </span>
        <button
          v-if="!disabled && ((open && searchTerm) || (clearable && modelValue))"
          type="button"
          class="clear-selection"
          :aria-label="t('common.actions.reset')"
          @click.stop="clearInput"
        >
          <el-icon><Close /></el-icon>
        </button>
        <el-icon v-else class="trigger-arrow" :class="{ 'is-open': open }"><ArrowDown /></el-icon>
      </div>
    </template>

    <div ref="treeElement" class="organization-tree" @keydown="onResultsKeydown" @focusout="onFocusOut">
      <div :id="treeId" v-loading="organizationsLoading" class="tree-scroll" role="tree" :aria-label="resolvedPlaceholder" :aria-busy="organizationsLoading">
        <div v-if="!organizationsLoading && organizations.length === 0" class="tree-empty">
          {{ t('organizations.notFound') }}
        </div>

        <div v-for="organization in organizations" :key="organization.id" class="organization-branch">
          <div
            class="organization-row"
            role="treeitem"
            tabindex="0"
            data-organization-option
            :aria-expanded="!organizationOnly && organization.type !== 'Individual' ? branch(organization.id).expanded : undefined"
            :aria-selected="modelValue?.organization.id === organization.id && (organization.type === 'Individual' || !modelValue.member)"
            :class="{
              'is-hidden': organization.isHidden,
              'is-selected': modelValue?.organization.id === organization.id
                && (organization.type === 'Individual' || !modelValue.member),
            }"
            @click="handleOrganizationClick(organization)"
            @keydown.enter.self.prevent.stop="handleOrganizationClick(organization)"
            @keydown.space.self.prevent.stop="handleOrganizationClick(organization)"
          >
            <el-icon
              v-if="!organizationOnly && organization.type !== 'Individual'"
              class="branch-arrow"
              :class="{ 'is-expanded': branch(organization.id).expanded }"
            >
              <CaretRight />
            </el-icon>
            <span v-else class="branch-leaf" aria-hidden="true" />
            <div class="organization-copy">
              <div class="organization-title">
                <strong>{{ organization.name }}</strong>
                <span v-if="organization.isHidden" class="organization-hidden-state">
                  {{ t('organizationPage.hidden') }}
                </span>
              </div>
              <UserHoverCard
                v-if="organization.type === 'Individual'"
                :user="organization.owner.user"
                placement="right-start"
              >
                <span class="organization-owner-summary">{{ organizationDetails(organization) }}</span>
              </UserHoverCard>
              <span v-else :title="organizationDetails(organization)">{{ organizationDetails(organization) }}</span>
            </div>
            <OrganizationApproximateBalance :organization="organization" />
            <el-button
              v-if="!organizationOnly && !memberRequired && organization.type !== 'Individual'"
              size="small"
              text
              type="primary"
              @click.stop="selectOrganization(organization)"
            >
              {{ t('organizations.selectOrganization') }}
            </el-button>
            <el-icon
              v-if="organization.type === 'Individual' && modelValue?.organization.id === organization.id"
              class="organization-check"
            >
              <Check />
            </el-icon>
          </div>

          <div v-if="!organizationOnly && branch(organization.id).expanded" class="member-branch" role="group">
            <div v-if="branch(organization.id).loading && branch(organization.id).members.length === 0" class="branch-status">
              {{ t('organizations.loadingMembers') }}
            </div>
            <button
              v-for="member in branch(organization.id).members"
              :key="member.user.id"
              type="button"
              class="member-row"
              role="treeitem"
              data-organization-option
              :aria-selected="modelValue?.member?.user.id === member.user.id"
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

      <div class="organization-selector-footer">
        <button
          type="button"
          class="organization-hidden-toggle"
          :class="{ 'is-active': includeHidden }"
          :aria-pressed="includeHidden"
          :disabled="organizationsLoading"
          @click.stop="toggleIncludeHidden"
        >
          <span class="organization-hidden-toggle__box" aria-hidden="true">
            <el-icon v-if="includeHidden"><Check /></el-icon>
          </span>
          {{ t('organizations.includeHidden') }}
        </button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, reactive, ref, useId, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useSelectionDebounce } from '@/composables/useSelectionDebounce'
import { ArrowDown, CaretRight, Check, Close } from '@element-plus/icons-vue'
import UserHoverCard from '@/components/users/UserHoverCard.vue'
import OrganizationApproximateBalance from '@/components/organizations/OrganizationApproximateBalance.vue'
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
  organizationOnly?: boolean
  types?: OrganizationType[]
}>(), {
  modelValue: undefined,
  placeholder: undefined,
  clearable: true,
  disabled: false,
  memberRequired: true,
  organizationOnly: false,
  types: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: OrganizationSelection | undefined]
}>()

const { t } = useI18n()
const organizationLimit = 20
const memberLimit = 20
const open = ref(false)
const triggerElement = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()
const treeElement = ref<HTMLElement>()
const treeId = `organization-selector-${useId()}`
const searchDebounce = useSelectionDebounce()
let restoringFocus = false
let disposed = false
const searchTerm = ref('')
const organizations = ref<OrganizationModel[]>([])
const organizationsPage = ref(0)
const organizationsHasNext = ref(true)
const organizationsLoading = ref(false)
const includeHidden = ref(false)
const branches = reactive<Record<string, MemberBranch>>({})
let organizationsRequestId = 0
onScopeDispose(() => { disposed = true; ++organizationsRequestId })
onClickOutside(treeElement, () => { open.value = false }, { ignore: [triggerElement] })

const resolvedPlaceholder = computed(() => props.placeholder ?? (
  props.organizationOnly || !props.memberRequired
    ? t('organizations.selectOrganization')
    : t('organizations.selectMember')
))

async function searchOrganizations() {
  if (await searchDebounce.wait()) await loadOrganizations(true)
}

function openSelector() {
  if (props.disabled || restoringFocus) return
  if (!open.value) {
    open.value = true
    searchTerm.value = ''
    // A selected label may still be in the focused input when typing resumes.
    if (searchInput.value) searchInput.value.value = ''
    void loadOrganizations(true)
  }
  searchInput.value?.focus()
}

function closeSelector(restoreFocus = false) {
  open.value = false
  if (restoreFocus) {
    restoringFocus = true
    searchInput.value?.focus()
    restoringFocus = false
  }
}

function onFocusOut(event: FocusEvent) {
  const target = event.relatedTarget
  if (target instanceof Node && !triggerElement.value?.contains(target) && !treeElement.value?.contains(target)) closeSelector()
}

function onSearchInput(event: Event) {
  open.value = true
  searchTerm.value = (event.target as HTMLInputElement).value
  ++organizationsRequestId
  organizations.value = []
  organizationsHasNext.value = false
  organizationsLoading.value = true
  void searchOrganizations()
}

function resultOptions() {
  if (organizationsLoading.value) return []
  return Array.from(treeElement.value?.querySelectorAll<HTMLElement>('[data-organization-option]') ?? [])
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    event.stopPropagation()
    closeSelector()
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    openSelector()
    const options = resultOptions()
    const option = event.key === 'ArrowDown' ? options[0] : options[options.length - 1]
    option?.focus()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (!open.value) openSelector()
    else if (!organizationsLoading.value) resultOptions()[0]?.click()
  }
}

function onResultsKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeSelector(true)
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const options = resultOptions()
    const index = options.indexOf(document.activeElement as HTMLElement)
    if (index < 0) return
    event.preventDefault()
    const next = index + (event.key === 'ArrowDown' ? 1 : -1)
    if (next < 0) searchInput.value?.focus()
    else options[Math.min(next, options.length - 1)]?.focus()
  }
}

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

async function loadOrganizations(reset: boolean) {
  if (disposed || !open.value) return
  if (reset) searchDebounce.cancel()
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
      sortBy: ['Name'],
      showHidden: includeHidden.value,
    })
    if (requestId !== organizationsRequestId) return

    if (reset) organizations.value = []
    const existingIds = new Set(organizations.value.map((organization) => organization.id))
    organizations.value.push(...response.organizations.filter((organization) => !existingIds.has(organization.id)))
    if (!searchTerm.value.trim()) ensureSelectedOrganization()
    organizations.value = orderOrganizations(organizations.value)
    organizationsHasNext.value = response.organizations.length === organizationLimit
    organizationsPage.value += 1
  } finally {
    if (requestId === organizationsRequestId) organizationsLoading.value = false
  }
}

async function toggleIncludeHidden() {
  includeHidden.value = !includeHidden.value
  await loadOrganizations(true)
}

function orderOrganizations(items: OrganizationModel[]) {
  return [...items].sort((left, right) => Number(left.isHidden) - Number(right.isHidden))
}

function handleOrganizationClick(organization: OrganizationModel) {
  if (props.organizationOnly) {
    selectOrganization(organization)
    return
  }

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
    if (disposed) return
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
  closeSelector(true)
}

function selectMember(organization: OrganizationModel, member: OrganizationMemberModel) {
  emit('update:modelValue', { organization, member })
  closeSelector(true)
}

function clearInput() {
  if (open.value && searchTerm.value) {
    searchTerm.value = ''
    void loadOrganizations(true)
    searchInput.value?.focus()
    return
  }
  emit('update:modelValue', undefined)
  searchTerm.value = ''
  if (open.value) void loadOrganizations(true)
  openSelector()
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

function userIdentity(user: UserModel) {
  const displayName = userName(user)
  return displayName === user.userName
    ? user.userName
    : `${displayName} · ${user.userName}`
}

function selectionPrimary(selection: OrganizationSelection) {
  return selection.organization.type === 'Individual' && selection.member
    ? userName(selection.member.user)
    : selection.organization.name
}

function selectionSecondary(selection: OrganizationSelection) {
  const hiddenSuffix = selection.organization.isHidden ? ` · ${t('organizationPage.hidden')}` : ''
  if (selection.organization.type === 'Individual' && selection.member) {
    return `${selection.member.user.userName} · ${selection.organization.name}${hiddenSuffix}`
  }
  if (selection.member) return `${userIdentity(selection.member.user)}${hiddenSuffix}`
  return `${organizationMeta(selection.organization)}${hiddenSuffix}`
}

function selectionTitle(selection: OrganizationSelection) {
  return `${selectionPrimary(selection)} — ${selectionSecondary(selection)}`
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

function organizationDetails(organization: OrganizationModel) {
  const meta = organizationMeta(organization)
  return organization.type === 'Individual'
    ? `${meta} · ${userIdentity(organization.owner.user)}`
    : meta
}

watch(open, (visible) => {
  if (!visible) {
    searchDebounce.cancel()
    ++organizationsRequestId
    organizationsLoading.value = false
    searchTerm.value = ''
  }
}, { flush: 'sync' })
watch(() => props.disabled, (disabled) => { if (disabled) closeSelector() })
watch(() => props.modelValue, () => { if (!searchTerm.value.trim()) ensureSelectedOrganization() })
watch(() => props.types, () => void loadOrganizations(true), { deep: true })
</script>

<style scoped>
.organization-selector-trigger {
  position: relative;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  min-height: 32px;
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

.organization-selector-input { width: 100%; min-width: 0; height: 100%; padding: 0; border: 0; outline: none; background: transparent; color: inherit; font: inherit; }
.organization-selector-input::placeholder { color: var(--el-text-color-placeholder); }
.organization-selector-input:disabled { cursor: not-allowed; }
.organization-selector-trigger.has-selection .organization-selector-input { color: transparent; }
.organization-selector-trigger.has-selection .organization-selector-input::placeholder { color: transparent; }
.organization-selector-trigger.is-open,
.organization-selector-trigger:focus-within { border-color: var(--el-color-primary); box-shadow: 0 0 0 1px var(--el-color-primary); }
.organization-selector-trigger:hover:not(.is-disabled) { border-color: var(--el-border-color-hover); }
.organization-selector-trigger.is-disabled { cursor: not-allowed; background: var(--el-disabled-bg-color); }
.selection-value { position: absolute; left: 11px; right: 34px; pointer-events: none; min-width: 0; display: flex; align-items: baseline; gap: 6px; overflow: hidden; }
.selection-value strong,
.selection-value > span:not(.organization-approximate-balance) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selection-value > span:not(.organization-approximate-balance) { color: var(--el-text-color-secondary); font-size: 12px; }
.trigger-arrow, .clear-selection { flex: none; color: var(--el-text-color-placeholder); transition: transform 150ms ease; }
.trigger-arrow.is-open { transform: rotate(180deg); }
.clear-selection { display: grid; place-items: center; border: 0; padding: 0; background: transparent; cursor: pointer; }
.clear-selection:hover { color: var(--el-text-color-primary); }
.organization-tree { display: grid; gap: 10px; }
.tree-scroll { min-height: 72px; max-height: 286px; overflow-y: auto; overscroll-behavior: contain; }
.tree-empty, .branch-status { padding: 16px 12px; color: var(--el-text-color-secondary); font-size: 13px; text-align: center; }
.organization-branch + .organization-branch { border-top: 1px solid var(--el-border-color-lighter); }
.organization-row { min-height: 44px; display: flex; align-items: center; gap: 8px; padding: 5px 6px; cursor: pointer; }
.organization-row:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
.organization-row:hover, .organization-row.is-selected { background: var(--el-fill-color-light); }
.organization-row.is-hidden { background: #f8fafc; opacity: 0.62; }
.organization-row.is-hidden:hover,
.organization-row.is-hidden.is-selected { background: var(--el-fill-color-light); opacity: 0.82; }
.branch-arrow { flex: none; color: var(--el-text-color-secondary); transition: transform 150ms ease; }
.branch-arrow.is-expanded { transform: rotate(90deg); }
.branch-leaf { width: 14px; height: 14px; flex: none; position: relative; }
.branch-leaf::after { content: ''; position: absolute; inset: 5px; border-radius: 50%; background: var(--el-color-primary); }
.organization-check { flex: none; color: var(--el-color-primary); }
.organization-copy, .member-copy { min-width: 0; flex: 1; display: grid; gap: 2px; }
.organization-title { display: flex; min-width: 0; align-items: center; gap: 6px; }
.organization-copy strong, .member-copy strong { overflow: hidden; color: var(--el-text-color-primary); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.organization-copy .organization-hidden-state { flex: none; border: 1px solid var(--el-border-color); border-radius: 4px; padding: 0 4px; color: var(--el-text-color-secondary); font-size: 9px; font-weight: 650; line-height: 15px; }
.organization-copy span, .member-copy span { overflow: hidden; color: var(--el-text-color-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.organization-copy :deep(.user-hover-card-reference) { display: block; width: 100%; color: var(--el-text-color-secondary); font-size: 11px; font-weight: 400; }
.organization-copy :deep(.user-hover-card-reference:hover) { color: var(--el-color-primary); }
.organization-owner-summary { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.member-branch { margin: 0 6px 8px 17px; padding-left: 13px; border-left: 1px solid var(--el-border-color); }
.member-row { width: 100%; min-height: 40px; display: flex; align-items: center; gap: 9px; padding: 5px 8px; border: 0; border-radius: 6px; background: transparent; text-align: left; cursor: pointer; }
.member-row:hover, .member-row.is-selected { background: var(--el-fill-color-light); }
.member-avatar { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 5px; background: var(--el-fill-color-dark); color: var(--el-text-color-regular); font-size: 10px; font-weight: 700; }
.load-more { width: 100%; padding: 8px; border: 0; background: transparent; color: var(--el-color-primary); font-size: 12px; cursor: pointer; }
.load-more:disabled { color: var(--el-text-color-placeholder); cursor: wait; }
.organization-load-more { border-top: 1px solid var(--el-border-color-lighter); }
.organization-selector-footer { border-top: 1px solid var(--el-border-color-lighter); padding-top: 8px; }
.organization-hidden-toggle { display: inline-flex; align-items: center; gap: 7px; border: 0; background: transparent; padding: 2px 1px; color: var(--el-text-color-secondary); font-size: 11px; cursor: pointer; }
.organization-hidden-toggle:hover,
.organization-hidden-toggle.is-active { color: var(--el-color-primary); }
.organization-hidden-toggle:focus-visible { outline: 2px solid #86bda4; outline-offset: 2px; }
.organization-hidden-toggle:disabled { color: var(--el-text-color-placeholder); cursor: wait; }
.organization-hidden-toggle__box { width: 13px; height: 13px; display: grid; flex: none; place-items: center; border: 1px solid var(--el-border-color); border-radius: 3px; background: var(--el-fill-color-blank); }
.organization-hidden-toggle.is-active .organization-hidden-toggle__box { border-color: var(--el-color-primary); background: var(--el-color-primary); color: #fff; }
.organization-hidden-toggle__box :deep(.el-icon) { font-size: 10px; }
</style>
