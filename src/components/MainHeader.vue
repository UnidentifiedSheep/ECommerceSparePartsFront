<template>
  <header class="main-header">
    <div class="main-header__left">
      <button class="main-header__menu-button" :aria-label="t('nav.menu')" @click="emit('open-menu')">
        <Menu class="main-header__icon" />
      </button>
    </div>

    <div class="main-header__search">
      <div class="main-header__search-field">
        <Search class="main-header__search-icon" />
        <input
          v-model="search"
          type="text"
          :placeholder="t('common.placeholders.searchProducts')"
          class="main-header__search-input"
          @keyup.enter="openProductSearch"
        />
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Search, Setting, User } from '@element-plus/icons-vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import IconExit from '@/components/icons/IconExit.vue'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/stores/authStore.ts'

const emit = defineEmits<{
  'open-menu': []
}>()

const router = useRouter()
const search = ref('')
const authStore = useAuthStore()
const { t } = useI18n()

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

function openSettings() {
  router.push('/settings')
}

function logout() {
  authStore.logout()
  router.push('/auth')
}
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
}
</style>
