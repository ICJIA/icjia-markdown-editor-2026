# Browser Support Matrix

## Supported Browsers (Minimum Versions)

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | Last 2 versions | Full support |
| Edge | Last 2 versions | Full support (Chromium-based) |
| Firefox | Last 2 versions | Full support |
| Safari | Last 2 versions | Full support |
| Safari iOS | 15.0+ | Touch target adjustments |
| Chrome Android | Last 2 versions | Mobile optimizations |

## Screen Readers

| Screen Reader | Version | Browser | Support Level |
|---------------|---------|---------|---------------|
| NVDA | 2023.1+ | Firefox/Chrome | Primary testing |
| JAWS | 2022+ | Chrome | Secondary testing |
| VoiceOver | Latest | Safari | Primary testing |
| TalkBack | Latest | Chrome Android | Mobile testing |

## Known Limitations

### Internet Explorer
- ❌ **Not supported** - CodeMirror 6 requires modern JavaScript features

### Private Browsing Mode
- ⚠️ Auto-save disabled (localStorage unavailable)
- ⚠️ User shown warning on first load
- ✅ All other features work normally

### Older Mobile Browsers
- ⚠️ iOS Safari < 15: Limited CSS Grid support
- ⚠️ Android WebView (system browser): May have performance issues

---

## Feature Detection

```typescript
// utils/browser-support.ts
export interface BrowserFeatures {
  localStorage: boolean
  clipboard: boolean
  webWorkers: boolean
  cssGrid: boolean
}

export function checkBrowserSupport(): BrowserFeatures {
  const features: BrowserFeatures = {
    localStorage: false,
    clipboard: !!navigator.clipboard,
    webWorkers: typeof Worker !== 'undefined',
    cssGrid: CSS.supports('display', 'grid'),
  }
  
  // Test localStorage availability
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    features.localStorage = true
  } catch (e) {
    features.localStorage = false
  }
  
  return features
}

export function warnUnsupportedFeatures(features: BrowserFeatures): void {
  if (!features.localStorage) {
    console.warn('localStorage unavailable - auto-save disabled')
  }
  
  if (!features.clipboard) {
    console.warn('Clipboard API unavailable - copy functions may not work')
  }
}
```

---

## Testing Requirements

Before each release, test on:

### Desktop Browsers
- [ ] Chrome (latest) - Windows
- [ ] Chrome (latest) - macOS
- [ ] Firefox (latest) - Windows
- [ ] Firefox (latest) - macOS
- [ ] Safari (latest) - macOS
- [ ] Edge (latest) - Windows

### Mobile Browsers
- [ ] Safari iOS (latest) - iPhone
- [ ] Safari iOS (latest) - iPad
- [ ] Chrome Android (latest) - Android phone

### Screen Readers
- [ ] NVDA + Firefox (Windows)
- [ ] NVDA + Chrome (Windows)
- [ ] VoiceOver + Safari (macOS)
- [ ] VoiceOver + Safari (iOS)
- [ ] TalkBack + Chrome (Android)

---

## Performance Targets by Browser

| Browser | FCP | LCP | TTI |
|---------|-----|-----|-----|
| Chrome | < 1.2s | < 2.0s | < 2.5s |
| Firefox | < 1.3s | < 2.2s | < 2.7s |
| Safari | < 1.4s | < 2.3s | < 2.8s |
| Edge | < 1.2s | < 2.0s | < 2.5s |
| Mobile (3G) | < 3.0s | < 4.0s | < 5.0s |

---

## Polyfills & Fallbacks

### Required (included automatically)
- None - targeting modern browsers only

### Optional (for extended support)
If supporting older browsers becomes necessary:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Only if needed for older browser support
  vite: {
    build: {
      target: 'es2020', // or 'es2019' for older Safari
    },
  },
})
```

---

## Browser-Specific CSS

```css
/* assets/css/browser-fixes.css */

/* Safari-specific fixes */
@supports (-webkit-touch-callout: none) {
  /* iOS Safari touch target fixes */
  .toolbar-button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Firefox-specific fixes */
@-moz-document url-prefix() {
  /* Firefox scrollbar styling */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--ui-border) transparent;
  }
}
```

---

## Unsupported Browser Handling

When a user visits with an unsupported browser, show a graceful message:

```vue
<!-- components/UnsupportedBrowser.vue -->
<script setup lang="ts">
const isSupported = computed(() => {
  if (typeof window === 'undefined') return true
  
  // Check for required features
  return (
    typeof CSS !== 'undefined' &&
    CSS.supports('display', 'grid') &&
    typeof Promise !== 'undefined' &&
    typeof fetch !== 'undefined'
  )
})
</script>

<template>
  <div v-if="!isSupported" class="unsupported-browser" role="alert">
    <h1>Browser Not Supported</h1>
    <p>
      The ICJIA Markdown Editor requires a modern browser. 
      Please upgrade to one of the following:
    </p>
    <ul>
      <li><a href="https://www.google.com/chrome/">Google Chrome</a></li>
      <li><a href="https://www.mozilla.org/firefox/">Mozilla Firefox</a></li>
      <li><a href="https://www.apple.com/safari/">Apple Safari</a></li>
      <li><a href="https://www.microsoft.com/edge">Microsoft Edge</a></li>
    </ul>
  </div>
  <slot v-else />
</template>
```
