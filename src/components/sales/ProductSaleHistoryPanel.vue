<template>
  <Teleport to="body">
  <aside
    class="sale-history"
    :class="{ 'sale-history--open': isOpen }"
    :style="{ zIndex: panelZIndex }"
    :aria-label="t('sales.history.title')"
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
          <div class="sale-history__title">{{ t('sales.history.title') }}</div>
          <div v-if="product" class="sale-history__product">
            <strong :title="product.name">{{ product.name }}</strong>
            <span>{{ product.sku }}</span>
          </div>
          <div v-else class="sale-history__hint">{{ t('sales.history.selectPosition') }}</div>
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
            @click="refresh"
          />
          <el-button text @click="isOpen = false">
            <el-icon><ArrowRight /></el-icon>
            {{ t('sales.history.hide') }}
          </el-button>
        </div>
      </header>

      <template v-if="product">
        <div class="sale-history__filters">
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
            <el-select v-model="sortBy" size="small" class="sale-history__sort" :aria-label="t('sales.history.sort')" @change="refresh">
              <el-option
                v-for="option in sortOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>

        <div class="sale-history__results" :aria-busy="isLoading || isLoadingMore">
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
            <button
              v-for="entry in history"
              :key="entry.saleContentId"
              type="button"
              class="sale-history__entry"
              :class="{ 'is-applied': appliedEntryId === entry.saleContentId && selectedPrice === entry.price }"
              :disabled="!canApplyPrice(entry)"
              :aria-pressed="appliedEntryId === entry.saleContentId && selectedPrice === entry.price"
              :title="canApplyPrice(entry) ? t('sales.history.applyPrice', { price: formatMoney(entry.price, entry.currency?.currencySign) }) : t('sales.history.priceUnavailable')"
              @click="applyPrice(entry)"
            >
              <span v-if="entry.product && entry.productId !== product.id" class="sale-history__entry-product" :title="entry.product.name">
                <el-tag size="small" type="info">{{ t('sales.history.cross') }}</el-tag>
                <strong>{{ entry.product.sku }}</strong>
                <span>{{ entry.product.producerName }}</span>
              </span>
              <span class="sale-history__entry-head">
                <strong>{{ formatMoney(entry.price, entry.currency?.currencySign) }}</strong>
                <time :datetime="entry.saleDate">{{ formatDate(entry.saleDate) }}</time>
              </span>
              <span v-if="entry.organization && !effectiveOrganizationId" class="sale-history__organization" :class="{ 'is-current': entry.organization.id === preferredOrganizationId }" :title="entry.organization.name">{{ entry.organization.name }}</span>
              <span class="sale-history__details">
                <span>{{ t('common.labels.count') }}: <b>{{ entry.quantity.toLocaleString(locale) }}</b></span>
                <span>{{ t('sales.history.averageBuyPrice') }}: <b>{{ formatMoney(entry.averageBuyPrice, entry.currency?.currencySign) }}</b></span>
                <span v-if="entry.discount">{{ t('sales.history.discount') }}: <b>{{ formatPercent(entry.discount) }}</b></span>
                <span v-if="entry.storageCode !== storageCode">{{ entry.storageCode }}</span>
              </span>
            </button>
          </div>
        </div>

        <footer class="sale-history__footer">
          <span class="sale-history__hint" role="status">{{ hasAppliedPrice ? t('sales.history.priceApplied') : t('sales.history.applyHint') }}</span>
          <el-button
            v-if="hasNext"
            class="sale-history__more"
            plain
            :loading="isLoadingMore"
            @click="loadMore"
          >
            {{ t('common.actions.loadMore') }}
          </el-button>
        </footer>
      </template>
    </div>
  </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, Refresh } from '@element-plus/icons-vue'
import { useZIndex } from 'element-plus'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import {
  getProductSaleHistory,
  type ProductSaleHistoryModel,
} from '@/services/api/sales.ts'
import { useSelectionDebounce } from '@/composables/useSelectionDebounce'
import { useI18n } from '@/i18n'

const props = defineProps<{
  product?: Pick<ProductSearchModel, 'id' | 'name' | 'sku'>
  storageCode?: string
  organizationId?: string
  preferredOrganizationId?: string
  currencyId?: number
  currencySign?: string
  selectedPrice?: number
  selectionKey?: number
  disabled?: boolean
}>()

