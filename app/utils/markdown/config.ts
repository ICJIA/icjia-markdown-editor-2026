/**
 * @fileoverview markdown-it Configuration
 * @description Configures the markdown parser with plugins and custom renderers.
 * Security-focused: raw HTML is disabled and external links have rel="noopener".
 * 
 * @module utils/markdown/config
 * @requires markdown-it
 * @requires markdown-it-footnote
 * @requires markdown-it-anchor
 * @requires highlight.js
 * 
 * Features:
 * - Syntax highlighting for 190+ languages via highlight.js
 * - Footnote support via markdown-it-footnote
 * - Heading anchors for navigation
 * - External link security (rel="noopener noreferrer")
 * - Lazy loading for images
 */

import MarkdownIt from 'markdown-it'
// @ts-expect-error - no type declarations available
import footnote from 'markdown-it-footnote'
import anchor from 'markdown-it-anchor'
import hljs from 'highlight.js'

/**
 * Creates and configures a markdown-it instance with all plugins and custom renderers.
 * 
 * Configuration:
 * - Raw HTML disabled for security
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
    html: false,          // Disable raw HTML for security
    xhtmlOut: true,       // Use XHTML-compliant output
    breaks: true,         // Convert \n to <br>
    linkify: true,        // Auto-convert URLs to links
    typographer: true,    // Enable smartquotes, dashes
    
    // Syntax highlighting for code blocks
    highlight: (str: string, lang: string): string => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs language-${lang}"><code>${
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`
        } catch (e) {
          console.error('Highlight error:', e)
        }
      }
      // Fallback: escape HTML and wrap in pre/code
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    },
  })
  
  // Add footnote support
  md.use(footnote)
  
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
    return `<pre class="hljs language-${lang}"${lineAttr}><code>${highlighted}</code></pre>`
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
 * Renders markdown content to HTML using the configured parser.
 * This is the main entry point for markdown rendering throughout the application.
 * 
 * @param {string} content - The markdown content to render
 * @returns {string} The rendered HTML string
 * 
 * @example
 * ```typescript
 * const html = renderMarkdown('# Hello World')
 * // Returns: '<h1>Hello World</h1>'
 * ```
 */
export function renderMarkdown(content: string): string {
  return getMarkdownIt().render(content)
}
