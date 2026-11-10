import { test as base, type Page, type ConsoleMessage } from '@playwright/test'

/**
 * `test`, with one difference: requests for Netlify's deploy-preview toolbar
 * are blocked.
 *
 * Netlify injects `/.netlify/scripts/cdp` into deploy previews, and only into
 * previews. It frames app.netlify.com, which this site's policy refuses
 * (`frame-src 'none'`), so on a preview it logs a console error and stalls a
 * reload — neither of which happens in production, where the script is not
 * injected. Blocking it makes a run against a preview test what production
 * serves. Against a local build the route never matches.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Answered with an empty script rather than aborted: an aborted request is
    // itself a console error, which is what the tests are listening for.
    await page.route('**/.netlify/scripts/**', route =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
    await use(page)
  },
})

export { expect } from '@playwright/test'

export const AUTOSAVE_KEY = 'icjia-markdown-editor-autosave'
const TOUR_KEY = 'icjia-markdown-editor-tour-v8'

/**
 * Makes the next page load start with `content` as the saved draft and the
 * first-visit welcome dialog already dismissed.
 *
 * Seeded once per browser context: an init script runs on every navigation, and
 * re-seeding on a reload would overwrite whatever the test was checking the
 * editor had saved.
 */
export async function seedDraft(page: Page, content: string | null): Promise<void> {
  await page.addInitScript(({ content, autosaveKey, tourKey }) => {
    if (sessionStorage.getItem('test-seeded')) return
    sessionStorage.setItem('test-seeded', '1')
    localStorage.setItem(tourKey, 'true')
    if (content !== null) {
      localStorage.setItem(autosaveKey, JSON.stringify({ content, savedAt: Date.now(), version: 1 }))
    }
  }, { content, autosaveKey: AUTOSAVE_KEY, tourKey: TOUR_KEY })
}

/** Opens the editor on a document and waits for the preview to render it. */
export async function openEditorWith(page: Page, content: string): Promise<void> {
  await seedDraft(page, content)
  await page.goto('/')
  await page.locator('.preview-content').waitFor()
}

/** The draft as it currently sits in storage. */
export async function storedDraft(page: Page): Promise<string | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw).content as string) : null
  }, AUTOSAVE_KEY)
}

/**
 * Collects console errors and Content-Security-Policy reports for a page.
 * Call before navigating.
 */
export function watchForProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  page.on('pageerror', error => problems.push(`uncaught: ${error.message}`))
  return problems
}
