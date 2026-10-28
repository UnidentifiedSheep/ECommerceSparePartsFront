export const fontScales = [90, 100, 110, 120, 125] as const
export const accents = ['emerald', 'sapphire', 'amethyst'] as const
export type Accent = typeof accents[number]
export interface Appearance { fontScale: number; accent: Accent }
export const defaultAppearance: Appearance = { fontScale: 100, accent: 'emerald' }
export function parseAppearance(raw: string | null): Appearance {
  try {
    const value: unknown = JSON.parse(raw ?? 'null')
    if (!value || typeof value !== 'object') return { ...defaultAppearance }
    const saved = value as Partial<Appearance>
    return {
      fontScale: fontScales.some(scale => scale === saved.fontScale) ? saved.fontScale! : 100,
      accent: accents.some(accent => accent === saved.accent) ? saved.accent! : 'emerald',
    }
  } catch { return { ...defaultAppearance } }
}
