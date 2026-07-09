/**
 * @fileoverview Heading Hierarchy Linter
 * @description Reports heading problems that would make a published document
 * fail an accessibility checker's heading-order rule.
 *
 * The linter is deliberately neutral about publishing context. A standalone
 * document owns its title and opens at `#`; a CMS-published document opens at
 * `##` because the page supplies the `<h1>` (ICJIA's Strapi site does). Only
 * the author knows which they are writing, so — exactly like axe-core's
 * heading-order rule — the first heading is never flagged, at any level. It
 * sets the baseline; after it, descending more than one level at a time is an
 * error and ascending any distance is fine.
 *
 * Parsing uses the same markdown-it singleton that renders the preview and the
 * HTML export, so the linter cannot disagree with the output. This also handles
 * two cases a regex over `^#{1,6}\s` gets wrong: hashes inside fenced code
 * blocks (not headings) and setext underlines (headings). Linting only ever
 * calls `parse()` with its own env, so it cannot disturb footnote numbering or
 * anchor slugs on the shared instance.
 *
 * Emptiness is decided from token *types*, never from joined `.content`:
 * a `footnote_ref` renders a visible `[1]` marker while carrying
 * `content: ''`, and `## <em></em>` renders nothing while carrying markup text.
 *
 * Known limitations, both stemming from `html: true`:
 *   - A literal `<h4>Section</h4>` arrives as an `html_block` token and is
 *     invisible here, so raw HTML headings are not linted at all.
 *   - Raw inline HTML inside a heading is treated as carrying no text, so
 *     `## <img src="x.png" alt="Chart">` reads as an empty heading even though
 *     the rendered image has an accessible name. Use markdown
 *     (`## ![Chart](x.png)`) to have it counted.
 *
 * @module utils/markdown/heading-lint
 * @requires ~/utils/markdown/config
 */

import type Token from 'markdown-it/lib/token.mjs'
import { getMarkdownIt } from '~/utils/markdown/config'

/** The rules this linter enforces. */
export type HeadingRule = 'heading-order' | 'empty-heading'

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
  const issues: HeadingIssue[] = []

  // The first heading sets the baseline, whatever its level. axe-core's
  // heading-order rule never flags the first heading, because only the
  // publishing context knows what sits above the document — and the editor
  // does not presume to know it either.
  let prevLevel: number | null = null

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type !== 'heading_open') continue

    const level = Number(token.tag.slice(1))
    const line = (token.map?.[0] ?? 0) + 1
    // The inline token immediately after heading_open holds the heading's children.
    const inlineToken = tokens[i + 1]

    if (!hasVisibleContent(inlineToken)) {
      issues.push({
        line,
        rule: 'empty-heading',
        severity: 'warning',
        message: `Empty h${level} heading. Add text or remove it.`,
      })
    }

    if (prevLevel !== null && level > prevLevel + 1) {
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
