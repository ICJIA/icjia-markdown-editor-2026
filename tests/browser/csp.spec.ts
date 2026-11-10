import { test, expect } from '@playwright/test'
import { openEditorWith, seedDraft, watchForProblems } from './helpers'

/**
 * The Content-Security-Policy, as the browser enforces it.
 *
 * The policy is generated at build time (scripts/csp.mjs), so the failure this
 * guards against is specific: a Nuxt upgrade changes an inline script, the
 * hashes no longer match, and the site deploys as a blank page. A policy that
 * is too loose fails here too.
 */

test('the policy allows no inline script, only hashes', async ({ request }) => {
  const response = await request.get('/')
  const policy = response.headers()['content-security-policy'] ?? ''
  const scriptSrc = policy.split(';').map(d => d.trim()).find(d => d.startsWith('script-src')) ?? ''

  expect(scriptSrc).toContain(`'self'`)
  expect(scriptSrc).toMatch(/'sha256-[A-Za-z0-9+/=]+'/)
  expect(scriptSrc).not.toContain('unsafe-inline')
  expect(scriptSrc).not.toContain('unsafe-eval')
  expect(policy).toContain(`object-src 'none'`)
  expect(policy).toContain(`base-uri 'none'`)
  expect(policy).toContain(`form-action 'none'`)
  expect(policy).toContain(`frame-ancestors 'none'`)
})

test('the other security headers are sent', async ({ request }) => {
  const headers = (await request.get('/')).headers()
  expect(headers['cross-origin-opener-policy']).toBe('same-origin')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')
})

for (const path of ['/', '/technical-details/']) {
  test(`${path} loads under the policy with nothing blocked and no console errors`, async ({ page }) => {
    const problems = watchForProblems(page)
    await seedDraft(page, null)
    await page.goto(path)
    // Proof the app actually started: hydration ran and produced rendered markdown.
    await page.locator(path === '/' ? '.preview-content h2' : '.td-demo-output h2').first().waitFor()
    await page.waitForTimeout(500)
    expect(problems).toEqual([])
  })
}

test('the preview is rendered by the worker, which the policy permits', async ({ page }) => {
  const workers: string[] = []
  page.on('worker', worker => workers.push(worker.url()))
  await openEditorWith(page, '# From the worker\n\nBody.\n')
  await expect(page.locator('.preview-content h1')).toHaveText('From the worker')
  expect(workers.some(url => url.includes('markdown.worker'))).toBe(true)
})

test('script injected into the live page is refused by the browser', async ({ page }) => {
  // This is what a sanitizer bypass would amount to: markup with a handler, or
  // a script element, landing in the document. Under 'unsafe-inline' both ran.
  await openEditorWith(page, '# Probe\n')
  await expect(page.locator('.preview-content h1')).toHaveText('Probe')

  await page.evaluate(() => {
    const img = document.createElement('img')
    img.setAttribute('onerror', 'window.__handlerRan = true')
    img.src = '/does-not-exist.png'
    document.body.appendChild(img)

    const script = document.createElement('script')
    script.textContent = 'window.__scriptRan = true'
    document.body.appendChild(script)
  })
  await page.waitForTimeout(500)

  const ran = await page.evaluate(() => {
    const w = window as unknown as { __handlerRan?: boolean, __scriptRan?: boolean }
    return { handler: w.__handlerRan, script: w.__scriptRan }
  })
  expect(ran).toEqual({ handler: undefined, script: undefined })
})
