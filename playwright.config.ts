import { defineConfig, devices } from '@playwright/test'

/**
 * Browser-level tests.
 *
 * These run against the *production build*, served by scripts/serve-dist.mjs
 * with the same headers Netlify sends — so the Content-Security-Policy, the
 * render worker and the real CSS engine are all part of what is tested. The
 * unit tests cannot see any of the three: jsdom has no layout, no workers and
 * no CSP, which is how four `position:fixed` bypasses and a `<style>` leak got
 * past them.
 *
 * Run `yarn generate` first; `yarn test:browser` does not build.
 *
 * To run the same tests against a deployed site — a Netlify deploy preview is
 * the place the real headers can be checked before production — set
 * PLAYWRIGHT_BASE_URL and no local server is started:
 *
 *   PLAYWRIGHT_BASE_URL=https://deploy-preview-12--example.netlify.app yarn test:browser
 */
const PORT = 4173
const REMOTE = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: REMOTE ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: REMOTE
    ? undefined
    : {
        command: `node scripts/serve-dist.mjs ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
      },
})
