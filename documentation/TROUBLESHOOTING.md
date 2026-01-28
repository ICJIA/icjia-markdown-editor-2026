# Troubleshooting Guide

Common issues and their solutions for the ICJIA Markdown Editor.

---

## Installation Issues

### "Cannot find module 'nuxt'"

**Problem:** Dependencies not installed properly.

**Solution:**
```bash
rm -rf node_modules yarn.lock .nuxt .output
yarn install
```

---

### "yarn: command not found"

**Problem:** Yarn not installed globally.

**Solution:**
```bash
# Install Yarn globally
npm install -g yarn@1.22.22

# Or use corepack (Node.js 16.10+)
corepack enable
corepack prepare yarn@1.22.22 --activate
```

---

### "Node.js version X is not supported"

**Problem:** Node.js version too old.

**Solution:**
```bash
# Check your version
node --version

# Install Node.js 20.x via nvm
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

---

### "Port 3000 is already in use"

**Problem:** Another process using port 3000.

**Solution:**
```bash
# Option 1: Use different port
yarn dev --port 3001

# Option 2: Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Option 2: Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Runtime Issues

### Editor Not Loading / Blank Screen

**Symptoms:** White or black screen, editor never appears.

**Possible Causes:**
1. JavaScript error during initialization
2. CodeMirror failed to load
3. Browser incompatibility

**Debugging Steps:**
```bash
# 1. Check browser console for errors
# Open DevTools (F12) → Console tab
# Look for red error messages

# 2. Clear browser cache
# Chrome/Firefox: Ctrl+Shift+R (Cmd+Shift+R on Mac)
# Or clear site data in DevTools → Application → Storage

# 3. Try incognito/private mode
# Rules out browser extensions causing issues

# 4. Check Node.js console for server errors
# Look at the terminal where `yarn dev` is running
```

**Common Fixes:**
```bash
# Regenerate Nuxt build
rm -rf .nuxt .output
yarn dev

# Reinstall dependencies
rm -rf node_modules
yarn install
yarn dev
```

---

### Preview Not Updating

**Symptoms:** Type in editor but preview stays stale.

**Possible Causes:**
1. Scroll sync interfering
2. markdown-it parsing error
3. Reactivity broken

**Solution:**
1. Toggle scroll sync off/on
2. Check console for parsing errors
3. Refresh the page

---

### Auto-Save Not Working

**Symptoms:** "Auto-save unavailable" message, or content not persisting.

**Possible Causes:**
1. Private/incognito browsing mode
2. localStorage quota exceeded
3. Browser localStorage disabled

**Debugging:**
```javascript
// Open browser console and test localStorage:
try {
  localStorage.setItem('test', 'test')
  localStorage.removeItem('test')
  console.log('localStorage is working')
} catch (e) {
  console.error('localStorage unavailable:', e.message)
}

// Check storage usage:
let total = 0
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length
  }
}
console.log('localStorage used:', (total / 1024).toFixed(2), 'KB')
```

**Solutions:**
```javascript
// Clear old auto-save data:
localStorage.removeItem('icjia-md-autosave')

// If quota exceeded, clear other site data:
localStorage.clear() // Warning: clears ALL localStorage for this origin
```

---

### Keyboard Shortcuts Not Working

**Symptoms:** Ctrl+B doesn't bold, etc.

**Possible Causes:**
1. Focus not in editor
2. Browser extension intercepting shortcuts
3. Operating system shortcut conflict

**Solution:**
1. Click in the editor first to focus it
2. Disable browser extensions temporarily
3. Check System Preferences → Keyboard → Shortcuts (macOS)
4. Try the toolbar button as fallback

---

### Copy to Clipboard Fails

**Symptoms:** "Copy failed" error message.

**Possible Causes:**
1. Clipboard API not available
2. Page not served over HTTPS (required for clipboard)
3. Browser permission denied

**Solution:**
```javascript
// Check clipboard availability:
console.log('Clipboard available:', !!navigator.clipboard)

// For local development, localhost is treated as secure
// For production, ensure HTTPS is enabled
```

---

## Performance Issues

### Slow Typing / Editor Lag

**Symptoms:** Characters appear with delay, cursor jumpy.

**Possible Causes:**
1. Very large document (>50,000 characters)
2. Too many browser extensions
3. System resources exhausted

**Solutions:**
1. Split large documents into smaller files
2. Disable browser extensions
3. Close other tabs/applications
4. Check Activity Monitor/Task Manager for CPU usage

---

### Preview Rendering Slow

**Symptoms:** Preview updates lag behind typing.

**Cause:** Expected behavior for large documents (debounced rendering).

