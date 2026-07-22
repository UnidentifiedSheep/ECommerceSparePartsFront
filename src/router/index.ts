import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '@/views/AuthView.vue'
import AnalyticsView from '@/views/AnalyticsView.vue'
import CurrenciesView from '@/views/CurrenciesView.vue'
import JobsView from '@/views/JobsView.vue'
import MarkupsView from '@/views/MarkupsView.vue'
import PriceAppliersView from '@/views/PriceAppliersView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import PasswordRecoveryView from '@/views/PasswordRecoveryView.vue'
import PasswordResetView from '@/views/PasswordResetView.vue'
import PermissionsView from '@/views/PermissionsView.vue'
import ProductDetailsView from '@/views/ProductDetailsView.vue'
import ProductsView from '@/views/ProductsView.vue'
import ProducersView from '@/views/ProducersView.vue'
import PurchasesView from '@/views/PurchasesView.vue'
import ReservationsView from '@/views/ReservationsView.vue'
import RolesView from '@/views/RolesView.vue'
import SalesView from '@/views/SalesView.vue'
import ServiceSettingsView from '@/views/ServiceSettingsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import StoragesView from '@/views/StoragesView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import UsersView from '@/views/UsersView.vue'
import OrganizationsView from '@/views/OrganizationsView.vue'
import { useAuthStore } from '@/stores/authStore.ts'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ClearLayout from '@/layouts/ClearLayout.vue'

const routes = [
  {
    path: '/',
    redirect: '/storages',
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '/storages',
        name: 'storages',
        component: StoragesView,
        meta: { requiresAuth: true },
      },
      {
        path: '/users',
        name: 'users',
        component: UsersView,
        meta: { requiresAuth: true },
      },
      {
        path: '/organizations',
        name: 'organizations',
        component: OrganizationsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/purchases',
        name: 'purchases',
        component: PurchasesView,
        meta: { requiresAuth: true },
      },
      {
        path: '/sales',
        name: 'sales',
        component: SalesView,
        meta: { requiresAuth: true },
      },
      {
        path: '/reservations',
        name: 'reservations',
        component: ReservationsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/currencies',
        name: 'currencies',
        component: CurrenciesView,
        meta: { requiresAuth: true },
      },
      {
        path: '/markups',
        name: 'markups',
        component: MarkupsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/price-appliers',
        name: 'price-appliers',
        component: PriceAppliersView,
        meta: { requiresAuth: true },
      },
      {
        path: '/permissions',
        name: 'permissions',
        component: PermissionsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/roles',
        name: 'roles',
        component: RolesView,
        meta: { requiresAuth: true },
      },
      {
        path: '/producers',
        name: 'producers',
        component: ProducersView,
        meta: { requiresAuth: true },
      },
      {
        path: '/products',
        name: 'products',
        component: ProductsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/products/:id',
        name: 'product-details',
        component: ProductDetailsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/analytics',
        name: 'analytics',
        component: AnalyticsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/jobs',
        name: 'jobs',
        component: JobsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/service-settings',
        name: 'service-settings',
        component: ServiceSettingsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/transactions',
        name: 'transactions',
        component: TransactionsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/settings',
        name: 'settings',
        component: SettingsView,
        meta: { requiresAuth: true },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFoundView,
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/auth',
    component: ClearLayout,
    children: [
      {
        path: '',
        name: 'auth',
        component: AuthView,
      },
      {
        path: '/recovery',
        name: 'password-recovery',
        component: PasswordRecoveryView,
      },
      {
        path: '/reset',
        name: 'password-reset',
        component: PasswordResetView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth')
  } else if (to.path === '/auth' && authStore.isAuthenticated) {
    next('/storages')
  } else {
    next()
  }
})

export default router
