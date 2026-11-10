/**
 * SEO Plugin
 * Injects the URL-dependent SEO tags that need the absolute site URL:
 *  - Absolute og:image / twitter:image (so social platforms can fetch the preview image)
 *  - og:url and the <link rel="canonical"> (kept consistent with each other)
 *  - WebApplication JSON-LD (Schema.org) for search engines and AI systems
 *
 * Set NUXT_PUBLIC_SITE_URL in your deployment environment (e.g. Netlify) for proper
 * social share previews and absolute canonical / structured-data URLs.
 *
 * `softwareVersion` is read from package.json, so it cannot drift from the
 * release (it had, twice). NOTE: `dateModified` still has to be bumped by hand
 * with each release, mirroring the latest entry in CHANGELOG.md.
 */
import { version } from '~~/package.json'

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl as string

  const base = siteUrl ? siteUrl.replace(/\/$/, '') : ''
  const imageUrl = base ? `${base}/og-image.png` : '/og-image.png'
  const siteRoot = base ? `${base}/` : ''
  // Each page is canonical for itself. This was the site root unconditionally,
  // which was correct only while the editor was the only page.
  // The trailing slash is normalized away (except on the root) so the
  // prerendered `/technical-details/` and a client-side navigation to
  // `/technical-details` name the same URL.
  const canonicalUrl = computed(() => {
    if (!base) return ''
    const path = route.path.length > 1 ? route.path.replace(/\/+$/, '') : '/'
    return `${base}${path}`
  })

  // Schema.org structured data describing the app to search engines and AI systems.
  // A single WebApplication node covers three signals at once: structured data,
  // authorship (author/publisher), and content freshness (datePublished/dateModified).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ICJIA Markdown Editor',
    description: 'Accessible markdown editor for ICJIA researchers',
    url: siteRoot || undefined,
    applicationCategory: 'Productivity',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript and a modern web browser',
    softwareVersion: version,
    datePublished: '2026-01-28',
    dateModified: '2026-11-10',
    inLanguage: 'en',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'Illinois Criminal Justice Information Authority',
      url: 'https://icjia.illinois.gov/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Illinois Criminal Justice Information Authority',
      url: 'https://icjia.illinois.gov/',
    },
    license: 'https://github.com/ICJIA/icjia-markdown-editor-2026/blob/main/LICENSE',
    sameAs: 'https://github.com/ICJIA/icjia-markdown-editor-2026',
  }

  useHead({
    meta: [
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:image', content: imageUrl },
      ...(base ? [{ property: 'og:url', content: canonicalUrl }] : []),
    ],
    link: [
      // `as const` keeps `rel` a literal: unhead types it as a union of known
      // link relations, and a widened `string` is not assignable to that.
      ...(base ? [{ rel: 'canonical' as const, href: canonicalUrl }] : []),
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(jsonLd),
      },
    ],
  })
})
