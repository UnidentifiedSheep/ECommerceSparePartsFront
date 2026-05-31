<template>
  <div class="routes-viewer">
    <div v-if="storage" class="routes-toolbar">
      <div>
        <h2>Маршруты</h2>
        <p>{{ toolbarText }}</p>
      </div>
      <el-button type="primary" @click="createOpen = true">Добавить маршрут</el-button>
    </div>

    <div v-else class="routes-placeholder">
      <el-empty description="Выберите склад, чтобы увидеть маршруты" />
    </div>

    <el-scrollbar v-if="storage" class="routes-scroll" @end-reached="loadNext(false)">
      <div v-loading="isLoading && routes.length === 0" class="routes-list">
        <StorageRouteCard
          v-for="route in routes"
          :key="route.id"
          :route="route"
          @toggle="toggle"
          @edit="openEditDialog"
          @remove="remove"
        />

        <el-empty v-if="!isLoading && routes.length === 0" description="Маршрутов нет" />

        <div v-if="isLoading && routes.length > 0" class="routes-loading">
          Загрузка маршрутов...
        </div>
      </div>
    </el-scrollbar>

    <CreateRouteDialog v-model:is-open="createOpen" :storage="storage" @created="onCreated" />
    <EditRouteDialog v-model="editOpen" :route="editingRoute" :currencies="currencies" @saved="loadNext(true)" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import CreateRouteDialog from '@/components/storages/CreateRouteDialog.vue'
import EditRouteDialog from '@/components/storages/EditRouteDialog.vue'
import StorageRouteCard from '@/components/storages/StorageRouteCard.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { StorageRouteModel } from '@/models/storageRouteModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { deleteStorageRoute, editStorageRoute, getStorageRoutes } from '@/services/api/storages.ts'

const storage = defineModel<StorageModel | undefined>('storage')

const routes = ref<StorageRouteModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const page = ref(0)
const limit = ref(20)
const isLoading = ref(false)
const hasNext = ref(true)
const createOpen = ref(false)
const editOpen = ref(false)
const editingRoute = ref<StorageRouteModel>()

const toolbarText = computed(() => {
  if (!storage.value) return ''
  return `Входящие маршруты на склад ${storage.value.name}`
})

async function loadCurrencies() {
  const resp = await getCurrencies({ page: 0, size: 50 })
  currencies.value = resp.currencies
}

async function loadNext(reset: boolean) {
  if (isLoading.value || !storage.value) return

  if (reset) {
    routes.value = []
    page.value = 0
    hasNext.value = true
  }

  if (!hasNext.value) return

  isLoading.value = true
  try {
    const resp = await getStorageRoutes({
      page: page.value,
      limit: limit.value,
      to: storage.value.name,
    })

    routes.value.push(...resp.storageRoutes)
    hasNext.value = resp.storageRoutes.length === limit.value
    page.value += 1
  } finally {
    isLoading.value = false
  }
}

async function toggle(route: StorageRouteModel) {
  await editStorageRoute({
    id: route.id,
    isActive: !route.isActive,
  })
  route.isActive = !route.isActive
}

function openEditDialog(route: StorageRouteModel) {
  editingRoute.value = route
  editOpen.value = true
}

async function remove(route: StorageRouteModel) {
  await deleteStorageRoute(route.id)
  routes.value = routes.value.filter((x) => x.id !== route.id)
  ElNotification({
    title: 'Успех',
    message: 'Маршрут удалён',
    type: 'success',
  })
}

function onCreated() {
  loadNext(true)
}

watch(storage, () => loadNext(true), { immediate: true })
onMounted(loadCurrencies)
</script>

<style scoped>
.routes-viewer {
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
}

.routes-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.routes-toolbar h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.2;
}

.routes-toolbar p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.routes-scroll {
  min-height: 0;
  flex: 1;
}

.routes-list {
  display: grid;
  gap: 12px;
  min-height: 180px;
  padding: 14px 2px 2px;
}

.routes-loading {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 14px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}

.routes-placeholder {
  display: grid;
  min-height: 280px;
  place-items: center;
}
</style>
