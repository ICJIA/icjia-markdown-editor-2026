import { describe, it, expect } from 'vitest'
import { sanitizeFilename } from '~/utils/filename'

const FALLBACK = 'document.md'

describe('sanitizeFilename', () => {
  it('appends the extension when missing', () => {
    expect(sanitizeFilename('report', '.md', FALLBACK)).toBe('report.md')
  })

  it('does not double up an extension that is already correct', () => {
    expect(sanitizeFilename('report.md', '.md', FALLBACK)).toBe('report.md')
  })

  it('swaps a different known extension for the required one', () => {
    expect(sanitizeFilename('notes.txt', '.md', FALLBACK)).toBe('notes.md')
    expect(sanitizeFilename('page.html', '.md', FALLBACK)).toBe('page.md')
  })

  it('keeps the extension when the name contains consecutive dots', () => {
    // The old order stripped ".." from the suffixed name and produced "amd".
    expect(sanitizeFilename('a..md', '.md', FALLBACK)).toBe('a.md')
    expect(sanitizeFilename('....md', '.md', FALLBACK)).toBe(FALLBACK)
    expect(sanitizeFilename('Q1..Q2 report', '.md', FALLBACK)).toBe('Q1Q2 report.md')
  })

  it('removes path traversal and separators', () => {
    expect(sanitizeFilename('../../etc/passwd', '.md', FALLBACK)).toBe('etcpasswd.md')
    expect(sanitizeFilename('q1/q2 report', '.md', FALLBACK)).toBe('q1q2 report.md')
  })

  it('strips characters the filesystem rejects', () => {
    expect(sanitizeFilename('a<b>c:d"e|f?g*h', '.md', FALLBACK)).toBe('abcdefgh.md')
  })

  it('strips leading dots so the file is not hidden', () => {
    expect(sanitizeFilename('.hidden', '.md', FALLBACK)).toBe('hidden.md')
  })

  it('drops trailing dots and spaces that Windows would discard', () => {
    expect(sanitizeFilename('report...', '.md', FALLBACK)).toBe('report.md')
    expect(sanitizeFilename('report   ', '.md', FALLBACK)).toBe('report.md')
  })

  it('keeps the extension on an over-long name', () => {
    const result = sanitizeFilename('x'.repeat(300), '.md', FALLBACK)
    expect(result.endsWith('.md')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(255)
  })

  it('falls back when nothing usable remains', () => {
    expect(sanitizeFilename('', '.md', FALLBACK)).toBe(FALLBACK)
    expect(sanitizeFilename('   ', '.md', FALLBACK)).toBe(FALLBACK)
    expect(sanitizeFilename('///', '.md', FALLBACK)).toBe(FALLBACK)
  })

  it('handles the html extension the same way', () => {
    expect(sanitizeFilename('report', '.html', 'document.html')).toBe('report.html')
    expect(sanitizeFilename('report.md', '.html', 'document.html')).toBe('report.html')
  })
})
