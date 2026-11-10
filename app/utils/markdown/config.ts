/**
 * @fileoverview markdown-it Configuration
 * @description Configures the markdown parser with plugins and custom renderers.
 * Raw HTML is enabled for embedding tables and other HTML elements.
 * External links have rel="noopener" for security.
 * 
 * @module utils/markdown/config
 * @requires markdown-it
 * @requires markdown-it-footnote
 * @requires markdown-it-anchor
 * @requires highlight.js
 * @requires @traptitech/markdown-it-katex
 * 
 * Features:
 * - Syntax highlighting for the 18 registered languages via highlight.js (core build)
 * - Footnote support via markdown-it-footnote
 * - Heading anchors for navigation
 * - External link security (rel="noopener noreferrer")
 * - Lazy loading for images
 * - Math/LaTeX rendering via KaTeX
 */

import DOMPurify from 'dompurify'
import { createMarkdownIt, getMarkdownIt } from '~/utils/markdown/parser'

// The parser moved to its own module so the render worker can import it without
// the sanitizer. Re-exported so existing imports keep working.
export { createMarkdownIt, getMarkdownIt }

/**
 * DOMPurify configuration that allows markdown-rendered HTML attributes and elements.
 * This preserves syntax highlighting classes, scroll sync data attributes,
 * KaTeX math rendering, and ARIA accessibility attributes.
 *
 * `FORBID_TAGS` narrows DOMPurify's default allowlist, which is broader than a
 * markdown preview needs. Each entry closes a way for a *document* — which may
 * have been pasted or opened from an untrusted source — to act on the
 * surrounding application rather than merely describe itself:
 *   - `style`   a document-supplied stylesheet is not scoped to the preview, so
 *               it restyles the whole editor UI (verified: it can repaint
 *               `<body>`). Note this does NOT reproduce under jsdom, which has
 *               no CSSOM for DOMPurify to sanitize, so only a browser catches it.
 *   - `form`    a form with an external `action` renders a working, on-brand
 *               submission target inside the editor.
 *   - `button` / `select` / `textarea` / `option` / `fieldset` / `legend`
 *               never produced by markdown; allowing them only supplies parts
 *               for a convincing fake UI.
 *   - `dialog`, and the `popover` attribute with its invokers
 *               (`popovertarget`, `command`, `commandfor`)
 *               the ways HTML can ask for the browser's top layer, which sits
 *               above everything and is not clipped by `contain: paint`. The
 *               invokers only work on a `<button>`, which is already forbidden,
 *               so nothing here can open today; they are removed so that stays
 *               true whatever a future browser lets them attach to.
 *   - `audio` / `video` / `source` / `track`
 *               markdown has no syntax for media, the deployed
 *               Content-Security-Policy already refuses to load it, and in an
 *               exported file — which has no policy from a server — each one is
 *               a request to a host of the document's choosing the moment the
 *               file is opened.
 *
 * `input` is deliberately NOT forbidden: markdown-it-task-lists renders real
 * `<input type="checkbox">` elements. The `uponSanitizeElement` hook below drops
 * every other input type instead, so task lists keep working while text fields
 * cannot be rendered.
 */
const PURIFY_CONFIG = {
  ADD_ATTR: [
    'data-source-line', 'target', 'rel',
    'role', 'aria-label', 'aria-hidden', 'tabindex', 'aria-multiline',
    'loading',
  ],
  ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'mtext', 'annotation', 'semantics'],
  FORBID_TAGS: [
    'style', 'form', 'button', 'select', 'textarea', 'option', 'fieldset', 'legend',
    'dialog', 'audio', 'video', 'source', 'track',
  ],
  FORBID_ATTR: ['popover', 'popovertarget', 'popovertargetaction', 'command', 'commandfor'],
  RETURN_TRUSTED_TYPE: false,
}

/**
 * The only `position` values a document may ask for.
 *
 * This is an allowlist because the value does not have to be spelled out for a
 * browser to honour it. `position: var(--p)` with `--p: fixed` declared beside
 * it, or `position: var(--undefined, fixed)`, both compute to `fixed` while
 * containing nothing a search for the word would find at the right place — and
 * both passed the pattern this replaces (red/blue exercise, November 2026).
 * Naming what is allowed leaves no value to be clever with. KaTeX needs
 * `relative`; `absolute` stays inside the preview, which is a containing block.
 */
const ALLOWED_POSITIONS = new Set(['static', 'relative', 'absolute'])

/**
 * Functions that make a browser fetch something. In a `style` attribute that is
 * a request to a host the document chose, sent the moment the preview renders —
 * a read receipt carrying the reader's IP address. Nothing the renderer emits
 * uses one.
 */
