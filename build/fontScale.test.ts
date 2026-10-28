import { describe, expect, it } from 'vitest'
import postcss from 'postcss'
import { fontScalePlugin } from './fontScale'

describe('relative typography', () => {
  it('scales fixed and vendor typography while preserving layout dimensions and percentage root size', async () => {
    const input = 'html{font-size:calc(100% * var(--app-font-scale,1))} :root{--el-font-size-base:14px} .row{font-size:12px;padding:12px;height:40px} .title{font-size:clamp(20px,2vw,32px)}'
    const first = await postcss([fontScalePlugin()]).process(input, { from: undefined })
    expect(first.css).toContain('--el-font-size-base:0.875rem')
    expect(first.css).toContain('font-size:0.75rem;padding:12px;height:40px')
    expect(first.css).toContain('clamp(1.25rem,2vw,2rem)')
    expect(first.css).toContain('font-size:calc(100% * var(--app-font-scale,1))')
    const second = await postcss([fontScalePlugin()]).process(first.css, { from: undefined })
    expect(second.css).toBe(first.css)
  })
})
