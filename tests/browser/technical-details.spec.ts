import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG_AAA = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa', 'wcag22aa', 'best-practice']

test.beforeEach(async ({ page }) => {
  await page.goto('/technical-details/')
  await page.locator('.td-demo-output h2').waitFor()
})

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`has no axe-core violations at AAA, ${viewport.width}px wide`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AAA).analyze()
    expect(violations.map(v => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([])
  })
}

test('the live demo renders what the visitor types', async ({ page }) => {
  await page.locator('#td-demo-source').fill('## Typed here\n\nA ==marked== word.')
  await expect(page.locator('.td-demo-output h2')).toHaveText('Typed here')
  await expect(page.locator('.td-demo-output mark')).toHaveText('marked')
})

test('the attack lab shows the live sanitizer output for each attack', async ({ page }) => {
  const kept = page.locator('.td-lab-side.is-blue code')

  await page.getByRole('button', { name: 'Cover the screen, in disguise' }).click()
  await expect(kept).not.toContainText('tion')

  await page.getByRole('button', { name: 'Cover the screen, by reference' }).click()
  await expect(kept).not.toContainText('position')

  await page.getByRole('button', { name: 'Take over the tab you came from' }).click()
  await expect(kept).toContainText('rel="noopener noreferrer"')

  await page.getByRole('button', { name: 'Send a read receipt' }).click()
  await expect(kept).not.toContainText('attacker.example')

  await page.getByRole('button', { name: 'Repaint the editor' }).click()
  await expect(kept).toHaveText('(nothing at all)')
})

test('the heading check reports the broken outline and clears when repaired', async ({ page }) => {
  await expect(page.locator('.td-issues li')).toHaveCount(3)
  await page.getByRole('button', { name: 'Repair it' }).click()
  await expect(page.locator('.td-issues-clean')).toBeVisible()
})

test('the skip link goes to the main content', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await expect(page.locator('.skip-link')).toHaveText('Skip to main content')
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})
