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
  const needsHighlighting = content.includes('hljs')
  const needsMath = content.includes('katex')

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
  <title>Exported Document</title>
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
    @media print {
      body {
        background: white;
        color: black;
      }
    }
  </style>
</head>
<body class="markdown-body">
${content}
</body>
</html>`
}
