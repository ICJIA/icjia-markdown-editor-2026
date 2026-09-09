// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/fonts',
    '@nuxt/eslint',
  ],

  // Nuxt Icon defaults to a *server* bundle, which a static deployment has no
  // server to serve: any icon it does not inline fails to load in production
  // (the "Start Editing" button's pencil was doing exactly that). Scanning the
  // source and bundling the icons it finds into the client makes every icon
  // available offline, with no runtime request to the Iconify API — which the
  // Content-Security-Policy's `connect-src 'self'` would block anyway.
  icon: {
    clientBundle: {
      scan: true,
    },
  },

  // @nuxt/eslint generates eslint.config.mjs from the project's real shape —
  // auto-imported composables, generated .nuxt types, Vue SFC parsing — so the
  // linter agrees with what Nuxt actually compiles.
  eslint: {
    config: {
      stylistic: false,
    },
  },

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

  // Client source maps ship with the build. The source is already public —
  // this is an MIT-licensed project that links its own repository from the
  // status bar — so there is nothing here to disclose, and without maps a stack
  // trace from a researcher's browser points at minified names and is useless
  // for support. Lighthouse reports their absence under `valid-source-maps`.
  //
  // Server maps are off: `netlify-static` prerenders and deploys no server, so
  // they would be build output nobody can fetch.
  sourcemap: {
    client: true,
    server: false,
  },

  vite: {
    css: {
      devSourcemap: true,
    },
  },

  // Ensure proper SSG behavior
  ssr: true,
  
  // Route rules for static generation
  routeRules: {
    '/': { prerender: true },
  },
})
