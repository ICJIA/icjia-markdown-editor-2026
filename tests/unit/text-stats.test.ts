import { describe, it, expect } from 'vitest'
import { stripMarkdownSyntax, computeWordCount } from '~/utils/markdown/text-stats'

describe('stripMarkdownSyntax', () => {
  it('removes heading markers but keeps heading text', () => {
    expect(stripMarkdownSyntax('## Hello World')).toBe('Hello World')
  })

  it('unwraps bold, italic, and bold+italic', () => {
    expect(stripMarkdownSyntax('***both*** **bold** *italic* _underscore_')).toBe('both bold italic underscore')
  })

  it('unwraps strikethrough, mark, and inline code', () => {
    expect(stripMarkdownSyntax('~~gone~~ ==marked== `code`')).toBe('gone marked code')
  })

  it('removes fenced code blocks entirely', () => {
    expect(stripMarkdownSyntax('before\n```js\nconst x = 1\n```\nafter')).toBe('before\n\nafter')
  })

  it('keeps link text and drops the URL', () => {
    expect(stripMarkdownSyntax('[ICJIA](https://icjia.illinois.gov)')).toBe('ICJIA')
  })

  it('removes images including alt text', () => {
    expect(stripMarkdownSyntax('![a photo](pic.jpg) end')).toBe(' end')
  })

  it('removes list markers, blockquote markers, and horizontal rules', () => {
    expect(stripMarkdownSyntax('- item\n1. numbered\n> quoted\n---')).toBe('item\nnumbered\nquoted\n')
  })
})

describe('computeWordCount', () => {
  it('counts words, characters, lines, and paragraphs of a markdown doc', () => {
    const doc = '# Title\n\nOne two three.\n\nFour five.'
    const stats = computeWordCount(doc)
    expect(stats.words).toBe(6) // Title One two three. Four five.
    expect(stats.lines).toBe(5)
    expect(stats.paragraphs).toBe(3)
    expect(stats.characters).toBeGreaterThan(0)
  })

  it('returns all zeros for empty input', () => {
    expect(computeWordCount('')).toEqual({
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 0,
      paragraphs: 0,
      readingTime: 0,
    })
  })

  it('returns all zeros for markdown-only input with no prose', () => {
    expect(computeWordCount('---').words).toBe(0)
  })

  it('reports a minimum reading time of 1 minute for non-empty text', () => {
    expect(computeWordCount('hello world').readingTime).toBe(1)
  })

  it('computes reading time at 200 words per minute', () => {
    const fourHundredWords = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ')
    expect(computeWordCount(fourHundredWords).readingTime).toBe(2)
  })
})
