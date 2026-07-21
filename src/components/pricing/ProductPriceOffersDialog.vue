<template>
  <el-dialog
    :model-value="modelValue"
    width="min(1280px, calc(100vw - 24px))"
    top="3vh"
    class="price-offers-dialog"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="price-offers-dialog__header">
        <div class="min-w-0">
          <h2>{{ t('priceOffers.title') }}</h2>
          <p>{{ productLabel || t('priceOffers.productFallback', { id: productId }) }}</p>
        </div>
      </div>
    </template>

    <div class="price-offers-dialog__body">
      <section class="price-offers-context">
        <div class="price-offers-context__fields">
          <el-form-item :label="t('common.labels.currency')">
            <el-select
              v-model="selectedCurrencyId"
              :disabled="lockContext"
              :loading="isCurrenciesLoading"
              filterable
              class="w-full"
              :placeholder="t('currencies.selectCurrency')"
            >
              <el-option
                v-for="currency in currencies"
                :key="currency.id"
                :label="currencyLabel(currency)"
                :value="currency.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('common.labels.storage')">
            <el-select
              v-model="selectedStorageName"
              :disabled="lockContext"
              :loading="isStoragesLoading"
              filterable
              class="w-full"
              :placeholder="t('storages.selectStorage')"
            >
              <el-option
                v-for="storage in storages"
                :key="storage.name"
                :label="storage.name"
                :value="storage.name"
              >
                <div class="flex min-w-0 flex-col py-1">
                  <span class="truncate">{{ storage.name }}</span>
                  <span class="truncate text-xs text-slate-500">
                    {{ storage.location || storage.description || t('priceOffers.noStorageDescription') }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item :label="t('priceOffers.source')">
            <el-select
              v-model="selectedSources"
              multiple
              collapse-tags
              collapse-tags-tooltip
              filterable
              class="w-full"
              :placeholder="t('priceOffers.allSources')"
            >
              <el-option
                v-for="source in sourceOptions"
                :key="source"
                :label="sourceLabel(source)"
                :value="source"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-tooltip :content="t('common.actions.refresh')" placement="top">
          <el-button
            :icon="Refresh"
            :loading="isLoading"
            class="price-offers-refresh"
            plain
            :aria-label="t('common.actions.refresh')"
            @click="reloadOffers"
          >
            <span class="price-offers-refresh__label">{{ t('common.actions.refresh') }}</span>
          </el-button>
        </el-tooltip>
      </section>

      <el-alert
        v-if="!canLoadOffers"
        type="info"
        show-icon
        :closable="false"
        :title="t('priceOffers.selectContext')"
      />

      <div v-loading="isLoading" class="price-offers-list">
        <div v-if="offers.length > 0" class="price-offers-table">
          <div class="price-offers-table__header">
            <div></div>
            <HeaderTooltip :short-label="t('priceOffers.supplier')" :full-label="t('priceOffers.supplier')" />
            <HeaderTooltip :short-label="t('priceOffers.purchasePriceShort')" :full-label="t('priceOffers.purchasePrice')" />
            <HeaderTooltip :short-label="t('priceOffers.stock')" :full-label="t('priceOffers.stockDetails')" />
            <HeaderTooltip :short-label="t('priceOffers.deliveryDates')" :full-label="t('priceOffers.deliveryDatesDetails')" />
            <HeaderTooltip :short-label="t('priceOffers.probabilityShort')" :full-label="t('priceOffers.probability')" />
            <HeaderTooltip :short-label="t('priceOffers.orderTillShort')" :full-label="t('priceOffers.orderTill')" />
            <HeaderTooltip
              class="price-offers-table__right"
              :short-label="t('priceOffers.recommendedShort')"
              :full-label="t('priceOffers.recommended')"
            />
          </div>

          <article
            v-for="(option, index) in offers"
            :key="option.priceOfferId"
            class="price-offer-row"
            :class="{ 'price-offer-row--best': index === 0 }"
          >
            <div class="price-offer-row__rank">
              <span>{{ index + 1 + page * size }}</span>
            </div>

            <div class="price-offer-source">
              <strong>{{ sourceLabel(option.offer.source) }}</strong>
              <span>{{ option.offer.offerForStorage }}</span>
              <el-tooltip :content="`${t('priceOffers.offerId')}: ${option.priceOfferId}`" placement="top">
                <em>{{ shortId(option.priceOfferId) }}</em>
              </el-tooltip>
            </div>

            <div class="price-offer-cell price-offer-price" :data-label="t('priceOffers.purchasePrice')">
              <strong>{{ formatMoney(option.offer.purchasePrice, offerCurrency(option)?.currencySign) }}</strong>
              <span>{{ offerCurrency(option)?.shortName || '—' }}</span>
            </div>
            <div class="price-offer-cell price-offer-stock" :data-label="t('priceOffers.stock')">
              <strong :class="{ 'price-offer-stock--empty': option.offer.availableQuantity === 0 }">
                {{ option.offer.availableQuantity.toLocaleString(locale) }}
              </strong>
              <span>
                {{ t('priceOffers.minimumCompact', { count: option.offer.minimumPurchaseQuantity.toLocaleString(locale) }) }}
                ·
                {{ t('priceOffers.multipleCompact', { count: option.offer.quantityCoefficient.toLocaleString(locale) }) }}
              </span>
            </div>
            <div class="price-offer-cell price-offer-delivery" :data-label="t('priceOffers.deliveryDates')">
              <strong>{{ formatShortDate(option.offer.deliveryDate) }}</strong>
              <span>
                {{ t('priceOffers.guaranteedCompact', { date: formatShortDate(option.offer.guaranteedDeliveryDate) }) }}
              </span>
            </div>
            <div
              class="price-offer-cell price-offer-probability"
              :class="probabilityClass(option.deliveryProbability)"
              :data-label="t('priceOffers.probability')"
            >
              <strong>{{ option.deliveryProbability.toLocaleString(locale) }}%</strong>
            </div>
            <div class="price-offer-cell price-offer-deadline" :data-label="t('priceOffers.orderTill')">
              <strong>{{ formatShortDateTime(option.offer.orderTill) }}</strong>
            </div>
            <div class="price-offer-cell price-offer-cell--recommended" :data-label="t('priceOffers.recommended')">
              <strong>{{ formatMoney(option.sellPrice, selectedCurrency?.currencySign) }}</strong>
              <span>{{ t('priceOffers.markupValue', { value: formatPercent(option.markup) }) }}</span>
            </div>
          </article>
        </div>

        <el-empty
          v-if="canLoadOffers && !isLoading && offers.length === 0"
          :description="t('priceOffers.empty')"
          :image-size="72"
        />
      </div>
    </div>

    <template #footer>
      <div class="price-offers-footer">
        <ZeroPagination
          v-model:page="page"
          v-model:size="size"
          :has-next="hasNext"
          :sizes="[10, 20, 50]"
        />
        <el-button @click="emit('update:modelValue', false)">{{ t('common.actions.close') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElTooltip } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { PriceOptionModel } from '@/models/priceOfferModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { getPriceOffersForProduct } from '@/services/api/priceOffers.ts'
import { getStorages } from '@/services/api/storages.ts'
import { useI18n } from '@/i18n'

const props = withDefaults(defineProps<{
  modelValue: boolean
  productId: number
  productLabel?: string
  currencyId?: number | null
  storageName?: string | null
  lockContext?: boolean
}>(), {
  productLabel: '',
  currencyId: null,
  storageName: null,
  lockContext: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { locale, t } = useI18n()

const HeaderTooltip = defineComponent({
  props: {
    shortLabel: {
      type: String,
      required: true,
    },
    fullLabel: {
      type: String,
      required: true,
    },
  },
  setup(props, { attrs }) {
    return () => h(ElTooltip, {
      content: props.fullLabel,
      placement: 'top',
      showAfter: 250,
    }, {
      default: () => h('div', {
        ...attrs,
        class: ['price-offers-header-cell', attrs.class],
      }, props.shortLabel),
    })
  },
})

const offers = ref<PriceOptionModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const storages = ref<StorageModel[]>([])
const selectedSources = ref<string[]>([])
const selectedCurrencyId = ref<number>()
const selectedStorageName = ref('')
const page = ref(0)
const size = ref(10)
const hasNext = ref(false)
const isLoading = ref(false)
const isCurrenciesLoading = ref(false)
const isStoragesLoading = ref(false)
let isPreparingContext = false
let requestId = 0

const selectedCurrency = computed(() => currencies.value.find((currency) => currency.id === selectedCurrencyId.value))
const canLoadOffers = computed(() => Boolean(props.productId && selectedCurrencyId.value && selectedStorageName.value))
const sourceOptions = ['OurWarehouse', 'Armtek', 'FavoriteParts']

function currencyLabel(currency: CurrencyModel) {
  return `${currency.name} (${currency.currencySign})`
}

function offerCurrency(option: PriceOptionModel) {
  return currencies.value.find((currency) => currency.id === option.offer.currencyId)
}

function sourceLabel(source: string) {
  return t(`priceOffers.sources.${source}`)
}

function probabilityClass(value: number) {
  if (value >= 90) return 'price-offer-probability--high'
  if (value >= 70) return 'price-offer-probability--medium'
  return 'price-offer-probability--low'
}

function formatNumber(value: number | string, maximumFractionDigits = 2) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return String(value)

  return numericValue.toLocaleString(locale.value, {
    maximumFractionDigits,
  })
}

function formatMoney(value: number | string, sign?: string) {
  return `${formatNumber(value)} ${sign ?? ''}`.trim()
}

function formatPercent(value: number | string) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return String(value)

  return `${(numericValue * 100).toLocaleString(locale.value, {
    maximumFractionDigits: 2,
  })}%`
}

function formatShortDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: 'short',
  })
}

function formatShortDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale.value, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}...` : id
}

async function loadDictionaries() {
  await Promise.all([
    loadCurrencies(),
    loadStorages(),
  ])
}

async function loadCurrencies() {
  if (currencies.value.length > 0 || isCurrenciesLoading.value) return

  isCurrenciesLoading.value = true
  try {
    const resp = await getCurrencies()
    currencies.value = resp.currencies
    selectedCurrencyId.value = props.currencyId ?? selectedCurrencyId.value ?? resp.currencies[0]?.id
  } finally {
    isCurrenciesLoading.value = false
  }
}

async function loadStorages() {
  if (storages.value.length > 0 || isStoragesLoading.value) return

  isStoragesLoading.value = true
  try {
    const resp = await getStorages({
      page: 0,
      limit: 100,
    })
    storages.value = resp.storages
    selectedStorageName.value = props.storageName || selectedStorageName.value || resp.storages[0]?.name || ''
  } finally {
    isStoragesLoading.value = false
  }
}

async function reloadOffers() {
  page.value = 0
  await loadOffers()
}

async function prepareContextAndLoadOffers() {
  isPreparingContext = true
  try {
    selectedCurrencyId.value = props.currencyId ?? selectedCurrencyId.value
    selectedStorageName.value = props.storageName ?? selectedStorageName.value
    await loadDictionaries()
  } finally {
    isPreparingContext = false
  }

  await loadOffers()
}

async function loadOffers() {
  if (!canLoadOffers.value) {
    offers.value = []
    hasNext.value = false
    return
  }

  const currentRequestId = ++requestId
  isLoading.value = true
  try {
    const resp = await getPriceOffersForProduct({
      productId: props.productId,
      currencyId: selectedCurrencyId.value!,
      sources: selectedSources.value,
      storageName: selectedStorageName.value,
      page: page.value,
      size: size.value,
      sortBy: 'score_desc',
    })

    if (currentRequestId !== requestId) return
    offers.value = resp.priceOptions
    hasNext.value = resp.priceOptions.length === size.value
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false
    }
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return

    await prepareContextAndLoadOffers()
  },
  { immediate: true },
)

watch(
  () => props.productId,
  async () => {
    if (!props.modelValue) return

    page.value = 0
    await prepareContextAndLoadOffers()
  },
)

watch(
  () => [props.currencyId, props.storageName],
  () => {
    if (props.currencyId) selectedCurrencyId.value = props.currencyId
    if (props.storageName) selectedStorageName.value = props.storageName
  },
)

watch([selectedCurrencyId, selectedStorageName, selectedSources], async () => {
  if (!props.modelValue || isPreparingContext) return
  page.value = 0
  await loadOffers()
})

watch(page, async () => {
  if (!props.modelValue) return
  await loadOffers()
})

watch(size, async () => {
  if (!props.modelValue) return
  page.value = 0
  await loadOffers()
})
</script>

<style>
.price-offers-dialog {
  display: flex;
  max-height: calc(100vh - 6vh);
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
}

.price-offers-dialog .el-dialog__header {
  margin: 0;
  border-bottom: 1px solid #e5e7eb;
  padding: 18px 24px 16px;
}

.price-offers-dialog .el-dialog__body {
  flex: 1;
  max-height: calc(100vh - 210px);
  overflow: auto;
  padding: 16px 24px;
}

.price-offers-dialog .el-dialog__footer {
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  padding: 12px 24px;
}
</style>

<style scoped>
.price-offers-dialog__header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
}

.price-offers-dialog__header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.price-offers-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.price-offers-context {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fafafa;
  padding: 10px;
}

.price-offers-context__fields {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(180px, 0.9fr) minmax(180px, 0.9fr) minmax(210px, 1.1fr);
  gap: 10px;
}

.price-offers-context :deep(.el-form-item) {
  margin-bottom: 0;
}

.price-offers-context :deep(.el-form-item__label) {
  height: auto;
  margin-bottom: 5px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.price-offers-refresh {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  padding: 0;
}

.price-offers-refresh__label {
  display: none;
}

.price-offers-list {
  min-height: 240px;
}

.price-offers-table {
  overflow: hidden;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
  background: #ffffff;
}

.price-offers-table__header,
.price-offer-row {
  display: grid;
  grid-template-columns:
    32px minmax(140px, 1.3fr) minmax(105px, 0.85fr) minmax(130px, 1fr)
    minmax(150px, 1.15fr) 82px minmax(105px, 0.85fr) minmax(118px, 0.95fr);
  align-items: center;
  gap: 10px;
}

.price-offers-table__header {
  position: sticky;
  z-index: 1;
  top: 0;
  border-bottom: 1px solid #dfe3e8;
  background: #f6f7f8;
  padding: 9px 14px;
  color: #596579;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
}

.price-offers-table__right {
  text-align: right;
}

.price-offers-header-cell {
  min-width: 0;
  overflow: hidden;
  cursor: help;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-row {
  min-height: 68px;
  border-bottom: 1px solid #eceff2;
  padding: 10px 14px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 140ms ease;
}

.price-offer-row:hover {
  background: #fafbfc;
}

.price-offer-row:last-child {
  border-bottom: 0;
}

.price-offer-row--best {
  background: #f6fbf7;
  box-shadow: inset 3px 0 #22a35a;
}

.price-offer-row--best:hover {
  background: #f2f9f4;
}

.price-offer-row__rank span {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d6dbe1;
  border-radius: 50%;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  font-weight: 650;
}

.price-offer-row--best .price-offer-row__rank span {
  border-color: #168a49;
  background: #168a49;
  color: #ffffff;
}

.price-offer-source {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.price-offer-source strong,
.price-offer-source span,
.price-offer-source em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-source strong {
  font-size: 14px;
  font-weight: 650;
}

.price-offer-source span {
  color: #475569;
  font-size: 12px;
  font-weight: 500;
}

.price-offer-source em {
  width: fit-content;
  color: #94a3b8;
  cursor: help;
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
}

.price-offer-cell {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.price-offer-cell strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-cell span {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-stock--empty {
  color: #b42318;
}

.price-offer-probability strong {
  font-variant-numeric: tabular-nums;
}

.price-offer-probability--high strong {
  color: #168a49;
}

.price-offer-probability--medium strong {
  color: #a15c00;
}

.price-offer-probability--low strong {
  color: #b42318;
}

.price-offer-cell--recommended {
  text-align: right;
}

.price-offer-cell--recommended strong {
  font-size: 15px;
}

.price-offers-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 900px) {
  .price-offers-context {
    align-items: stretch;
    flex-direction: column;
  }

  .price-offers-context__fields {
    grid-template-columns: 1fr;
  }

  .price-offers-table__header {
    display: none;
  }

  .price-offer-row {
    grid-template-columns: 28px minmax(0, 1fr);
    align-items: flex-start;
    gap: 8px 10px;
    padding: 12px;
  }

  .price-offer-source,
  .price-offer-cell {
    grid-column: 2;
  }

  .price-offer-cell {
    display: grid;
    grid-template-areas:
      "label value"
      "label meta";
    grid-template-columns: minmax(112px, 0.75fr) minmax(0, 1fr);
    gap: 2px 12px;
    border-top: 1px solid #eceff2;
    padding-top: 8px;
  }

  .price-offer-cell::before {
    content: attr(data-label);
    grid-area: label;
    align-self: center;
    color: #596579;
    font-weight: 600;
  }

  .price-offer-cell strong {
    grid-area: value;
  }

  .price-offer-cell span {
    grid-area: meta;
  }

  .price-offer-cell--recommended {
    text-align: left;
  }

  .price-offers-footer {
    flex-wrap: wrap;
  }
}

@media (max-width: 560px) {
  .price-offers-dialog__header h2 {
    font-size: 17px;
  }

  .price-offers-context__fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .price-offers-refresh {
    width: 100%;
  }

  .price-offers-refresh__label {
    display: inline;
  }

  .price-offers-footer {
    align-items: stretch;
  }

  .price-offers-footer > :first-child {
    width: 100%;
  }

  .price-offers-footer :deep(.gap-3) {
    flex-wrap: nowrap;
    gap: 8px;
  }

  .price-offers-footer :deep(.page-size-select) {
    width: 60px;
    flex-basis: 60px;
  }

  .price-offers-footer :deep(.min-w-24) {
    min-width: 76px;
    white-space: nowrap;
  }

  .price-offers-footer > .el-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
