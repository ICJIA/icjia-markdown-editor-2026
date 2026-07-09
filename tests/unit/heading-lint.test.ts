import { describe, it, expect } from 'vitest'
import { lintHeadings } from '~/utils/markdown/heading-lint'

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

  it('excludes markup tags from h1 no-h1 message with emphasis', () => {
    const issues = lintHeadings('# <em>Title</em>\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Title" instead.')
  })

  it('excludes markup tags from h1 no-h1 message with code', () => {
    const issues = lintHeadings('# `code` heading\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## code heading" instead.')
  })

  it('excludes markup tags from h1 no-h1 message with bold', () => {
    const issues = lintHeadings('# Bold **x**\n')
    expect(issues).toHaveLength(1)
    expect(issues[0]!.message).toBe('H1 is reserved for the page title. Use "## Bold x" instead.')
  })
})
