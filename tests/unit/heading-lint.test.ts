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
    expect(issues[0]!.message).toContain('## Title')
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
})
