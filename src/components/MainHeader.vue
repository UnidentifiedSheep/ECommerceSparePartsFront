<template>
  <header class="main-header">
    <div class="main-header__left">
      <button class="main-header__menu-button" :aria-label="t('nav.menu')" @click="emit('open-menu')">
        <Menu class="main-header__icon" />
      </button>
    </div>

    <div ref="searchRoot" class="main-header__search">
      <div class="main-header__search-field">
        <Search class="main-header__search-icon" />
        <input
          v-model="search"
          type="text"
          :placeholder="t('common.placeholders.searchProducts')"
          class="main-header__search-input"
          autocomplete="off"
          aria-haspopup="listbox"
          :aria-expanded="searchOpen"
          @focus="searchOpen = true"
          @keydown.escape="closeSearch"
          @keydown.enter.prevent="openProductSearch()"
        />
      </div>

      <div v-if="searchOpen" class="main-header__search-dropdown">
        <template v-if="!normalizedSearch">
          <div class="main-header__search-heading">{{ t('headerSearch.recent') }}</div>
          <div v-if="searchHistory.length" class="main-header__search-list">
            <button
              v-for="item in searchHistory"
              :key="item"
              type="button"
              class="main-header__history-item"
              @click="openProductSearch(item)"
            >
              <el-icon><Clock /></el-icon>
              <span>{{ item }}</span>
              <el-icon class="main-header__item-arrow"><ArrowRight /></el-icon>
            </button>
          </div>
          <div v-else class="main-header__search-empty">{{ t('headerSearch.noHistory') }}</div>
        </template>

        <template v-else>
          <div class="main-header__search-heading">{{ t('headerSearch.results') }}</div>
          <div v-if="searchLoading" class="main-header__search-empty">
            <el-icon class="is-loading"><Loading /></el-icon>
            {{ t('headerSearch.searching') }}
          </div>
          <div v-else-if="searchResults.length" class="main-header__search-list" role="listbox">
            <button
              v-for="product in searchResults"
              :key="product.id"
              type="button"
              role="option"
              class="main-header__product-result"
              @click="openProduct(product.id)"
            >
              <span
                class="main-header__product-indicator"
                :style="{ backgroundColor: product.indicator || '#94a3b8' }"
              />
              <span class="main-header__product-identity">
                <strong>{{ product.name }}</strong>
                <span class="main-header__product-meta">
                  <code class="main-header__product-sku">{{ product.sku }}</code>
                  <span aria-hidden="true">·</span>
                  <span class="main-header__product-producer">
                    {{ producerNames[product.producerId] || '—' }}
                  </span>
                </span>
              </span>
              <div class="main-header__product-stock">
                <ProductStockCell :stock="product.stock" />
              </div>
            </button>
          </div>
          <div v-else class="main-header__search-empty">{{ t('headerSearch.noResults') }}</div>

          <button type="button" class="main-header__search-all" @click="openProductSearch()">
            <span>{{ t('headerSearch.viewAll', { query: normalizedSearch }) }}</span>
            <kbd>Enter</kbd>
          </button>
        </template>
      </div>
    </div>

    <div class="main-header__actions">
      <LocaleSwitcher variant="light" />

      <el-dropdown placement="bottom">
        <button class="main-header__user-button" :aria-label="t('settings.title')">
          <User class="main-header__user-icon" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :icon="Setting" @click="openSettings">{{ t('settings.title') }}</el-dropdown-item>
            <el-dropdown-item :icon="IconExit" @click="logout">{{ t('common.actions.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Clock, Loading, Menu, Search, Setting, User } from '@element-plus/icons-vue'
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import IconExit from '@/components/icons/IconExit.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/stores/authStore.ts'
import { useProductSearchHistory } from '@/composables/useProductSearchHistory.ts'
import { searchProducts } from '@/services/api/search.ts'
import { getProducer } from '@/services/api/producers.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'

const emit = defineEmits<{
  'open-menu': []
}>()

const router = useRouter()
const search = ref('')
const searchRoot = ref<HTMLElement>()
const searchOpen = ref(false)
const searchLoading = ref(false)
const searchResults = ref<ProductSearchModel[]>([])
const producerNames = ref<Record<number, string>>({})
const authStore = useAuthStore()
const { locale, t } = useI18n()
const { searchHistory, rememberSearch } = useProductSearchHistory()
const normalizedSearch = computed(() => search.value.trim())
let searchRequestId = 0
let suppressNextSearchWatch = false
const producerRequests = new Map<number, Promise<void>>()

async function loadProducerNames(products: ProductSearchModel[]) {
  const ids = [...new Set(products.map((product) => product.producerId))]
    .filter((id) => !producerNames.value[id])

  await Promise.all(ids.map((id) => {
    const existingRequest = producerRequests.get(id)
    if (existingRequest) return existingRequest

    const request = getProducer(id)
      .then((resp) => {
        producerNames.value[id] = resp.producer.name
      })
      .catch(() => undefined)
      .finally(() => producerRequests.delete(id))
    producerRequests.set(id, request)
    return request
  }))
}

const loadSearchResults = useDebounceFn(async () => {
  const query = normalizedSearch.value
  if (!query) return

  const requestId = ++searchRequestId
  searchLoading.value = true
  try {
    const resp = await searchProducts({ query, page: 0, size: 6 })
    if (requestId !== searchRequestId) return
    await loadProducerNames(resp.products)
    if (requestId !== searchRequestId) return
    searchResults.value = resp.products
  } catch {
    if (requestId === searchRequestId) searchResults.value = []
  } finally {
    if (requestId === searchRequestId) searchLoading.value = false
  }
}, 300)

function openProductSearch(value = search.value) {
  const query = value.trim()
  if (query) {
    if (search.value !== query) {
      suppressNextSearchWatch = true
      search.value = query
    }
    rememberSearch(query, locale.value)
  }
  searchOpen.value = false

  router.push({
    name: 'products',
    query: {
      ...(query ? { query } : {}),
      page: 0,
      size: 20,
    },
  })
}

function openProduct(productId: number) {
  searchOpen.value = false
  router.push({ name: 'product-details', params: { id: productId } })
}

function closeSearch() {
  searchOpen.value = false
}

function openSettings() {
  router.push('/settings')
}

function logout() {
  authStore.logout()
  router.push('/auth')
}

watch(search, () => {
  if (suppressNextSearchWatch) {
    suppressNextSearchWatch = false
    return
  }

  searchOpen.value = true
  if (!normalizedSearch.value) {
    searchRequestId += 1
    searchResults.value = []
    searchLoading.value = false
    return
  }
  void loadSearchResults()
})

onClickOutside(searchRoot, closeSearch)
</script>

<style scoped>
.main-header {
  position: relative;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(260px, 480px) minmax(180px, 1fr);
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 56px;
  border-bottom: 1px solid #d8dee8;
  background: var(--app-topbar-bg);
  padding: 0 16px;
}

.main-header__left,
.main-header__actions {
  display: flex;
  align-items: center;
  min-width: 0;
}

.main-header__left {
  gap: 10px;
}

.main-header__actions {
  justify-content: flex-end;
  gap: 10px;
}

.main-header__user-button {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.main-header__user-button:hover {
  border-color: #d8dee8;
  background: #ffffff;
  color: #0f172a;
}

.main-header__menu-button {
  display: none;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.main-header__menu-button:hover {
  border-color: #d8dee8;
  background: #ffffff;
  color: #0f172a;
}

.main-header__icon,
.main-header__user-icon {
  width: 20px;
  height: 20px;
}

.main-header__search {
  position: relative;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.main-header__search-field {
  position: relative;
  width: 100%;
}

.main-header__search-icon {
  position: absolute;
  top: 50%;
  left: 11px;
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transform: translateY(-50%);
}

.main-header__search-input {
  width: 100%;
  height: 36px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  outline: none;
  padding: 0 12px 0 36px;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.main-header__search-input::placeholder {
  color: #94a3b8;
}

.main-header__search-input:focus {
  border-color: var(--app-primary);
  background: #ffffff;
  box-shadow: 0 0 0 2px rgb(4 120 87 / 12%);
}

.main-header__search-dropdown {
  position: absolute;
  z-index: 100;
  top: calc(100% + 7px);
  left: 0;
  width: 100%;
  overflow: hidden;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgb(15 23 42 / 12%);
}

.main-header__search-heading {
  border-bottom: 1px solid #edf0f2;
  color: #64748b;
  font-size: 11px;
  font-weight: 650;
  padding: 9px 12px 8px;
}

.main-header__search-list {
  max-height: 348px;
  overflow-y: auto;
  padding: 4px;
}

.main-header__history-item,
.main-header__product-result,
.main-header__search-all {
  width: 100%;
  border: 0;
  background: transparent;
  color: #334155;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.main-header__history-item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  border-radius: 6px;
  padding: 0 9px;
  font-size: 13px;
}

.main-header__history-item:hover,
.main-header__product-result:hover {
  background: #f1f5f3;
  color: #0f172a;
}

.main-header__history-item > .el-icon:first-child {
  color: #94a3b8;
}

.main-header__history-item span,
.main-header__product-identity {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-header__item-arrow {
  color: #94a3b8;
  opacity: 0;
}

.main-header__history-item:hover .main-header__item-arrow {
  opacity: 1;
}

.main-header__product-result {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  border-radius: 6px;
  padding: 6px 9px;
}

.main-header__product-indicator {
  width: 7px;
  height: 7px;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgb(15 23 42 / 8%);
}

.main-header__product-identity {
  display: grid;
  gap: 2px;
}

.main-header__product-identity strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-header__product-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 11px;
}

.main-header__product-meta code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.main-header__product-sku {
  color: #047857;
  font-weight: 700;
}

.main-header__product-producer {
  color: #526172;
  font-weight: 650;
}

.main-header__product-meta span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-header__product-stock {
  display: flex;
  justify-content: flex-end;
}

.main-header__product-stock :deep(.stock-cell) {
  grid-template-columns: 38px minmax(26px, auto);
  gap: 7px;
  min-width: 78px;
}

.main-header__product-stock :deep(.stock-cell__rail) {
  width: 38px;
}

.main-header__product-stock :deep(.stock-cell__value) {
  font-size: 11px;
}

.main-header__search-empty {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
  padding: 16px;
}

.main-header__search-all {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #edf0f2;
  color: #047857;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 650;
}

.main-header__search-all:hover {
  background: #f7f9f8;
}

.main-header__search-all kbd {
  border: 1px solid #d8dee8;
  border-radius: 4px;
  background: #ffffff;
  color: #64748b;
  font: inherit;
  font-size: 10px;
  padding: 2px 5px;
}

@media (max-width: 900px) {
  .main-header {
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    padding: 0 10px;
  }

  .main-header__menu-button {
    display: inline-flex;
  }

  .main-header__left,
  .main-header__actions {
    flex: 0 0 auto;
  }

  .main-header__search {
    min-width: 0;
  }

  .main-header__search-dropdown {
    position: fixed;
    top: 51px;
    left: 50%;
    width: min(480px, calc(100vw - 20px));
    transform: translateX(-50%);
  }
}

@media (max-width: 520px) {
  .main-header__product-result {
    grid-template-columns: 10px minmax(0, 1fr);
  }

  .main-header__product-stock {
    display: none;
  }
}
</style>
