/**
 * @fileoverview Heading Hierarchy Linter
 * @description Reports heading problems that would make a published document
 * fail an accessibility checker's heading-order rule.
 *
 * Documents authored here are published through Strapi, which renders the page
 * title as the page's <h1> and injects this markdown beneath it. The linter
 * therefore seeds its traversal with a "virtual h1": a document must open at
 * h2, must not contain an h1 of its own, and may never skip a level.
 *
 * Parsing uses the same markdown-it singleton that renders the preview and the
 * HTML export, so the linter cannot disagree with the output. This also handles
 * two cases a regex over `^#{1,6}\s` gets wrong: hashes inside fenced code
 * blocks (not headings) and setext underlines (headings). Linting only ever calls
 * `parse()` with its own env, so it cannot disturb footnote numbering or anchor
 * slugs on the shared instance.
 *
 * Two questions are answered from two different sources, on purpose:
 *   - "Is this heading empty?" comes from token *types*, because only the token
 *     stream knows a `footnote_ref` renders a visible marker while `<em></em>`
 *     renders nothing.
 *   - "What should we suggest the author type?" comes from the *source line*,
 *     because only the source preserves the footnote references, code spans, and
 *     emphasis that a token-rebuilt string would silently drop.
 *
 * Known limitations, both stemming from `html: true`:
 *   - A literal `<h4>Section</h4>` arrives as an `html_block` token and is invisible
 *     here, so raw HTML headings are not linted at all.
 *   - Raw inline HTML inside a heading is treated as carrying no text, so
 *     `## <img src="x.png" alt="Chart">` reads as an empty heading even though the
 *     rendered image has an accessible name. Use markdown (`## ![Chart](x.png)`) to
 *     have it counted.
 *
 * @module utils/markdown/heading-lint
 * @requires ~/utils/markdown/config
 */

import type Token from 'markdown-it/lib/token.mjs'
import { getMarkdownIt } from '~/utils/markdown/config'

/** The rules this linter enforces. */
export type HeadingRule = 'no-h1' | 'heading-order' | 'empty-heading'

/** A single heading problem, anchored to a 1-based editor line. */
export interface HeadingIssue {
  /** 1-based line number in the markdown source. */
  line: number
  /** Which rule was violated. */
  rule: HeadingRule
  /** Errors break the published hierarchy; warnings are authoring slips. */
  severity: 'error' | 'warning'
  /** Author-facing text that names the fix. */
  message: string
}

/** Strapi renders the page title as an <h1> above this document. */
const VIRTUAL_H1_LEVEL = 1

/**
 * Tokens that wrap or annotate content without rendering any text of their own:
 * markdown-it-anchor's permalink `link_open`/`span_open`/… decoration, the
 * `strong_open`/`em_open`/… emphasis pairs, and raw inline HTML tags (`html: true`
 * is enabled, so `<em>` arrives as `html_inline` whose content is the tag markup).
 */
function isDecoration(type: string): boolean {
  return type === 'html_inline' || type.endsWith('_open') || type.endsWith('_close')
}

/** An image's alt text, parsed. `token.content` holds the raw, unparsed alt instead. */
function altText(image: Token): string {
  return (image.children ?? [])
    .filter(child => !isDecoration(child.type))
    .map(child => child.content)
    .join('')
    .trim()
}

/**
 * Whether a heading renders anything a reader or screen reader would perceive.
 *
 * This is deliberately NOT "is the joined `.content` non-empty". `token.content` is
 * not a proxy for rendered text: a `footnote_ref` renders a visible `[1]` marker but
 * carries `content: ''`, so joining content would call `## [^1]` an empty heading —
 * and footnote references are a headline feature of this editor. Conversely
 * `html_inline` carries `'<em>'` yet `## <em></em>` renders nothing at all.
 *
 * So emptiness is decided by token *type*, which is the only thing that knows what a
 * token will render.
 */
function hasVisibleContent(inline: Token | undefined): boolean {
  for (const child of inline?.children ?? []) {
    if (isDecoration(child.type)) continue
    // Line breaks separate content; they are not content.
    if (child.type === 'softbreak' || child.type === 'hardbreak') continue
    // Renders its marker from `token.meta`, never from `token.content`.
    if (child.type === 'footnote_ref') return true
    // An image contributes its alt text; without alt it has no accessible name.
    if (child.type === 'image') {
      if (altText(child)) return true
      continue
    }
    if (child.content.trim()) return true
  }
  return false
}

