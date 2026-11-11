import {
  defineConfig,
  presetAttributify,
  presetTagify,
  presetTypography,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify({
      strict: true,
      prefixedOnly: true,
      prefix: 'un-',
    }),
    presetTagify({
      prefix: 'un-',
    }),
    presetTypography(),
  ],
  // Keys named like a token (meta, text, display) would emit a self-referencing var and void it.
  theme: {
    font: {
      sans: 'var(--font-text)',
      mono: 'var(--font-meta)',
    },
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
  layers: {
    default: 0,
    components: 1,
    utilities: 2,
  },
})
