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
 * - Syntax highlighting for 190+ languages via highlight.js
 * - Footnote support via markdown-it-footnote
 * - Heading anchors for navigation
 * - External link security (rel="noopener noreferrer")
 * - Lazy loading for images
 * - Math/LaTeX rendering via KaTeX
 */

import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
// @ts-expect-error - no type declarations available
import footnote from 'markdown-it-footnote'
import anchor from 'markdown-it-anchor'
// @ts-expect-error - no type declarations available
import taskLists from 'markdown-it-task-lists'
// @ts-expect-error - no type declarations available
import strikethrough from 'markdown-it-strikethrough-alt'
// @ts-expect-error - no type declarations available
import mark from 'markdown-it-mark'
// @ts-expect-error - no type declarations available
import ins from 'markdown-it-ins'
import katex from '@traptitech/markdown-it-katex'
// Core-only highlight.js: the full build ships ~190 languages (~1.7 MB of the
// main chunk). Register just the languages ICJIA researchers use; unregistered
// languages fall back to escaped plain text in the fence renderer below.
import hljs from 'highlight.js/lib/core'
import langJavascript from 'highlight.js/lib/languages/javascript'
import langTypescript from 'highlight.js/lib/languages/typescript'
import langPython from 'highlight.js/lib/languages/python'
import langR from 'highlight.js/lib/languages/r'
import langStata from 'highlight.js/lib/languages/stata'
import langSas from 'highlight.js/lib/languages/sas'
import langSql from 'highlight.js/lib/languages/sql'
import langBash from 'highlight.js/lib/languages/bash'
import langJson from 'highlight.js/lib/languages/json'
import langYaml from 'highlight.js/lib/languages/yaml'
import langXml from 'highlight.js/lib/languages/xml'
import langCss from 'highlight.js/lib/languages/css'
import langMarkdown from 'highlight.js/lib/languages/markdown'
import langJava from 'highlight.js/lib/languages/java'
import langC from 'highlight.js/lib/languages/c'
import langCpp from 'highlight.js/lib/languages/cpp'
import langCsharp from 'highlight.js/lib/languages/csharp'
import langDiff from 'highlight.js/lib/languages/diff'

hljs.registerLanguage('javascript', langJavascript) // aliases: js, jsx, mjs, cjs
hljs.registerLanguage('typescript', langTypescript) // aliases: ts, tsx
hljs.registerLanguage('python', langPython) // aliases: py
hljs.registerLanguage('r', langR)
hljs.registerLanguage('stata', langStata)
hljs.registerLanguage('sas', langSas)
hljs.registerLanguage('sql', langSql)
hljs.registerLanguage('bash', langBash) // aliases: sh
hljs.registerLanguage('json', langJson)
hljs.registerLanguage('yaml', langYaml) // aliases: yml
hljs.registerLanguage('xml', langXml) // aliases: html, xhtml, svg
hljs.registerLanguage('css', langCss)
hljs.registerLanguage('markdown', langMarkdown) // aliases: md
hljs.registerLanguage('java', langJava)
hljs.registerLanguage('c', langC)
hljs.registerLanguage('cpp', langCpp) // aliases: c++, h++
hljs.registerLanguage('csharp', langCsharp) // aliases: cs
hljs.registerLanguage('diff', langDiff)

/**
 * Creates and configures a markdown-it instance with all plugins and custom renderers.
 * 
 * Configuration:
 * - Raw HTML enabled for embedding tables and custom elements
 * - XHTML-compliant output
 * - Automatic line breaks
 * - URL auto-linking
 * - Typographic replacements (smart quotes, dashes)
 * - Syntax highlighting for code blocks
 * 
 * @returns {MarkdownIt} Configured markdown-it instance
 */
