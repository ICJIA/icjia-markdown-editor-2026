// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/fonts',
  ],

  // Component auto-import configuration - disable path prefixes
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  // Nuxt UI configuration - using defaults
  
  // Color mode - default to dark
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },
  
  // Google Fonts via @nuxt/fonts
  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600] },
    ],
  },
  
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'ICJIA Markdown Editor',
      meta: [
        { name: 'description', content: 'Accessible markdown editor for ICJIA researchers' },
        { name: 'theme-color', content: '#0f172a' },
      ],
    },
  },
  
  css: ['~/assets/css/main.css'],
  
  // Static generation for Netlify
  nitro: {
    preset: 'netlify-static',
  },
  
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Ensure proper SSG behavior
  ssr: true,
  
  // Route rules for static generation
  routeRules: {
    '/': { prerender: true },
  },
})
