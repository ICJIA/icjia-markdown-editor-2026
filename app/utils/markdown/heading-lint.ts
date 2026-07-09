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
 * blocks (not headings) and setext underlines (headings).
 *
 * Known limitation: markdown-it runs with `html: true`, so a literal
 * `<h4>Section</h4>` arrives as an `html_block` token and is invisible here.
 *
 * @module utils/markdown/heading-lint
 * @requires ~/utils/markdown/config
 */

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

  // Seeded to the page-title h1 that Strapi supplies, not to the first heading
  // we happen to see. This is what makes a document opening at h3 an error.
  let prevLevel = VIRTUAL_H1_LEVEL

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token?.type !== 'heading_open') continue

    const level = Number(token.tag.slice(1))
    const line = (token.map?.[0] ?? 0) + 1
    // The inline token immediately after heading_open carries the heading text.
    // Extract text from either the content property or by reconstructing from children.
    const inlineToken = tokens[i + 1]
    let text = ''
    if (inlineToken?.children) {
      text = inlineToken.children.map(child => child.content || '').join('').trim()
    } else if (inlineToken?.content) {
      text = inlineToken.content.trim()
    }

    if (level === VIRTUAL_H1_LEVEL) {
      issues.push({
        line,
        rule: 'no-h1',
        severity: 'error',
        message: text
          ? `H1 is reserved for the page title. Use "## ${text}" instead.`
          : 'H1 is reserved for the page title. Use ## instead.',
      })
      // Keep the baseline at h1 so the next heading is judged against the page
      // title rather than against a heading we just rejected.
      prevLevel = VIRTUAL_H1_LEVEL
      continue
    }

    if (text === '') {
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
