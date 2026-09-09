/**
 * @fileoverview Document Outline
 * @description Builds the navigable outline the status-bar panel shows, and
 * works out which entry the cursor is currently inside.
 *
 * The headings come from `parseHeadings`, shared with the linter, so the outline
 * lists exactly what the linter checks and labels it the same way. Raw HTML
 * headings appear in neither — see `heading-tokens` for why.
 *
 * @module utils/markdown/outline
 * @requires ~/utils/markdown/heading-tokens
 */

import { parseHeadings } from '~/utils/markdown/heading-tokens'

/** Shown in place of a label for a heading that renders nothing. */
const EMPTY_LABEL = '(empty heading)'

/** One row of the outline. */
export interface OutlineEntry {
  /** 1-based line number in the markdown source. */
  line: number
  /** Heading level, 1–6, used to indent the row. */
  level: number
  /** Label to display. */
  text: string
}

/**
 * Builds the document outline, in source order.
 *
 * A heading that renders nothing still gets a row rather than being dropped: it
 * occupies a place in the document's structure, the linter has flagged it, and a
 * row is what lets the author jump to it and fix it.
 *
 * @param {string} markdown - The markdown source
 * @returns {OutlineEntry[]} One entry per heading, empty when there are none
 *
 * @example
 * ```typescript
 * buildOutline('# Report\n\n## Method')
 * // [{ line: 1, level: 1, text: 'Report' }, { line: 3, level: 2, text: 'Method' }]
 * ```
 */
export function buildOutline(markdown: string): OutlineEntry[] {
  return parseHeadings(markdown).map(({ line, level, text, hasVisibleContent }) => ({
    line,
    level,
    text: hasVisibleContent && text ? text : EMPTY_LABEL,
  }))
}

/**
 * The index of the outline entry the cursor currently sits within.
 *
 * "Within" means at or below that heading and above the next one, so moving the
 * cursor through a section keeps that section highlighted. Returns -1 when the
 * cursor is above the first heading, which is a real position in a document that
 * opens with a paragraph — the caller should highlight nothing rather than
 * guessing at the first entry.
 *
 * @param {OutlineEntry[]} entries - The outline, in source order
 * @param {number} cursorLine - 1-based line the cursor is on
 * @returns {number} Index into `entries`, or -1 for none
 */
export function activeOutlineIndex(entries: OutlineEntry[], cursorLine: number): number {
  let active = -1
  for (let i = 0; i < entries.length; i++) {
    if (entries[i]!.line <= cursorLine) active = i
    else break
  }
  return active
}