const FETCHING_CSS = /(?:url|image-set|image|cross-fade|element)\s*\(/i

/**
 * Removes from one `style` attribute value the declarations that let an element
 * escape the preview pane, cover the application, or call out to the network.
 *
 * The whole `style` attribute cannot simply be forbidden: KaTeX positions every
 * glyph with inline `height` / `top` / `vertical-align` / `position:relative`,
 * and markdown tables carry `text-align` for column alignment. So the value is
 * read the way a browser reads it — one declaration at a time — and only three
 * things are dropped: a `position` outside {@link ALLOWED_POSITIONS}, any
 * `z-index`, and any declaration that fetches.
 *
 * Three ways of hiding a declaration from that reading are closed first:
 *
 *   - Comments. CSS permits one between any two tokens, so `position:/**\/fixed`
 *     is a fixed element to a browser. They are removed before anything else.
 *   - Escapes. `pos\69tion:fixed` and `position:\66ixed` are both ordinary CSS
 *     for `position:fixed`, and every pattern written against the readable
 *     spelling misses them. No renderer here emits a backslash in a style, so a
 *     value containing one is rejected whole rather than decoded: decoding would
 *     mean reimplementing the browser's tokenizer and trusting the copy.
 *   - `!important`, case and whitespace, which are normalized before comparing.
 *
 * Splitting on every `;` is stricter than a browser, which ignores one inside a
 * string or parentheses. That can only produce more pieces than the browser
 * sees, never fewer, so a declaration the browser honours always begins at a
 * boundary this function also examines.
 *
 * @param {string} style - Raw `style` attribute value
 * @returns {string} The value with unsafe declarations removed; empty if nothing is left
 */
export function sanitizeStyleAttribute(style: string): string {
  if (style.includes('\\')) return ''

  return style
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .filter((declaration) => {
      const colon = declaration.indexOf(':')
      if (colon === -1) return declaration.trim() !== ''

      const property = declaration.slice(0, colon).trim().toLowerCase()
      const value = declaration.slice(colon + 1).trim().toLowerCase()

      if (property === 'z-index') return false
      if (property === 'position') {
        return ALLOWED_POSITIONS.has(value.replace(/\s*!\s*important$/, '').trim())
      }
      return !FETCHING_CSS.test(value)
    })
    .join(';')
    .trim()
}

/** Hooks are global to the DOMPurify instance, so register them exactly once. */
let hooksRegistered = false

function registerHooks(): void {
  if (hooksRegistered) return
  hooksRegistered = true

  // Task-list checkboxes are legitimate; every other input type is not.
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'input') return
    const type = (node as Element).getAttribute?.('type')?.toLowerCase()
    if (type !== 'checkbox') {
      (node as Element).remove?.()
    }
  })

  // Drop only the declarations that would let content overlay the application
  // or call out to the network.
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style' || !data.attrValue) return
    const cleaned = sanitizeStyleAttribute(data.attrValue)
    if (cleaned) {
      data.attrValue = cleaned
    } else {
      data.keepAttr = false
    }
  })

  // markdown-authored links get rel from the link_open renderer, but a raw-HTML
  // link arrives without one. Guarantee it after sanitization — for every
  // `target`, not only `_blank`. Browsers imply `noopener` for `_blank` alone: a
  // link to a *named* window (`target="report"`) hands the page it opens a live
  // `window.opener`, which that page can use to navigate this tab somewhere
  // else while the author is reading the new one. `<area>` and SVG `<a>` take
  // `target` too, so the check is on the attribute rather than the tag name.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.hasAttribute?.('target')) {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

/**
 * Sanitizes HTML produced by the markdown parser.
 *
 * This is the only route by which parser output becomes displayable, whether
 * the parsing happened here or in the render worker. It needs a document, so on
 * the server it returns an empty string rather than passing anything through:
 * unsanitized HTML must never be able to reach prerendered output.
 *
 * @param {string} rawHtml - Output of `getMarkdownIt().render()`
 * @returns {string} HTML safe to hand to `v-html`; empty on the server
 */
export function sanitizeHtml(rawHtml: string): string {
  if (typeof window === 'undefined') return ''
  registerHooks()
  return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG)
}

/**
 * Renders markdown content to HTML using the configured parser.
 * Output is sanitized with DOMPurify to prevent XSS attacks from embedded HTML.
 *
 * Synchronous, on the calling thread. The live preview does not use this — it
 * parses in a worker (see `useMarkdown`) — but exports, the table builder and
 * the Technical Details demos do, where the input is small or the action is one
 * the author asked for.
 *
 * @param {string} content - The markdown content to render
 * @returns {string} The sanitized rendered HTML string
 *
 * @example
 * ```typescript
 * const html = renderMarkdown('# Hello World')
 * // Returns: '<h1>Hello World</h1>'
 * ```
 */
export function renderMarkdown(content: string): string {
  return sanitizeHtml(getMarkdownIt().render(content))
}
