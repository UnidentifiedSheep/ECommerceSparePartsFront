<template>
  <Teleport to="body" :disabled="inline">
  <aside
    class="sale-history"
    :class="{ 'sale-history--open': isOpen, 'sale-history--inline': inline }"
    :style="inline ? undefined : { zIndex: panelZIndex }"
    :aria-label="canRecommend ? t('sales.recommendation.panelTitle') : t('sales.history.title')"
  >
    <button
      v-if="!isOpen"
      type="button"
      class="sale-history__toggle"
      :aria-label="t('sales.history.open')"
      :title="t('sales.history.open')"
      @click="isOpen = true"
    >
      <el-icon>
        <ArrowLeft />
      </el-icon>
      <span>{{ t('sales.history.show') }}</span>
    </button>

    <div v-if="isOpen" class="sale-history__content">
      <header class="sale-history__header">
        <div class="min-w-0">
          <div class="sale-history__title">{{ canRecommend ? t('sales.recommendation.panelTitle') : t('sales.history.title') }}</div>
          <div v-if="product && !inline" class="sale-history__product">
            <strong :title="product.name">{{ product.name }}</strong>
            <span>{{ product.sku }}</span>
          </div>
          <div v-else-if="!product" class="sale-history__hint">{{ t('sales.history.selectPosition') }}</div>
        </div>
        <div class="sale-history__header-actions">
          <el-button
            :icon="Refresh"
            circle
            plain
            :loading="isLoading"
            :disabled="!product"
            :aria-label="t('common.actions.refresh')"
            :title="t('common.actions.refresh')"
            @click="refreshAll"
          />
          <el-button v-if="!inline" text @click="isOpen = false">
            <el-icon><ArrowRight /></el-icon>
            {{ t('sales.history.hide') }}
          </el-button>
        </div>
      </header>

      <template v-if="product">
        <RecommendedSalePrice
          v-if="canRecommend"
          ref="recommendedPriceRef"
          :active="isOpen"
          :product-id="product.id"
          :storage-code="storageCode"
          :currency-id="currencyId"
          :currency-sign="currencySign"
          :quantity="quantity"
          :selection-key="selectionKey"
          :selected-price="selectedPrice"
          :disabled="disabled"
          @apply="applyRecommendedPrice"
        />
        <div class="sale-history__filters">
          <div v-if="canRecommend" class="sale-history__title">{{ t('sales.history.title') }}</div>
          <el-button v-if="historyUpdatesPending" size="small" plain @click="refresh">{{ t('common.live.newChanges') }}</el-button>
          <el-radio-group
            v-if="preferredOrganizationId && !organizationId"
            v-model="onlyThisOrganization"
            size="small"
            :aria-label="t('sales.buyer')"
            @change="refresh"
          >
            <el-radio-button :value="false">{{ t('sales.history.allBuyers') }}</el-radio-button>
            <el-radio-button :value="true">{{ t('sales.history.thisBuyer') }}</el-radio-button>
          </el-radio-group>
          <div class="sale-history__filter-row">
            <el-checkbox v-model="showCrosses" @change="refresh">{{ t('sales.history.showCrosses') }}</el-checkbox>
            <el-tag v-if="inline && historyOrganization" closable @close="clearHistoryOrganization">{{ historyOrganization.name }}</el-tag>
          </div>
        </div>

        <div ref="resultsElement" class="sale-history__results" :aria-busy="isLoading || isLoadingMore" @scroll.passive="loadNearEnd">
          <div v-if="errorMessage" class="sale-history__state sale-history__state--error">
            <span>{{ errorMessage }}</span>
            <el-button size="small" plain @click="refresh">{{ t('common.actions.refresh') }}</el-button>
          </div>

          <div v-else-if="isLoading && history.length === 0" class="sale-history__state">
            <el-skeleton :rows="5" animated />
            <span class="sr-only" role="status">{{ t('sales.history.loading') }}</span>
          </div>

          <div v-else-if="history.length === 0" class="sale-history__state">
            {{ t('sales.history.empty') }}
          </div>

          <div v-else class="sale-history__list">
            <div class="sale-history__columns" role="group" :aria-label="t('sales.history.sort')">
              <div class="sale-history__entry-head">
                <SortableColumnHeader :label="t('common.labels.price')" field="discountedPrice" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="sortHistory" />
                <SortableColumnHeader :label="t('common.labels.date')" field="saleDate" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="sortHistory" />
              </div>
              <div class="sale-history__details">
                <SortableColumnHeader :label="t('common.labels.count')" field="quantity" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="sortHistory" />
                <SortableColumnHeader :label="t('sales.history.buyPriceColumn')" field="averageBuyPrice" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="sortHistory" />
              </div>
            </div>
            <component
              :is="readOnly ? 'div' : 'button'"
              v-for="entry in history"
              :key="entry.saleContentId"
              :type="readOnly ? undefined : 'button'"
              class="sale-history__entry"
              :class="{ 'is-applied': appliedEntryId === entry.saleContentId && selectedPrice === entry.discountedPrice }"
              :disabled="readOnly ? undefined : !canApplyPrice(entry)"
              :aria-pressed="readOnly ? undefined : appliedEntryId === entry.saleContentId && selectedPrice === entry.discountedPrice"
              :title="entryTitle(entry)"
              @click="applyPrice(entry)"
            >
              <span class="sale-history__entry-head">
                <SalePrice class="sale-history__price" :original-price="entry.originalPrice" :discounted-price="entry.discountedPrice" :currency-sign="entry.currency?.currencySign ?? currencySign" />
                <time :datetime="entry.saleDate">{{ formatDate(entry.saleDate) }}</time>
              </span>
              <span class="sale-history__identity">
                <span v-if="entry.product && (!readOnly || entry.productId !== product.id)" class="sale-history__entry-product" :class="{ 'is-match': matchesSku(entry) }" :title="matchesSku(entry) ? t('sales.history.sameSku') : entry.product.name">
                  {{ entry.product.sku }}<span v-if="entry.product.producerName"> · {{ entry.product.producerName }}</span>
                </span>
                <button
                  v-if="entry.organization && inline && readOnly && !organizationId"
                  type="button"
                  class="sale-history__organization sale-history__organization-filter"
                  :class="{ 'is-match': matchesOrganization(entry) }"
                  :title="t('organizations.useInFilter')"
                  :aria-label="`${t('organizations.useInFilter')}: ${entry.organization.name}`"
                  @click.stop="filterHistoryOrganization(entry.organization)"
                >
                  {{ entry.organization.name }}<el-icon><Filter /></el-icon>
                </button>
                <span v-else-if="entry.organization" class="sale-history__organization" :class="{ 'is-match': matchesOrganization(entry) }" :title="entry.organization.name">
                  {{ entry.organization.name }}
                </span>
              </span>
              <span class="sale-history__details">
                <span><span class="sr-only">{{ t('common.labels.count') }}: </span>{{ entry.quantity.toLocaleString(locale) }}</span>
                <span :title="t('sales.history.averageBuyPrice')"><span class="sr-only">{{ t('sales.history.averageBuyPrice') }}: </span>{{ formatMoney(entry.averageBuyPrice, entry.currency?.currencySign) }}</span>
              </span>
            </component>
            <div v-if="isLoadingMore" class="sale-history__loading-more" role="status">{{ t('sales.history.loading') }}</div>
          </div>
        </div>

        <footer v-if="!readOnly" class="sale-history__footer">
          <span class="sale-history__hint" role="status">{{ hasAppliedPrice ? t('sales.history.priceApplied') : t('sales.history.applyHint') }}</span>
        </footer>
      </template>
    </div>
  </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { ArrowLeft, ArrowRight, Filter, Refresh } from '@element-plus/icons-vue'
