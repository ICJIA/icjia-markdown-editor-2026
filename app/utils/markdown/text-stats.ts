/**
 * @fileoverview Markdown Text Statistics
 * @description Pure functions for stripping markdown syntax and computing
 * word count statistics. Extracted from useMarkdown so the logic is unit
 * testable and shared by the singleton composable state.
 *
 * @module utils/markdown/text-stats
 */

/** Word count statistics for a markdown document. */
export interface WordCountStats {
  words: number
  characters: number
  charactersNoSpaces: number
  lines: number
  paragraphs: number
  readingTime: number
}

const EMPTY_STATS: WordCountStats = {
  words: 0,
  characters: 0,
  charactersNoSpaces: 0,
  lines: 0,
  paragraphs: 0,
  readingTime: 0,
}

/**
 * Strips markdown syntax from text, leaving readable prose.
 * Code blocks and images are removed entirely; links keep their text.
 *
 * @param {string} markdown - The markdown source
 * @returns {string} Plain text with markdown syntax removed
 */
export function stripMarkdownSyntax(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '') // code blocks (before inline code so fences aren't mangled)
    .replace(/!\[.*?\]\(.+?\)/g, '') // images (before links so the alt text isn't kept)
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // inline links
    .replace(/\[(.+?)\]\[.+?\]/g, '$1') // reference links
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // bold+italic
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic (asterisk)
    .replace(/_(.+?)_/g, '$1') // italic (underscore)
    .replace(/~~(.+?)~~/g, '$1') // strikethrough
    .replace(/==(.+?)==/g, '$1') // highlight/mark
    .replace(/`(.+?)`/g, '$1') // inline code
    .replace(/^\s*\[.\]\s/gm, '') // task list markers (before list markers)
    .replace(/^\s*[-*+]\s/gm, '') // list markers
    .replace(/^\s*\d+\.\s/gm, '') // numbered lists
    .replace(/^\s*>\s/gm, '') // blockquotes
    .replace(/---/g, '') // horizontal rules
    .replace(/\|[^|]*\|/g, '') // table cells
}

/**
 * Computes word count statistics for a markdown document.
 * Word and character counts use the stripped plain text; line and
 * paragraph counts use the raw markdown source.
 *
 * @param {string} markdown - The markdown source
 * @returns {WordCountStats} Word count statistics (all zeros when there is no prose)
 */
export function computeWordCount(markdown: string): WordCountStats {
  const plain = stripMarkdownSyntax(markdown)
  const text = plain.trim()

  if (!text) {
    return { ...EMPTY_STATS }
  }

  const words = text.split(/\s+/).filter(Boolean).length

  return {
    words,
    characters: plain.length,
    charactersNoSpaces: plain.replace(/\s/g, '').length,
    lines: markdown.split('\n').length,
    paragraphs: markdown.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
    // Average adult reads 200-250 wpm; 200 gives a comfortable estimate
    readingTime: Math.max(1, Math.ceil(words / 200)),
  }
}
