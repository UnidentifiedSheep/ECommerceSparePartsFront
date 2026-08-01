<template>
  <el-tooltip v-if="balance !== null" :content="t('organizations.approximateBalance')" placement="top">
    <span
      class="organization-approximate-balance"
      :class="{
        'organization-approximate-balance--negative': balance < 0,
        'organization-approximate-balance--positive': balance > 0,
      }"
    >
      {{ formattedBalance }}
    </span>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { OrganizationModel } from '@/models/organizationModel.ts'
import { useCurrencyStore } from '@/stores/currencyStore.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  organization: OrganizationModel
}>()

const { locale, t } = useI18n()
const { baseCurrency } = storeToRefs(useCurrencyStore())
const balance = computed(() => props.organization.approximateBalanceInBaseCurrency ?? null)
const formattedBalance = computed(() => {
  if (balance.value === null) return ''
  const amount = balance.value.toLocaleString(locale.value, { maximumFractionDigits: 2 })
  const currency = baseCurrency.value?.currencySign || baseCurrency.value?.shortName
  return currency ? `${amount} ${currency}` : amount
})
</script>

<style scoped>
.organization-approximate-balance {
  flex: none;
  color: #64748b;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  white-space: nowrap;
}

.organization-approximate-balance--negative { color: #dc2626; }
.organization-approximate-balance--positive { color: #047857; }
</style>