import { useZIndex } from 'element-plus'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import {
  getProductSaleHistory,
  type ProductSaleHistoryModel,
} from '@/services/api/sales.ts'
import SalePrice from '@/components/sales/SalePrice.vue'
import SortableColumnHeader from '@/components/common/SortableColumnHeader.vue'
import { useMultiSort } from '@/composables/useMultiSort'
import { useSelectionDebounce } from '@/composables/useSelectionDebounce'
import { useI18n } from '@/i18n'
import RecommendedSalePrice from './RecommendedSalePrice.vue'
import type { AppliedPriceRecommendation } from '@/services/api/priceRecommendation'
import { usePermissions } from '@/composables/usePermissions'
import { useDocumentChanges } from '@/composables/useDocumentChanges'

const props = defineProps<{
  product?: Pick<ProductSearchModel, 'id' | 'name' | 'sku'>
  storageCode?: string
  organizationId?: string
  preferredOrganizationId?: string
  currencyId?: number
  currencySign?: string
  selectedPrice?: number
  quantity?: number
  selectionKey?: number
  disabled?: boolean
  inline?: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  'apply-price': [entry: ProductSaleHistoryModel]
  'apply-recommended-price': [value: AppliedPriceRecommendation]
}>()
const { hasPermission } = usePermissions()
const canRecommend = computed(() => !props.readOnly && hasPermission('PRICES_GET_STANDARD', 'PRICES_GET_DETAILED'))
const appliedEntryId = ref<number>()
const recommendedPriceRef = ref<InstanceType<typeof RecommendedSalePrice>>()
const isOpen = defineModel<boolean>({ required: true })
const { locale, t } = useI18n()
const { nextZIndex } = useZIndex()
const panelZIndex = ref(nextZIndex())
const history = ref<ProductSaleHistoryModel[]>([])
const resultsElement = ref<HTMLElement>()
const hasAppliedPrice = computed(() => appliedEntryId.value !== undefined && history.value.some(entry => entry.saleContentId === appliedEntryId.value && entry.discountedPrice === props.selectedPrice))
const isLoading = ref(false)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const hasNext = ref(false)
const showCrosses = ref(false)
const onlyThisOrganization = ref(false)
const historyOrganization = ref<ProductSaleHistoryModel['organization']>()
const effectiveOrganizationId = computed(() => props.organizationId || historyOrganization.value?.id || (onlyThisOrganization.value ? props.preferredOrganizationId : undefined))

