/**
 * markdown-it Configuration
 * Configures the markdown parser with plugins and custom renderers
 * Security: raw HTML disabled, URLs validated
 */

import MarkdownIt from 'markdown-it'
// @ts-expect-error - no type declarations available
import footnote from 'markdown-it-footnote'
import anchor from 'markdown-it-anchor'
import hljs from 'highlight.js'

/**
 * Create and configure markdown-it instance
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
  
  return md
}

// Singleton instance for the application
let mdInstance: MarkdownIt | null = null

/**
 * Get or create the markdown-it instance
 */
export function getMarkdownIt(): MarkdownIt {
  if (!mdInstance) {
    mdInstance = createMarkdownIt()
  }
  return mdInstance
}

/**
 * Render markdown to HTML
 */
export function renderMarkdown(content: string): string {
  return getMarkdownIt().render(content)
}
