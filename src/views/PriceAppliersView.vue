<template>
  <div class="price-appliers-page">
    <PageHeader :title="t('priceAppliers.title')" :description="t('priceAppliers.description')">
      <template #actions>
        <el-button :loading="isLoading" @click="loadAppliers">
          {{ t('common.actions.refresh') }}
        </el-button>
        <el-button v-if="orderChanged" :disabled="isSaving" @click="resetOrder">
          {{ t('common.actions.reset') }}
        </el-button>
        <el-button v-if="orderChanged" type="primary" :loading="isSaving" @click="saveOrder">
          {{ t('priceAppliers.saveOrder') }}
        </el-button>
        <el-button v-else type="primary" :disabled="!canManage" @click="openCreateDialog">
          {{ t('priceAppliers.createRule') }}
        </el-button>
      </template>
    </PageHeader>

    <main class="price-appliers-content">
      <section class="rules-panel">
        <div class="rules-toolbar">
          <el-radio-group v-model="activeUsage" :disabled="isLoading || isSaving">
            <el-radio-button :value="PriceOfferSourceType.Supplier">
              {{ t('priceAppliers.usage.Supplier') }}
            </el-radio-button>
            <el-radio-button :value="PriceOfferSourceType.OurWarehouse">
              {{ t('priceAppliers.usage.OurWarehouse') }}
            </el-radio-button>
          </el-radio-group>

          <span class="rules-count">{{ t('priceAppliers.rulesCount', { count: currentCards.length }) }}</span>
        </div>

        <div v-loading="isLoading" class="rules-body">
          <div class="queue-note">
            <el-icon><Rank /></el-icon>
            <span>{{ t('priceAppliers.orderHint') }}</span>
          </div>

          <ol v-if="currentCards.length" class="rules-list">
            <li
              v-for="(applier, index) in currentCards"
              :key="applier.systemName"
              class="rule-card"
              :class="{
                'rule-card--dragging': draggedSystemName === applier.systemName,
                'rule-card--drop-target': dropTargetIndex === index,
                'rule-card--disabled': !stateFor(applier).enabled,
              }"
              :draggable="applier.isDynamic && canManage && !isSaving"
              @dragstart="startDrag($event, applier)"
              @dragover.prevent="setDropTarget(index)"
              @drop.prevent="dropAt(index)"
              @dragend="finishDrag"
            >
              <div class="rule-order">{{ index + 1 }}</div>

              <div class="drag-handle" :class="{ 'drag-handle--locked': !applier.isDynamic }">
                <el-icon><Rank v-if="applier.isDynamic" /><Lock v-else /></el-icon>
              </div>

              <div class="rule-main">
                <div class="rule-title-row">
                  <strong>{{ applier.name }}</strong>
                  <span class="rule-kind">
                    {{ applier.isDynamic ? t('priceAppliers.dynamic') : t('priceAppliers.local') }}
                  </span>
                </div>
                <span class="rule-meta">
                  {{ applier.systemName }} ·
                  {{ applier.isDynamic ? t('priceAppliers.dynamicDescription') : t('priceAppliers.localDescription') }}
                </span>
              </div>

              <div class="rule-actions">
                <div v-if="applier.isDynamic" class="move-actions">
                  <el-button
                    text
                    :aria-label="t('priceAppliers.moveUp')"
                    :disabled="index === 0 || isSaving"
                    @click="moveRule(index, index - 1)"
                  >
                    <el-icon><ArrowUp /></el-icon>
                  </el-button>
                  <el-button
                    text
                    :aria-label="t('priceAppliers.moveDown')"
                    :disabled="index === currentCards.length - 1 || isSaving"
                    @click="moveRule(index, index + 1)"
                  >
                    <el-icon><ArrowDown /></el-icon>
                  </el-button>
                </div>

                <el-button
                  v-if="applier.isDynamic"
                  text
                  :aria-label="t('common.actions.edit')"
                  :disabled="isSaving"
                  @click="openEditDialog(applier)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>

                <el-button
                  v-if="applier.isDynamic"
                  text
                  type="danger"
                  :aria-label="t('common.actions.delete')"
                  :disabled="isSaving || isDeletingSystemName === applier.systemName"
                  :loading="isDeletingSystemName === applier.systemName"
                  @click="confirmDeleteRule(applier)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>

                <el-switch
                  :model-value="stateFor(applier).enabled"
                  :disabled="!canManage || isSavingSystemName === applier.systemName"
                  :loading="isSavingSystemName === applier.systemName"
                  :aria-label="t('priceAppliers.enabled')"
                  @change="toggleRule(applier, Boolean($event))"
                />
              </div>
            </li>
          </ol>

          <el-empty v-else-if="!isLoading" :description="t('priceAppliers.empty')" />
        </div>
      </section>
    </main>

    <PriceApplierEditorDialog
      v-model="editorOpen"
      :applier="editingApplier"
      :initial-usage="activeUsage"
      :suggested-orders="suggestedOrders"
      @saved="handleRuleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp, Delete, Edit, Lock, Rank } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import PriceApplierEditorDialog from '@/components/pricing/PriceApplierEditorDialog.vue'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'
