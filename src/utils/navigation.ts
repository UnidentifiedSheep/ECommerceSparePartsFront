import type { Component } from 'vue'
import { Box, Coin, Collection, DataAnalysis, Document, House, Key, Lock, Money, OfficeBuilding, Setting, ShoppingCart, Tickets, User } from '@element-plus/icons-vue'

export interface NavigationEntry { path: string; label: string; icon: Component; permissions: string[] }
export const navigationEntries: NavigationEntry[] = [
  { path: '/', label: 'nav.overview', icon: DataAnalysis, permissions: ['CHARTS_GET'] },
  { path: '/purchases', label: 'nav.purchases', icon: ShoppingCart, permissions: ['PURCHASE_GET'] },
  { path: '/sales', label: 'nav.sales', icon: Money, permissions: ['SALES_GET'] },
  { path: '/reservations', label: 'nav.reservations', icon: Tickets, permissions: ['ARTICLE_RESERVATIONS_GET_ME', 'ARTICLE_RESERVATIONS_GET_ALL'] },
  { path: '/transactions', label: 'nav.transactions', icon: Money, permissions: ['BALANCES_TRANSACTION_GET_ME', 'BALANCES_TRANSACTION_GET_ALL'] },
  { path: '/products', label: 'nav.products', icon: Box, permissions: ['ARTICLES_GET_MAIN', 'ARTICLES_GET_FULL'] },
  { path: '/products/enrichment', label: 'nav.catalogueReview', icon: Collection, permissions: ['CATALOGUE_CANDIDATES_REVIEW'] },
  { path: '/producers', label: 'nav.producers', icon: OfficeBuilding, permissions: [] },
  { path: '/storages', label: 'nav.storages', icon: House, permissions: ['STORAGES_GET'] },
  { path: '/users', label: 'nav.users', icon: User, permissions: ['USERS_GET'] },
  { path: '/organizations', label: 'nav.organizations', icon: OfficeBuilding, permissions: ['ORGANIZATIONS_GET'] },
  { path: '/roles', label: 'nav.roles', icon: Key, permissions: ['ROLES_GET'] },
  { path: '/permissions', label: 'nav.permissions', icon: Lock, permissions: ['PERMISSIONS_GET'] },
  { path: '/currencies', label: 'nav.currencies', icon: Coin, permissions: ['CURRENCIES_GET'] },
  { path: '/service-settings', label: 'nav.serviceSettings', icon: Setting, permissions: ['OPTIONS_GET'] },
  { path: '/markups', label: 'nav.markup', icon: Money, permissions: ['MARKUP_GET'] },
  { path: '/price-appliers', label: 'nav.priceAppliers', icon: Coin, permissions: ['PRICE_APPLIERS_MANAGE'] },
  { path: '/jobs', label: 'nav.jobs', icon: Tickets, permissions: ['JOBS_GET'] },
  { path: '/documents', label: 'nav.documents', icon: Document, permissions: ['DOCUMENTS_ME', 'DOCUMENTS_ALL'] },
  { path: '/settings', label: 'settings.title', icon: Setting, permissions: [] },
]
export function canAccessNavigation(entry: NavigationEntry, hasPermission: (...codes: string[]) => boolean) {
  return entry.permissions.length === 0 || hasPermission(...entry.permissions)
}
export function activeNavigationPath(path: string) {
  return navigationEntries.filter(entry => path === entry.path || (entry.path !== '/' && path.startsWith(`${entry.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path
}
