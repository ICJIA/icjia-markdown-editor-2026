import { describe, it, expect } from 'vitest'
import { createMarkdownIt, renderMarkdown, sanitizeStyleAttribute } from '~/utils/markdown/config'

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

describe('escaping-CSS stripping resists ordinary CSS syntax', () => {
  // Each of these is valid CSS that a browser honours, so each has to be
  // stripped. `!important` was the gap: the original pattern required the
  // declaration to end immediately after `fixed`, so any trailing token
  // carried it straight through.
  const escapes = [
    ['!important', 'position: fixed !important; top:0'],
    ['uppercase value', 'position: FIXED; top:0'],
    ['a CSS comment', 'position:/**/fixed; top:0'],
    ['sticky with !important', 'position: sticky !important'],
    ['extra whitespace', 'position :  fixed  ; top:0'],
    ['trailing semicolons', 'position:fixed;;'],
  ] as const

  for (const [label, style] of escapes) {
    it(`strips position:fixed written with ${label}`, () => {
      const html = renderMarkdown(`<div style="${style}">overlay</div>`)
      expect(html).not.toMatch(/position\s*:\s*(?:\/\*[^*]*\*\/\s*)?(?:fixed|sticky)/i)
    })
  }

  it('strips z-index written with !important', () => {
    const html = renderMarkdown('<div style="z-index: 99999 !important">lifted</div>')
    expect(html).not.toMatch(/z-index/i)
  })

  it('keeps the declarations a preview legitimately needs', () => {
    const html = renderMarkdown('<div style="position:fixed !important;text-align:center;height:2em">x</div>')
    expect(html).toMatch(/text-align\s*:\s*center/i)
    expect(html).toMatch(/height\s*:\s*2em/i)
  })
})

// Red/blue exercise, November 2026. Every payload below was confirmed in
// Chromium against 1.9.4 before the fix: the element computed to
// `position: fixed`, or the request left the browser, or the link reached the
// DOM without `rel`. jsdom has no CSS engine, so these assert on the markup the
// sanitizer returns — which is the thing the fix changed.
describe('style attributes cannot hide a declaration from the sanitizer', () => {
  const fixedByAnotherName = [
    ['an escaped property name', 'pos\\69tion:fixed;top:0'],
    ['an escaped value', 'position:\\66ixed;top:0'],
    ['a custom property', '--p:fixed;position:var(--p);top:0'],
    ['a var() fallback', 'position:var(--undefined,fixed);top:0'],
    ['a vendor keyword', 'position:-webkit-sticky;top:0'],
  ] as const

  for (const [label, style] of fixedByAnotherName) {
    it(`does not let position through as ${label}`, () => {
      const html = renderMarkdown(`<div style="${style}">overlay</div>`)
      expect(html).not.toMatch(/pos[^;"]*tion\s*:/i)
    })
  }

  it('removes an escaped z-index', () => {
    const html = renderMarkdown('<div style="z-\\69ndex:99999;color:red">x</div>')
    expect(html).not.toContain('99999')
  })

  it('rejects any style value containing a CSS escape', () => {
    expect(sanitizeStyleAttribute('color:\\72 ed')).toBe('')
  })

  it('keeps relative and absolute positioning, which stay inside the preview', () => {
    expect(sanitizeStyleAttribute('position:relative;top:1em')).toBe('position:relative;top:1em')
    expect(sanitizeStyleAttribute('position: absolute !important')).toBe('position: absolute !important')
  })

  it('removes declarations that fetch from the network', () => {
    const fetching = [
      'background:url(https://tracker.example/pixel.png)',
      "background-image: URL( 'https://tracker.example/p.png' )",
      'list-style-image:url(//tracker.example/p.png)',
      "background:image-set('https://tracker.example/p.png' 1x)",
      '--bg:url(https://tracker.example/p.png);background:var(--bg)',
    ]
    for (const style of fetching) {
      const html = renderMarkdown(`<div style="${style};color:red">x</div>`)
      expect(html).not.toContain('tracker.example')
      expect(html).toContain('color:red')
    }
  })
})

describe('links cannot hand the opened page a window.opener', () => {
  it('adds rel to a link with a named target', () => {
    const html = renderMarkdown('<a href="https://example.com" target="report">x</a>')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('overrides a rel the document supplied', () => {
    const html = renderMarkdown('<a href="https://example.com" target="report" rel="opener">x</a>')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).not.toContain('rel="opener"')
  })

  it('covers image-map areas, which take target too', () => {
    const html = renderMarkdown(
      '<map name="m"><area shape="rect" coords="0,0,5,5" href="https://example.com" target="report"></map>',
    )
    expect(html).toMatch(/<area[^>]*rel="noopener noreferrer"/)
  })

  it('leaves untargeted links alone', () => {
    expect(renderMarkdown('<a href="https://example.com">x</a>')).not.toContain('rel=')
  })
})

describe('tags and attributes with no place in a rendered document', () => {
  it('strips media elements, which fetch as soon as they render', () => {
    const html = renderMarkdown(
      '<video src="https://tracker.example/v.mp4" autoplay></video>'
      + '<audio><source src="https://tracker.example/a.mp3"></audio>',
    )
    expect(html).not.toMatch(/<(video|audio|source)/)
    expect(html).not.toContain('tracker.example')
  })

  it('strips dialog and popover, the two routes to the top layer', () => {
    expect(renderMarkdown('<dialog open>x</dialog>')).not.toContain('<dialog')
    expect(renderMarkdown('<div popover="manual">x</div>')).not.toContain('popover')
    const invoker = renderMarkdown(
      '<div id="p" popover>x</div><a href="#" popovertarget="p" commandfor="p" command="show-popover">open</a>',
    )
    expect(invoker).not.toMatch(/popover|command/)
  })
})