import {
  PriceOfferSourceType,
  deletePriceApplier,
  getPriceAppliers,
  upsertPriceApplier,
  type PriceApplierModel,
  type PriceApplierStateModel,
  type UpsertPriceApplierRequest,
} from '@/services/api/priceAppliers.ts'

const { t } = useI18n()
const { hasPermission } = usePermissions()
const usages = [PriceOfferSourceType.Supplier, PriceOfferSourceType.OurWarehouse] as const

const appliers = ref<PriceApplierModel[]>([])
const displayOrder = ref<Record<PriceOfferSourceType, string[]>>({
  [PriceOfferSourceType.Supplier]: [],
  [PriceOfferSourceType.OurWarehouse]: [],
})
const savedDisplayOrder = ref<Record<PriceOfferSourceType, string[]>>({
  [PriceOfferSourceType.Supplier]: [],
  [PriceOfferSourceType.OurWarehouse]: [],
})
const activeUsage = ref<PriceOfferSourceType>(PriceOfferSourceType.Supplier)
const isLoading = ref(false)
const isSaving = ref(false)
const isSavingSystemName = ref<string | null>(null)
const isDeletingSystemName = ref<string | null>(null)
const draggedSystemName = ref<string | null>(null)
const dropTargetIndex = ref<number | null>(null)
const editorOpen = ref(false)
const editingApplier = ref<PriceApplierModel | null>(null)

const canManage = computed(() => hasPermission('PRICE_APPLIERS_MANAGE'))
const applierByName = computed(() => new Map(appliers.value.map((item) => [item.systemName, item])))
const currentCards = computed(() => displayOrder.value[activeUsage.value]
  .map((systemName) => applierByName.value.get(systemName))
  .filter((item): item is PriceApplierModel => Boolean(item?.states.some((state) => state.usage === activeUsage.value))))
const orderChanged = computed(() => {
  const current = displayOrder.value[activeUsage.value]
  const saved = savedDisplayOrder.value[activeUsage.value]
  return current.length === saved.length && current.some((name, index) => name !== saved[index])
})
const suggestedOrders = computed<Record<PriceOfferSourceType, number>>(() => ({
  [PriceOfferSourceType.Supplier]: nextOrder(PriceOfferSourceType.Supplier),
  [PriceOfferSourceType.OurWarehouse]: nextOrder(PriceOfferSourceType.OurWarehouse),
}))

onMounted(loadAppliers)

async function loadAppliers() {
  isLoading.value = true
  try {
    const responses = await Promise.all(usages.map((usage) => getPriceAppliers(usage)))
    appliers.value = mergeAppliers(responses.flat())
    syncDisplayOrders()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('priceAppliers.loadError'))
  } finally {
    isLoading.value = false
  }
}

function mergeAppliers(items: PriceApplierModel[]) {
  const merged = new Map<string, PriceApplierModel>()
  for (const item of items) {
    const existing = merged.get(item.systemName)
    if (!existing) {
      merged.set(item.systemName, { ...item, states: [...item.states] })
      continue
    }
    for (const state of item.states) {
      const index = existing.states.findIndex((candidate) => candidate.usage === state.usage)
      if (index >= 0) existing.states[index] = state
      else existing.states.push(state)
    }
  }
  return [...merged.values()]
}

function syncDisplayOrders() {
  const next = {} as Record<PriceOfferSourceType, string[]>
  for (const usage of usages) {
    next[usage] = appliers.value
      .filter((applier) => applier.states.some((state) => state.usage === usage))
      .sort((left, right) => stateForUsage(left, usage).order - stateForUsage(right, usage).order
        || left.systemName.localeCompare(right.systemName))
      .map((applier) => applier.systemName)
  }
  displayOrder.value = {
    Supplier: [...next.Supplier],
    OurWarehouse: [...next.OurWarehouse],
  }
  savedDisplayOrder.value = {
    Supplier: [...next.Supplier],
    OurWarehouse: [...next.OurWarehouse],
  }
}

function stateFor(applier: PriceApplierModel) {
  return stateForUsage(applier, activeUsage.value)
}

