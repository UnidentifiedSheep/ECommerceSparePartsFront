import { navigationEntries } from './navigation'

export const pinColors = ['theme', 'emerald', 'sapphire', 'amethyst', 'amber', 'rose', 'teal'] as const
export type PinColor = typeof pinColors[number]
export interface NavigationPin { path: string; label: string; color: PinColor }
export interface PinnedNavigationPreferences { enabled: boolean; showLabels: boolean; barColor: PinColor; pins: NavigationPin[] }
export function defaultPinnedNavigation(): PinnedNavigationPreferences {
  return { enabled: true, showLabels: true, barColor: 'theme', pins: [] }
}
function isColor(value: unknown): value is PinColor { return pinColors.some(color => color === value) }
export function parsePinnedNavigation(raw: string | null): PinnedNavigationPreferences {
  try {
    const value: unknown = JSON.parse(raw ?? 'null')
    if (!value || typeof value !== 'object') return defaultPinnedNavigation()
    const saved = value as Partial<PinnedNavigationPreferences>
    const paths = new Set<string>()
    const pins: NavigationPin[] = []
    if (Array.isArray(saved.pins)) for (const item of saved.pins) {
      if (!item || typeof item !== 'object' || !navigationEntries.some(entry => entry.path === item.path) || paths.has(item.path)) continue
      paths.add(item.path)
      pins.push({ path: item.path, label: typeof item.label === 'string' ? item.label.slice(0, 32) : '', color: isColor(item.color) ? item.color : 'theme' })
    }
    return { enabled: typeof saved.enabled === 'boolean' ? saved.enabled : true, showLabels: typeof saved.showLabels === 'boolean' ? saved.showLabels : true, barColor: isColor(saved.barColor) ? saved.barColor : 'theme', pins }
  } catch { return defaultPinnedNavigation() }
}
export function pinStyle(color: PinColor) {
  const colors = {
    theme: ['var(--app-primary)', 'var(--app-primary-soft)'],
    emerald: ['#047857', '#ecfdf5'], sapphire: ['#1d4ed8', '#eff6ff'],
    amethyst: ['#7e22ce', '#faf5ff'], amber: ['#92400e', '#fffbeb'],
    rose: ['#be123c', '#fff1f2'], teal: ['#0e7490', '#ecfeff'],
  } satisfies Record<PinColor, [string, string]>
  return { '--pin-color': colors[color][0], '--pin-bg': colors[color][1] }
}
