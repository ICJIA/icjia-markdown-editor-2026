// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  
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
  
  runtimeConfig: {
    public: {
      // Set NUXT_PUBLIC_SITE_URL in deployment (e.g. Netlify) for absolute og:image URLs
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://markdown.icjia.cloud',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'ICJIA Markdown Editor',
      meta: [
        { name: 'description', content: 'Accessible markdown editor for ICJIA researchers' },
        { name: 'author', content: 'Illinois Criminal Justice Information Authority' },
        { name: 'theme-color', content: '#0f172a' },
        // Open Graph (og:image set via plugins/seo.ts with absolute URL when NUXT_PUBLIC_SITE_URL is set)
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'ICJIA Markdown Editor 2.0' },
        { property: 'og:description', content: 'Accessible markdown editor for ICJIA researchers' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'ICJIA Markdown Editor 2.0' },
        { name: 'twitter:description', content: 'Accessible markdown editor for ICJIA researchers' },
      ],
    },
  },
  
  css: [
    '~/assets/css/main.css',
    'katex/dist/katex.min.css',
  ],
  
  // Static generation for Netlify
  nitro: {
    preset: 'netlify-static',
  },
  
  typescript: {
    strict: true,
    typeCheck: 'build',  // Only run vue-tsc during build, not dev (avoids auto-import issues)
  },

  // Vite configuration - suppress Tailwind sourcemap warnings
  vite: {
    css: {
      devSourcemap: true,
    },
    build: {
      sourcemap: false,
    },
  },

  // Ensure proper SSG behavior
  ssr: true,
  
  // Route rules for static generation
  routeRules: {
    '/': { prerender: true },
  },
})
