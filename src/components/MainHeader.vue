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

  <el-drawer v-model="menuToggled" direction="ltr" size="250px" :with-header="false">
    <el-menu
      default-active="1"
      background-color="#1f2937"
      text-color="#f9fafb"
      active-text-color="#3b82f6"
      class="h-full border-0"
    >
      <div class="flex flex-col items-start border-b border-gray-700 px-4 py-4">
        <h1 class="text-xl font-bold text-white">SpareParts Admin</h1>
        <span class="text-sm text-gray-400">Admin panel</span>
      </div>

      <el-menu-item index="1" @click="openRoute('/storages')">
        <template #title>
          <el-icon><House /></el-icon>
          <span>Склады</span>
        </template>
      </el-menu-item>

      <el-menu-item index="2" @click="openRoute('/users')">
        <template #title>
          <el-icon><User /></el-icon>
          <span>Пользователи</span>
        </template>
      </el-menu-item>

      <el-menu-item index="3" @click="openRoute('/purchases')">
        <template #title>
          <el-icon><Tickets /></el-icon>
          <span>Закупки</span>
        </template>
      </el-menu-item>

      <el-menu-item index="4" @click="openRoute('/currencies')">
        <template #title>
          <el-icon><Coin /></el-icon>
          <span>Валюты</span>
        </template>
      </el-menu-item>

      <el-menu-item index="5" @click="openRoute('/permissions')">
        <template #title>
          <el-icon><Key /></el-icon>
          <span>Разрешения</span>
        </template>
      </el-menu-item>

      <el-menu-item index="6" @click="openRoute('/producers')">
        <template #title>
          <el-icon><OfficeBuilding /></el-icon>
          <span>Производители</span>
        </template>
      </el-menu-item>

      <el-menu-item index="7" @click="openRoute('/products')">
        <template #title>
          <el-icon><IconRoute /></el-icon>
          <span>Товары</span>
        </template>
      </el-menu-item>

      <el-menu-item index="8" @click="openRoute('/analytics')">
        <template #title>
          <el-icon><DataAnalysis /></el-icon>
          <span>Метрики</span>
        </template>
      </el-menu-item>

      <el-menu-item index="9" @click="openRoute('/jobs')">
        <template #title>
          <el-icon><Tickets /></el-icon>
          <span>Задачи</span>
        </template>
      </el-menu-item>

      <el-menu-item index="10" @click="openRoute('/transactions')">
        <template #title>
          <el-icon><Coin /></el-icon>
          <span>Транзакции</span>
        </template>
      </el-menu-item>
    </el-menu>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Coin, DataAnalysis, House, Key, Menu, OfficeBuilding, Search, Tickets, User } from '@element-plus/icons-vue'
import IconExit from '@/components/icons/IconExit.vue'
import IconRoute from '@/components/icons/IconRoute.vue'
import { useAuthStore } from '@/stores/authStore.ts'

const router = useRouter()
const search = ref('')
const menuToggled = ref(false)
const authStore = useAuthStore()

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
