import { describe, it, expect } from 'vitest'
import { lintHeadings } from '~/utils/markdown/heading-lint'
import { renderMarkdown } from '~/utils/markdown/config'
import { DEFAULT_CONTENT } from '~/utils/default-content'

describe('lintHeadings', () => {
  it('accepts a document that opens at h2 and descends one level at a time', () => {
    expect(lintHeadings('## A\n\n### B\n')).toEqual([])
  })

  it('allows ascending more than one level at a time (h4 back to h2)', () => {
    expect(lintHeadings('## A\n\n### B\n\n#### C\n\n## D\n')).toEqual([])
  })

  it('flags a document that opens at h3, because it skips the page h1 to h3', () => {
    const issues = lintHeadings('### Deep\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'heading-order', severity: 'error' })
    expect(issues[0]!.message).toContain('h1 to h3')
  })

  it('flags a skip from h2 to h4 on the correct line', () => {
    const issues = lintHeadings('## A\n\n#### D\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 3, rule: 'heading-order' })
    expect(issues[0]!.message).toContain('Use h3')
  })

  it('flags an h1 and suggests the h2 form with the heading text', () => {
    const issues = lintHeadings('# Title\n\n## Sub\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'no-h1', severity: 'error' })
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Title" instead.')
  })

  it('reports both the h1 and the skip beneath it', () => {
    const issues = lintHeadings('# Title\n\n### Sub\n')
    expect(issues.map(i => i.rule)).toEqual(['no-h1', 'heading-order'])
    expect(issues.map(i => i.line)).toEqual([1, 3])
  })

  it('resets the traversal baseline to h1 after a no-h1 finding, even when a real heading preceded it', () => {
    const issues = lintHeadings('## A\n\n# Oops\n\n### B\n')
    expect(issues.map(i => i.rule)).toEqual(['no-h1', 'heading-order'])
    expect(issues.map(i => i.line)).toEqual([3, 5])
  })

  it('reports only no-h1 for a bare "#", never empty-heading', () => {
    const issues = lintHeadings('#\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('no-h1')
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use ## instead.')
  })

  it('flags an empty heading as a warning', () => {
    const issues = lintHeadings('##\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'empty-heading', severity: 'warning' })
  })

  it('understands setext headings, which a regex linter would read as a horizontal rule', () => {
    const issues = lintHeadings('Title\n-----\n\n#### D\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 4, rule: 'heading-order' })
  })

  it('ignores "#" inside a fenced code block', () => {
    expect(lintHeadings('## A\n\n```bash\n# not a heading\n```\n')).toEqual([])
  })

  it('returns an empty array for a document with no headings', () => {
    expect(lintHeadings('Just a paragraph.\n')).toEqual([])
  })

  it('detects empty heading made of only decoration tags', () => {
    const issues = lintHeadings('## <em></em>\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'empty-heading', severity: 'warning' })
  })

  it('does not treat math-only headings as empty', () => {
    expect(lintHeadings('## $E = mc^2$\n')).toEqual([])
  })

  // The no-h1 suggestion is markdown the author is meant to type. It must round-trip
  // their source exactly: a suggestion that quietly drops emphasis, a code span, an
  // image, or a footnote reference would delete content from their document.
  it('preserves inline HTML in the no-h1 suggestion', () => {
    const issues = lintHeadings('# <em>Title</em>\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## <em>Title</em>" instead.')
  })

  it('preserves a code span in the no-h1 suggestion', () => {
    const issues = lintHeadings('# `code` heading\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## `code` heading" instead.')
  })

  it('preserves emphasis markers in the no-h1 suggestion', () => {
    const issues = lintHeadings('# Bold **x**\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Bold **x**" instead.')
  })

  it('preserves an image in the no-h1 suggestion', () => {
    const issues = lintHeadings('# ![**Bold** alt](chart.png)\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## ![**Bold** alt](chart.png)" instead.')
  })

  it('strips an ATX closing sequence from the suggestion', () => {
    const issues = lintHeadings('# Title #\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Title" instead.')
  })

  it('converts a setext h1 into an ATX suggestion', () => {
    const issues = lintHeadings('Title\n=====\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Title" instead.')
  })

  it('joins a multi-line setext heading with a space, not by fusing the words', () => {
    const issues = lintHeadings('Line one\nLine two\n=========\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Line one Line two" instead.')
  })

  it('keeps a trailing hash that is part of the heading text', () => {
    const issues = lintHeadings('# C#\n')
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## C#" instead.')
  })

  it('is not confused by CRLF line endings', () => {
    const issues = lintHeadings('# Title\r\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Title" instead.')
  })

  // A heading nested in a blockquote or list item still occupies a source line that
  // carries the container's own prefix. Quoting that line back would tell the author
  // to type "## > # Title" — garbage. Better to say nothing than to say something wrong.
  it('does not quote a blockquote prefix back at the author', () => {
    const issues = lintHeadings('> # Title\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('no-h1')
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use ## instead.')
  })

  it('does not quote a list marker back at the author', () => {
    const issues = lintHeadings('- # Title\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('no-h1')
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use ## instead.')
  })

  it('does not quote a container prefix from a nested setext heading', () => {
    const issues = lintHeadings('> Title\n> =====\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('no-h1')
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use ## instead.')
  })

  it('still reports a container-nested h1, only without a quoted suggestion', () => {
    const issues = lintHeadings('## Intro\n\n> # Nested\n\n### After\n')
    expect(issues.map(i => i.rule)).toEqual(['no-h1', 'heading-order'])
  })

  it('treats a multi-line setext h2 as non-empty despite its softbreak', () => {
    expect(lintHeadings('Line one\nLine two\n---------\n')).toEqual([])
  })
})

// Footnotes are a headline feature of this editor. A heading may legitimately consist
// of nothing but a footnote reference: markdown-it-footnote renders it as a visible
// `[1]` marker, but the `footnote_ref` token carries `content: ''`. Emptiness must
// therefore be judged from token types, never from joined `.content`.
describe('lintHeadings — footnotes and references', () => {
  it('does not call a heading empty when its only content is a footnote reference', () => {
    expect(lintHeadings('## [^1]\n\n[^1]: A source.\n')).toEqual([])
  })

  it('leaves a heading with text plus a footnote reference alone', () => {
    expect(lintHeadings('## Findings[^1]\n\n[^1]: A source.\n')).toEqual([])
  })

  it('treats an undefined footnote reference as the literal text it renders as', () => {
    expect(lintHeadings('## [^1]\n')).toEqual([])
  })

  it('preserves a footnote reference in the no-h1 suggestion', () => {
    const issues = lintHeadings('# Title[^1]\n\n[^1]: A source.\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Title[^1]" instead.')
  })

  it('preserves a footnote-only h1 in the suggestion rather than emitting the no-text form', () => {
    const issues = lintHeadings('# [^1]\n\n[^1]: A source.\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## [^1]" instead.')
  })

  it('still flags a level skip on a heading whose content is only a footnote reference', () => {
    const issues = lintHeadings('## A\n\n#### [^1]\n\n[^1]: A source.\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 3, rule: 'heading-order' })
  })

  it('leaves a reference-style link heading alone', () => {
    expect(lintHeadings('## [text][ref]\n\n[ref]: https://example.com\n')).toEqual([])
  })

  it('does not let the linter disturb footnote rendering on the shared parser', () => {
    const doc = '## Findings[^a]\n\nBody.[^b]\n\n[^a]: One.\n[^b]: Two.\n'
    const before = renderMarkdown(doc)
    for (let i = 0; i < 3; i++) { lintHeadings(doc); renderMarkdown(doc) }
    expect(renderMarkdown(doc)).toBe(before)
    expect(before).toContain('footnote-backref')
  })
})

describe('lintHeadings — images as heading content', () => {
  it('treats an image with alt text as visible content', () => {
    expect(lintHeadings('## ![Chart of results](chart.png)\n')).toEqual([])
  })

  it('flags a heading holding only an image with no alt text, which has no accessible name', () => {
    const issues = lintHeadings('## ![](chart.png)\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'empty-heading', severity: 'warning' })
  })
})

describe('DEFAULT_CONTENT', () => {
  it('lints clean, so new users never load the app to a heading issue', () => {
    expect(lintHeadings(DEFAULT_CONTENT)).toEqual([])
  })

  it('opens at h2, because Strapi supplies the h1 page title', () => {
    expect(DEFAULT_CONTENT.startsWith('## ')).toBe(true)
  })
})
