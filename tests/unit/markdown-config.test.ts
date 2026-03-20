import { describe, it, expect } from 'vitest'
import { createMarkdownIt, renderMarkdown } from '~/utils/markdown/config'

describe('createMarkdownIt', () => {
  const md = createMarkdownIt()

  it('renders headings', () => {
    const html = md.render('# Hello')
    expect(html).toContain('<h1')
    expect(html).toContain('Hello')
  })

  it('renders bold and italic', () => {
    expect(md.render('**bold**')).toContain('<strong>bold</strong>')
    expect(md.render('_italic_')).toContain('<em>italic</em>')
  })

  it('renders fenced code blocks with syntax highlighting', () => {
    const html = md.render('```javascript\nconst x = 1\n```')
    expect(html).toContain('class="hljs language-javascript"')
    expect(html).toContain('role="figure"')
    expect(html).toContain('aria-label="javascript code block"')
  })

  it('renders code blocks without a language', () => {
    const html = md.render('```\nplain code\n```')
    expect(html).toContain('role="figure"')
    expect(html).toContain('aria-label="code block"')
  })

  it('adds data-source-line attributes for scroll sync', () => {
    const html = md.render('# Heading\n\nParagraph text')
    expect(html).toContain('data-source-line')
  })

  it('adds rel="noopener noreferrer" to external links', () => {
    const html = md.render('[link](https://example.com)')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
  })

  it('does not add rel to relative links', () => {
    const html = md.render('[link](#section)')
    expect(html).not.toContain('rel="noopener noreferrer"')
  })

  it('adds lazy loading to images', () => {
    const html = md.render('![alt](image.png)')
    expect(html).toContain('loading="lazy"')
  })

  it('renders footnotes', () => {
    const html = md.render('Text[^1]\n\n[^1]: Footnote content')
    expect(html).toContain('footnote')
  })

  it('renders task lists', () => {
    const html = md.render('- [ ] unchecked\n- [x] checked')
    expect(html).toContain('type="checkbox"')
  })

  it('renders strikethrough', () => {
    const html = md.render('~~deleted~~')
    expect(html).toContain('<s>')
  })

  it('renders mark/highlight', () => {
    const html = md.render('==highlighted==')
    expect(html).toContain('<mark>')
  })

  it('renders KaTeX math', () => {
    const html = md.render('$E=mc^2$')
    expect(html).toContain('katex')
  })
})

describe('renderMarkdown', () => {
  it('sanitizes dangerous HTML via DOMPurify', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toContain('onerror')
  })

  it('sanitizes script tags', () => {
    const html = renderMarkdown('<script>alert("xss")</script>')
    expect(html).not.toContain('<script>')
  })

  it('preserves safe HTML attributes used by the editor', () => {
    const html = renderMarkdown('# Heading\n\nParagraph')
    expect(html).toContain('data-source-line')
  })

  it('preserves code block accessibility attributes', () => {
    const html = renderMarkdown('```js\ncode\n```')
    expect(html).toContain('role="figure"')
    expect(html).toContain('aria-label')
  })

  it('returns empty output for empty input', () => {
    const html = renderMarkdown('')
    expect(html.trim()).toBe('')
  })
})
