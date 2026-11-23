<template>
  <div class="schema-entity-list">
    <template v-if="entity === 'Organization' || entity === 'User'">
      <div v-for="(id, index) in ids" :key="`${index}:${id}`" class="schema-entity-row"><SchemaPartySelector :entity="entity" :model-value="String(id)" :placeholder="placeholder" @update:model-value="value => replace(index, value)" /><el-button link type="danger" :aria-label="t('common.actions.delete')" @click="replace(index, null)">×</el-button></div>
      <SchemaPartySelector :key="addKey" :entity="entity" :model-value="null" :placeholder="placeholder" @update:model-value="add" />
    </template>
    <el-select v-else-if="entity === 'Currency'" :model-value="ids" multiple clearable filterable :loading="loading" :placeholder="placeholder" @visible-change="loadCurrencies" @update:model-value="write"><el-option v-for="currency in currencies" :key="currency.id" :value="currency.id" :label="currency.name" /></el-select>
    <template v-else-if="entity === 'Product'">
      <el-button plain @click="productsOpen = true">{{ t('sales.addProduct') }}</el-button>
      <div class="schema-entity-tags"><el-tag v-for="(id, index) in ids" :key="id" closable @close="replace(index, null)">{{ names[Number(id)] || t('analysisDetails.productFallback', { id }) }}</el-tag></div>
      <ProductSelectorDialog v-model="productsOpen" @select="selectProduct" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import SchemaPartySelector from './SchemaPartySelector.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import { getCurrencies } from '@/services/api/currencies'
import type { CurrencyModel } from '@/models/currencyModel'
import type { ProductSearchModel } from '@/models/productSearchModel'
import { graphqlClient } from '@/services/graphql/client'
import { SchemaProductsByIdsDocument } from '@/graphql/generated/graphql'
import { useI18n } from '@/i18n'
const props = defineProps<{ entity: string; modelValue?: string | number | boolean | null; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const { t } = useI18n()
const currencies = ref<CurrencyModel[]>([]), names = ref<Record<number, string>>({}), loading = ref(false), productsOpen = ref(false), addKey = ref(0)
let request = 0
onScopeDispose(() => { ++request })
const ids = computed<Array<string | number>>(() => { try { const value: unknown = JSON.parse(String(props.modelValue || '[]')); return Array.isArray(value) ? value.filter((id): id is string | number => typeof id === 'string' || typeof id === 'number') : [] } catch { return [] } })
function write(value: Array<string | number>) { emit('update:modelValue', value.length ? JSON.stringify([...new Set(value)]) : '') }
function add(value: string | null) { if (value) { write([...ids.value, value]); ++addKey.value } }
function replace(index: number, value: string | null) { write(ids.value.flatMap((id, i) => i !== index ? [id] : value ? [value] : [])) }
function selectProduct(product: ProductSearchModel) { names.value[product.id] = product.sku || product.name; write([...ids.value, product.id]); productsOpen.value = false }
async function loadCurrencies(visible: boolean) { if (!visible || currencies.value.length || loading.value) return; loading.value = true; try { currencies.value = (await getCurrencies()).currencies } catch (error) { ElMessage.error(error instanceof Error ? error.message : t('schemaInputs.loadPartyError')) } finally { loading.value = false } }
watch([() => props.entity, ids], async ([entity, values]) => {
  const current = ++request
  if (entity === 'Currency') { void loadCurrencies(true); return }
  if (entity !== 'Product') return
  const missing = values.filter((id): id is number => typeof id === 'number' && !names.value[id])
  try { for (let index = 0; index < missing.length; index += 40) { if (current !== request) return; const { data } = await graphqlClient.query({ query: SchemaProductsByIdsDocument, variables: { ids: missing.slice(index, index + 40) }, fetchPolicy: 'no-cache' }); if (current !== request) return; for (const item of data.products.byIds) names.value[item.id] = item.sku || item.name } }
  catch (error) { if (current === request) ElMessage.error(error instanceof Error ? error.message : t('schemaInputs.loadPartyError')) }
}, { immediate: true })
</script>
<style scoped>
.schema-entity-list { display: grid; gap: 8px; width: 100%; } .schema-entity-row { display: flex; gap: 8px; } .schema-entity-row > :first-child { flex: 1; min-width: 0; } .schema-entity-tags { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
