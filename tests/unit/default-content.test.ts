import { describe, it, expect } from 'vitest'
import { DEFAULT_CONTENT } from '~/utils/default-content'
import { renderMarkdown } from '~/utils/markdown/config'
import { lintHeadings } from '~/utils/markdown/heading-lint'

/** Renders the tutorial and returns it as a queryable DOM tree. */
function renderTutorial(): HTMLDivElement {
  const div = document.createElement('div')
  div.innerHTML = renderMarkdown(DEFAULT_CONTENT)
  return div
}

/** Finds the row of the escaping table that documents `character`. */
function escapeRow(doc: HTMLDivElement, character: string): string[] {
  const row = [...doc.querySelectorAll('tr')].find(
    tr => tr.children[0]?.textContent?.trim() === character,
  )
  if (!row) throw new Error(`no escaping-table row for ${character}`)
  return [...row.children].map(c => c.textContent?.trim() ?? '')
}

describe('DEFAULT_CONTENT', () => {
  it('renders without leaving raw markdown artefacts', () => {
    const html = renderMarkdown(DEFAULT_CONTENT)
    expect(html.length).toBeGreaterThan(1000)
    expect(html).not.toContain('undefined')
  })

  it('passes its own heading linter', () => {
    // The tutorial is the first thing every new user sees and the example the
    // linter is judged against, so it must not trip its own rules.
    expect(lintHeadings(DEFAULT_CONTENT)).toEqual([])
  })

  describe('the escaping table demonstrates escaping rather than performing it', () => {
    // Each Result cell must show the literal character. Rendering `*text*` as
    // italic text is the exact mistake the row is teaching readers to avoid.
    const cases: Array<[string, string, string]> = [
      ['Asterisk', '\\*text\\*', '*text*'],
      ['Underscore', '\\_text\\_', '_text_'],
      ['Backtick', '\\`code\\`', '`code`'],
      ['Hash', '\\# Not a heading', '# Not a heading'],
      ['Bracket', '\\[not a link\\]', '[not a link]'],
    ]

    for (const [character, escaped, result] of cases) {
      it(`shows ${character} escaped and literal`, () => {
        const [, escapedCell, resultCell] = escapeRow(renderTutorial(), character)
        expect(escapedCell).toBe(escaped)
        expect(resultCell).toBe(result)
      })
    }

    it('leaves no emphasis in the Result column', () => {
      const doc = renderTutorial()
      const row = [...doc.querySelectorAll('tr')].find(
        tr => tr.children[0]?.textContent?.trim() === 'Asterisk',
      )!
      expect(row.querySelectorAll('em, strong')).toHaveLength(0)
    })
  })
})
