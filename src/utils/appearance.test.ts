import { describe, expect, it } from 'vitest'
import { parseAppearance } from './appearance'

describe('appearance preferences', () => {
  it('accepts supported settings and ignores invalid stored values', () => {
    expect(parseAppearance('{"fontScale":125,"accent":"amethyst"}')).toEqual({ fontScale: 125, accent: 'amethyst' })
    for (const raw of [null, 'bad json', 'null', '{"fontScale":10000,"accent":"red;display:none"}']) {
      expect(parseAppearance(raw)).toEqual({ fontScale: 100, accent: 'emerald' })
    }
  })
})