/**
 * The heading's text exactly as the author wrote it, taken from the source lines.
 * Returns `''` when the source cannot be quoted back safely.
 *
 * The `no-h1` message quotes this as markdown the author should type, so it has to
 * round-trip their source. Rebuilding it from the token stream cannot: joining
 * children silently drops footnote references, code spans, emphasis markers, and
 * images, and an author who copied that suggestion would delete content from their
 * document.
 *
 * The parser still decides *what is a heading* and *where it starts* — this only
 * slices the source range the parser already identified, so fenced code blocks and
 * setext underlines remain correctly handled. Where the slice cannot be trusted, we
 * return `''` and the caller falls back to a message that quotes nothing: saying
 * nothing beats saying something wrong.
 *
 * The untrustworthy case is a heading nested in a container block. `# Title` inside a
 * blockquote or list item occupies the source line `> # Title`, which still carries
 * the container's prefix. Quoting it would tell the author to type `## > # Title`.
 * We detect that by requiring the line to actually begin with the hash run the parser
 * recorded in `token.markup`, and by requiring a setext underline to be a bare run of
 * `=` or `-`.
 */
function headingSourceText(token: Token, lines: string[]): string {
  const [start, end] = token.map ?? [0, 0]

  // ATX (`## Foo`): `token.markup` is the exact opening hash run.
  if (token.markup.startsWith('#')) {
    const raw = lines[start] ?? ''
    // Up to 3 leading spaces are allowed; a container prefix is not.
    const opening = raw.match(/^ {0,3}(#{1,6})(?:[ \t]+|$)/)
    if (!opening || opening[1] !== token.markup) return ''

    return raw
      .slice(opening[0].length)
      // Optional ATX closing sequence (`## Foo ##`). It must be preceded by
      // whitespace, so a heading that legitimately ends in a hash (`# C#`) survives.
      .replace(/[ \t]+#+[ \t]*$/, '')
      .trim()
  }

  // Setext (`Foo` over `===`): the underline is the last line of the token's range.
  // If it is not a bare run of `=` or `-`, the heading sits inside a container.
  const underline = (lines[end - 1] ?? '').trim()
  if (!/^(?:=+|-+)$/.test(underline)) return ''

  // The text is every line above the underline. The renderer joins them with a space
  // rather than fusing the words together.
  return lines
    .slice(start, end - 1)
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ')
}

/**
 * Lints a markdown document's heading hierarchy.
 * Issues are returned in source order.
 *
 * @param {string} markdown - The markdown source
 * @returns {HeadingIssue[]} Every heading problem found, empty when clean
 *
 * @example
 * ```typescript
 * lintHeadings('## A\n\n#### D')
 * // [{ line: 3, rule: 'heading-order', severity: 'error', message: 'Heading skips from h2 to h4. Use h3.' }]
 * ```
 */
export function lintHeadings(markdown: string): HeadingIssue[] {
  const tokens = getMarkdownIt().parse(markdown, {})
  const lines = markdown.split('\n')
  const issues: HeadingIssue[] = []

  // Seeded to the page-title h1 that Strapi supplies, not to the first heading
  // we happen to see. This is what makes a document opening at h3 an error.
  let prevLevel = VIRTUAL_H1_LEVEL

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type !== 'heading_open') continue

    const level = Number(token.tag.slice(1))
    const line = (token.map?.[0] ?? 0) + 1
    // The inline token immediately after heading_open holds the heading's children.
    const inlineToken = tokens[i + 1]

    if (level === VIRTUAL_H1_LEVEL) {
      // Quote the author's own source, so the suggestion never drops a footnote
      // reference, code span, or emphasis they wrote.
      const source = headingSourceText(token, lines)
      issues.push({
        line,
        rule: 'no-h1',
        severity: 'error',
        message: source
          ? `H1 is reserved for the page title. Use "## ${source}" instead.`
          : 'H1 is reserved for the page title. Use ## instead.',
      })
      // Keep the baseline at h1 so the next heading is judged against the page
      // title rather than against a heading we just rejected.
      prevLevel = VIRTUAL_H1_LEVEL
      continue
    }

    if (!hasVisibleContent(inlineToken)) {
      issues.push({
        line,
        rule: 'empty-heading',
        severity: 'warning',
        message: `Empty h${level} heading. Add text or remove it.`,
      })
    }

    if (level > prevLevel + 1) {
      issues.push({
        line,
        rule: 'heading-order',
        severity: 'error',
        message: `Heading skips from h${prevLevel} to h${level}. Use h${prevLevel + 1}.`,
      })
    }

    prevLevel = level
  }

  return issues
}
