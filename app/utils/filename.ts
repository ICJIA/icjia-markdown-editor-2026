/**
 * @fileoverview Download Filename Sanitization
 * @description Turns whatever an author types into the download dialog into a
 * filename the operating system will accept, without losing the extension.
 *
 * Extracted from `useDownloadModal` so the rules are testable on their own —
 * the composable itself needs a Nuxt runtime, these rules do not.
 *
 * @module utils/filename
 */

/** Longest filename accepted on ext4/APFS/NTFS, in characters. */
const MAX_FILENAME_LENGTH = 255

/**
 * Sanitizes a user-supplied filename and guarantees the given extension.
 *
 * Order matters here, and getting it wrong is how the extension goes missing:
 * sanitization must run on the *stem*, before the extension is appended, not on
 * the finished name. Stripping `..` from the already-suffixed `a..md` yields
 * `amd` — a file with no extension that no OS will associate with an
 * application. Truncating the finished name has the same effect from the other
 * end, so the stem is truncated to leave room for the extension instead.
 *
 * @param {string} input - Raw filename typed by the author, with or without an extension
 * @param {string} extension - Required extension, including the leading dot (e.g. `.md`)
 * @param {string} fallback - Name to use when sanitizing leaves nothing usable
 * @returns {string} A filename that always ends in `extension`
 *
 * @example
 * ```typescript
 * sanitizeFilename('Q1 report', '.md', 'document.md')   // 'Q1 report.md'
 * sanitizeFilename('a..md', '.md', 'document.md')       // 'a.md'
 * sanitizeFilename('../../etc/passwd', '.md', 'x.md')   // 'etcpasswd.md'
 * ```
 */
export function sanitizeFilename(input: string, extension: string, fallback: string): string {
  // Work on the stem alone, so nothing below can damage the extension.
  const stem = input.trim().replace(/\.(md|markdown|html|htm|txt)$/i, '')

  const cleaned = stem
    .replace(/\.\./g, '') // path traversal
    .replace(/[<>:"/\\|?*]/g, '') // characters no OS accepts in a name
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, '') // control characters
    .replace(/^\.+/, '') // leading dots (hidden files)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FILENAME_LENGTH - extension.length)
    // Trailing dots and spaces are silently dropped by Windows.
    .replace(/[. ]+$/, '')

  return cleaned ? `${cleaned}${extension}` : fallback
}
