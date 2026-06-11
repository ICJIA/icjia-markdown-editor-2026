import { describe, it, expect } from 'vitest'
import { wrapHtmlDocument } from '~/utils/export/html-template'

describe('wrapHtmlDocument', () => {
  const doc = wrapHtmlDocument('<h1>Test</h1><p>Body content</p>')

  it('wraps content in a complete HTML document', () => {
    expect(doc).toContain('<!DOCTYPE html>')
    expect(doc).toContain('<html lang="en">')
    expect(doc).toContain('<h1>Test</h1><p>Body content</p>')
  })

  it('includes the GitHub markdown stylesheet', () => {
    expect(doc).toContain('github-markdown')
  })

  it('includes the KaTeX stylesheet so exported math renders correctly', () => {
    expect(doc).toMatch(/<link[^>]+katex[^>]*\.css/i)
  })

  it('includes a highlight.js theme so exported code blocks are styled', () => {
    expect(doc).toMatch(/<link[^>]+highlight\.js[^>]*\.css/i)
  })

  it('uses charset and viewport meta tags', () => {
    expect(doc).toContain('charset="UTF-8"')
    expect(doc).toContain('name="viewport"')
  })
})