function filterHistoryOrganization(organization: NonNullable<ProductSaleHistoryModel['organization']>) {
  if (historyOrganization.value?.id === organization.id) return
  historyOrganization.value = organization
  refresh()
}

function clearHistoryOrganization() {
  historyOrganization.value = undefined
  refresh()
}
const page = ref(0)
const pageSize = 10
const { sortBy, toggleSort } = useMultiSort(['-saleDate'])
const historyDebounce = useSelectionDebounce()
const historyUpdatesPending = ref(false)
useDocumentChanges('sale', {
  active: () => isOpen.value && Boolean(props.product),
  changed: () => refreshLiveHistory(),
  reconnected: () => refreshLiveHistory(),
})
let requestId = 0
onScopeDispose(() => { ++requestId })

function sortHistory(field: string, event: MouseEvent) {
  toggleSort(field, event)
  refresh()
}

function matchesSku(entry: ProductSaleHistoryModel) {
  const sku = props.product?.sku.trim().toUpperCase()
  return Boolean(sku && entry.product?.sku.trim().toUpperCase() === sku)
}

function matchesOrganization(entry: ProductSaleHistoryModel) {
  const organizationId = effectiveOrganizationId.value || props.preferredOrganizationId
  return Boolean(organizationId && entry.organization?.id === organizationId)
}

async function load(reset: boolean) {
  if (!props.product || !isOpen.value) return

  if (!reset && (isLoading.value || isLoadingMore.value || !hasNext.value)) return
  const currentRequestId = ++requestId
  if (reset) {
    resultsElement.value?.scrollTo({ top: 0 })
    appliedEntryId.value = undefined
    page.value = 0
    history.value = []
    errorMessage.value = ''
    isLoading.value = true
    isLoadingMore.value = false
    hasNext.value = false
  } else {
    isLoadingMore.value = true
  }

  if (reset && !await historyDebounce.wait()) return
  if (currentRequestId !== requestId) return
  try {
    const response = await getProductSaleHistory({
      productId: props.product.id,
      storageCode: props.storageCode,
      organizationId: effectiveOrganizationId.value,
      showCrosses: showCrosses.value,
      preferredOrganizationId: props.preferredOrganizationId,
      currencyId: props.currencyId,
      page: page.value,
      size: pageSize,
      sortBy: sortBy.value,
    })
    if (currentRequestId !== requestId) return

    const existing = new Set(history.value.map(entry => entry.saleContentId))
    history.value = reset ? response.history : [...history.value, ...response.history.filter(entry => !existing.has(entry.saleContentId))]
    hasNext.value = response.history.length === pageSize
    page.value += 1
  } catch (error) {
    if (currentRequestId === requestId) {
      errorMessage.value = error instanceof Error ? error.message : t('sales.history.loadError')
      hasNext.value = false
    }
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }
}

