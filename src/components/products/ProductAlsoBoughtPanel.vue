<template>
  <section class="also-bought" :aria-label="t('products.details.alsoBought')" :aria-busy="loading">
    <el-skeleton v-if="loading" :rows="3" animated />
    <DataLoadError v-else-if="error" :error="error" @retry="load" />
    <el-empty v-else-if="!products.length" :description="t('products.details.alsoBoughtEmpty')" :image-size="64" />
    <ul v-else class="also-bought-list">
      <li v-for="product in products" :key="product.id">
        <RouterLink :to="{ name: 'product-details', params: { id: product.id } }" class="also-bought-row">
          <span class="also-bought-reference">
            <strong>{{ product.sku }}</strong>
            <span v-if="product.producer?.name">{{ product.producer.name }}</span>
          </span>
          <span>{{ product.name }}</span>
          <el-icon aria-hidden="true"><ArrowRight /></el-icon>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import DataLoadError from '@/components/common/DataLoadError.vue'
import { useI18n } from '@/i18n'
import { getProductAlsoBoughtGraphql } from '@/services/graphql/products'
import { classifyDataLoadError, type DataLoadErrorKind } from '@/utils/dataLoadError'

const props = defineProps<{ productId: number }>()
const { t } = useI18n()
const products = ref<Awaited<ReturnType<typeof getProductAlsoBoughtGraphql>>>([])
const loading = ref(true)
const error = ref<DataLoadErrorKind | null>(null)
let request: AbortController | undefined

async function load() {
  request?.abort()
  const controller = new AbortController()
  request = controller
  loading.value = true
  error.value = null
  try {
    const result = await getProductAlsoBoughtGraphql(props.productId, controller.signal)
    if (!controller.signal.aborted) products.value = result
  } catch (cause) {
    if (!controller.signal.aborted) error.value = classifyDataLoadError(cause)
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

onMounted(load)
onScopeDispose(() => request?.abort())
</script>

<style scoped>
.also-bought { min-width: 0; padding: 8px 0; }
.also-bought-list { list-style: none; margin: 0; padding: 0; }
.also-bought-list li + li { border-top: 1px solid var(--app-border); }
.also-bought-row {
  display: grid;
  grid-template-columns: minmax(120px, 25%) minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.also-bought-row:hover { background: var(--el-color-primary-light-9); }
.also-bought-row:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
.also-bought-reference { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.also-bought-reference strong { color: var(--el-color-primary); }
.also-bought-reference span { color: var(--app-text-muted); font-size: .85em; }
@media (max-width: 600px) {
  .also-bought-row { grid-template-columns: minmax(0, 1fr) auto; gap: 2px 8px; }
  .also-bought-reference { grid-column: 1; }
  .also-bought-row > .el-icon { grid-row: 1 / span 2; grid-column: 2; }
}
</style>
