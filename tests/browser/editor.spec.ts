import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { openEditorWith, seedDraft, storedDraft } from './helpers'

const WCAG_AAA = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa', 'wcag22aa', 'best-practice']
const DRAFT = '# My irreplaceable report\n\nSix hours of work.\n'

test.describe('the render worker', () => {
  test('the outline and the heading check come from the same render as the preview', async ({ page }) => {
    await openEditorWith(page, '# Report\n\n### Skipped a level\n\n## Results\n')
    await expect(page.locator('.preview-content h1')).toHaveText('Report')
    await expect(page.locator('.outline-text')).toContainText('3 headings')
    await expect(page.locator('.issues-text')).toContainText('1')
  })

  test('typing updates the preview', async ({ page }) => {
    await openEditorWith(page, '# Before\n')
    await expect(page.locator('.preview-content h1')).toHaveText('Before')
    await page.locator('.cm-content').click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.type('# After')
    await expect(page.locator('.preview-content h1')).toHaveText('After')
  })

  test('a document that renders to more than the preview can show pauses it, and the page stays responsive', async ({ page }) => {
    // 30,000 inline formulas: 120 KB of markdown, more than 10 MB of KaTeX
    // markup. On the main thread this froze the tab for seconds, and auto-save
    // brought it back on every reload.
    await seedDraft(page, '$x$ '.repeat(30_000))
    await page.goto('/')

    // While the worker grinds, the main thread must keep answering promptly.
    await page.locator('.cm-content').waitFor()
    let slowest = 0
    const deadline = Date.now() + 4000
    while (Date.now() < deadline) {
      const started = Date.now()
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(null))))
      slowest = Math.max(slowest, Date.now() - started)
      if (await page.locator('.preview-paused').isVisible()) break
    }
    expect(slowest).toBeLessThan(1000)

    await expect(page.locator('.preview-paused')).toContainText('Preview paused', { timeout: 30_000 })
    await expect(page.locator('.preview-paused')).toContainText('Your text is safe')
    const { violations } = await new AxeBuilder({ page }).include('.preview-paused').withTags(WCAG_AAA).analyze()
    expect(violations.map(v => v.id)).toEqual([])

    // The editor still works, and the preview comes back when the document shrinks.
    await page.locator('.cm-content').click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.type('# Small again')
    await expect(page.locator('.preview-content h1')).toHaveText('Small again', { timeout: 30_000 })
    await expect(page.locator('.preview-paused')).toHaveCount(0)
  })
})

test.describe('the saved draft', () => {
  test('survives "Display Markdown Tutorial" and the reload the dialog recommends', async ({ page }) => {
    await openEditorWith(page, DRAFT)
    await expect(page.locator('.preview-content h1')).toHaveText('My irreplaceable report')

    page.on('dialog', dialog => dialog.accept())
    await page.locator('[data-tour="reset"]').click()
    await expect(page.locator('.preview-content h2').first()).toContainText('Welcome')

    // Longer than the two-second save that used to overwrite the draft.
    await page.waitForTimeout(3500)
    expect(await storedDraft(page)).toBe(DRAFT)

    // The reload fires beforeunload, which used to save the tutorial as well.
    await page.reload()
    await expect(page.locator('.preview-content h1')).toHaveText('My irreplaceable report')
  })

  test('is saved once the author edits', async ({ page }) => {
    await openEditorWith(page, DRAFT)
    await page.locator('.cm-content').click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.type('More.')
    await expect.poll(() => storedDraft(page), { timeout: 8000 }).toContain('More.')
  })
})

test.describe('recovery mode', () => {
  test('opens the editor without opening, rendering or overwriting the draft', async ({ page }) => {
    await seedDraft(page, DRAFT)
    await page.goto('/?recover')

    await expect(page.locator('.recovery')).toContainText('Recovery mode')
    await expect(page.locator('.recovery')).toContainText('7 words, 46 bytes')
    // The tutorial is showing, not the draft.
    await expect(page.locator('.preview-content h2').first()).toContainText('Welcome')
    await expect(page.locator('.preview-content')).not.toContainText('irreplaceable')

    // Editing in recovery mode must not touch the stored draft.
    await page.locator('.start-editing-overlay button').click()
    await page.locator('.cm-content').click()
    await page.keyboard.type('scratch text')
    await page.waitForTimeout(3500)
    expect(await storedDraft(page)).toBe(DRAFT)
  })

  test('downloads the draft exactly as stored', async ({ page }) => {
    await seedDraft(page, DRAFT)
    await page.goto('/?recover')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download the draft' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('recovered-draft.md')
    expect(readFileSync(await download.path(), 'utf8')).toBe(DRAFT)
  })

  test('hands the draft back to the editor on request', async ({ page }) => {
    await seedDraft(page, DRAFT)
    await page.goto('/?recover')
    await page.getByRole('button', { name: 'Open it in the editor' }).click()
    await expect(page.locator('.preview-content h1')).toHaveText('My irreplaceable report')
    await expect(page.locator('.recovery')).toHaveCount(0)
  })

  test('the banner has no axe-core violations at AAA', async ({ page }) => {
    await seedDraft(page, DRAFT)
    await page.goto('/?recover')
    await page.locator('.recovery').waitFor()
    const { violations } = await new AxeBuilder({ page }).include('.recovery').withTags(WCAG_AAA).analyze()
    expect(violations.map(v => v.id)).toEqual([])
  })

  test('says so when there is no draft', async ({ page }) => {
    await seedDraft(page, null)
    await page.goto('/?recover')
    await expect(page.locator('.recovery')).toContainText('There is no saved draft')
  })
})

test.describe('HTML export', () => {
  test('carries its own policy, runs no script, and is readable', async ({ page, context }, testInfo) => {
    await openEditorWith(page, [
      '# Quarterly report',
      '',
      'Arrests fell **12%**.',
      '',
      '<img src="/missing.png" onerror="document.title = \'pwned\'">',
      '',
    ].join('\n'))
    await expect(page.locator('.preview-content h1')).toHaveText('Quarterly report')

    await page.getByRole('button', { name: 'Download HTML' }).first().click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[role="dialog"] button').last().click(),
    ])
    // Saved under a real .html name: the browser decides how to open a local
    // file from its extension, and the temporary download path has none.
    const path = testInfo.outputPath('exported-report.html')
    await download.saveAs(path)
    const html = readFileSync(path, 'utf8')

    expect(html).toMatch(/<meta http-equiv="Content-Security-Policy" content="script-src 'none'/)
    expect(html).toContain('<title>Quarterly report</title>')
    expect(html).not.toContain('onerror')
    expect(html).not.toMatch(/<script/i)

    // Open the file the way a recipient would.
    const exported = await context.newPage()
    await exported.goto(`file://${path}`)
    await expect(exported.locator('h1')).toHaveText('Quarterly report')
    expect(await exported.title()).toBe('Quarterly report')

    const colours = await exported.evaluate(() => {
      const body = getComputedStyle(document.body)
      return { background: body.backgroundColor, text: body.color }
    })
    // 1.8.0 to 1.9.3 shipped light text on a transparent (white) page.
    expect(colours.background).toBe('rgb(13, 17, 23)')
    expect(colours.text).not.toBe(colours.background)
  })
})