**Solutions:**
1. Accept slight delay (150ms debounce)
2. Use editor-only mode for drafting
3. Split into smaller documents

---

### High Memory Usage

**Symptoms:** Browser tab using >500MB memory.

**Possible Causes:**
1. Memory leak (report as bug)
2. Very large document
3. Long editing session

**Solution:**
```bash
# Save your work, then refresh the page
# This clears any accumulated memory

# For persistent issues, file a bug report with:
# - Document size
# - Time elapsed since page load
# - Browser and version
```

---

## Build & Deploy Issues

### TypeScript Errors on Build

**Problem:** `yarn generate` fails with type errors.

**Solution:**
```bash
# Regenerate Nuxt types
yarn nuxi prepare

# Run type check to see specific errors
yarn typecheck

# Common fixes:
# - Check for missing type imports
# - Verify all components have proper type annotations
# - Check tsconfig.json includes all paths
```

---

### Netlify Deploy Fails

**Problem:** Build succeeds locally but fails on Netlify.

**Common Causes:**
1. Different Node.js version
2. Missing environment variables
3. Build command mismatch

**Check `netlify.toml`:**
```toml
[build]
  command = "yarn generate"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"
```

**Check Node.js version:**
```bash
# Ensure your local version matches Netlify
node --version
# Should be 20.x to match netlify.toml
```

---

### 404 Errors After Deploy

**Problem:** App loads, but navigation gives 404.

**Solution:** Add redirect rule in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Testing Issues

### Accessibility Tests Failing

**Problem:** `yarn test:a11y` shows violations.

**Debugging:**
```bash
# Run with verbose output
yarn test:a11y -- --reporter=verbose

# See specific violation details in test output
# Each violation includes:
# - What the issue is
# - Which element failed
# - How to fix it
```

**Common Fixes:**
1. Add missing `aria-label` to buttons
2. Increase color contrast
3. Add focus indicators
4. Associate labels with form inputs

---

### E2E Tests Timing Out

**Problem:** Playwright tests hang or timeout.

**Solution:**
```bash
# Run in headed mode to see what's happening
yarn playwright test --headed

# Increase timeout in playwright.config.ts:
export default defineConfig({
  timeout: 60000, // 60 seconds
})

# Run a specific test file
yarn playwright test tests/e2e/editor.spec.ts

# Debug mode (step through test)
yarn playwright test --debug
```

---

### Tests Pass Locally but Fail in CI

**Possible Causes:**
1. Timing differences (CI is slower)
2. Missing dependencies in CI environment
3. Different Node.js version

**Solutions:**
```yaml
# In CI config, ensure same Node version:
- uses: actions/setup-node@v4
  with:
    node-version: '20'

# Add retries for flaky tests:
retries: process.env.CI ? 2 : 0
```

---

## Screen Reader Issues

### NVDA Not Announcing Updates

**Symptoms:** Changes not read aloud.

**Check live region:**
```javascript
// Verify live region exists:
document.querySelector('[aria-live]')

// Check it's being updated:
const liveRegion = document.querySelector('[aria-live="polite"]')
console.log('Live region content:', liveRegion?.textContent)
```

**Solutions:**
1. Ensure NVDA is in focus mode (Insert+Space)
2. Check NVDA settings for verbosity
3. Try refreshing the page with NVDA running

---

### VoiceOver Not Working

**Symptoms:** VoiceOver doesn't read content properly.

**Troubleshooting:**
1. Press VO+A to read all (VO = Ctrl+Option)
2. Use rotor (VO+U) to navigate by headings
3. Check that Safari is the browser (VoiceOver works best with Safari)
4. Try VO+Shift+Down to enter web content

---

## Debug Mode

Enable verbose logging for development:

```bash
# Development with debug logging
DEBUG=* yarn dev

# Or set in .env
NUXT_DEBUG=true
```

```typescript
// Add to composables for debugging:
if (import.meta.dev) {
  console.log('Editor state:', editor.content.value)
}
```

---

## Getting More Help

### Before Reporting a Bug

1. Search existing issues
2. Try the troubleshooting steps above
3. Test in incognito mode
4. Test in a different browser

### Bug Report Template

When filing an issue, include:

```markdown
## Description
[What happened vs what you expected]

## Steps to Reproduce
1. 
2. 
3. 

## Environment
- OS: [e.g., macOS 14.0, Windows 11]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node.js version: [e.g., 20.10.0]
- Editor version/commit: 

## Console Errors
```
[paste any error messages]
```

## Screenshots
[if applicable]
```

### Contact

- **GitHub Issues**: https://github.com/ICJIA/icjia-markdown-editor/issues
- **Accessibility Issues**: accessibility@icjia.gov