function stateForUsage(applier: PriceApplierModel, usage: PriceOfferSourceType): PriceApplierStateModel {
  const state = applier.states.find((candidate) => candidate.usage === usage)
  if (!state) throw new Error(`Missing ${usage} state for ${applier.systemName}`)
  return state
}

function startDrag(event: DragEvent, applier: PriceApplierModel) {
  if (!applier.isDynamic) {
    event.preventDefault()
    return
  }
  draggedSystemName.value = applier.systemName
  event.dataTransfer?.setData('text/plain', applier.systemName)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function setDropTarget(index: number) {
  if (draggedSystemName.value) dropTargetIndex.value = index
}

function dropAt(index: number) {
  const systemName = draggedSystemName.value
  if (!systemName) return
  const from = displayOrder.value[activeUsage.value].indexOf(systemName)
  if (from >= 0) moveRule(from, index)
  finishDrag()
}

function finishDrag() {
  draggedSystemName.value = null
  dropTargetIndex.value = null
}

function moveRule(from: number, to: number) {
  const order = [...displayOrder.value[activeUsage.value]]
  if (from < 0 || to < 0 || from >= order.length || to >= order.length || from === to) return
  const [moved] = order.splice(from, 1)
  if (!moved) return
  order.splice(to, 0, moved)
  displayOrder.value = { ...displayOrder.value, [activeUsage.value]: order }
}

function resetOrder() {
  displayOrder.value = {
    ...displayOrder.value,
    [activeUsage.value]: [...savedDisplayOrder.value[activeUsage.value]],
  }
}

async function toggleRule(applier: PriceApplierModel, enabled: boolean) {
  const state = stateFor(applier)
  const previous = state.enabled
  state.enabled = enabled
  isSavingSystemName.value = applier.systemName
  try {
    const saved = await upsertPriceApplier(toRequest(applier))
    replaceApplier(saved)
    ElMessage.success(t(enabled ? 'priceAppliers.enabledMessage' : 'priceAppliers.disabledMessage'))
  } catch (error) {
    state.enabled = previous
    ElMessage.error(error instanceof Error ? error.message : t('priceAppliers.saveError'))
  } finally {
    isSavingSystemName.value = null
  }
}

async function confirmDeleteRule(applier: PriceApplierModel) {
  if (!applier.isDynamic) return
  try {
    await ElMessageBox.confirm(
      t('priceAppliers.deleteConfirm', { name: applier.name }),
      t('priceAppliers.deleteTitle'),
      {
        confirmButtonText: t('common.actions.delete'),
        cancelButtonText: t('common.actions.cancel'),
        confirmButtonClass: 'el-button--danger',
        type: 'warning',
      },
    )
  } catch {
    return
  }

  isDeletingSystemName.value = applier.systemName
  try {
    await deletePriceApplier(applier.systemName)
    appliers.value = appliers.value.filter((item) => item.systemName !== applier.systemName)
    for (const usage of usages) {
      displayOrder.value[usage] = displayOrder.value[usage].filter((name) => name !== applier.systemName)
      savedDisplayOrder.value[usage] = savedDisplayOrder.value[usage].filter((name) => name !== applier.systemName)
    }
    ElMessage.success(t('priceAppliers.deleted'))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('priceAppliers.deleteError'))
  } finally {
    isDeletingSystemName.value = null
  }
}

async function saveOrder() {
  const usage = activeUsage.value
  const orderedAppliers = displayOrder.value[usage]
    .map((name) => applierByName.value.get(name))
    .filter((item): item is PriceApplierModel => Boolean(item))

  let desiredOrders: Map<string, number>
  try {
    desiredOrders = calculateDynamicOrders(orderedAppliers, usage)
  } catch {
    ElMessage.warning(t('priceAppliers.orderNoSpace'))
    return
  }

  const dynamics = orderedAppliers.filter((applier) => applier.isDynamic)
  const occupiedOrders = new Set(orderedAppliers.map((applier) => stateForUsage(applier, usage).order))
  let parkingOrder = 2_000_000_000

  isSaving.value = true
  try {
    for (const applier of dynamics.filter((item) => stateForUsage(item, usage).enabled)) {
      while (occupiedOrders.has(parkingOrder)) parkingOrder--
      stateForUsage(applier, usage).order = parkingOrder--
      replaceApplier(await upsertPriceApplier(toRequest(applier)))
    }

    for (const applier of dynamics) {
      stateForUsage(applier, usage).order = desiredOrders.get(applier.systemName)!
      replaceApplier(await upsertPriceApplier(toRequest(applier)))
    }

    savedDisplayOrder.value = {
      ...savedDisplayOrder.value,
      [usage]: [...displayOrder.value[usage]],
    }
    ElMessage.success(t('priceAppliers.orderSaved'))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('priceAppliers.orderSaveError'))
    await loadAppliers()
  } finally {
    isSaving.value = false
  }
}

