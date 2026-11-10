/**
 * Serves dist/ the way Netlify does, for local checks and the browser tests.
 *
 * A plain static server (`npx serve dist`) sends none of the security headers,
 * so a page that works under it can still be broken in production by its own
 * Content-Security-Policy. This sends the headers from both places Netlify
 * reads them — the [[headers]] blocks in netlify.toml and dist/_headers — so
 * what is tested is what is deployed.
 *
 * HSTS is left out: it is meaningless over http and would make a browser refuse
 * plain-http localhost afterwards.
 *
 *   node scripts/serve-dist.mjs [port]     default 4173
 */
import http from 'node:http'
import { existsSync, readFileSync, statSync, createReadStream } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const root = resolve('dist')
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173)

if (!existsSync(join(root, 'index.html'))) {
  console.error('dist/index.html not found. Run `yarn generate` first.')
  process.exit(1)
}

/** @returns {{ pattern: string, headers: Record<string, string> }[]} */
function rulesFromToml() {
  const toml = readFileSync(resolve('netlify.toml'), 'utf8')
  return toml.split('[[headers]]').slice(1).map((block) => {
    const pattern = block.match(/^for\s*=\s*"(.*)"/m)?.[1] ?? '/*'
    const headers = Object.fromEntries(
      [...block.matchAll(/^([A-Za-z-]+)\s*=\s*"(.*)"\s*$/gm)].map(m => [m[1], m[2]]),
    )
    return { pattern, headers }
  })
}

/** @returns {{ pattern: string, headers: Record<string, string> }[]} */
function rulesFromHeadersFile() {
  const file = join(root, '_headers')
  if (!existsSync(file)) return []
  const rules = []
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), headers: {} })
    } else if (rules.length) {
      const colon = line.indexOf(':')
      rules.at(-1).headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
    }
  }
  return rules
}

const rules = [...rulesFromToml(), ...rulesFromHeadersFile()]

function matches(pattern, path) {
  return pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern
}

function headersFor(path) {
  const out = {}
  for (const { pattern, headers } of rules) {
    if (matches(pattern, path)) Object.assign(out, headers)
  }
  delete out['Strict-Transport-Security']
  return out
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

http.createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  let file = join(root, path)
  if (!file.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  const headers = headersFor(path)
  if (!existsSync(file)) {
    res.writeHead(404, { ...headers, 'Content-Type': TYPES['.html'] })
    createReadStream(join(root, '404.html')).pipe(res)
    return
  }
  res.writeHead(200, { ...headers, 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, () => {
  console.log(`dist/ on http://localhost:${port} with Netlify's headers`)
})
