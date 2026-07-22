<template>
  <div class="organizations-page">
    <PageHeader :title="t('organizationPage.title')" :description="t('organizationPage.description')">
      <template #actions>
        <el-button v-if="canCreateOrganizations" type="primary" @click="openCreateDialog">
          {{ t('organizationPage.create') }}
        </el-button>
      </template>
    </PageHeader>

    <div class="organizations-layout">
      <section class="organizations-panel organizations-list-panel">
        <div class="organizations-toolbar">
          <el-input
            v-model="searchTerm"
            clearable
            :placeholder="t('organizationPage.searchPlaceholder')"
          />
          <el-select
            v-model="typeFilters"
            multiple
            collapse-tags
            clearable
            :placeholder="t('organizationPage.allTypes')"
          >
            <el-option
              v-for="type in organizationTypes"
              :key="type"
              :label="organizationTypeLabel(type)"
              :value="type"
            />
          </el-select>
          <el-button :loading="organizationsLoading" @click="loadOrganizations(true)">
            {{ t('common.actions.refresh') }}
          </el-button>
        </div>

        <el-table
          ref="organizationsTableRef"
          v-loading="organizationsLoading"
          :data="organizations"
          row-key="id"
          height="100%"
          highlight-current-row
          class="organizations-table"
          @current-change="selectOrganization"
        >
          <el-table-column :label="t('common.labels.name')" min-width="190">
            <template #default="{ row }">
              <div class="organization-name-cell">
                <strong>{{ row.name }}</strong>
                <span>{{ row.systemName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.labels.type')" min-width="110">
            <template #default="{ row }">{{ organizationTypeLabel(row.type) }}</template>
          </el-table-column>
        </el-table>

        <div class="organizations-pagination">
          <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
        </div>
      </section>

      <section class="organizations-panel organization-details-panel">
        <template v-if="selectedOrganization">
          <header class="organization-details-header">
            <div class="min-w-0">
              <h2>{{ selectedOrganization.name }}</h2>
              <p>{{ selectedOrganization.systemName }} · {{ organizationTypeLabel(selectedOrganization.type) }}</p>
            </div>
            <div class="organization-details-actions">
              <el-button v-if="canViewReservations" @click="reservationsDialogOpen = true">
                {{ t('reservations.title') }}
              </el-button>
              <el-button :loading="detailsLoading" @click="loadOrganizationDetails">
                {{ t('common.actions.refresh') }}
              </el-button>
            </div>
          </header>

          <el-tabs v-model="detailsTab" class="organization-tabs">
            <el-tab-pane :label="t('organizationPage.members')" name="members">
              <div class="tab-toolbar">
                <div>
                  <strong>{{ t('organizationPage.members') }}</strong>
                  <span>{{ t('organizationPage.membersLoaded', { count: members.length }) }}</span>
                </div>
                <el-button v-if="canEditOrganizations" type="primary" size="small" @click="openAddMemberDialog">
                  {{ t('organizationPage.addMember') }}
                </el-button>
              </div>

              <el-table v-loading="membersLoading" :data="members" row-key="user.id" class="members-table">
                <el-table-column :label="t('common.labels.user')" min-width="210">
                  <template #default="{ row }">
                    <button type="button" class="member-link" @click="openUser(row.user.id)">
                      <strong>{{ userName(row.user) }}</strong>
                      <span>{{ row.user.userName }}</span>
                    </button>
                  </template>
                </el-table-column>
                <el-table-column :label="t('organizationPage.role')" min-width="150">
                  <template #default="{ row }">
                    <el-select
                      v-if="canEditOrganizations && row.role !== 'Owner'"
                      v-model="row.role"
                      size="small"
                      :disabled="changingMemberId === row.user.id"
                      @change="changeMemberRole(row, $event)"
                    >
                      <el-option
                        v-for="role in editableRoles"
                        :key="role"
                        :label="organizationRoleLabel(role)"
                        :value="role"
                      />
                    </el-select>
                    <span v-else>{{ organizationRoleLabel(row.role) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="canEditOrganizations" width="90" align="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="row.role !== 'Owner'"
                      text
                      type="danger"
                      :loading="removingMemberId === row.user.id"
                      @click="confirmRemoveMember(row)"
                    >
                      {{ t('common.actions.delete') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="load-more-row">
                <el-button v-if="membersHasNext" :loading="membersLoading" @click="loadMembers(false)">
                  {{ t('common.actions.loadMore') }}
                </el-button>
              </div>
            </el-tab-pane>

            <el-tab-pane v-if="canViewFinances" :label="t('organizationPage.finances')" name="finances">
              <div v-loading="financesLoading" class="finances-content">
                <div v-if="financialInfo" class="financial-summary">
                  <div>
                    <span>{{ t('organizationPage.netPosition') }}</span>
                    <strong :class="amountClass(financialInfo.financialProfile?.netPositionInBaseCurrency ?? 0)">
                      {{ formatAmount(financialInfo.financialProfile?.netPositionInBaseCurrency ?? 0, financialInfo.baseCurrency) }}
                    </strong>
                  </div>
                  <div>
                    <span>{{ t('organizationPage.minimalBalance') }}</span>
                    <div class="minimal-balance-control">
                      <el-input-number
                        v-model="minimalAllowedBalance"
                        :precision="2"
                        :controls="false"
                        :disabled="!canEditFinances"
                      />
                      <el-button
                        v-if="canEditFinances"
                        type="primary"
                        :loading="financesSaving"
                        @click="saveFinancialProfile"
                      >
                        {{ t('common.actions.save') }}
                      </el-button>
                    </div>
                  </div>
                </div>

                <div class="balances-heading">{{ t('organizationPage.currencyBalances') }}</div>
                <div v-if="financialInfo?.balances.length" class="balances-list">
                  <div v-for="balance in financialInfo.balances" :key="balance.currency.id">
                    <span>{{ balance.currency.name }}</span>
                    <strong :class="amountClass(balance.balance)">{{ formatAmount(balance.balance, balance.currency) }}</strong>
                  </div>
                </div>
                <el-empty v-else :description="t('organizationPage.noBalances')" :image-size="64" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>

        <el-empty v-else :description="t('organizationPage.selectOrganization')" />
      </section>
    </div>

    <el-dialog v-model="createDialogOpen" :title="t('organizationPage.createTitle')" width="520">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <el-form-item :label="t('organizationPage.owner')" prop="owner">
          <UserSelector
            v-model:selected-user="createForm.owner"
            :placeholder="t('organizationPage.selectOwner')"
            :clearable="false"
          />
        </el-form-item>
        <el-form-item :label="t('common.labels.name')" prop="name">
          <el-input v-model="createForm.name" :placeholder="t('organizationPage.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('organizationPage.systemName')" prop="systemName">
          <el-input v-model="createForm.systemName" :placeholder="t('organizationPage.systemNamePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreateOrganization">
          {{ t('common.actions.create') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addMemberDialogOpen" :title="t('organizationPage.addMemberTitle')" width="500">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.user')">
          <UserSelector
            v-model:selected-user="memberForm.user"
            :placeholder="t('organizationPage.selectMemberUser')"
            :clearable="false"
          />
        </el-form-item>
        <el-form-item :label="t('organizationPage.role')">
          <el-select v-model="memberForm.role" class="w-full">
            <el-option
              v-for="role in editableRoles"
              :key="role"
              :label="organizationRoleLabel(role)"
              :value="role"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addMemberDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :disabled="!memberForm.user" :loading="addingMember" @click="submitAddMember">
          {{ t('common.actions.add') }}
        </el-button>
      </template>
    </el-dialog>

    <ProductReservationsDialog
      v-if="selectedOrganization && canViewReservations"
      v-model="reservationsDialogOpen"
      :organization-id="selectedOrganization.id"
      :title="t('reservations.organizationTitle', { name: selectedOrganization.name })"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification, type FormInstance, type FormRules, type TableInstance } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import ProductReservationsDialog from '@/components/products/ProductReservationsDialog.vue'
import type {
  OrganizationMemberModel,
  OrganizationModel,
  OrganizationRole,
  OrganizationType,
} from '@/models/organizationModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import {
  addOrganizationMember,
  changeOrganizationMemberRole,
  createOrganization,
  getOrganizationFinancialInfo,
  getOrganizationMembers,
  getOrganizations,
  removeOrganizationMember,
  updateOrganizationFinancialInfo,
  type GetOrganizationFinancialInfoResponse,
} from '@/services/api/organizations.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

interface CreateOrganizationForm {
  owner?: UserModel
  name: string
  systemName: string
}

const organizationTypes: OrganizationType[] = ['Individual', 'Business']
const editableRoles: OrganizationRole[] = ['Admin', 'Manager', 'Member']
const memberPageSize = 20

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { hasPermission } = usePermissions()
const canCreateOrganizations = computed(() => hasPermission('ORGANIZATIONS_CREATE'))
const canEditOrganizations = computed(() => hasPermission('ORGANIZATIONS_EDIT'))
const canViewFinances = computed(() => hasPermission('BALANCES_FINANCES_GET'))
const canEditFinances = computed(() => hasPermission('BALANCES_FINANCES_UPDATE'))
const canViewReservations = computed(() => hasPermission('ARTICLE_RESERVATIONS_GET_ALL'))

const organizationsTableRef = ref<TableInstance>()
const organizations = ref<OrganizationModel[]>([])
const selectedOrganization = ref<OrganizationModel>()
const searchTerm = ref('')
const typeFilters = ref<OrganizationType[]>([])
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const organizationsLoading = ref(false)
const detailsLoading = ref(false)
const detailsTab = ref('members')
const members = ref<OrganizationMemberModel[]>([])
const membersPage = ref(0)
const membersHasNext = ref(false)
const membersLoading = ref(false)
const changingMemberId = ref('')
const removingMemberId = ref('')
const financialInfo = ref<GetOrganizationFinancialInfoResponse>()
const financesLoading = ref(false)
const financesSaving = ref(false)
const minimalAllowedBalance = ref(0)
const createDialogOpen = ref(false)
const createFormRef = ref<FormInstance>()
const creating = ref(false)
const addMemberDialogOpen = ref(false)
const reservationsDialogOpen = ref(false)
const addingMember = ref(false)
let organizationsRequestId = 0
let detailsRequestId = 0

const createForm = reactive<CreateOrganizationForm>({ owner: undefined, name: '', systemName: '' })
const memberForm = reactive<{ user?: UserModel, role: OrganizationRole }>({ user: undefined, role: 'Member' })
const createRules = computed<FormRules<CreateOrganizationForm>>(() => ({
  owner: [{ required: true, message: t('organizationPage.ownerRequired'), trigger: 'change' }],
  name: [
    { required: true, message: t('organizationPage.nameRequired'), trigger: 'blur' },
    { min: 3, max: 128, message: t('organizationPage.nameLength'), trigger: 'blur' },
  ],
  systemName: [
    { required: true, message: t('organizationPage.systemNameRequired'), trigger: 'blur' },
    { max: 128, message: t('organizationPage.systemNameLength'), trigger: 'blur' },
  ],
}))

const loadOrganizationsDebounced = useDebounceFn(() => loadOrganizations(true), 300)

function organizationTypeLabel(type: OrganizationType) {
  return t(`organizations.types.${type}`)
}

function organizationRoleLabel(role: OrganizationRole) {
  return t(`organizations.roles.${role}`)
}

function userName(user: UserModel) {
  return [user.surname, user.name].filter(Boolean).join(' ') || user.userName
}

async function loadOrganizations(reset = false) {
  const requestId = ++organizationsRequestId
  if (reset) page.value = 0
  organizationsLoading.value = true
  try {
    const response = await getOrganizations({
      searchTerm: searchTerm.value.trim() || undefined,
      types: typeFilters.value.length ? typeFilters.value : undefined,
      page: page.value,
      limit: limit.value,
      sortBy: 'Name',
    })
    if (requestId !== organizationsRequestId) return
    organizations.value = response.organizations
    hasNext.value = response.organizations.length === limit.value

    if (selectedOrganization.value) {
      const current = organizations.value.find((organization) => organization.id === selectedOrganization.value?.id)
      if (current) selectedOrganization.value = current
    }
  } finally {
    if (requestId === organizationsRequestId) organizationsLoading.value = false
  }
}

async function selectOrganization(organization?: OrganizationModel) {
  selectedOrganization.value = organization
  await nextTick()
  organizationsTableRef.value?.setCurrentRow(organization)
  if (!organization) return

  if (route.query.organizationId !== organization.id) {
    await router.replace({ name: 'organizations', query: { organizationId: organization.id } })
  }
  await loadOrganizationDetails()
}

async function loadOrganizationDetails() {
  if (!selectedOrganization.value) return
  const requestId = ++detailsRequestId
  detailsLoading.value = true
  try {
    await Promise.all([
      loadMembers(true),
      canViewFinances.value ? loadFinances() : Promise.resolve(),
    ])
    if (requestId !== detailsRequestId) return
  } finally {
    if (requestId === detailsRequestId) detailsLoading.value = false
  }
}

async function loadMembers(reset: boolean) {
  const organization = selectedOrganization.value
  if (!organization || membersLoading.value) return
  if (reset) {
    members.value = []
    membersPage.value = 0
    membersHasNext.value = true
  }
  if (!membersHasNext.value) return

  membersLoading.value = true
  try {
    const response = await getOrganizationMembers({
      organizationId: organization.id,
      page: membersPage.value,
      limit: memberPageSize,
    })
    if (selectedOrganization.value?.id !== organization.id) return
    const existingIds = new Set(members.value.map((member) => member.user.id))
    members.value.push(...response.members.filter((member) => !existingIds.has(member.user.id)))
    membersHasNext.value = response.members.length === memberPageSize
    membersPage.value += 1
  } finally {
    membersLoading.value = false
  }
}

async function loadFinances() {
  const organization = selectedOrganization.value
  if (!organization) return
  financesLoading.value = true
  try {
    const response = await getOrganizationFinancialInfo(organization.id)
    if (selectedOrganization.value?.id !== organization.id) return
    financialInfo.value = response
    minimalAllowedBalance.value = response.financialProfile?.minimalAllowedBalance ?? 0
  } finally {
    financesLoading.value = false
  }
}

function openCreateDialog() {
  createForm.owner = undefined
  createForm.name = ''
  createForm.systemName = ''
  createDialogOpen.value = true
  createFormRef.value?.clearValidate()
}

async function submitCreateOrganization() {
  if (!createFormRef.value || creating.value) return
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid || !createForm.owner) return

  creating.value = true
  try {
    const response = await createOrganization({
      ownerUserId: createForm.owner.id,
      name: createForm.name.trim(),
      systemName: createForm.systemName.trim(),
    })
    createDialogOpen.value = false
    organizations.value = [response.organization, ...organizations.value.filter((item) => item.id !== response.organization.id)]
    ElNotification({ title: t('common.labels.success'), message: t('organizationPage.created'), type: 'success' })
    await selectOrganization(response.organization)
  } finally {
    creating.value = false
  }
}

function openAddMemberDialog() {
  memberForm.user = undefined
  memberForm.role = 'Member'
  addMemberDialogOpen.value = true
}

async function submitAddMember() {
  if (!selectedOrganization.value || !memberForm.user || addingMember.value) return
  addingMember.value = true
  try {
    await addOrganizationMember({
      organizationId: selectedOrganization.value.id,
      userId: memberForm.user.id,
      role: memberForm.role,
    })
    addMemberDialogOpen.value = false
    ElNotification({ title: t('common.labels.success'), message: t('organizationPage.memberAdded'), type: 'success' })
    await loadMembers(true)
  } finally {
    addingMember.value = false
  }
}

async function changeMemberRole(member: OrganizationMemberModel, role: OrganizationRole) {
  if (!selectedOrganization.value) return
  changingMemberId.value = member.user.id
  try {
    await changeOrganizationMemberRole(selectedOrganization.value.id, member.user.id, role)
    ElNotification({ title: t('common.labels.success'), message: t('organizationPage.roleChanged'), type: 'success' })
  } catch (error) {
    await loadMembers(true)
    throw error
  } finally {
    changingMemberId.value = ''
  }
}

async function confirmRemoveMember(member: OrganizationMemberModel) {
  if (!selectedOrganization.value) return
  try {
    await ElMessageBox.confirm(
      t('organizationPage.removeMemberConfirm', { name: userName(member.user) }),
      t('organizationPage.removeMemberTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.delete'), cancelButtonText: t('common.actions.cancel') },
    )
  } catch {
    return
  }
  removingMemberId.value = member.user.id
  try {
    await removeOrganizationMember(selectedOrganization.value.id, member.user.id)
    members.value = members.value.filter((item) => item.user.id !== member.user.id)
    ElNotification({ title: t('common.labels.success'), message: t('organizationPage.memberRemoved'), type: 'success' })
  } finally {
    removingMemberId.value = ''
  }
}

async function saveFinancialProfile() {
  if (!selectedOrganization.value || financesSaving.value) return
  financesSaving.value = true
  try {
    const response = await updateOrganizationFinancialInfo(selectedOrganization.value.id, minimalAllowedBalance.value)
    if (financialInfo.value) financialInfo.value.financialProfile = response.financialProfile
    ElNotification({ title: t('common.labels.success'), message: t('organizationPage.financesUpdated'), type: 'success' })
  } finally {
    financesSaving.value = false
  }
}

function openUser(userId: string) {
  router.push({ name: 'users', query: { userId } })
}

async function selectOrganizationFromRoute() {
  const organizationId = typeof route.query.organizationId === 'string' ? route.query.organizationId : undefined
  if (!organizationId || selectedOrganization.value?.id === organizationId) return
  let organization = organizations.value.find((item) => item.id === organizationId)
  if (!organization) {
    const response = await getOrganizations({ ids: [organizationId], page: 0, limit: 1 })
    organization = response.organizations[0]
    if (organization) organizations.value = [organization, ...organizations.value.filter((item) => item.id !== organizationId)]
  }
  if (organization) await selectOrganization(organization)
}

function formatAmount(value: number, currency: CurrencyModel) {
  return `${value.toLocaleString(locale.value, { maximumFractionDigits: 2 })} ${currency.currencySign || currency.shortName}`.trim()
}

function amountClass(value: number) {
  return { 'amount-negative': value < 0, 'amount-positive': value > 0 }
}

watch(searchTerm, loadOrganizationsDebounced)
watch(typeFilters, () => loadOrganizations(true), { deep: true })
watch([page, limit], () => loadOrganizations(false))
watch(() => route.query.organizationId, () => selectOrganizationFromRoute())

onMounted(async () => {
  await loadOrganizations(true)
  await selectOrganizationFromRoute()
})
</script>

<style scoped>
.organizations-page { min-height: calc(100vh - 56px); background: #f8fafc; }
.organizations-layout { display: grid; grid-template-columns: minmax(360px, 0.75fr) minmax(520px, 1.25fr); gap: 16px; padding: 16px; }
.organizations-panel { min-width: 0; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; }
.organizations-list-panel { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; height: calc(100vh - 120px); min-height: 620px; padding: 16px; }
.organizations-toolbar { display: grid; grid-template-columns: minmax(160px, 1fr) 180px auto; gap: 8px; padding-bottom: 12px; }
.organizations-table :deep(.el-table__row) { cursor: pointer; }
.organization-name-cell { min-width: 0; display: grid; gap: 2px; }
.organization-name-cell strong { overflow: hidden; color: #0f172a; text-overflow: ellipsis; white-space: nowrap; }
.organization-name-cell span { overflow: hidden; color: #64748b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.organizations-pagination { border-top: 1px solid #e2e8f0; padding-top: 12px; }
.organization-details-panel { min-height: 620px; overflow: hidden; }
.organization-details-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #e2e8f0; padding: 16px 18px; }
.organization-details-header h2 { margin: 0; overflow: hidden; color: #0f172a; font-size: 18px; text-overflow: ellipsis; white-space: nowrap; }
.organization-details-header p { margin: 3px 0 0; overflow: hidden; color: #64748b; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.organization-details-actions { display: flex; flex: none; align-items: center; gap: 8px; }
.organization-tabs { padding: 0 18px 18px; }
.organization-tabs :deep(.el-tabs__header) { margin-bottom: 14px; }
.tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.tab-toolbar > div { display: grid; gap: 2px; }
.tab-toolbar strong { color: #0f172a; font-size: 14px; }
.tab-toolbar span { color: #64748b; font-size: 12px; }
.member-link { display: grid; gap: 2px; width: 100%; padding: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
.member-link strong { color: #0f172a; font-size: 13px; }
.member-link span { color: #64748b; font-size: 12px; }
.member-link:hover strong { color: #047857; }
.load-more-row { display: flex; justify-content: flex-start; padding-top: 12px; }
.finances-content { min-height: 300px; }
.financial-summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 1fr); gap: 12px; }
.financial-summary > div { display: grid; gap: 8px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
.financial-summary span, .balances-heading { color: #64748b; font-size: 12px; font-weight: 600; }
.financial-summary strong { color: #0f172a; font-size: 20px; }
.minimal-balance-control { display: flex; gap: 8px; }
.minimal-balance-control :deep(.el-input-number) { width: 100%; }
.balances-heading { margin: 18px 0 8px; }
.balances-list { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.balances-list > div { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
.balances-list > div:last-child { border-bottom: 0; }
.balances-list span { color: #475569; font-size: 13px; }
.balances-list strong { color: #0f172a; font-size: 13px; font-variant-numeric: tabular-nums; }
.amount-negative { color: #dc2626 !important; }
.amount-positive { color: #047857 !important; }
@media (max-width: 1080px) {
  .organizations-layout { grid-template-columns: 1fr; }
  .organizations-list-panel { height: 560px; min-height: 0; }
}
@media (max-width: 680px) {
  .organizations-layout { padding: 10px; }
  .organizations-toolbar { grid-template-columns: 1fr; }
  .financial-summary { grid-template-columns: 1fr; }
}
</style>