function refresh() {
  historyUpdatesPending.value = false
  void load(true)
}

function refreshLiveHistory() {
  if ((resultsElement.value?.scrollTop ?? 0) > 8 || isLoadingMore.value) historyUpdatesPending.value = true
  else refresh()
}

function refreshAll() {
  refresh()
  void recommendedPriceRef.value?.refresh()
}

function loadNearEnd() {
  const element = resultsElement.value
  if (!element || isLoading.value || isLoadingMore.value || !hasNext.value) return
  if (element.scrollHeight - element.scrollTop - element.clientHeight <= 80) void load(false)
}

// Fill a tall panel as well as continuing a user scroll; the load guard keeps one request in flight.
watch(
  () => [history.value.length, hasNext.value, isLoading.value, isLoadingMore.value],
  async () => {
    await nextTick()
    loadNearEnd()
  },
  { flush: 'post' },
)
useResizeObserver(resultsElement, loadNearEnd)

function formatMoney(value: number, currencySign?: string) {
  const formatted = value.toLocaleString(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${currencySign ?? props.currencySign ?? ''}`.trim()
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function entryTitle(entry: ProductSaleHistoryModel) {
  const date = new Date(entry.saleDate)
  const dateTime = Number.isNaN(date.getTime()) ? entry.saleDate : new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(date)
  return [
    props.readOnly ? undefined : canApplyPrice(entry) ? t('sales.history.applyPrice', { price: formatMoney(entry.discountedPrice, entry.currency?.currencySign) }) : t('sales.history.priceUnavailable'),
    entry.productId !== props.product?.id ? t('sales.history.cross') : undefined,
    entry.product && (!props.readOnly || entry.productId !== props.product?.id) ? [entry.product.sku, entry.product.producerName, entry.product.name].filter(Boolean).join(' · ') : undefined,
    dateTime,
    entry.organization?.name,
    entry.storageCode,
  ].filter(Boolean).join('\n')
}

function canApplyPrice(entry: ProductSaleHistoryModel) {
  return !props.readOnly && !props.disabled && props.currencyId === entry.currencyId && Number.isFinite(entry.discountedPrice) && entry.discountedPrice >= 0
}

function applyPrice(entry: ProductSaleHistoryModel) {
  if (!canApplyPrice(entry)) return
  appliedEntryId.value = entry.saleContentId
  emit('apply-price', entry)
}

function applyRecommendedPrice(value: AppliedPriceRecommendation) {
  appliedEntryId.value = undefined
  emit('apply-recommended-price', value)
}

watch(
  () => [
    isOpen.value,
    props.product?.id,
    props.storageCode,
    props.organizationId,
    props.preferredOrganizationId,
    props.currencyId,
    props.selectionKey,
  ],
  ([open]) => {
    if (open && props.product) {
      panelZIndex.value = nextZIndex()
      refresh()
    } else {
      historyDebounce.cancel()
      requestId += 1
      isLoading.value = false
      isLoadingMore.value = false
      history.value = []
      hasNext.value = false
      errorMessage.value = ''
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.sale-history {
  position: fixed;
  top: 5vh;
  right: max(16px, calc((100vw - 1680px) / 2));
  width: 108px;
  height: 38px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface);
  color: var(--app-text);
}
.sale-history--open {
  width: 400px;
  height: min(884px, 90vh);
  border-radius: 0 8px 8px 0;
}
.sale-history.sale-history--inline {
  position: static;
  width: 100%;
  height: min(680px, 70dvh);
  border: 0;
  border-radius: 0;
}
.sale-history--inline .sale-history__entry { cursor: default; }
.sale-history.sale-history--inline .sale-history__entry:hover { background: transparent; }
.sale-history__toggle {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}
.sale-history__toggle:hover { background: var(--app-surface-tinted); }
.sale-history__content {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
}
.sale-history__header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 16px 12px;
}
.sale-history__header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
}
.sale-history__header-actions :deep(.el-button + .el-button) { margin-left: 0; }
.sale-history__header-actions :deep(.el-button.is-text) { padding: 6px 4px; }
.sale-history__title { font-size: 15px; font-weight: 700; }
.sale-history__product {
  display: grid;
  gap: 2px;
  margin-top: 6px;
  font-size: 12px;
}
.sale-history__product strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.sale-history__product span,
.sale-history__hint { color: var(--app-text-muted); font-size: 12px; }
.sale-history__filters {
  display: grid;
  flex: 0 0 auto;
  gap: 8px;
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--app-border);
}
.sale-history__filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.sale-history__filter-row :deep(.el-checkbox) { flex: 0 0 auto; height: 28px; margin: 0; }
.sale-history__results { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.sale-history__list { min-width: 0; }
.sale-history__columns {
  position: sticky;
  top: 0;
  z-index: 1;
  display: grid;
  gap: 8px;
  padding: 8px 12px;
  background: var(--app-bg-soft);
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
}
.sale-history__entry {
  display: grid;
  width: 100%;
  min-height: 76px;
  gap: 3px;
  border: 0;
  border-bottom: 1px solid var(--app-border);
  border-radius: 0;
  padding: 6px 12px;
  background: var(--app-surface);
  color: var(--app-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.sale-history__entry:hover:not(:disabled),
.sale-history__entry.is-applied { background: var(--app-primary-soft); }
.sale-history__entry:focus-visible,
.sale-history__toggle:focus-visible {
  outline: 2px solid var(--app-primary);
  outline-offset: -2px;
}
.sale-history__entry:disabled { cursor: default; }
.sale-history__entry-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 14px; line-height: 1.3; }
.sale-history__price { font-size: 14px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.sale-history__entry-head time { color: var(--app-text-muted); font-size: 12px; white-space: nowrap; }
.sale-history__identity { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-width: 0; align-items: baseline; gap: 8px; font-size: 12px; line-height: 1.4; }
.sale-history__identity > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 1px 4px; border-radius: 3px; }
.sale-history__entry-product { min-width: 0; font-weight: 600; }
.sale-history__organization { min-width: 0; color: var(--app-text-muted); text-align: right; }
.sale-history__organization-filter { display: inline-flex; justify-content: flex-end; align-items: center; gap: 6px; border: 0; background: transparent; font: inherit; cursor: pointer; }
.sale-history__organization-filter .el-icon { flex: none; color: var(--app-primary); }
.sale-history__organization-filter:hover,
.sale-history__organization-filter:focus-visible { color: var(--app-primary); outline: 2px solid var(--app-primary); outline-offset: 1px; }
.sale-history--inline .sale-history__organization { grid-column: 2; }
.sale-history__entry-product.is-match { background: var(--app-primary-soft); color: var(--app-primary); box-shadow: inset 0 0 0 1px var(--app-border-strong); }
.sale-history__organization.is-match { background: #fffbeb; color: #92400e; }
.sale-history__details { display: grid; grid-template-columns: 70px minmax(0, 1fr); align-items: baseline; gap: 8px; color: var(--app-text-muted); font-size: 13px; line-height: 1.4; font-variant-numeric: tabular-nums; }
.sale-history__details > :nth-child(2) { justify-self: center; white-space: nowrap; }
.sale-history__details > :last-child { justify-self: end; white-space: nowrap; }
.sale-history__loading-more { padding: 10px; color: var(--app-text-muted); font-size: 12px; text-align: center; }
.sale-history__state { display: grid; place-items: center; gap: 12px; min-height: 150px; padding: 24px 16px; color: var(--app-text-muted); font-size: 13px; text-align: center; }
.sale-history__state--error { color: var(--el-color-danger); }
.sale-history__footer { display: grid; flex: 0 0 auto; gap: 8px; border-top: 1px solid var(--app-border); padding: 12px 16px; }
@media (max-width: 1180px) {
  .sale-history { right: 12px; }
  .sale-history--open {
    top: 12px;
    width: min(400px, calc(100vw - 24px));
    height: calc(100dvh - 24px);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(15 23 42 / 12%);
  }
}
</style>
