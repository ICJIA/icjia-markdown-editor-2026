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
