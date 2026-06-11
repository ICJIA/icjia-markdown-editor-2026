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
  const defaultFence = md.renderer.rules.fence!
  md.renderer.rules.fence = function(tokens, idx, options, env, self) {
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
 */
const PURIFY_CONFIG = {
  ADD_ATTR: [
    'data-source-line', 'target', 'rel',
    'role', 'aria-label', 'aria-hidden', 'tabindex', 'aria-multiline',
    'loading',
  ],
  ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'mtext', 'annotation', 'semantics'],
  RETURN_TRUSTED_TYPE: false,
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
    return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG)
  }
  // SSR/SSG: DOMPurify needs a browser DOM, so output cannot be sanitized
  // here. Nothing prerenders markdown today (the preview waits for the
  // client-side isContentReady), so return an empty string to guarantee
  // unsanitized HTML can never reach prerendered output if that changes.
  return ''
}
