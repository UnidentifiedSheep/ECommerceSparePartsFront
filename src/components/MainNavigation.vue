<template>
  <el-menu
    ref="menu"
    :default-active="activeMenuIndex"
    @open="openedGroups.add($event)"
    @close="openedGroups.delete($event)"
    background-color="var(--app-surface-tinted)"
    text-color="#334155"
    active-text-color="var(--app-primary)"
    class="main-nav"
  >
    <div class="main-nav__brand">
      <h1>{{ t('app.name') }}</h1>
      <button
        v-if="closable"
        class="main-nav__close"
        :aria-label="t('common.actions.close')"
        @click="emit('close')"
      >
        <Close />
      </button>
    </div>

    <el-menu-item v-if="canViewCharts" index="/" @click="openRoute('/')">
      <el-icon><House /></el-icon>
      <span class="main-nav__item-label" :title="t('nav.overview')">{{ t('nav.overview') }}</span>
      <PinMenuButton path="/" />
    </el-menu-item>

    <el-sub-menu v-if="operationsRoutes.some(canOpen)" index="operations" class="main-nav__operations">
      <template #title>
        <el-icon><Tickets /></el-icon>
        <span>{{ t('nav.operations') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/purchases')" index="/purchases" @click="openRoute('/purchases')"><span class="main-nav__item-label" :title="t('nav.purchases')">{{ t('nav.purchases') }}</span><PinMenuButton path="/purchases" /></el-menu-item>
      <el-menu-item v-if="canOpen('/sales')" index="/sales" @click="openRoute('/sales')"><span class="main-nav__item-label" :title="t('nav.sales')">{{ t('nav.sales') }}</span><PinMenuButton path="/sales" /></el-menu-item>
      <el-menu-item v-if="canOpen('/reservations')" index="/reservations" @click="openRoute('/reservations')"><span class="main-nav__item-label" :title="t('nav.reservations')">{{ t('nav.reservations') }}</span><PinMenuButton path="/reservations" /></el-menu-item>
      <el-menu-item v-if="canOpen('/transactions')" index="/transactions" @click="openRoute('/transactions')"><span class="main-nav__item-label" :title="t('nav.transactions')">{{ t('nav.transactions') }}</span><PinMenuButton path="/transactions" /></el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="catalog" class="main-nav__catalog">
      <template #title>
        <el-icon><IconRoute /></el-icon>
        <span>{{ t('nav.catalog') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/products')" index="/products" @click="openRoute('/products')"><span class="main-nav__item-label" :title="t('nav.products')">{{ t('nav.products') }}</span><PinMenuButton path="/products" /></el-menu-item>
      <el-menu-item
        v-if="canReviewCatalogueCandidates"
        index="/products/enrichment"
        @click="openRoute('/products/enrichment')"
      ><span class="main-nav__item-label" :title="t('nav.catalogueReview')">{{ t('nav.catalogueReview') }}</span><PinMenuButton path="/products/enrichment" /></el-menu-item>
      <el-menu-item index="/producers" @click="openRoute('/producers')"><span class="main-nav__item-label" :title="t('nav.producers')">{{ t('nav.producers') }}</span><PinMenuButton path="/producers" /></el-menu-item>
      <el-menu-item v-if="canOpen('/storages')" index="/storages" @click="openRoute('/storages')"><span class="main-nav__item-label" :title="t('nav.storages')">{{ t('nav.storages') }}</span><PinMenuButton path="/storages" /></el-menu-item>
    </el-sub-menu>

    <el-sub-menu v-if="adminRoutes.some(canOpen)" index="admin" class="main-nav__admin">
      <template #title>
        <el-icon><Key /></el-icon>
        <span>{{ t('nav.admin') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/users')" index="/users" @click="openRoute('/users')"><span class="main-nav__item-label" :title="t('nav.users')">{{ t('nav.users') }}</span><PinMenuButton path="/users" /></el-menu-item>
      <el-menu-item v-if="canViewOrganizations" index="/organizations" @click="openRoute('/organizations')"><span class="main-nav__item-label" :title="t('nav.organizations')">{{ t('nav.organizations') }}</span><PinMenuButton path="/organizations" /></el-menu-item>
      <el-menu-item v-if="canOpen('/roles')" index="/roles" @click="openRoute('/roles')"><span class="main-nav__item-label" :title="t('nav.roles')">{{ t('nav.roles') }}</span><PinMenuButton path="/roles" /></el-menu-item>
      <el-menu-item v-if="canOpen('/permissions')" index="/permissions" @click="openRoute('/permissions')"><span class="main-nav__item-label" :title="t('nav.permissions')">{{ t('nav.permissions') }}</span><PinMenuButton path="/permissions" /></el-menu-item>
      <el-menu-item v-if="canOpen('/currencies')" index="/currencies" @click="openRoute('/currencies')"><span class="main-nav__item-label" :title="t('nav.currencies')">{{ t('nav.currencies') }}</span><PinMenuButton path="/currencies" /></el-menu-item>
      <el-menu-item v-if="canOpen('/service-settings')" index="/service-settings" @click="openRoute('/service-settings')"><span class="main-nav__item-label" :title="t('nav.serviceSettings')">{{ t('nav.serviceSettings') }}</span><PinMenuButton path="/service-settings" /></el-menu-item>
    </el-sub-menu>

    <el-sub-menu v-if="pricingRoutes.some(canOpen)" index="pricing" class="main-nav__pricing">
      <template #title>
        <el-icon><Money /></el-icon>
        <span>{{ t('nav.pricing') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/markups')" index="/markups" @click="openRoute('/markups')"><span class="main-nav__item-label" :title="t('nav.markup')">{{ t('nav.markup') }}</span><PinMenuButton path="/markups" /></el-menu-item>
      <el-menu-item
        v-if="canManagePriceAppliers"
        index="/price-appliers"
        @click="openRoute('/price-appliers')"
      ><span class="main-nav__item-label" :title="t('nav.priceAppliers')">{{ t('nav.priceAppliers') }}</span><PinMenuButton path="/price-appliers" /></el-menu-item>
    </el-sub-menu>

    <el-sub-menu v-if="controlRoutes.some(canOpen)" index="control" class="main-nav__control">
      <template #title>
        <el-icon><DataAnalysis /></el-icon>
        <span>{{ t('nav.control') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/jobs')" index="/jobs" @click="openRoute('/jobs')"><span class="main-nav__item-label" :title="t('nav.jobs')">{{ t('nav.jobs') }}</span><PinMenuButton path="/jobs" /></el-menu-item>
      <el-menu-item v-if="canViewDocuments" index="/documents" @click="openRoute('/documents')"><span class="main-nav__item-label" :title="t('nav.documents')">{{ t('nav.documents') }}</span><PinMenuButton path="/documents" /></el-menu-item>
      <el-menu-item v-if="canOpen('/extensions')" index="/extensions" @click="openRoute('/extensions')"><span class="main-nav__item-label" :title="t('nav.extensions')">{{ t('nav.extensions') }}</span><PinMenuButton path="/extensions" /></el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { MenuInstance } from 'element-plus'
import PinMenuButton from '@/components/common/PinMenuButton.vue'
import { navigationEntries, canAccessNavigation, activeNavigationPath } from '@/utils/navigation'
import { useRoute, useRouter } from 'vue-router'
import { Close, DataAnalysis, House, Key, Money, Tickets } from '@element-plus/icons-vue'
import IconRoute from '@/components/icons/IconRoute.vue'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

withDefaults(defineProps<{
  closable?: boolean
}>(), {
  closable: false,
})

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { hasPermission } = usePermissions()
const canManagePriceAppliers = computed(() => hasPermission('PRICE_APPLIERS_MANAGE'))
const canViewOrganizations = computed(() => hasPermission('ORGANIZATIONS_GET'))
const canReviewCatalogueCandidates = computed(() => hasPermission('CATALOGUE_CANDIDATES_REVIEW'))
const canViewCharts = computed(() => hasPermission('CHARTS_GET'))
const canViewDocuments = computed(() => hasPermission('DOCUMENTS_ME', 'DOCUMENTS_ALL'))

function canOpen(path: string) {
  const entry = navigationEntries.find(item => item.path === path)
  return Boolean(entry && canAccessNavigation(entry, hasPermission))
}
const operationsRoutes = ['/purchases', '/sales', '/reservations', '/transactions']
const adminRoutes = ['/users', '/organizations', '/roles', '/permissions', '/currencies', '/service-settings']
const pricingRoutes = ['/markups', '/price-appliers']
const controlRoutes = ['/jobs', '/documents', '/extensions']

const activeMenuIndex = computed(() => activeNavigationPath(route.path) ?? route.path)
const menu = ref<MenuInstance>()
const openedGroups = new Set<string>()

watch(activeMenuIndex, async () => {
  // Element Plus opens the active item's ancestors during its update. Restore
  // the user's group choices after that update, before the next browser paint.
  const previouslyOpened = new Set(openedGroups)
  await nextTick()
  for (const group of openedGroups) {
    if (!previouslyOpened.has(group)) menu.value?.close(group)
  }
  openedGroups.clear()
  previouslyOpened.forEach(group => openedGroups.add(group))
})

function openRoute(path: string) {
  emit('close')
  router.push(path)
}
</script>

<style scoped>
.main-nav {
  height: 100%;
  border-right: 0;
  background: var(--app-surface-tinted);
}

.main-nav__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 56px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--app-border);
  background: #ffffff;
  padding: 0 16px;
}

.main-nav__brand h1 {
  margin: 0;
  color: #0f172a;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.main-nav__close {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.main-nav__close:hover {
  border-color: var(--app-border);
  background: var(--app-primary-soft);
  color: #0f172a;
}

.main-nav__close svg {
  width: 16px;
  height: 16px;
}

:deep(.el-sub-menu__title),
:deep(.el-menu-item) {
  height: 40px;
  margin: 2px 8px;
  border-radius: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  line-height: 40px;
}

:deep(.el-sub-menu__title:hover),
:deep(.el-menu-item:hover) {
  background: var(--app-primary-soft);
  color: #0f172a;
}

:deep(.el-menu-item.is-active) {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
  padding-left: 44px !important;
  font-weight: 500;
}

:deep(.el-icon) {
  color: inherit;
}
.main-nav__operations { --section-color: var(--app-section-operations); }
.main-nav__catalog { --section-color: var(--app-section-catalog); }
.main-nav__admin { --section-color: var(--app-section-admin); }
.main-nav__pricing { --section-color: var(--app-section-pricing); }
.main-nav__control { --section-color: var(--app-section-control); }
:deep(.el-sub-menu__title > .el-icon:first-child) { color: var(--section-color, var(--app-primary)); background: color-mix(in srgb, var(--section-color, var(--app-primary)), white 90%); border-radius: 5px; width: 26px; height: 26px; padding: 4px; }
.main-nav__item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
