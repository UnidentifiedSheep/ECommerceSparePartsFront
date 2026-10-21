<template>
  <el-menu
    :default-active="activeMenuIndex"
    background-color="#fbfdfb"
    text-color="#334155"
    active-text-color="#047857"
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
      <span>{{ t('nav.overview') }}</span>
    </el-menu-item>

    <el-sub-menu v-if="operationsRoutes.some(canOpen)" index="operations">
      <template #title>
        <el-icon><Tickets /></el-icon>
        <span>{{ t('nav.operations') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/purchases')" index="/purchases" @click="openRoute('/purchases')">{{ t('nav.purchases') }}</el-menu-item>
      <el-menu-item v-if="canOpen('/sales')" index="/sales" @click="openRoute('/sales')">{{ t('nav.sales') }}</el-menu-item>
      <el-menu-item v-if="canOpen('/reservations')" index="/reservations" @click="openRoute('/reservations')">{{ t('nav.reservations') }}</el-menu-item>
      <el-menu-item v-if="canOpen('/transactions')" index="/transactions" @click="openRoute('/transactions')">{{ t('nav.transactions') }}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="catalog">
      <template #title>
        <el-icon><IconRoute /></el-icon>
        <span>{{ t('nav.catalog') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/products')" index="/products" @click="openRoute('/products')">{{ t('nav.products') }}</el-menu-item>
      <el-menu-item
        v-if="canReviewCatalogueCandidates"
        index="/products/enrichment"
        @click="openRoute('/products/enrichment')"
      >
        {{ t('nav.catalogueReview') }}
      </el-menu-item>
      <el-menu-item index="/producers" @click="openRoute('/producers')">{{ t('nav.producers') }}</el-menu-item>
      <el-menu-item v-if="canOpen('/storages')" index="/storages" @click="openRoute('/storages')">{{ t('nav.storages') }}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu v-if="adminRoutes.some(canOpen)" index="admin">
      <template #title>
        <el-icon><Key /></el-icon>
        <span>{{ t('nav.admin') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/users')" index="/users" @click="openRoute('/users')">{{ t('nav.users') }}</el-menu-item>
      <el-menu-item v-if="canViewOrganizations" index="/organizations" @click="openRoute('/organizations')">
        {{ t('nav.organizations') }}
      </el-menu-item>
      <el-menu-item v-if="canOpen('/roles')" index="/roles" @click="openRoute('/roles')">{{ t('nav.roles') }}</el-menu-item>
      <el-menu-item v-if="canOpen('/permissions')" index="/permissions" @click="openRoute('/permissions')">{{ t('nav.permissions') }}</el-menu-item>
      <el-menu-item v-if="canOpen('/currencies')" index="/currencies" @click="openRoute('/currencies')">{{ t('nav.currencies') }}</el-menu-item>
      <el-menu-item v-if="canOpen('/service-settings')" index="/service-settings" @click="openRoute('/service-settings')">{{ t('nav.serviceSettings') }}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu v-if="pricingRoutes.some(canOpen)" index="pricing">
      <template #title>
        <el-icon><Money /></el-icon>
        <span>{{ t('nav.pricing') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/markups')" index="/markups" @click="openRoute('/markups')">{{ t('nav.markup') }}</el-menu-item>
      <el-menu-item
        v-if="canManagePriceAppliers"
        index="/price-appliers"
        @click="openRoute('/price-appliers')"
      >
        {{ t('nav.priceAppliers') }}
      </el-menu-item>
    </el-sub-menu>

    <el-sub-menu v-if="controlRoutes.some(canOpen)" index="control">
      <template #title>
        <el-icon><DataAnalysis /></el-icon>
        <span>{{ t('nav.control') }}</span>
      </template>

      <el-menu-item v-if="canOpen('/jobs')" index="/jobs" @click="openRoute('/jobs')">{{ t('nav.jobs') }}</el-menu-item>
      <el-menu-item v-if="canViewDocuments" index="/documents" @click="openRoute('/documents')">{{ t('nav.documents') }}</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const routePermissions: Record<string, string[]> = {
  '/purchases': ['PURCHASE_GET'],
  '/sales': ['SALES_GET'],
  '/reservations': ['ARTICLE_RESERVATIONS_GET_ME', 'ARTICLE_RESERVATIONS_GET_ALL'],
  '/transactions': ['BALANCES_TRANSACTION_GET_ME', 'BALANCES_TRANSACTION_GET_ALL'],
  '/products': ['ARTICLES_GET_MAIN', 'ARTICLES_GET_FULL'],
  '/storages': ['STORAGES_GET'],
  '/users': ['USERS_GET'],
  '/roles': ['ROLES_GET'],
  '/permissions': ['PERMISSIONS_GET'],
  '/currencies': ['CURRENCIES_GET'],
  '/service-settings': ['OPTIONS_GET'],
  '/markups': ['MARKUP_GET'],
  '/jobs': ['JOBS_GET'],
  '/organizations': ['ORGANIZATIONS_GET'],
  '/price-appliers': ['PRICE_APPLIERS_MANAGE'],
  '/documents': ['DOCUMENTS_ME', 'DOCUMENTS_ALL'],
}
function canOpen(path: string) { return hasPermission(...(routePermissions[path] ?? [])) }
const operationsRoutes = ['/purchases', '/sales', '/reservations', '/transactions']
const adminRoutes = ['/users', '/organizations', '/roles', '/permissions', '/currencies', '/service-settings']
const pricingRoutes = ['/markups', '/price-appliers']
const controlRoutes = ['/jobs', '/documents']

const routeRoots = [
  '/purchases',
  '/sales',
  '/reservations',
  '/transactions',
  '/products/enrichment',
  '/products',
  '/producers',
  '/storages',
  '/users',
  '/organizations',
  '/roles',
  '/permissions',
  '/currencies',
  '/markups',
  '/price-appliers',
  '/service-settings',
  '/jobs',
  '/documents',
]

const activeMenuIndex = computed(() => route.path === '/'
  ? '/'
  : routeRoots.find((path) => route.path.startsWith(path)) ?? route.path)

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
  background: #eef6f1;
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
  background: #eef6f1;
  color: #0f172a;
}

:deep(.el-menu-item.is-active) {
  background: var(--app-primary-soft);
  color: #047857;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
  padding-left: 44px !important;
  font-weight: 500;
}

:deep(.el-icon) {
  color: inherit;
}
</style>
