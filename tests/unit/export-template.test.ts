import { describe, it, expect } from 'vitest'
import { wrapHtmlDocument } from '~/utils/export/html-template'

describe('wrapHtmlDocument', () => {
  it('wraps content in a complete HTML document', async () => {
    const doc = await wrapHtmlDocument('<h1>Test</h1><p>Body content</p>')
    expect(doc).toContain('<!DOCTYPE html>')
    expect(doc).toContain('<html lang="en">')
    expect(doc).toContain('<h1>Test</h1><p>Body content</p>')
  })

  it('uses charset and viewport meta tags', async () => {
    const doc = await wrapHtmlDocument('<p>x</p>')
    expect(doc).toContain('charset="UTF-8"')
    expect(doc).toContain('name="viewport"')
  })

  it('inlines the base stylesheet instead of linking one', async () => {
    const doc = await wrapHtmlDocument('<p>x</p>')
    expect(doc).toContain('.markdown-body')
    expect(doc).not.toMatch(/<link[^>]+stylesheet/i)
  })

  it('makes no external requests of any kind', async () => {
    const doc = await wrapHtmlDocument('<span class="katex">m</span><pre class="hljs">c</pre>')
    expect(doc).not.toContain('cdnjs')
    // XML namespace identifiers such as http://www.w3.org/2000/svg are not
    // fetched, so the assertion targets the forms a browser would request.
    expect(doc).not.toMatch(/url\(\s*["']?https?:/i)
    expect(doc).not.toMatch(/(?:href|src)\s*=\s*["']https?:/i)
    expect(doc).not.toMatch(/@import/i)
  })

  it('omits the highlight.js theme when there is no code', async () => {
    const plain = await wrapHtmlDocument('<p>no code here</p>')
    const withCode = await wrapHtmlDocument('<pre class="hljs"><code>x</code></pre>')
    expect(withCode.length).toBeGreaterThan(plain.length)
    expect(withCode).toContain('.hljs')
  })

  it('omits KaTeX and its fonts when there is no math', async () => {
    const doc = await wrapHtmlDocument('<p>no math here</p>')
    expect(doc).not.toContain('KaTeX_Main')
    expect(doc).not.toContain('data:font')
    expect(doc.length).toBeLessThan(120_000)
  })

  it('embeds every KaTeX font as a data URI when the document contains math', async () => {
    const doc = await wrapHtmlDocument('<span class="katex">math</span>')
    const faces = (doc.match(/@font-face/g) ?? []).length
    expect(faces).toBe(20)
    // Every face embedded, including the numbered KaTeX_Size1-4 delimiter faces.
    expect((doc.match(/url\(data:font\/woff2/g) ?? []).length).toBe(faces)
    expect(doc).toContain('font-family:KaTeX_Size4')
    // No relative path survives: there is no fonts/ directory beside the export.
    expect(doc).not.toMatch(/url\(\s*["']?fonts\//)
    // And no empty url() left behind to invalidate a src descriptor.
    expect(doc).not.toContain('url()')
  })

  it('keeps a plain report small enough to email', async () => {
    const doc = await wrapHtmlDocument('<h1>Report</h1><p>Body</p>')
    expect(doc.length).toBeLessThan(60_000)
  })
})

describe('wrapHtmlDocument print styling', () => {
  /** Pulls the body of the template's `@media print { ... }` block. */
  function printBlock(doc: string): string {
    const at = doc.indexOf('@media print')
    if (at === -1) return ''
    const open = doc.indexOf('{', at)
    let depth = 0
    for (let i = open; i < doc.length; i++) {
      if (doc[i] === '{') depth++
      else if (doc[i] === '}' && --depth === 0) return doc.slice(open + 1, i)
    }
    return ''
  }

  function relativeLuminance(hex: string): number {
    const n = hex.replace('#', '')
    const full = n.length === 3 ? n.split('').map(c => c + c).join('') : n
    const channels = [0, 2, 4].map((i) => {
      const s = parseInt(full.slice(i, i + 2), 16) / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }) as [number, number, number]
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }

  function contrast(a: string, b: string): number {
    const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
    return (hi! + 0.05) / (lo! + 0.05)
  }

  it('overrides the dark text colour at class specificity so print rules actually win', async () => {
    const doc = await wrapHtmlDocument('<h1>Report</h1><p>Body</p>')
    const block = printBlock(doc)
    // The base stylesheet sets `.markdown-body { color: #f0f6fc }` (0-1-0).
    // A print rule selecting only `body` (0-0-1) loses, and the page prints
    // near-white text on white paper.
    const colourRule = block.match(/([^{}]+)\{[^}]*\bcolor\s*:/)
    expect(colourRule, 'print block sets no colour at all').not.toBeNull()
    expect(colourRule![1]).toContain('.markdown-body')
  })

  it('prints body text at WCAG AA contrast against the paper', async () => {
    const block = printBlock(await wrapHtmlDocument('<p>Body</p>'))
    const fg = block.match(/\bcolor\s*:\s*(#[0-9a-f]{3,6})/i)?.[1]
    const bg = block.match(/\bbackground(?:-color)?\s*:\s*(#[0-9a-f]{3,6}|white)/i)?.[1]
    expect(fg, 'no print foreground colour').toBeDefined()
    expect(bg, 'no print background colour').toBeDefined()
    const paper = bg!.toLowerCase() === 'white' ? '#ffffff' : bg!
    expect(contrast(fg!, paper)).toBeGreaterThanOrEqual(4.5)
  })

  it('prints links at WCAG AA contrast against the paper', async () => {
    const block = printBlock(await wrapHtmlDocument('<p><a href="https://x.test">link</a></p>'))
    const linkRule = block.match(/([^{}]*\ba\b[^{}]*)\{([^}]*)\}/)
    expect(linkRule, 'print block does not restyle links').not.toBeNull()
    const fg = linkRule![2].match(/\bcolor\s*:\s*(#[0-9a-f]{3,6})/i)?.[1]
    expect(fg, 'no print link colour').toBeDefined()
    expect(contrast(fg!, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('wrapHtmlDocument title', () => {
  it('names the document after its first heading', async () => {
    const doc = await wrapHtmlDocument('<h1>Quarterly Findings</h1><p>Body</p>')
    expect(doc).toContain('<title>Quarterly Findings</title>')
  })

  it('falls back to a generic title when the document has no heading', async () => {
    const doc = await wrapHtmlDocument('<p>Just a paragraph</p>')
    expect(doc).toContain('<title>Exported Document</title>')
  })

  it('escapes markup in the heading rather than injecting it into head', async () => {
    const doc = await wrapHtmlDocument('<h1>A &lt;script&gt; &amp; more</h1>')
    expect(doc).toContain('<title>A &lt;script&gt; &amp; more</title>')
    expect(doc).not.toContain('<title>A <script>')
  })

  // markdown-it-anchor's headerLink permalink wraps the heading text in the
  // anchor, so the title has to come from the text inside it.
  it('uses the heading text from an anchored heading', async () => {
    const doc = await wrapHtmlDocument(
      '<h1 id="q" tabindex="-1"><a class="header-anchor" href="#q"><span>Quarterly Findings</span></a></h1>',
    )
    expect(doc).toContain('<title>Quarterly Findings</title>')
  })

  // A raw-HTML heading may instead carry the permalink *beside* its text.
  it('drops a permalink that sits beside the heading text', async () => {
    const doc = await wrapHtmlDocument('<h1 id="r">Report<a class="header-anchor" href="#r">#</a></h1>')
    expect(doc).toContain('<title>Report</title>')
  })

  it('keeps a heading that legitimately ends in a hash', async () => {
    const doc = await wrapHtmlDocument('<h1>Notes on C#</h1>')
    expect(doc).toContain('<title>Notes on C#</title>')
  })
})

describe('wrapHtmlDocument stylesheet selection', () => {
  it('does not ship KaTeX fonts for a document that merely mentions katex in prose', async () => {
    const doc = await wrapHtmlDocument('<p>Math is rendered by the katex library.</p>')
    expect(doc).not.toContain('KaTeX_Main')
    expect(doc).not.toContain('data:font')
  })

  it('does not ship the highlight theme for a document that merely mentions hljs', async () => {
    const doc = await wrapHtmlDocument('<p>The hljs classes are added by the fence renderer.</p>')
    expect(doc).not.toContain('.hljs-keyword')
  })

  it('still ships KaTeX styles for real rendered math', async () => {
    const doc = await wrapHtmlDocument('<span class="katex"><span class="katex-mathml">x</span></span>')
    expect((doc.match(/@font-face/g) ?? []).length).toBe(20)
  })

  it('still ships the highlight theme for a real code block', async () => {
    const doc = await wrapHtmlDocument('<pre class="hljs"><code>const x = 1</code></pre>')
    expect(doc).toContain('.hljs')
  })
})
