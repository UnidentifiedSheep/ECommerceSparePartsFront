<template>
  <div class="sale-details">
    <template v-if="sale">
      <header class="details-header">
        <h2>{{ t('sales.detailsTitle') }}</h2>
        <span>{{ t('sales.positions') }}: {{ content.length }}</span>
      </header>

      <div class="details-scroll">
        <div class="content-columns" aria-hidden="true">
          <span></span>
          <span>{{ t('common.labels.count') }}</span>
          <span>{{ t('common.labels.price') }}</span>
          <span>{{ t('sales.amount') }}</span>
        </div>
        <div v-loading="loading" class="content-list">
          <article v-for="row in highlightedContent" :key="row.id" class="content-row">
            <div class="product-cell" :title="[row.product.sku, row.product.producerName, row.product.name].filter(Boolean).join(' · ')">
              <div class="product-heading">
                <RouterLink v-if="row.product.id" :to="{ name: 'product-details', params: { id: row.product.id } }" class="product-link">
                  <QueryHighlightedText :text="row.product.sku || row.product.name || t('sales.unnamed')" :query="searchQuery" :sku="Boolean(row.product.sku)" /><span v-if="row.product.producerName"> • <QueryHighlightedText :text="row.product.producerName" :query="searchQuery" /></span>
                </RouterLink>
                <strong v-else class="product-link">
                  <QueryHighlightedText :text="row.product.sku || row.product.name || t('sales.unnamed')" :query="searchQuery" :sku="Boolean(row.product.sku)" /><span v-if="row.product.producerName"> • <QueryHighlightedText :text="row.product.producerName" :query="searchQuery" /></span>
                </strong>
                <PositionCommentPopover :comment="row.comment" :query="searchQuery" />
              </div>
              <span v-if="row.product.name && row.product.name !== row.product.sku" class="product-meta"><QueryHighlightedText :text="row.product.name" :query="searchQuery" preview /></span>
              <span v-if="row.commentPreview" class="product-meta product-comment-match"><QueryHighlightedText :text="row.commentPreview" :query="searchQuery" /></span>
            </div>
            <span class="content-value content-value--count">{{ row.count.toLocaleString(locale) }}</span>
            <SalePrice :original-price="row.originalPrice" :discounted-price="row.discountedPrice" :currency-sign="sale.currency.currencySign" />
            <strong class="content-value content-value--total" :title="formatCurrency(row.totalSum, sale.currency.currencySign)">{{ formatCurrency(row.totalSum, sale.currency.currencySign) }}</strong>
          </article>
          <el-empty v-if="!loading && content.length === 0" :description="t('sales.notFound')" />
        </div>
        <section v-if="sale.comment" class="details-comment">
          <span>{{ t('common.labels.comment') }}</span>
          <p><QueryHighlightedText :text="sale.comment" :query="searchQuery" /></p>
        </section>
      </div>
    </template>

    <div v-else class="sale-details-empty">
      <h2>{{ t('sales.detailsTitle') }}</h2>
      <p>{{ t('sales.selectToView') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SaleContentModel, SaleModel } from '@/models/saleModel.ts'
import { useI18n } from '@/i18n'
import PositionCommentPopover from '@/components/common/PositionCommentPopover.vue'
import SalePrice from '@/components/sales/SalePrice.vue'
import QueryHighlightedText from '@/components/common/QueryHighlightedText.vue'
import { queryMatchPreview } from '@/utils/queryHighlights'

const { locale, t } = useI18n()

const props = defineProps<{
  sale?: SaleModel
  content: SaleContentModel[]
  loading: boolean
  searchQuery?: string
}>()

const highlightedContent = computed(() => props.content.map(row => ({ ...row, commentPreview: queryMatchPreview(row.comment, props.searchQuery, 16) })))

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

</script>

<style scoped>
.sale-details {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.details-header {
  flex: none;
  padding: 14px 14px 10px;
}

.details-header h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.details-header span {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.details-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.content-columns,
.content-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(44px, 8%) minmax(110px, 25%) minmax(90px, 18%);
  gap: 5px;
  align-items: center;
  padding-right: 12px;
  padding-left: 12px;
}

.content-columns {
  position: sticky;
  z-index: 1;
  top: 0;
  min-height: 32px;
  background: var(--app-surface-muted, #f7f9fa);
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.content-columns span:not(:first-child) { text-align: right; }
.content-columns span:nth-child(2) { text-align: center; }

.content-row {
  min-height: 66px;
  border-bottom: 1px solid var(--app-border);
  padding-top: 9px;
  padding-bottom: 9px;
}

.content-row:last-child { border-bottom: 0; }
.product-cell { min-width: 0; }
.product-comment-match { white-space: pre-wrap; }
.details-comment { border-top: 1px solid var(--app-border); padding: 12px; }
.details-comment > span { color: var(--app-text-muted); font-size: 12px; }
.details-comment p { margin: 4px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; }

.product-heading {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.product-link {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  text-decoration: none;
}

a.product-link:hover { color: var(--app-primary); text-decoration: underline; }

.product-meta {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 3px;
  color: #475569;
  font-size: 12px;
  line-height: 1.3;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.content-value {
  min-width: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-value--count { text-align: center; }
.content-value--total { font-weight: 700; }

.sale-details-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.sale-details-empty h2 { margin: 0; color: var(--app-text); font-size: 16px; }
.sale-details-empty p { margin: 7px 0 0; color: var(--app-text-muted); font-size: 13px; }

@media (max-width: 600px) {
  .content-columns,
  .content-row { grid-template-columns: 44px minmax(0, 1fr) minmax(0, 1fr); }
  .content-columns span:first-child { display: none; }
  .product-cell { grid-column: 1 / -1; margin-bottom: 4px; }
}
</style>
