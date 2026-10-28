import type { Plugin } from 'postcss'

// Scale typography through the root font size, including vendor CSS, without zooming layout.
export function fontScalePlugin(): Plugin {
  return {
    postcssPlugin: 'app-relative-font-sizes',
    Declaration(declaration) {
      if (declaration.prop !== 'font-size' && !/^--[\w-]*font-size[\w-]*$/.test(declaration.prop)) return
      declaration.value = declaration.value.replace(/(?<![\w.-])(\d*\.?\d+)px\b/g, (_, size: string) => `${Number(size) / 16}rem`)
    },
  }
}
