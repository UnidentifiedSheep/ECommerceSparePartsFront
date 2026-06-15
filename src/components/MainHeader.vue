<template>
  <header class="relative z-20 flex h-14 w-full items-center border-b border-gray-700 bg-gray-800 px-4 text-white">
    <div class="flex w-12 justify-start">
      <button class="rounded p-2 transition hover:bg-gray-700" @click="menuToggled = true">
        <Menu class="h-6 w-6 text-gray-200" />
      </button>
    </div>

    <div class="flex flex-1 justify-center">
      <div class="relative w-full max-w-md">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Поиск товаров..."
          class="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="openProductSearch"
        />
      </div>
    </div>

    <div class="flex w-12 justify-end">
      <el-dropdown placement="bottom">
        <User class="h-6 w-6 text-gray-200" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :icon="IconExit" @click="logout">Выйти</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>

  <el-drawer v-model="menuToggled" direction="ltr" size="min(280px, 88vw)" :with-header="false">
    <el-menu
      :default-active="activeMenuIndex"
      background-color="#1f2937"
      text-color="#f9fafb"
      active-text-color="#3b82f6"
      class="h-full border-0"
    >
      <div class="flex flex-col items-start border-b border-gray-700 px-4 py-4">
        <h1 class="text-xl font-bold text-white">SpareParts Admin</h1>
        <span class="text-sm text-gray-400">Admin panel</span>
      </div>

      <el-sub-menu index="operations">
        <template #title>
          <el-icon><Tickets /></el-icon>
          <span>Операции</span>
        </template>

        <el-menu-item index="/purchases" @click="openRoute('/purchases')">Закупки</el-menu-item>
        <el-menu-item index="/sales" @click="openRoute('/sales')">Продажи</el-menu-item>
        <el-menu-item index="/reservations" @click="openRoute('/reservations')">Резервации</el-menu-item>
        <el-menu-item index="/transactions" @click="openRoute('/transactions')">Транзакции</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="catalog">
        <template #title>
          <el-icon><IconRoute /></el-icon>
          <span>Каталог и склады</span>
        </template>

        <el-menu-item index="/products" @click="openRoute('/products')">Товары</el-menu-item>
        <el-menu-item index="/producers" @click="openRoute('/producers')">Производители</el-menu-item>
        <el-menu-item index="/storages" @click="openRoute('/storages')">Склады</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="admin">
        <template #title>
          <el-icon><Key /></el-icon>
          <span>Администрирование</span>
        </template>

        <el-menu-item index="/users" @click="openRoute('/users')">Пользователи</el-menu-item>
        <el-menu-item index="/permissions" @click="openRoute('/permissions')">Разрешения</el-menu-item>
        <el-menu-item index="/currencies" @click="openRoute('/currencies')">Валюты</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="control">
        <template #title>
          <el-icon><DataAnalysis /></el-icon>
          <span>Контроль</span>
        </template>

        <el-menu-item index="/analytics" @click="openRoute('/analytics')">Метрики</el-menu-item>
        <el-menu-item index="/jobs" @click="openRoute('/jobs')">Задачи</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataAnalysis, Key, Menu, Search, Tickets, User } from '@element-plus/icons-vue'
import IconExit from '@/components/icons/IconExit.vue'
import IconRoute from '@/components/icons/IconRoute.vue'
import { useAuthStore } from '@/stores/authStore.ts'

const route = useRoute()
const router = useRouter()
const search = ref('')
const menuToggled = ref(false)
const authStore = useAuthStore()

const activeMenuIndex = computed(() => {
  if (route.path.startsWith('/products')) return '/products'
  return route.path
})

function openRoute(path: string) {
  menuToggled.value = false
  router.push(path)
}

function openProductSearch() {
  const query = search.value.trim()
  if (!query) return

  router.push({
    name: 'products',
    query: {
      query,
      page: 0,
      size: 20,
    },
  })
}

function logout() {
  authStore.logout()
  router.push('/auth')
}
</script>

<style scoped>
</style>
