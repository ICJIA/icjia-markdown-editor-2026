import { describe, it, expect } from 'vitest'
import { buildOutline, activeOutlineIndex } from '~/utils/markdown/outline'

const texts = (md: string) => buildOutline(md).map(e => e.text)

describe('buildOutline', () => {
  it('lists headings in source order with level and 1-based line', () => {
    expect(buildOutline('# One\n\n## Two\n\n### Three')).toEqual([
      { line: 1, level: 1, text: 'One' },
      { line: 3, level: 2, text: 'Two' },
      { line: 5, level: 3, text: 'Three' },
    ])
  })

  it('returns nothing for a document with no headings', () => {
    expect(buildOutline('Just a paragraph.\n\nAnd another.')).toEqual([])
  })

  it('strips emphasis and code markup from the label', () => {
    expect(texts('## The *quick* `brown` **fox**')).toEqual(['The quick brown fox'])
  })

  it('keeps a footnote-referenced heading readable', () => {
    // markdown-it gives footnote_ref an empty `content`; the label should be the
    // author's words, not an empty row.
    expect(texts('## Findings[^1]\n\n[^1]: note')).toEqual(['Findings'])
  })

  it('uses image alt text when a heading is an image', () => {
    expect(texts('## ![Quarterly chart](c.png)')).toEqual(['Quarterly chart'])
  })

  it('labels a heading that renders nothing', () => {
    expect(texts('## \n\ntext')).toEqual(['(empty heading)'])
  })

  it('ignores hashes inside fenced code blocks', () => {
    expect(texts('# Real\n\n```bash\n# not a heading\n```')).toEqual(['Real'])
  })

  it('includes setext headings', () => {
    expect(buildOutline('Title\n=====\n\nSub\n---')).toEqual([
      { line: 1, level: 1, text: 'Title' },
      { line: 4, level: 2, text: 'Sub' },
    ])
  })

  it('includes a heading nested in a blockquote', () => {
    expect(texts('> ## Quoted heading')).toEqual(['Quoted heading'])
  })

  // Only setext headings span lines; an ATX heading ends at its newline.
  it('joins a multi-line setext heading with a space rather than fusing it', () => {
    expect(texts('First\nsecond\n=====')).toEqual(['First second'])
  })

  it('does not disturb footnote numbering in the preview', () => {
    // The linter and outline share one markdown-it instance with the renderer,
    // so both must parse with their own env.
    const md = 'Body[^a]\n\n[^a]: note'
    buildOutline(md)
    expect(buildOutline(md)).toEqual([])
  })
})

describe('activeOutlineIndex', () => {
  const outline = buildOutline('# One\n\ntext\n\n## Two\n\ntext\n\n### Three')

  it('reports no active heading above the first one', () => {
    expect(activeOutlineIndex(outline, 1)).toBe(0)
  })

  it('reports the heading the cursor sits on', () => {
    expect(activeOutlineIndex(outline, 5)).toBe(1)
  })

  it('reports the heading a paragraph belongs to', () => {
    expect(activeOutlineIndex(outline, 7)).toBe(1)
  })

  it('reports the last heading for a cursor below all of them', () => {
    expect(activeOutlineIndex(outline, 99)).toBe(2)
  })

  it('reports -1 when there are no headings', () => {
    expect(activeOutlineIndex([], 3)).toBe(-1)
  })

  it('reports -1 when the cursor is above the first heading', () => {
    const later = buildOutline('intro paragraph\n\n## Later')
    expect(activeOutlineIndex(later, 1)).toBe(-1)
  })
})
