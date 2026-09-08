import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Vitest stubs every `.css` import to an empty string by default, which
    // silently includes the `?raw` imports the HTML export uses to inline its
    // stylesheets — the export tests would pass against an empty document.
    css: true,
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
    },
  },
})