function calculateDynamicOrders(items: PriceApplierModel[], usage: PriceOfferSourceType) {
  const result = new Map<string, number>()
  let previousLocalOrder: number | null = null
  let pending: PriceApplierModel[] = []

  const assignPending = (nextLocalOrder: number | null) => {
    if (pending.length === 0) return
    let start: number
    if (previousLocalOrder === null && nextLocalOrder !== null) {
      start = nextLocalOrder - pending.length
    } else if (previousLocalOrder !== null && nextLocalOrder !== null) {
      if (nextLocalOrder - previousLocalOrder - 1 < pending.length) throw new Error('No order slots')
      start = previousLocalOrder + 1
    } else {
      start = (previousLocalOrder ?? -1) + 1
    }
    pending.forEach((applier, index) => result.set(applier.systemName, start + index))
    pending = []
  }

  for (const applier of items) {
    if (applier.isDynamic) {
      pending.push(applier)
      continue
    }
    const localOrder = stateForUsage(applier, usage).order
    assignPending(localOrder)
    previousLocalOrder = localOrder
  }
  assignPending(null)
  return result
}

function toRequest(applier: PriceApplierModel): UpsertPriceApplierRequest {
  return {
    systemName: applier.systemName,
    name: applier.isDynamic ? applier.name : null,
    dslLogic: applier.dslLogic,
    states: applier.states.map((state) => ({
      usage: state.usage,
      order: applier.isDynamic ? state.order : null,
      enabled: state.enabled,
    })),
  }
}

function replaceApplier(saved: PriceApplierModel) {
  const existing = appliers.value.find((item) => item.systemName === saved.systemName)
  if (!existing) {
    appliers.value.push(saved)
    return
  }
  existing.isDynamic = saved.isDynamic
  existing.name = saved.name
  existing.dslLogic = saved.dslLogic
  existing.states = saved.states
}

function nextOrder(usage: PriceOfferSourceType) {
  const orders = appliers.value
    .flatMap((applier) => applier.states)
    .filter((state) => state.usage === usage)
    .map((state) => state.order)
  return orders.length ? Math.max(...orders) + 1 : 0
}

function openCreateDialog() {
  editingApplier.value = null
  editorOpen.value = true
}

function openEditDialog(applier: PriceApplierModel) {
  editingApplier.value = applier
  editorOpen.value = true
}

async function handleRuleSaved() {
  await loadAppliers()
}
</script>

<style scoped>
.price-appliers-page {
  min-height: 100%;
  background: var(--app-bg);
}

.price-appliers-content {
  padding: 24px;
}

.rules-panel {
  max-width: 980px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
}

.rules-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--app-border);
  padding: 12px 16px;
}

.rules-count {
  color: var(--app-text-muted);
  font-size: 13px;
}

.rules-body {
  min-height: 360px;
  padding: 16px;
}

.queue-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.rules-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rule-card {
  display: grid;
  grid-template-columns: 32px 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 68px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  padding: 10px 12px;
  transition: border-color 150ms ease, opacity 150ms ease;
}

.rule-card[draggable='true'] {
  cursor: grab;
}

.rule-card[draggable='true']:active {
  cursor: grabbing;
}

.rule-card--dragging {
  opacity: 0.45;
}

.rule-card--drop-target {
  border-color: var(--app-primary);
}

.rule-card--disabled .rule-main {
  opacity: 0.6;
}

.rule-order {
  color: var(--app-text-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.drag-handle {
  display: flex;
  color: #64748b;
  font-size: 18px;
}

.drag-handle--locked {
  color: #94a3b8;
  font-size: 15px;
}

.rule-main {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.rule-title-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.rule-title-row strong {
  overflow: hidden;
  color: var(--app-text);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-kind {
  color: var(--app-text-muted);
  font-size: 12px;
}

.rule-meta {
  color: var(--app-text-muted);
  font-size: 12px;
}

.rule-actions,
.move-actions {
  display: flex;
  align-items: center;
}

.rule-actions {
  gap: 8px;
}

.move-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 720px) {
  .price-appliers-content {
    padding: 12px;
  }

  .rules-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .rules-body {
    padding: 12px;
  }

  .rule-card {
    grid-template-columns: 24px minmax(0, 1fr) auto;
  }

  .rule-order {
    display: none;
  }

  .rule-meta {
    display: none;
  }

  .move-actions {
    display: none;
  }
}
</style>