export function createMarkdownIt(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,           // Enable raw HTML for embedding tables, etc.
    xhtmlOut: true,       // Use XHTML-compliant output
    breaks: true,         // Convert \n to <br>
    linkify: true,        // Auto-convert URLs to links
    typographer: true,    // Enable smartquotes, dashes
    // Note: syntax highlighting is handled by the custom fence renderer below,
    // which adds data-source-line for scroll sync and ARIA attributes for a11y.
  })
  
  // Add footnote support
  md.use(footnote)
  
  // Add strikethrough support (~~text~~)
  md.use(strikethrough)
  
  // Add highlight/mark support (==text==)
  md.use(mark)

  // Add inserted-text support (++text++)
  md.use(ins)
  
  // Add KaTeX math support ($inline$ and $$block$$)
  md.use(katex, {
    throwOnError: false,
    errorColor: '#cc0000',
  })
  
  // Add task list support (checkboxes: - [ ] and - [x])
  md.use(taskLists, {
    enabled: true,
    label: true,
    labelAfter: true,
  })
  
  // Add heading anchors for navigation
  md.use(anchor, {
    permalink: anchor.permalink.headerLink({
      safariReaderFix: true,
    }),
    permalinkClass: 'header-anchor',
    permalinkSymbol: '#',
    permalinkAttrs: () => ({ 'aria-hidden': 'true', 'tabindex': '-1' }),
    level: [1, 2, 3, 4, 5, 6],
  })
  
  // Custom renderer: add rel="noopener noreferrer" to external links
  const defaultLinkRender = md.renderer.rules.link_open || function(tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }
  
  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx]
    if (token) {
      const href = token.attrGet('href')
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        token.attrPush(['rel', 'noopener noreferrer'])
        token.attrPush(['target', '_blank'])
      }
    }
    return defaultLinkRender(tokens, idx, options, env, self)
  }
  
  // Custom renderer: add loading="lazy" to images
  const defaultImageRender = md.renderer.rules.image || function(tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }
  
  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    const token = tokens[idx]
    if (token) {
      token.attrPush(['loading', 'lazy'])
    }
    return defaultImageRender(tokens, idx, options, env, self)
  }

  // Source line attributes for scroll sync: add data-source-line to block elements
  const blockRules = [
    'paragraph_open',
    'heading_open',
    'blockquote_open',
    'bullet_list_open',
    'ordered_list_open',
    'list_item_open',
    'table_open',
    'thead_open',
    'tbody_open',
    'tr_open',
    'th_open',
    'td_open',
    'hr',
  ] as const

  blockRules.forEach((ruleName) => {
    const defaultRule = md.renderer.rules[ruleName] || function(tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options)
    }
    md.renderer.rules[ruleName] = function(tokens, idx, options, env, self) {
      const token = tokens[idx]
      if (token?.map) {
        token.attrPush(['data-source-line', String(token.map[0])])
      }
      return defaultRule(tokens, idx, options, env, self)
    }
  })

  // Fence (code blocks): highlight returns full HTML, so we wrap with data-source-line
  // Also add role="figure" and aria-label for accessibility (WCAG 2.1 preformatted text compliance)
  // The default fence renderer is replaced outright rather than delegated to,
  // so its arguments beyond the token list are unused.
  md.renderer.rules.fence = function(tokens, idx, _options, _env, _self) {
    const token = tokens[idx]
    const lang = token?.info?.trim() ?? ''
    const code = token?.content ?? ''
    let highlighted: string
    if (lang && hljs.getLanguage(lang)) {
      try {
        highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
      } catch {
        highlighted = md.utils.escapeHtml(code)
      }
    } else {
      highlighted = md.utils.escapeHtml(code)
    }
    const lineAttr = token?.map ? ` data-source-line="${token.map[0]}"` : ''
    // Sanitize lang to prevent attribute injection (user controls fenced code block language)
    const safeLang = lang.replace(/[^a-zA-Z0-9_-]/g, '')
    const langLabel = safeLang ? `${safeLang} ` : ''
    const ariaLabel = `${langLabel}code block`
    return `<pre class="hljs language-${safeLang}"${lineAttr} role="figure" aria-label="${ariaLabel}"><code>${highlighted}</code></pre>`
  }
  
  return md
}

/**
 * Singleton markdown-it instance for the application.
 * @type {MarkdownIt | null}
 */
let mdInstance: MarkdownIt | null = null

/**
 * Gets or creates the singleton markdown-it instance.
 * Creates the instance on first call, returns cached instance thereafter.
 * 
 * @returns {MarkdownIt} The shared markdown-it instance
 */
export function getMarkdownIt(): MarkdownIt {
  if (!mdInstance) {
    mdInstance = createMarkdownIt()
  }
  return mdInstance
}

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
  FORBID_TAGS: ['style', 'form', 'button', 'select', 'textarea', 'option', 'fieldset', 'legend'],
  RETURN_TRUSTED_TYPE: false,
}

/**
 * CSS declarations that let an element escape the preview pane and cover the
 * application. Stripped from `style` attributes on the way through.
 *
 * The whole `style` attribute cannot simply be forbidden: KaTeX positions every
 * glyph with inline `height` / `top` / `vertical-align` / `position:relative`,
 * and markdown tables carry `text-align` for column alignment. So this removes
 * the two declarations that matter — `position:fixed` (or `sticky`), which
 * escapes any containing block, and `z-index`, which lifts the result above the
 * UI — and leaves every other declaration untouched.
 *
 * Each alternative runs to the next `;` rather than ending at the value. An
 * earlier version anchored the `position` branch immediately after
 * `fixed`/`sticky`, so `position:fixed !important` — ordinary CSS a browser
 * honours — did not match and passed through intact. (`z-index` was unaffected
 * only because its `[^;]*` already swallowed the `!important`.) Matching the
 * whole declaration removes that whole class of near-miss.
 */
const ESCAPING_CSS = /(?:^|;)\s*(?:position\s*:\s*(?:fixed|sticky)\b[^;]*|z-index\s*:[^;]*)/gi

/**
 * Removes the escaping declarations from one `style` attribute value.
 *
 * Comments are stripped first. CSS permits a comment between any two tokens, so
 * `position:/**\/fixed` is a fixed element to a browser while being invisible to
 * a pattern that expects the value to follow the colon. Removing comments before
 * matching closes every place one could hide rather than guessing at positions.
 *
 * @param {string} style - Raw `style` attribute value
 * @returns {string} The value with escaping declarations removed
 */
function stripEscapingCss(style: string): string {
  return style
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(ESCAPING_CSS, '')
    .replace(/^\s*;+/, '')
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

  // Drop only the declarations that would let content overlay the application.
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style' || !data.attrValue) return
    const cleaned = stripEscapingCss(data.attrValue)
    if (cleaned) {
      data.attrValue = cleaned
    } else {
      data.keepAttr = false
    }
  })

  // markdown-authored links get rel from the link_open renderer, but a raw-HTML
  // `<a target="_blank">` arrives without one. Guarantee it after sanitization.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

/**
 * Renders markdown content to HTML using the configured parser.
 * Output is sanitized with DOMPurify to prevent XSS attacks from embedded HTML.
 * This is the main entry point for markdown rendering throughout the application.
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
  const rawHtml = getMarkdownIt().render(content)
  if (typeof window !== 'undefined') {
    registerHooks()
    return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG)
  }
  // SSR/SSG: DOMPurify needs a browser DOM, so output cannot be sanitized
  // here. Nothing prerenders markdown today (the preview waits for the
  // client-side isContentReady), so return an empty string to guarantee
  // unsanitized HTML can never reach prerendered output if that changes.
  return ''
}
