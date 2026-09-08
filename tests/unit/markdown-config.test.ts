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

describe('syntax highlighting language registry', () => {
  const md = createMarkdownIt()

  // Languages researchers actually use must produce highlighted output
  it.each([
    'javascript',
    'typescript',
    'python',
    'r',
    'sql',
    'bash',
    'json',
    'yaml',
    'xml',
    'css',
    'markdown',
    'java',
    'c',
    'cpp',
    'csharp',
    'diff',
    'stata',
    'sas',
  ])('highlights %s code blocks', (lang) => {
    const html = md.render(`\`\`\`${lang}\nx\n\`\`\``)
    expect(html).toContain(`class="hljs language-${lang}"`)
  })

  it('falls back to escaped plain text for unregistered languages', () => {
    // fortran is not in the registered subset — must degrade gracefully,
    // not pull the full 190-language registry into the bundle
    const html = md.render('```fortran\nPROGRAM hello\nEND PROGRAM\n```')
    expect(html).toContain('class="hljs language-fortran"')
    expect(html).toContain('PROGRAM hello')
    expect(html).not.toContain('<span class="hljs-')
  })

  it('resolves common language aliases from registered languages', () => {
    const js = md.render('```js\nconst x = 1\n```')
    expect(js).toContain('class="hljs language-js"')
    expect(js).toContain('<span class="hljs-')

    const py = md.render('```py\nx = 1\n```')
    expect(py).toContain('<span class="hljs-')
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

describe('renderMarkdown hardening', () => {
  it('strips <style> blocks so a document cannot restyle the application', () => {
    const html = renderMarkdown('<style>body{background:red}</style>')
    expect(html).not.toContain('<style')
    expect(html).not.toContain('background:red')
  })

  it('strips <form> so a document cannot post to an external endpoint', () => {
    const html = renderMarkdown('<form action="https://evil.example"><input name="q"></form>')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('evil.example')
  })

  it('strips text inputs while keeping task-list checkboxes', () => {
    expect(renderMarkdown('<input type="text" name="q">')).not.toContain('<input')
    expect(renderMarkdown('- [x] done')).toContain('type="checkbox"')
  })

  it('strips buttons, selects and textareas', () => {
    expect(renderMarkdown('<button>Go</button>')).not.toContain('<button')
    expect(renderMarkdown('<select><option>a</option></select>')).not.toContain('<select')
    expect(renderMarkdown('<textarea>x</textarea>')).not.toContain('<textarea')
  })

  it('strips position:fixed and z-index so a document cannot overlay the app', () => {
    const html = renderMarkdown(
      '<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999">overlay</div>',
    )
    expect(html).not.toMatch(/position\s*:\s*fixed/i)
    expect(html).not.toMatch(/z-index/i)
  })

  it('keeps the inline styles KaTeX and tables depend on', () => {
    // \sum places its limits with position:relative, so this proves the hook
    // strips only fixed/sticky rather than the position property outright.
    const math = renderMarkdown('$\\sum_{i=1}^{n} i$')
    expect(math).toMatch(/position\s*:\s*relative/i)
    expect(math).toMatch(/height:/)

    const table = renderMarkdown('| a |\n| ---: |\n| 1 |')
    expect(table).toContain('text-align:right')
  })

  it('adds rel="noopener noreferrer" to raw-HTML target="_blank" links', () => {
    const html = renderMarkdown('<a href="https://example.com" target="_blank">x</a>')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('renders ++inserted++ as <ins>', () => {
    expect(renderMarkdown('++inserted++')).toContain('<ins>inserted</ins>')
  })
})
