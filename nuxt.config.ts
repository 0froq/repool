// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@unocss/nuxt', '@vueuse/nuxt'],
  ssr: false,
  build: { transpile: ['@froq/ui'] },
  css: [
    '@froq/ui/tokens.css',
    '@fontsource-variable/geist/index.css',
    '@fontsource-variable/geist-mono/index.css',
    '@fontsource/instrument-serif/400.css',
    '@fontsource/instrument-serif/400-italic.css',
    // Scoped to `.ui`: bridges the library tokens to the repool skin in tokens.css.
    '~/assets/css/ui.css',
    '~/assets/css/tokens.css',
  ],
  app: {
    head: {
      title: 'repool',
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'description', content: 'Upstream contribution radar' }],
      script: [
        {
          innerHTML: `(()=>{let t=null;try{t=localStorage.getItem('kit-theme')}catch{}document.documentElement.dataset.theme=t==='light'||t==='dark'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')})()`,
        },
      ],
    },
  },
  runtimeConfig: {
    githubClientId: '',
    githubClientSecret: '',
    sessionSecret: '',
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: {
    strict: true,
  },
})
