/**
 * SEO Plugin
 * Injects absolute URLs for og:image and twitter:image when siteUrl is configured.
 * Required for social platforms to fetch the image when the page is shared.
 * Set NUXT_PUBLIC_SITE_URL in your deployment environment (e.g. Netlify) for proper social share previews.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl as string

  const imageUrl = siteUrl ? `${siteUrl.replace(/\/$/, '')}/og-image.png` : '/og-image.png'

  useHead({
    meta: [
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:image', content: imageUrl },
      ...(siteUrl ? [{ property: 'og:url', content: siteUrl }] : []),
    ],
  })
})