const emit = defineEmits<{ 'apply-price': [entry: ProductSaleHistoryModel] }>()
const appliedEntryId = ref<number>()
const isOpen = defineModel<boolean>({ required: true })
const { locale, t } = useI18n()
const { nextZIndex } = useZIndex()
const panelZIndex = ref(nextZIndex())
const history = ref<ProductSaleHistoryModel[]>([])
const hasAppliedPrice = computed(() => appliedEntryId.value !== undefined && history.value.some(entry => entry.saleContentId === appliedEntryId.value && entry.price === props.selectedPrice))
const isLoading = ref(false)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const hasNext = ref(false)
const showCrosses = ref(false)
const onlyThisOrganization = ref(false)
const effectiveOrganizationId = computed(() => props.organizationId || (onlyThisOrganization.value ? props.preferredOrganizationId : undefined))
const page = ref(0)
const pageSize = 10
const sortBy = ref('saleDate_desc')
const historyDebounce = useSelectionDebounce()
let requestId = 0
onScopeDispose(() => { ++requestId })

const sortOptions = computed(() => [
  { value: 'saleDate_desc', label: t('sales.history.sortNewest') },
  { value: 'saleDate_asc', label: t('sales.history.sortOldest') },
  { value: 'price_desc', label: t('sales.history.sortPriceDesc') },
  { value: 'price_asc', label: t('sales.history.sortPriceAsc') },
  { value: 'averageBuyPrice_desc', label: t('sales.history.sortBuyPriceDesc') },
  { value: 'averageBuyPrice_asc', label: t('sales.history.sortBuyPriceAsc') },
  { value: 'discount_desc', label: t('sales.history.sortDiscountDesc') },
  { value: 'discount_asc', label: t('sales.history.sortDiscountAsc') },
])

async function load(reset: boolean) {
  if (!props.product || !isOpen.value) return

  if (!reset && (isLoading.value || isLoadingMore.value || !hasNext.value)) return
  const currentRequestId = ++requestId
  if (reset) {
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
      sortBy: [sortBy.value],
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
  void load(true)
}

function loadMore() {
  if (!isLoading.value && !isLoadingMore.value && hasNext.value) void load(false)
}

function formatMoney(value: number, currencySign?: string) {
  const formatted = value.toLocaleString(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${currencySign ?? props.currencySign ?? ''}`.trim()
}

function formatPercent(value: number) {
  return (value * 100).toLocaleString(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + '%'
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function canApplyPrice(entry: ProductSaleHistoryModel) {
  return !props.disabled && props.currencyId === entry.currencyId && Number.isFinite(entry.price) && entry.price >= 0
}

function applyPrice(entry: ProductSaleHistoryModel) {
  if (!canApplyPrice(entry)) return
  appliedEntryId.value = entry.saleContentId
  emit('apply-price', entry)
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
.sale-history__filter-row { display: flex; align-items: center; gap: 12px; }
.sale-history__filter-row :deep(.el-checkbox) { flex: 0 0 auto; height: 28px; margin: 0; }
.sale-history__sort { flex: 1; min-width: 0; }
.sale-history__results { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.sale-history__list { display: grid; }
.sale-history__entry {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 4px;
  border: 0;
  border-bottom: 1px solid var(--app-border);
  border-radius: 0;
  padding: 12px 16px;
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
.sale-history__entry-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.sale-history__entry-head strong { font-size: 14px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.sale-history__entry-head time { color: var(--app-text-muted); font-size: 12px; text-align: right; }
.sale-history__entry-product { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 12px; overflow-wrap: anywhere; }
.sale-history__entry-product > span:last-child { color: var(--app-text-muted); }
.sale-history__organization { overflow: hidden; color: var(--app-text-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.sale-history__organization.is-current { color: var(--app-primary); font-weight: 500; }
.sale-history__details { display: flex; flex-wrap: wrap; gap: 2px 12px; color: var(--app-text-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.sale-history__details > span { white-space: nowrap; }
.sale-history__details b { font-weight: 500; }
.sale-history__state { display: grid; place-items: center; gap: 12px; min-height: 150px; padding: 24px 16px; color: var(--app-text-muted); font-size: 13px; text-align: center; }
.sale-history__state--error { color: var(--el-color-danger); }
.sale-history__footer { display: grid; flex: 0 0 auto; gap: 8px; border-top: 1px solid var(--app-border); padding: 12px 16px; }
.sale-history__more { width: 100%; }
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
