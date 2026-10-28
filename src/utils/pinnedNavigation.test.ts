import { describe, expect, it } from 'vitest'
import { parsePinnedNavigation, defaultPinnedNavigation } from './pinnedNavigation'
import { activeNavigationPath, canAccessNavigation, navigationEntries } from './navigation'

describe('pinned navigation preferences', () => {
  it('rejects arbitrary destinations, duplicates and unsupported colors in saved settings', () => {
    const saved = parsePinnedNavigation(JSON.stringify({ enabled: false, showLabels: false, barColor: 'rose', pins: [
      { path: 'https://example.com', color: 'red' }, null, { path: '/products', label: '  Parts  ', color: 'sapphire' },
      { path: '/products', label: 'Duplicate' }, { path: '/roles', label: 'x'.repeat(1000), color: 'url(evil)' },
    ] }))
    expect(saved.enabled).toBe(false)
    expect(saved.showLabels).toBe(false)
    expect(saved.barColor).toBe('rose')
    expect(saved.pins).toEqual([{ path: '/products', label: '  Parts  ', color: 'sapphire' }, { path: '/roles', label: 'x'.repeat(32), color: 'theme' }])
    for (const raw of [null, 'bad json', 'null']) expect(parsePinnedNavigation(raw)).toEqual(defaultPinnedNavigation())
  })
  it('uses the most specific destination for highlighting and honors alternative read permissions', () => {
    expect(activeNavigationPath('/products/enrichment/42')).toBe('/products/enrichment')
    expect(activeNavigationPath('/products/42')).toBe('/products')
    expect(activeNavigationPath('/products-other')).toBeUndefined()
    const products = navigationEntries.find(entry => entry.path === '/products')!
    expect(canAccessNavigation(products, (...codes) => codes.includes('ARTICLES_GET_FULL'))).toBe(true)
    expect(canAccessNavigation(products, () => false)).toBe(false)
    expect(canAccessNavigation(navigationEntries.find(entry => entry.path === '/settings')!, () => false)).toBe(true)
  })
})
