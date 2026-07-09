import { describe, it, expect } from 'vitest'
import { lintHeadings } from '~/utils/markdown/heading-lint'
import { renderMarkdown } from '~/utils/markdown/config'
import { DEFAULT_CONTENT } from '~/utils/default-content'

describe('lintHeadings — hierarchy', () => {
  it('accepts a document that opens at h2 and descends one level at a time', () => {
    expect(lintHeadings('## A\n\n### B\n')).toEqual([])
  })

  it('allows ascending more than one level at a time (h4 back to h2)', () => {
    expect(lintHeadings('## A\n\n### B\n\n#### C\n\n## D\n')).toEqual([])
  })

  it('flags a skip from h2 to h4 on the correct line', () => {
    const issues = lintHeadings('## A\n\n#### D\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 3, rule: 'heading-order', severity: 'error' })
    expect(issues[0]!.message).toBe('Heading skips from h2 to h4. Use h3.')
  })

  it('understands setext headings, which a regex linter would read as a horizontal rule', () => {
    const issues = lintHeadings('Title\n-----\n\n#### D\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 4, rule: 'heading-order' })
  })

  it('lets an h1 update the baseline, so a skip below it is judged against h1', () => {
    const issues = lintHeadings('## A\n\n# Mid\n\n### C\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 5, rule: 'heading-order' })
    expect(issues[0]!.message).toBe('Heading skips from h1 to h3. Use h2.')
  })

  it('flags a skip below an h1 opening', () => {
    const issues = lintHeadings('# Title\n\n### Sub\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 3, rule: 'heading-order' })
  })

  it('ignores "#" inside a fenced code block', () => {
    expect(lintHeadings('## A\n\n```bash\n# not a heading\n```\n')).toEqual([])
  })

  it('returns an empty array for a document with no headings', () => {
    expect(lintHeadings('Just a paragraph.\n')).toEqual([])
  })
})

// The linter is neutral about publishing context. A standalone document owns its
// title and opens at #; a CMS-published document opens at ## because the page
// supplies the <h1>. Only the author knows which they are writing, so — exactly
// like axe-core's heading-order rule — the first heading is never flagged, at any
// level. Structure below it is still enforced.
describe('lintHeadings — the first heading sets the baseline', () => {
  it('accepts a document that opens with a normal h1', () => {
    expect(lintHeadings('# Title\n\n## Sub\n')).toEqual([])
  })

  it('accepts a setext h1 opening', () => {
    expect(lintHeadings('Title\n=====\n\n## Sub\n')).toEqual([])
  })

  it('never flags the first heading, even deep ones (matching axe-core)', () => {
    expect(lintHeadings('### Deep\n')).toEqual([])
    expect(lintHeadings('#### Deeper\n\n##### Next\n')).toEqual([])
  })

  it('still measures skips from a deep opening', () => {
    const issues = lintHeadings('### A\n\n##### B\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 3, rule: 'heading-order' })
    expect(issues[0]!.message).toBe('Heading skips from h3 to h5. Use h4.')
  })

  it('allows multiple h1s, which axe-core does not flag either', () => {
    expect(lintHeadings('# A\n\n# B\n')).toEqual([])
  })

  it('accepts h1 headings across syntaxes and contexts', () => {
    expect(lintHeadings('> # Quoted\n')).toEqual([])          // blockquoted
    expect(lintHeadings('- # In a list\n')).toEqual([])       // list item
    expect(lintHeadings('# C#\n')).toEqual([])                // trailing hash is text
    expect(lintHeadings('# Title ####\n')).toEqual([])        // ATX closing sequence
    expect(lintHeadings('# Title\r\n')).toEqual([])           // CRLF
    expect(lintHeadings('Line one\nLine two\n=========\n')).toEqual([]) // multi-line setext
  })
})

describe('lintHeadings — empty headings', () => {
  it('flags an empty h2 as a warning', () => {
    const issues = lintHeadings('##\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'empty-heading', severity: 'warning' })
    expect(issues[0]!.message).toBe('Empty h2 heading. Add text or remove it.')
  })

  it('flags a bare "#" as an empty h1, now that h1 is an ordinary heading', () => {
    const issues = lintHeadings('#\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'empty-heading', severity: 'warning' })
    expect(issues[0]!.message).toBe('Empty h1 heading. Add text or remove it.')
  })

  it('reports an empty deep opening as empty only — the first heading is never a skip', () => {
    const issues = lintHeadings('###\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.rule).toBe('empty-heading')
  })

  it('detects an empty heading made of only decoration tags', () => {
    const issues = lintHeadings('## <em></em>\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, rule: 'empty-heading', severity: 'warning' })
  })

  it('does not treat math-only headings as empty', () => {
    expect(lintHeadings('## $E = mc^2$\n')).toEqual([])
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

  it('accepts an h1 whose only content is a footnote reference', () => {
    expect(lintHeadings('# [^1]\n\n[^1]: A source.\n')).toEqual([])
  })

  it('leaves a heading with text plus a footnote reference alone', () => {
    expect(lintHeadings('## Findings[^1]\n\n[^1]: A source.\n')).toEqual([])
  })

  it('accepts an h1 opening that carries a footnote reference', () => {
    expect(lintHeadings('# Title[^1]\n\n[^1]: A source.\n')).toEqual([])
  })

  it('treats an undefined footnote reference as the literal text it renders as', () => {
    expect(lintHeadings('## [^1]\n')).toEqual([])
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

  it('opens at h2 — the convention for ICJIA documents published through Strapi, which supplies the h1 page title', () => {
    expect(DEFAULT_CONTENT.startsWith('## ')).toBe(true)
  })
})
