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
 */
const PORT = 4173

export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
