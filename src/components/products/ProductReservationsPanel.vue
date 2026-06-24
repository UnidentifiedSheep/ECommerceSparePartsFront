<template>
  <section class="reservation-panel">
    <div class="reservation-header">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-slate-900">{{ panelTitle }}</div>
        <div class="truncate text-xs text-slate-500">{{ summaryText }}</div>
      </div>
      <div class="reservation-actions">
        <el-button
          v-if="canCreate && allowCreate"
          :icon="Plus"
          size="small"
          type="primary"
          plain
          @click="openCreateDialog"
        >
          {{ t('common.actions.create') }}
        </el-button>
        <el-button :icon="Refresh" :loading="isLoading" size="small" plain @click="loadReservations">
          {{ t('common.actions.refresh') }}
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="isLoading"
      :data="reservations"
      stripe
      size="small"
      :empty-text="t('reservations.empty')"
      class="reservation-table"
      @sort-change="handleSortChange"
    >
      <el-table-column :label="t('common.labels.client')" min-width="170" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="font-medium text-slate-900">{{ userName(row) }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="t('common.labels.status')" width="112" sortable="custom" prop="status">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="light">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="t('common.labels.count')" width="116" align="right">
        <template #default="{ row }">
          <div class="count-cell">
            <strong>{{ formatNumber(remainingCount(row)) }}</strong>
            <span>{{ formatNumber(row.currentCount) }} / {{ formatNumber(row.reservedCount) }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column :label="t('common.labels.price')" width="120" align="right">
        <template #default="{ row }">
          {{ proposedPriceText(row) }}
        </template>
      </el-table-column>

      <el-table-column :label="t('common.labels.comment')" min-width="170" show-overflow-tooltip>
        <template #default="{ row }">
          <span :class="row.comment ? 'text-slate-700' : 'text-slate-400'">
            {{ row.comment || '-' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column :label="t('common.labels.updatedAtShort')" width="150" sortable="custom" prop="updatedAt">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="" width="128" align="right">
        <template #default="{ row }">
          <el-button :icon="Clock" size="small" text @click="openHistoryDialog(row)" />
          <el-button v-if="canEdit" :icon="Edit" size="small" text @click="openEditDialog(row)" />
          <el-button
            v-if="canDelete && row.status !== 'Canceled'"
            :icon="Delete"
            size="small"
            text
            type="danger"
            @click="removeReservation(row)"
          />
        </template>
      </el-table-column>
    </el-table>

    <div class="reservation-footer">
      <ZeroPagination
        v-model:page="page"
        v-model:size="size"
        :has-next="hasNext"
        :sizes="[10, 20, 50]"
      />
    </div>

    <el-dialog v-model="createDialogOpen" :title="t('reservations.create')" width="560">
      <el-form label-position="top">
        <el-form-item v-if="!fixedUserId" :label="t('common.labels.user')">
          <UserSelector v-model:selected-user="createForm.user" :place-holder="t('reservations.selectUser')" />
        </el-form-item>

        <el-form-item v-if="!fixedProductId" :label="t('common.labels.product')">
          <div class="picker-row picker-row--button">
            <button class="picker-value" type="button" @click="productSelectorOpen = true">
              <span :class="createForm.product ? 'text-slate-900' : 'text-slate-400'">
                {{ createForm.product ? productLabel(createForm.product) : t('reservations.selectProduct') }}
              </span>
            </button>
          </div>
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item :label="t('reservations.reserved')">
            <el-input-number v-model="createForm.reservedCount" :min="1" :precision="0" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('reservations.currentTaken')">
            <el-input-number
              v-model="createForm.currentCount"
              :min="0"
              :max="createForm.reservedCount"
              :precision="0"
              :controls="false"
              class="w-full"
            />
          </el-form-item>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item :label="t('reservations.proposedPrice')">
            <el-input-number v-model="createForm.proposedPrice" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('common.labels.currency')">
            <el-select v-model="createForm.givenCurrencyId" clearable filterable class="w-full" :placeholder="t('reservations.notSelected')">
              <el-option
                v-for="currency in currencies"
                :key="currency.id"
                :label="`${currency.name} (${currency.currencySign})`"
                :value="currency.id"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item :label="t('common.labels.comment')">
          <el-input v-model="createForm.comment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :disabled="!canSaveCreate" :loading="isSaving" @click="saveCreate">
          {{ t('common.actions.create') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogOpen" :title="t('reservations.edit')" width="480">
      <el-form label-position="top">
        <el-form-item :label="t('reservations.proposedPrice')">
          <el-input-number v-model="editForm.proposedPrice" :min="0" :precision="2" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('common.labels.currency')">
          <el-select v-model="editForm.givenCurrencyId" clearable filterable class="w-full" :placeholder="t('reservations.notSelected')">
            <el-option
              v-for="currency in currencies"
              :key="currency.id"
              :label="`${currency.name} (${currency.currencySign})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.labels.comment')">
          <el-input v-model="editForm.comment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="isSaving" @click="saveEdit">{{ t('common.actions.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="historyDialogOpen"
      :title="t('reservations.history')"
      width="min(760px, calc(100vw - 24px))"
      class="reservation-history-dialog"
    >
      <el-table
        v-loading="isHistoryLoading"
        :data="history"
        stripe
        size="small"
        :empty-text="t('reservations.historyEmpty')"
      >
        <el-table-column :label="t('common.labels.date')" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.labels.price')" width="120" align="right">
          <template #default="{ row }">
            {{ historyPriceText(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.labels.comment')" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="row.comment ? 'text-slate-700' : 'text-slate-400'">
              {{ row.comment || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.labels.updatedBy')" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <el-popover
              v-if="row.updatedBy"
              placement="top"
              trigger="hover"
              width="280"
              @show="loadUserTooltip(row.updatedBy)"
            >
              <template #reference>
                <button class="user-id-link" type="button">
                  {{ shortenUserId(row.updatedBy) }}
                </button>
              </template>

              <div v-loading="userTooltipState(row.updatedBy).loading" class="user-tooltip">
                <template v-if="userTooltipState(row.updatedBy).user">
                  <div class="user-tooltip-title">
                    {{ userTooltipState(row.updatedBy).user!.surname }} {{ userTooltipState(row.updatedBy).user!.name }}
                  </div>
                  <div class="user-tooltip-muted">{{ userTooltipState(row.updatedBy).user!.userName }}</div>
                  <div v-if="userTooltipState(row.updatedBy).roles.length > 0" class="user-tooltip-roles">
                    <el-tag
                      v-for="role in userTooltipState(row.updatedBy).roles"
                      :key="role"
                      size="small"
                      effect="plain"
                    >
                      {{ roleDisplayName(role) }}
                    </el-tag>
                  </div>
                </template>
                <template v-else-if="userTooltipState(row.updatedBy).error">
                  <div class="user-tooltip-muted">{{ userTooltipState(row.updatedBy).error }}</div>
                </template>
                <template v-else>
                  <div class="user-tooltip-muted">{{ t('reservations.userLoading') }}</div>
                </template>
              </div>
            </el-popover>
            <span v-else>{{ t('reservations.notSpecified') }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="reservation-footer">
        <ZeroPagination
          v-model:page="historyPage"
          v-model:size="historySize"
          :has-next="historyHasNext"
          :sizes="[10, 20, 50]"
        />
      </div>
    </el-dialog>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="selectProduct" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Clock, Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type {
  ProductReservationHistoryModel,
  ProductReservationModel,
  ProductReservationStatus,
} from '@/models/productReservationModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { getRoles, type RoleModel } from '@/services/api/roles.ts'
import { getUserFullInfo } from '@/services/api/users.ts'
import {
  createProductReservation,
  deleteProductReservation,
  editProductReservation,
  getProductReservationHistory,
  getProductReservations,
} from '@/services/api/products.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()

const props = withDefaults(defineProps<{
  productId?: number
  userId?: string
  title?: string
  allowCreate?: boolean
  showDeleted?: boolean
}>(), {
  title: undefined,
  allowCreate: true,
  showDeleted: false,
})

const { hasPermission } = usePermissions()
const canCreate = computed(() => hasPermission('ARTICLE_RESERVATIONS_CREATE'))
const canEdit = computed(() => hasPermission('ARTICLE_RESERVATIONS_EDIT'))
const canDelete = computed(() => hasPermission('ARTICLE_RESERVATIONS_DELETE'))
const fixedProductId = computed(() => props.productId)
const fixedUserId = computed(() => props.userId)

const reservations = ref<ProductReservationModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const page = ref(0)
const size = ref(10)
const hasNext = ref(false)
const sortBy = ref<string>('updatedAt_desc')
const isLoading = ref(false)
const isSaving = ref(false)
const isCurrenciesLoading = ref(false)
const createDialogOpen = ref(false)
const editDialogOpen = ref(false)
const productSelectorOpen = ref(false)
const editingReservation = ref<ProductReservationModel>()
const historyDialogOpen = ref(false)
const historyReservation = ref<ProductReservationModel>()
const history = ref<ProductReservationHistoryModel[]>([])
const historyPage = ref(0)
const historySize = ref(10)
const historyHasNext = ref(false)
const isHistoryLoading = ref(false)
const rolesLoading = ref(false)
const roleOptions = ref<RoleModel[]>([])
const userTooltipCache = reactive<Record<string, {
  loading: boolean
  user?: UserModel
  roles: string[]
  error?: string
}>>({})

const createForm = reactive({
  user: undefined as UserModel | undefined,
  product: undefined as ProductSearchModel | undefined,
  reservedCount: 1,
  currentCount: 0,
  proposedPrice: undefined as number | undefined,
  givenCurrencyId: undefined as number | undefined,
  comment: '',
})

const editForm = reactive({
  proposedPrice: undefined as number | undefined,
  givenCurrencyId: undefined as number | undefined,
  comment: '',
})

const totalReserved = computed(() => (
  reservations.value.reduce((sum, item) => sum + item.reservedCount, 0)
))
const totalTaken = computed(() => (
  reservations.value.reduce((sum, item) => sum + item.currentCount, 0)
))
const totalRemaining = computed(() => (
  reservations.value.reduce((sum, item) => sum + remainingCount(item), 0)
))
const panelTitle = computed(() => props.title ?? t('reservations.title'))
const summaryText = computed(() => {
  if (isLoading.value) return t('reservations.loading')
  return reservations.value.length > 0
    ? t('reservations.onPage', { count: reservations.value.length })
    : t('reservations.notFound')
})
const canSaveCreate = computed(() => (
  Boolean(fixedUserId.value || createForm.user)
  && Boolean(fixedProductId.value || createForm.product)
  && createForm.reservedCount > 0
  && createForm.currentCount >= 0
  && createForm.currentCount <= createForm.reservedCount
))

function formatNumber(value: number) {
  return value.toLocaleString(locale.value)
}

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, t('reservations.noData'))
}

function remainingCount(row: ProductReservationModel) {
  return Math.max(row.reservedCount - row.currentCount, 0)
}

function statusText(status: ProductReservationStatus) {
  return t(`reservations.statuses.${status}`) || status
}

function statusTagType(status: ProductReservationStatus) {
  const types: Record<ProductReservationStatus, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    Active: 'success',
    Locked: 'warning',
    Done: 'info',
    Canceled: 'danger',
  }
  return types[status] ?? ''
}

function userName(row: ProductReservationModel) {
  const user = row.user.user
  if (!user) return partyTypeText(row.user.partyType)
  return `${user.surname} ${user.name}`.trim() || user.userName
}

function partyTypeText(value: string | number) {
  if (value === 'System' || value === 1) return t('reservations.system')
  return t('reservations.userParty')
}

function roleDisplayName(role: string) {
  const roleInfo = roleOptions.value.find((item) => item.systemName === role)
  return roleInfo?.localizedName || roleInfo?.systemName || role
}

function currencySign(currencyId?: number | null) {
  if (!currencyId) return undefined
  return currencies.value.find((currency) => currency.id === currencyId)?.currencySign
}

function proposedPriceText(row: ProductReservationModel) {
  if (row.proposedPrice === null || row.proposedPrice === undefined) return '-'
  return `${formatNumber(row.proposedPrice)} ${currencySign(row.proposedCurrencyId) ?? ''}`.trim()
}

function historyPriceText(row: ProductReservationHistoryModel) {
  if (row.proposePrice === null || row.proposePrice === undefined) return '-'
  return `${formatNumber(row.proposePrice)} ${currencySign(row.proposedCurrencyId) ?? ''}`.trim()
}

function shortenUserId(userId: string) {
  return userId.length > 13 ? `${userId.slice(0, 8)}...${userId.slice(-4)}` : userId
}

function userTooltipState(userId: string) {
  if (!userTooltipCache[userId]) {
    userTooltipCache[userId] = {
      loading: false,
      roles: [],
    }
  }
  return userTooltipCache[userId]
}

async function loadUserTooltip(userId: string) {
  const state = userTooltipState(userId)
  if (state.loading || state.user || state.error) return

  state.loading = true
  try {
    const [resp] = await Promise.all([
      getUserFullInfo(userId),
      loadRoles(),
    ])
    state.user = resp.user
    state.roles = resp.roles
  } catch (error) {
    state.error = error instanceof Error ? error.message : t('reservations.loadUserError')
  } finally {
    state.loading = false
  }
}

async function loadRoles() {
  if (rolesLoading.value || roleOptions.value.length > 0) return

  rolesLoading.value = true
  try {
    const resp = await getRoles({
      page: 0,
      size: 100,
    })
    roleOptions.value = resp.roles
  } finally {
    rolesLoading.value = false
  }
}

function productLabel(product: ProductSearchModel) {
  return `${product.sku} - ${product.name}`
}

function selectProduct(product: ProductSearchModel) {
  createForm.product = product
}

function resetCreateForm() {
  createForm.user = undefined
  createForm.product = undefined
  createForm.reservedCount = 1
  createForm.currentCount = 0
  createForm.proposedPrice = undefined
  createForm.givenCurrencyId = currencies.value[0]?.id
  createForm.comment = ''
}

function openCreateDialog() {
  resetCreateForm()
  createDialogOpen.value = true
}

function openEditDialog(row: ProductReservationModel) {
  editingReservation.value = row
  editForm.proposedPrice = row.proposedPrice ?? undefined
  editForm.givenCurrencyId = row.proposedCurrencyId ?? undefined
  editForm.comment = row.comment ?? ''
  editDialogOpen.value = true
}

async function openHistoryDialog(row: ProductReservationModel) {
  historyReservation.value = row
  historyPage.value = 0
  historyDialogOpen.value = true
  await loadHistory()
}

async function loadCurrencies() {
  if (currencies.value.length > 0 || isCurrenciesLoading.value) return

  isCurrenciesLoading.value = true
  try {
    const resp = await getCurrencies()
    currencies.value = resp.currencies
  } finally {
    isCurrenciesLoading.value = false
  }
}

async function loadReservations() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    await loadCurrencies()
    const resp = await getProductReservations({
      productId: props.productId,
      userId: props.userId,
      showDeleted: props.showDeleted,
      page: page.value,
      size: size.value,
      sortBy: sortBy.value,
    })

    reservations.value = resp.reservations
    hasNext.value = resp.reservations.length === size.value
  } finally {
    isLoading.value = false
  }
}

async function loadHistory() {
  if (!historyReservation.value || isHistoryLoading.value) return

  isHistoryLoading.value = true
  try {
    await loadCurrencies()
    const resp = await getProductReservationHistory({
      reservationId: historyReservation.value.id,
      page: historyPage.value,
      size: historySize.value,
    })

    history.value = resp.history
    historyHasNext.value = resp.history.length === historySize.value
  } finally {
    isHistoryLoading.value = false
  }
}

async function saveCreate() {
  if (!canSaveCreate.value || isSaving.value) return

  isSaving.value = true
  try {
    const resp = await createProductReservation({
      reservation: {
        userId: fixedUserId.value ?? createForm.user!.id,
        productId: fixedProductId.value ?? createForm.product!.id,
        reservedCount: createForm.reservedCount,
        currentCount: createForm.currentCount,
        proposedPrice: createForm.proposedPrice ?? null,
        givenCurrencyId: createForm.givenCurrencyId ?? null,
        comment: createForm.comment.trim() || null,
      },
    })

    createDialogOpen.value = false
    reservations.value = [
      resp.reservation,
      ...reservations.value.filter((item) => item.id !== resp.reservation.id),
    ].slice(0, size.value)
    hasNext.value = hasNext.value || reservations.value.length === size.value
    ElNotification({ title: t('common.labels.success'), message: t('reservations.created'), type: 'success' })
  } finally {
    isSaving.value = false
  }
}

async function saveEdit() {
  if (!editingReservation.value || isSaving.value) return

  isSaving.value = true
  try {
    await editProductReservation(editingReservation.value.id, {
      proposedPrice: editForm.proposedPrice ?? null,
      givenCurrencyId: editForm.givenCurrencyId ?? null,
      comment: editForm.comment.trim() || null,
    })

    editDialogOpen.value = false
    await loadReservations()
    ElNotification({ title: t('common.labels.success'), message: t('reservations.updated'), type: 'success' })
  } finally {
    isSaving.value = false
  }
}

async function removeReservation(row: ProductReservationModel) {
  try {
    await ElMessageBox.confirm(t('reservations.deleteConfirm'), t('reservations.deleteTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }

  await deleteProductReservation(row.id)
  await loadReservations()
  ElNotification({ title: t('common.labels.success'), message: t('reservations.removed'), type: 'success' })
}

async function handleSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) {
    sortBy.value = 'updatedAt_desc'
  } else {
    sortBy.value = event.order === 'descending'
      ? `${event.prop}_desc`
      : event.prop
  }

  if (page.value !== 0) {
    page.value = 0
    return
  }

  await loadReservations()
}

watch(() => [props.productId, props.userId], async () => {
  page.value = 0
  await loadReservations()
})
watch(() => props.showDeleted, async () => {
  page.value = 0
  await loadReservations()
})
watch(page, async () => loadReservations())
watch(size, async () => {
  page.value = 0
  await loadReservations()
})
watch(historyPage, async () => {
  if (historyDialogOpen.value) await loadHistory()
})
watch(historySize, async () => {
  historyPage.value = 0
  if (historyDialogOpen.value) await loadHistory()
})

onMounted(async () => loadReservations())
</script>

<style scoped>
.reservation-panel {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.reservation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px 14px;
}

.reservation-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.reservation-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid #e2e8f0;
}

.reservation-stats div {
  min-width: 0;
  border-right: 1px solid #e2e8f0;
  padding: 10px 12px;
}

.reservation-stats div:last-child {
  border-right: 0;
}

.reservation-stats span,
.count-cell span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.reservation-stats strong,
.count-cell strong {
  display: block;
  margin-top: 3px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 750;
}

.reservation-table {
  width: 100%;
}

.count-cell {
  line-height: 1.2;
}

.picker-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.picker-value {
  min-width: 0;
  height: 32px;
  overflow: hidden;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
  cursor: pointer;
  padding: 0 11px;
  text-align: left;
}

.picker-value:hover {
  border-color: #60a5fa;
  background: #eff6ff;
}

.picker-value span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reservation-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e2e8f0;
  padding: 10px 12px;
}

.user-id-link {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: help;
  font: inherit;
  padding: 0;
}

.user-id-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.user-tooltip {
  min-height: 42px;
}

.user-tooltip-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 750;
}

.user-tooltip-muted {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.user-tooltip-id {
  margin-top: 8px;
  overflow-wrap: anywhere;
  border-radius: 4px;
  background: #f8fafc;
  color: #475569;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  padding: 6px;
}

.user-tooltip-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

@media (max-width: 640px) {
  .reservation-header,
  .reservation-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .reservation-header :deep(.el-button),
  .reservation-actions :deep(.el-button) {
    width: 100%;
  }

  .reservation-stats {
    grid-template-columns: 1fr;
  }

  .reservation-stats div {
    border-right: 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .reservation-stats div:last-child {
    border-bottom: 0;
  }
}
</style>
