import type { Page, ConsoleMessage } from '@playwright/test'

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
