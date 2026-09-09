/**
 * @fileoverview HTML Export Template
 * @description Wraps rendered markdown in a complete, self-contained HTML document.
 *
 * Every stylesheet is embedded in the file rather than linked from a CDN. An
 * exported document is something a researcher emails to a colleague, attaches to
 * a record, or opens years later — all situations where a network fetch is the
 * wrong dependency. Inlining also removes the CDN as a place where someone could
 * alter how a published document looks, which no `integrity` attribute can do
 * for a file that has already been sent.
 *
 * The cost is file size, so it is paid only where it buys something. A plain
 * report carries the base stylesheet alone (~22 KB). The highlight.js theme is
 * added only when the document contains a code block, and the KaTeX stylesheet
 * and its twenty webfonts (~350 KB as base64) only when it contains math —
 * without those fonts a browser substitutes Times New Roman for KaTeX's symbol
 * faces, which turns large operators and delimiters into wrong or missing glyphs.
 *
 * All three stylesheets are loaded through dynamic `import()`, so they land in a
 * chunk fetched at export time and never enter the editor's main bundle.
 *
 * @module utils/export/html-template
 */

/**
 * KaTeX's webfonts, in the order `katex.min.css` declares them.
 *
 * Listed explicitly rather than globbed because a bare package specifier cannot
 * be globbed, and because an explicit list fails loudly at build time if KaTeX
 * renames a face. A face that KaTeX adds in a future release and this list
 * misses degrades to a fallback glyph; it does not break the export.
 */
const KATEX_FONT_MODULES = {
  'KaTeX_AMS-Regular': () => import('katex/dist/fonts/KaTeX_AMS-Regular.woff2?inline'),
  'KaTeX_Caligraphic-Bold': () => import('katex/dist/fonts/KaTeX_Caligraphic-Bold.woff2?inline'),
  'KaTeX_Caligraphic-Regular': () => import('katex/dist/fonts/KaTeX_Caligraphic-Regular.woff2?inline'),
  'KaTeX_Fraktur-Bold': () => import('katex/dist/fonts/KaTeX_Fraktur-Bold.woff2?inline'),
  'KaTeX_Fraktur-Regular': () => import('katex/dist/fonts/KaTeX_Fraktur-Regular.woff2?inline'),
  'KaTeX_Main-Bold': () => import('katex/dist/fonts/KaTeX_Main-Bold.woff2?inline'),
  'KaTeX_Main-BoldItalic': () => import('katex/dist/fonts/KaTeX_Main-BoldItalic.woff2?inline'),
  'KaTeX_Main-Italic': () => import('katex/dist/fonts/KaTeX_Main-Italic.woff2?inline'),
  'KaTeX_Main-Regular': () => import('katex/dist/fonts/KaTeX_Main-Regular.woff2?inline'),
  'KaTeX_Math-BoldItalic': () => import('katex/dist/fonts/KaTeX_Math-BoldItalic.woff2?inline'),
  'KaTeX_Math-Italic': () => import('katex/dist/fonts/KaTeX_Math-Italic.woff2?inline'),
  'KaTeX_SansSerif-Bold': () => import('katex/dist/fonts/KaTeX_SansSerif-Bold.woff2?inline'),
  'KaTeX_SansSerif-Italic': () => import('katex/dist/fonts/KaTeX_SansSerif-Italic.woff2?inline'),
  'KaTeX_SansSerif-Regular': () => import('katex/dist/fonts/KaTeX_SansSerif-Regular.woff2?inline'),
  'KaTeX_Script-Regular': () => import('katex/dist/fonts/KaTeX_Script-Regular.woff2?inline'),
  'KaTeX_Size1-Regular': () => import('katex/dist/fonts/KaTeX_Size1-Regular.woff2?inline'),
  'KaTeX_Size2-Regular': () => import('katex/dist/fonts/KaTeX_Size2-Regular.woff2?inline'),
  'KaTeX_Size3-Regular': () => import('katex/dist/fonts/KaTeX_Size3-Regular.woff2?inline'),
  'KaTeX_Size4-Regular': () => import('katex/dist/fonts/KaTeX_Size4-Regular.woff2?inline'),
  'KaTeX_Typewriter-Regular': () => import('katex/dist/fonts/KaTeX_Typewriter-Regular.woff2?inline'),
} as const

