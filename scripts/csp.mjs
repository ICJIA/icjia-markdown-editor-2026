/**
 * Writes the site's Content-Security-Policy into dist/_headers.
 *
 * Run after `nuxt generate` (it is chained in the `generate` script). The policy
 * cannot live in netlify.toml as a fixed string, because it names the inline
 * scripts Nuxt wrote into each page by their SHA-256 hash, and those are only
 * known once the pages exist.
 *
 * Why hashes: until 1.11.0 the policy said `script-src 'self' 'unsafe-inline'`,
 * because Nuxt writes three small scripts inline (an import map, the colour-mode
 * bootstrap and its runtime config). `'unsafe-inline'` lets *any* inline script
 * and any `onerror=`-style attribute run, which is precisely what a sanitizer
 * bypass would inject — so the policy meant to back the sanitizer up would not
 * have stopped the one attack it is there for. With hashes, exactly the scripts
 * the build produced may run; anything a document smuggles in is refused by the
 * browser, attributes included.
 *
 * The build fails if this cannot do its job. A site deployed with no policy at
 * all is worse than a build that stops.
 *
 * Each directive is chosen against one threat — an untrusted document rendered
 * with raw HTML enabled — not copied from a list:
 *
 *   default-src 'self'   nothing loads from anywhere else by default.
 *   script-src           this origin's files, plus the hashed inline scripts.
 *                        No 'unsafe-inline', no eval.
 *   worker-src 'self'    the markdown render worker, served from this origin.
 *   style-src            'unsafe-inline' is still required: Nuxt inlines the
 *                        critical CSS, and KaTeX positions every glyph with an
 *                        inline style attribute. Styles cannot run code; the
 *                        sanitizer strips the declarations that could mislead.
 *   img-src              data: covers the base64 images in the tutorial;
 *                        https: lets an author reference an image by URL.
 *   font-src 'self'      @nuxt/fonts self-hosts every face at build time.
 *   connect-src 'self'   the editor makes no network calls; this keeps it so.
 *   form-action 'none'   nothing here submits a form, so any form in a preview
 *                        came from the document.
 *   frame-src / object-src / base-uri 'none'
 *                        no framed content, no plugins, and no way for injected
 *                        markup to repoint relative URLs via <base>.
 *   frame-ancestors      clickjacking protection.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Script types a browser does not execute, and CSP therefore does not govern. */
const DATA_BLOCK = /^(?:application\/(?:ld\+)?json|text\/template|text\/plain)$/i

/**
 * Finds every inline script in a page that a browser would act on, and returns
 * the CSP hash source for each.
 *
 * Import maps count: they are not JavaScript, but `script-src` governs them, and
 * an unhashed one is ignored — which breaks every module on the page.
 *
 * @param {string} html - A complete HTML document
 * @returns {string[]} Sources of the form `'sha256-…'`, in document order
 */
export function inlineScriptHashes(html) {
  const hashes = []
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(attrs)) continue
    const type = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? ''
    if (DATA_BLOCK.test(type)) continue
    if (!body) continue
    hashes.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
  return hashes
}

/**
 * Builds the policy.
 *
 * @param {string[]} scriptHashes - Hash sources for the inline scripts to allow
 * @returns {string} The Content-Security-Policy header value
 */
export function buildCsp(scriptHashes) {
  return [
    `default-src 'self'`,
    `script-src ${[`'self'`, ...scriptHashes].join(' ')}`,
    `worker-src 'self'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self'`,
    `form-action 'none'`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'none'`,
  ].join('; ')
}

/** Every .html file under a directory. */
function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return htmlFiles(path)
    return name.endsWith('.html') ? [path] : []
  })
}

/**
 * Hashes the inline scripts of every page under `dist` and appends the policy
 * to `dist/_headers`, which Netlify applies alongside netlify.toml.
 *
 * One policy covers every path. The pages share their inline scripts, so the
 * union is a handful of hashes; a per-page policy would buy nothing.
 *
 * @param {string} dist - The generated site
 * @returns {{ policy: string, pages: number, hashes: number }}
 */
export function writeCspHeader(dist) {
  if (!existsSync(dist)) throw new Error(`${dist} does not exist. Run nuxt generate first.`)
  const pages = htmlFiles(dist)
  if (pages.length === 0) throw new Error(`No HTML files under ${dist}; nothing to protect.`)

  const hashes = [...new Set(pages.flatMap(page => inlineScriptHashes(readFileSync(page, 'utf8'))))].sort()
  const policy = buildCsp(hashes)

  const headersPath = join(dist, '_headers')
  const existing = existsSync(headersPath) ? readFileSync(headersPath, 'utf8') : ''
  if (/content-security-policy/i.test(existing)) {
    throw new Error(`${headersPath} already sets a Content-Security-Policy; refusing to add a second.`)
  }
  const block = `/*\n  Content-Security-Policy: ${policy}\n`
  writeFileSync(headersPath, `${existing.replace(/\n*$/, '\n')}${block}`)

  return { policy, pages: pages.length, hashes: hashes.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { pages, hashes, policy } = writeCspHeader(resolve(process.argv[2] ?? 'dist'))
    console.log(`[csp] ${hashes} inline script hash(es) from ${pages} page(s) written to dist/_headers`)
    console.log(`[csp] ${policy}`)
  } catch (error) {
    console.error(`[csp] ${error.message}`)
    process.exit(1)
  }
}
