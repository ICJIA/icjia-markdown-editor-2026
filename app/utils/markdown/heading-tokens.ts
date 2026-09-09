/**
 * @fileoverview Heading Token Analysis
 * @description Turns a markdown document's heading tokens into plain facts:
 * level, source line, label, and whether the heading renders anything at all.
 *
 * The linter and the outline navigator both need exactly this, and they must
 * never disagree about it — an outline that lists a heading the linter cannot
 * see, or labels it differently, is worse than no outline. So the walk lives
 * here once and both consume its output.
 *
 * Parsing uses the same markdown-it singleton that renders the preview and the
 * HTML export, so neither can disagree with the rendered document either. That
 * also handles two cases a regex over `^#{1,6}\s` gets wrong: hashes inside
 * fenced code blocks (not headings) and setext underlines (headings). Parsing
 * always passes its own env, so it cannot disturb footnote numbering or anchor
 * slugs on the shared instance.
 *
 * Known limitation, from `html: true`: a literal `<h4>Section</h4>` arrives as
 * an `html_block` token and is invisible here, so raw HTML headings are neither
 * linted nor listed.
 *
 * @module utils/markdown/heading-tokens
 * @requires ~/utils/markdown/config
 */

import type Token from 'markdown-it/lib/token.mjs'
import { getMarkdownIt } from '~/utils/markdown/config'

/** One heading, as both the linter and the outline see it. */
export interface ParsedHeading {
  /** 1-based line number in the markdown source. */
  line: number
  /** Heading level, 1–6. */
  level: number
  /** Rendered text with decoration removed; empty when the heading renders nothing. */
  text: string
  /** Whether the heading renders anything a reader would perceive. */
  hasVisibleContent: boolean
}

/**
 * Tokens that wrap or annotate content without rendering any text of their own:
 * markdown-it-anchor's permalink `link_open`/`span_open`/… decoration, the
 * `strong_open`/`em_open`/… emphasis pairs, and raw inline HTML tags (`html: true`
 * is enabled, so `<em>` arrives as `html_inline` whose content is the tag markup).
 */
export function isDecoration(type: string): boolean {
  return type === 'html_inline' || type.endsWith('_open') || type.endsWith('_close')
}

/** An image's alt text, parsed. `token.content` holds the raw, unparsed alt instead. */
export function altText(image: Token): string {
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
export function hasVisibleContent(inline: Token | undefined): boolean {
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
 * The reader-visible text of a heading, for use as a label.
 *
 * Built from token types for the same reason as `hasVisibleContent`: decoration
 * carries text that is not rendered, and images render text that is not in
 * `content`. Footnote references are skipped rather than rendered as `[1]` — an
 * outline row reads better as "Findings" than "Findings1" — and line breaks
 * inside a multi-line heading become single spaces so the label stays one line.
 *
 * @param {Token | undefined} inline - The inline token following `heading_open`
 * @returns {string} Label text, empty when the heading renders nothing
 */
export function headingText(inline: Token | undefined): string {
  const parts: string[] = []
  for (const child of inline?.children ?? []) {
    if (isDecoration(child.type)) continue
    if (child.type === 'footnote_ref') continue
    if (child.type === 'softbreak' || child.type === 'hardbreak') {
      parts.push(' ')
      continue
    }
    if (child.type === 'image') {
      parts.push(altText(child))
      continue
    }
    parts.push(child.content)
  }
  return parts.join('').replace(/\s+/g, ' ').trim()
}

/**
 * Parses every markdown heading in a document, in source order.
 *
 * @param {string} markdown - The markdown source
 * @returns {ParsedHeading[]} One entry per heading, empty when there are none
 *
 * @example
 * ```typescript
 * parseHeadings('# Title\n\n## Section')
 * // [{ line: 1, level: 1, text: 'Title', hasVisibleContent: true },
 * //  { line: 3, level: 2, text: 'Section', hasVisibleContent: true }]
 * ```
 */
export function parseHeadings(markdown: string): ParsedHeading[] {
  const tokens = getMarkdownIt().parse(markdown, {})
  const headings: ParsedHeading[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type !== 'heading_open') continue

    // The inline token immediately after heading_open holds the heading's children.
    const inline = tokens[i + 1]
    headings.push({
      line: (token.map?.[0] ?? 0) + 1,
      level: Number(token.tag.slice(1)),
      text: headingText(inline),
      hasVisibleContent: hasVisibleContent(inline),
    })
  }

  return headings
}