/**
 * Matches a whole `src:` descriptor in katex.min.css, capturing the face name.
 *
 * Every one of KaTeX's twenty `@font-face` rules has the identical shape:
 *
 *     src:url(fonts/NAME.woff2) format("woff2"),
 *         url(fonts/NAME.woff)  format("woff"),
 *         url(fonts/NAME.ttf)   format("truetype")
 *
 * The whole descriptor is matched, not each URL separately, because the three
 * entries are one fallback list: replacing the woff/ttf URLs individually with
 * something empty leaves an invalid component in the list, and a browser is
 * entitled to discard the entire `src` — taking the valid woff2 with it. So the
 * list is rebuilt from scratch with the single embedded entry.
 *
 * `[A-Za-z0-9]` in the face name is load-bearing: four faces are named
 * `KaTeX_Size1`…`KaTeX_Size4`, and a letters-only pattern silently skips them,
 * which loses exactly the large delimiters and operators that make math legible.
 */
const KATEX_SRC_DESCRIPTOR = /src:\s*url\(\s*["']?fonts\/(KaTeX_[A-Za-z0-9]+-[A-Za-z]+)\.woff2["']?\s*\)[^;}]*/g

/**
 * Rewrites KaTeX's relative font references into embedded data URIs.
 *
 * Only the woff2 is embedded — every browser this editor supports reads woff2,
 * and carrying all three formats would triple the payload for no gain.
 *
 * @param {string} css - The contents of katex.min.css
 * @param {Record<string, string>} dataUris - Face name to `data:` URI
 * @returns {string} CSS whose every font reference is self-contained
 */
function embedKatexFonts(css: string, dataUris: Record<string, string>): string {
  return css.replace(KATEX_SRC_DESCRIPTOR, (match, face: string) => {
    const uri = dataUris[face]
    return uri ? `src:url(${uri}) format("woff2")` : match
  })
}

/**
 * Loads the KaTeX stylesheet with all of its webfonts embedded.
 *
 * @returns {Promise<string>} Self-contained KaTeX CSS
 */
async function loadKatexCss(): Promise<string> {
  const [{ default: css }, ...fonts] = await Promise.all([
    import('katex/dist/katex.min.css?raw'),
    ...Object.entries(KATEX_FONT_MODULES).map(async ([face, load]) => {
      const { default: uri } = await load()
      return [face, uri] as const
    }),
  ])
  return embedKatexFonts(css, Object.fromEntries(fonts))
}

/** Used when a document has no heading to take a name from. */
const DEFAULT_TITLE = 'Exported Document'

/** Removes every tag, leaving the character data between them. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Names the exported document after its first heading.
 *
 * `<title>` is the browser tab, the bookmark, and — the reason this matters —
 * the header a browser stamps on every page when the reader prints or saves to
 * PDF. A constant there put "Exported Document" on every report anyone sent.
 *
 * Two heading shapes have to be handled. `markdown-it-anchor`'s `headerLink`
 * permalink wraps the heading's text *inside* the anchor, so the anchor cannot
 * simply be deleted. A raw-HTML heading may instead carry a permalink *beside*
 * its text, where deleting it is exactly right. Dropping header anchors and
 * keeping the result only when text survives covers both without a special
 * case, and without truncating a heading that genuinely ends in `#`.
 *
 * @param {string} content - The rendered, already-sanitized HTML
 * @returns {string} Title text, safe to place in `<title>`
 */
function documentTitle(content: string): string {
  const heading = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  if (!heading) return DEFAULT_TITLE

  const withoutAnchors = heading.replace(
    /<a\b[^>]*class="[^"]*\bheader-anchor\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
    '',
  )
  const source = stripTags(withoutAnchors).trim() ? withoutAnchors : heading
  const text = stripTags(source).replace(/\s+/g, ' ').trim()
  if (!text) return DEFAULT_TITLE

  // `content` is already-escaped HTML, so entities such as `&amp;` are correct
  // as they stand and must not be escaped a second time. Only a stray angle
  // bracket — which well-formed sanitizer output will not contain — is closed off.
  return text.replace(/[<>]/g, ch => (ch === '<' ? '&lt;' : '&gt;'))
}

/**
 * Wraps rendered HTML in a complete, standalone HTML document.
 *
 * The returned document has no external references of any kind: it renders
 * identically with the network switched off.
 *
 * @param {string} content - The rendered, already-sanitized HTML to wrap
 * @returns {Promise<string>} A complete HTML document as a string
 *
 * @example
 * ```typescript
 * const doc = await wrapHtmlDocument(renderMarkdown('# Report'))
 * // '<!DOCTYPE html>…<style>…</style>…<h1>Report</h1>…'
 * ```
 */
export async function wrapHtmlDocument(content: string): Promise<string> {
  // Match the class attributes the renderers actually emit, not the bare words.
  // A substring test for `hljs`/`katex` fires on any document that merely
  // mentions them in prose — and for `katex` that means posting twenty webfonts
  // (~350 KB) to a reader who has no math.
  const needsHighlighting = content.includes('class="hljs')
  const needsMath = content.includes('class="katex')

  const [baseCss, hljsCss, katexCss] = await Promise.all([
    import('github-markdown-css/github-markdown-dark.css?raw').then(m => m.default),
    needsHighlighting
      ? import('highlight.js/styles/github-dark.min.css?raw').then(m => m.default)
      : '',
    needsMath ? loadKatexCss() : '',
  ])

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle(content)}</title>
  <style>
${baseCss}
${hljsCss}
${katexCss}
  </style>
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background: #0d1117;
      color: #c9d1d9;
    }
    .markdown-body {
      background: transparent;
    }
    pre.hljs {
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
    }
    @media (max-width: 767px) {
      body { padding: 15px; }
    }
    /* Print / Save-as-PDF.
       The embedded base stylesheet is the dark GitHub theme, and it colours
       .markdown-body — the same element as body — at class specificity. A print
       rule selecting body alone (0-0-1) therefore loses to it, and the page
       prints #f0f6fc text on white paper: 1.09:1, invisible. Every rule here is
       written at class specificity or higher for that reason, and the palette is
       GitHub's light theme so the colours stay familiar. Ratios against white
       are noted; all clear WCAG AA. */
    @media print {
      body,
      .markdown-body {
        background: #ffffff;   /* paper */
        color: #1f2328;        /* 15.8:1 */
      }
      .markdown-body a {
        color: #0969da;        /* 5.2:1 */
      }
      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4,
      .markdown-body h5,
      .markdown-body h6,
      .markdown-body strong {
        color: #1f2328;
      }
      .markdown-body h1,
      .markdown-body h2 {
        border-bottom-color: #d1d9e0;
      }
      .markdown-body blockquote {
        color: #59636e;        /* 6.1:1 */
        border-left-color: #d1d9e0;
      }
      .markdown-body hr {
        background-color: #d1d9e0;
      }
      .markdown-body table tr {
        background-color: #ffffff;
        border-top-color: #d1d9e0;
      }
      .markdown-body table tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
      .markdown-body table td,
      .markdown-body table th {
        border-color: #d1d9e0;
      }
      .markdown-body code,
      .markdown-body tt {
        background-color: #eff1f3;
        color: #1f2328;
      }
      /* Highlighted code keeps its own theme, so it is reset wholesale rather
         than per-token: a light block with plain dark text prints legibly,
         where github-dark's palette on white does not. */
      .markdown-body pre,
      .markdown-body pre.hljs {
        background: #f6f8fa;
        color: #1f2328;
        border: 1px solid #d1d9e0;
      }
      .markdown-body pre.hljs span {
        color: inherit;
      }
    }
  </style>
</head>
<body class="markdown-body">
${content}
</body>
</html>`
}
