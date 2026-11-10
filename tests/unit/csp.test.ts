import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
// @ts-expect-error - plain .mjs build script, no type declarations
import { inlineScriptHashes, buildCsp, writeCspHeader } from '../../scripts/csp.mjs'

const hashOf = (body: string) => `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`

describe('inlineScriptHashes', () => {
  it('hashes an inline script exactly as the browser will', () => {
    const body = 'window.__NUXT__={};'
    expect(inlineScriptHashes(`<html><script>${body}</script></html>`)).toEqual([hashOf(body)])
  })

  it('hashes an inline import map, which script-src governs too', () => {
    const body = '{"imports":{"#entry":"/_nuxt/a.js"}}'
    expect(inlineScriptHashes(`<script type="importmap">${body}</script>`)).toEqual([hashOf(body)])
  })

  it('hashes inline module scripts', () => {
    expect(inlineScriptHashes('<script type="module">import "/a.js"</script>')).toHaveLength(1)
  })

  it('skips external scripts, which \'self\' already covers', () => {
    expect(inlineScriptHashes('<script type="module" src="/_nuxt/a.js" crossorigin></script>')).toEqual([])
  })

  it('skips data blocks, which are never executed', () => {
    const html = [
      '<script type="application/json" id="__NUXT_DATA__">[1,2]</script>',
      '<script type="application/ld+json">{"@type":"WebApplication"}</script>',
    ].join('')
    expect(inlineScriptHashes(html)).toEqual([])
  })

  it('preserves whitespace inside the script, since a hash covers every byte', () => {
    expect(inlineScriptHashes('<script>\n  a()\n</script>')).toEqual([hashOf('\n  a()\n')])
  })

  it('returns every script on the page, in order', () => {
    expect(inlineScriptHashes('<script>a()</script><p>x</p><script>b()</script>'))
      .toEqual([hashOf('a()'), hashOf('b()')])
  })
})

describe('buildCsp', () => {
  const policy = buildCsp([`'sha256-abc='`])
  const directive = (name: string) => policy.split('; ').find((d: string) => d.startsWith(`${name} `))

  it('allows this origin and the hashed scripts, and nothing inline', () => {
    expect(directive('script-src')).toBe(`script-src 'self' 'sha256-abc='`)
    expect(directive('script-src')).not.toContain('unsafe')
  })

  it('still builds a strict script policy when there are no inline scripts', () => {
    expect(buildCsp([])).toContain(`script-src 'self';`)
  })

  it('keeps the directives that make a sanitizer bypass unexploitable', () => {
    for (const expected of [
      `default-src 'self'`,
      `worker-src 'self'`,
      `connect-src 'self'`,
      `form-action 'none'`,
      `frame-src 'none'`,
      `object-src 'none'`,
      `base-uri 'none'`,
      `frame-ancestors 'none'`,
    ]) {
      expect(policy).toContain(expected)
    }
  })
})

describe('writeCspHeader', () => {
  function site(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'csp-test-'))
    for (const [name, content] of Object.entries(files)) {
      mkdirSync(join(dir, name, '..'), { recursive: true })
      writeFileSync(join(dir, name), content)
    }
    return dir
  }

  it('appends one policy covering every page, keeping existing header rules', () => {
    const dir = site({
      'index.html': '<script>a()</script>',
      'about/index.html': '<script>a()</script><script>b()</script>',
      '_headers': '/_nuxt/*\n  cache-control: public, max-age=31536000, immutable\n',
    })
    const result = writeCspHeader(dir)
    const headers = readFileSync(join(dir, '_headers'), 'utf8')

    expect(result).toMatchObject({ pages: 2, hashes: 2 })
    expect(headers).toContain('/_nuxt/*\n  cache-control: public')
    expect(headers).toMatch(/\n\/\*\n {2}Content-Security-Policy: default-src 'self'; script-src 'self' /)
    expect(headers).toContain(hashOf('a()'))
    expect(headers).toContain(hashOf('b()'))
  })

  it('refuses to write a second policy', () => {
    const dir = site({ 'index.html': '<script>a()</script>' })
    writeCspHeader(dir)
    expect(() => writeCspHeader(dir)).toThrow(/already sets/)
  })

  it('fails rather than deploy a site with no pages to protect', () => {
    expect(() => writeCspHeader(site({ 'robots.txt': '' }))).toThrow(/No HTML files/)
    expect(() => writeCspHeader(join(tmpdir(), 'does-not-exist-csp'))).toThrow(/does not exist/)
  })
})
