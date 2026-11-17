<template>
  <div class="purchase-details">
    <template v-if="purchase">
      <header class="details-header">
        <div class="details-heading">
          <h2>{{ t('purchases.detailsTitle') }}</h2>
          <span>{{ t('purchases.positions') }}: {{ content.length }}</span>
          <div class="details-party-line">
            <OrganizationPartyHoverCard
              :organization="purchase.supplierOrganization"
              :user="purchase.supplier"
              placement="bottom-start"
            />
            <span>·</span>
            <OrganizationPartyHoverCard
              :organization="purchase.supplierOrganization"
              :user="purchase.supplier"
              placement="bottom-start"
              trigger-entity="user"
            />
            <span>· {{ formatDate(purchase.purchaseDatetime) }}</span>
          </div>
        </div>
        <strong class="details-total">{{ formatCurrency(purchase.totalSum, purchase.currency.currencySign) }}</strong>
      </header>

      <div class="details-scroll">
        <div class="content-columns" aria-hidden="true">
          <span></span>
          <span>{{ t('common.labels.count') }}</span>
          <span>{{ t('common.labels.price') }}</span>
          <span>{{ t('purchases.amount') }}</span>
        </div>

        <div v-loading="loading" class="content-list">
          <article v-for="row in highlightedContent" :key="row.id" class="content-row">
            <div class="product-cell" :title="[row.product.sku, row.product.producerName, row.product.name].filter(Boolean).join(' · ')">
              <div class="product-heading">
                <RouterLink v-if="row.product.id" :to="{ name: 'product-details', params: { id: row.product.id } }" class="product-link">
                  <QueryHighlightedText :text="row.product.sku || row.product.name || t('purchases.unnamed')" :query="searchQuery" :sku="Boolean(row.product.sku)" /><span v-if="row.product.producerName"> • <QueryHighlightedText :text="row.product.producerName" :query="searchQuery" /></span>
                </RouterLink>
                <strong v-else class="product-link">
                  <QueryHighlightedText :text="row.product.sku || row.product.name || t('purchases.unnamed')" :query="searchQuery" :sku="Boolean(row.product.sku)" /><span v-if="row.product.producerName"> • <QueryHighlightedText :text="row.product.producerName" :query="searchQuery" /></span>
                </strong>
                <PositionCommentPopover :comment="row.comment" :query="searchQuery" />
              </div>
              <span v-if="row.product.name && row.product.name !== row.product.sku" class="product-meta"><QueryHighlightedText :text="row.product.name" :query="searchQuery" preview /></span>
              <span v-if="row.commentPreview" class="product-meta product-comment-match"><QueryHighlightedText :text="row.commentPreview" :query="searchQuery" /></span>
            </div>
            <span class="content-value content-value--count">{{ row.count.toLocaleString(locale) }}</span>
            <span class="content-value" :title="formatCurrency(row.price, purchase.currency.currencySign)">{{ formatCurrency(row.price, purchase.currency.currencySign) }}</span>
            <strong class="content-value content-value--total" :title="formatCurrency(row.totalSum, purchase.currency.currencySign)">{{ formatCurrency(row.totalSum, purchase.currency.currencySign) }}</strong>
          </article>
          <el-empty v-if="!loading && content.length === 0" :description="t('purchases.notFound')" />
        </div>

        <section v-if="purchase.comment" class="details-comment">
          <span>{{ t('common.labels.comment') }}</span>
          <p><QueryHighlightedText :text="purchase.comment" :query="searchQuery" /></p>
        </section>
      </div>
    </template>

    <div v-else class="purchase-details-empty">
      <h2>{{ t('purchases.detailsTitle') }}</h2>
      <p>{{ t('purchases.selectToView') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PurchaseContentModel, PurchaseModel } from '@/models/purchaseModel.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'
import OrganizationPartyHoverCard from '@/components/organizations/OrganizationPartyHoverCard.vue'
import QueryHighlightedText from '@/components/common/QueryHighlightedText.vue'
import { queryMatchPreview } from '@/utils/queryHighlights'
import PositionCommentPopover from '@/components/common/PositionCommentPopover.vue'

const { locale, t } = useI18n()

const props = defineProps<{
  purchase?: PurchaseModel
  content: PurchaseContentModel[]
  loading: boolean
  searchQuery?: string
}>()

const highlightedContent = computed(() => props.content.map(row => ({ ...row, commentPreview: queryMatchPreview(row.comment, props.searchQuery, 16) })))

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, t('purchases.noData'))
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

</script>

<style scoped>
.purchase-details { display: flex; height: 100%; min-height: 0; flex-direction: column; overflow: hidden; }
.product-comment-match { white-space: pre-wrap; }
.details-header {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px;
}
.details-heading { min-width: 0; }
.details-header h2 { margin: 0; color: var(--app-text); font-size: 17px; font-weight: 700; line-height: 1.3; }
.details-heading > span { display: block; margin-top: 3px; color: var(--app-text-muted); font-size: 13px; }
.details-party-line { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 5px; color: var(--app-text-muted); font-size: 12px; }
.details-party-line :deep(.organization-party-reference:hover) { color: var(--app-primary); }
.details-total { flex: none; color: var(--app-text); font-size: 16px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.details-scroll { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.content-columns,
.content-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(44px, 8%) minmax(70px, 17%) minmax(78px, 18%);
  gap: 5px;
  align-items: center;
  min-width: 360px;
  padding-right: 12px;
  padding-left: 12px;
}
.content-columns { position: sticky; z-index: 1; top: 0; min-height: 32px; background: var(--app-surface-muted, #f7f9fa); color: var(--app-text-muted); font-size: 12px; font-weight: 600; }
.content-columns span:not(:first-child) { text-align: right; }
.content-columns span:nth-child(2) { text-align: center; }
.content-row { min-height: 66px; border-bottom: 1px solid var(--app-border); padding-top: 9px; padding-bottom: 9px; }
.product-cell { min-width: 0; }
.product-heading { display: flex; align-items: center; gap: 4px; min-width: 0; }
.product-link { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--app-text); font-size: 13px; font-weight: 700; line-height: 1.3; text-decoration: none; }
a.product-link:hover { color: var(--app-primary); text-decoration: underline; }
.product-meta { display: -webkit-box; overflow: hidden; margin-top: 3px; color: #475569; font-size: 12px; line-height: 1.3; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.content-value { min-width: 0; overflow: hidden; color: var(--app-text); font-size: 12px; font-variant-numeric: tabular-nums; font-weight: 500; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.content-value--count { text-align: center; }
.content-value--total { font-weight: 700; }
.details-comment { margin: 12px 14px 0; border-top: 1px solid var(--app-border); padding-top: 10px; }
.details-comment span { color: var(--app-text-muted); font-size: 12px; font-weight: 650; }
.details-comment p { margin: 4px 0 0; color: var(--app-text); font-size: 13px; line-height: 1.4; }
.purchase-details-empty { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
.purchase-details-empty h2 { margin: 0; color: var(--app-text); font-size: 16px; }
.purchase-details-empty p { margin: 7px 0 0; color: var(--app-text-muted); font-size: 13px; }
@media (max-width: 480px) {
  .details-header { flex-wrap: wrap; }
  .details-total { font-size: 14px; }
}
</style>
