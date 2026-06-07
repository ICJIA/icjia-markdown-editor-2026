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
 * NOTE: bump `softwareVersion` and `dateModified` below with each release,
 * mirroring the latest entry in CHANGELOG.md.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl as string

  const base = siteUrl ? siteUrl.replace(/\/$/, '') : ''
  const imageUrl = base ? `${base}/og-image.png` : '/og-image.png'
  const canonicalUrl = base ? `${base}/` : ''

  // Schema.org structured data describing the app to search engines and AI systems.
  // A single WebApplication node covers three signals at once: structured data,
  // authorship (author/publisher), and content freshness (datePublished/dateModified).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ICJIA Markdown Editor',
    description: 'Accessible markdown editor for ICJIA researchers',
    url: canonicalUrl || undefined,
    applicationCategory: 'Productivity',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript and a modern web browser',
    softwareVersion: '1.5.0',
    datePublished: '2026-01-28',
    dateModified: '2026-03-23',
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
      ...(canonicalUrl ? [{ property: 'og:url', content: canonicalUrl }] : []),
    ],
    link: [
      ...(canonicalUrl ? [{ rel: 'canonical', href: canonicalUrl }] : []),
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(jsonLd),
      },
    ],
  })
})
