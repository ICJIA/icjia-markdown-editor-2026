# Changelog

All notable changes to ICJIA Markdown Editor 2.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2026-06-10

### Fixed

- **Mobile header buttons (WCAG 2.5.8 target size + visual bug):** The ≤640px rule that hides the button text (`.view-mode-button span`) also matched the `UIcon` spans (`<span class="iconify">`), so on phones the View-mode and Tools buttons rendered as empty 12×12px gradient squares — failing Lighthouse/axe `target-size` and showing no icon at all. Labels now carry an explicit `.button-label` class (the pattern `ColorModeToggle` already used), and the buttons get a 2rem minimum target with a 1rem icon on mobile
- **Toast viewport (axe `presentation-role-conflict`):** The app.vue patch that swaps the Nuxt UI toast `<ol>` between `role="presentation"` (empty) and `role="list"` (toasts visible) left reka-ui's `tabindex="-1"` in place, making the presentational element focusable. The tabindex is now removed while empty and restored with `role="list"`, and the observer also re-corrects the attributes if reka-ui resets them
- **Header logo (axe `label-content-name-mismatch`, WCAG 2.5.3):** axe counts a non-empty image `alt` as visible text that must appear in the link's accessible name — `alt="ICJIA Logo"` was not in the title link's aria-label. The logo is decorative next to the visible title text, so it is now `alt=""`
- **Header logo (Lighthouse `third-party-cookies` + `inspector-issues`):** The header still hotlinked the logo from icjia.illinois.gov (the v1.6.0 self-hosting pass covered only the welcome modal), so browsers with Illinois SSO sessions attached MSIS auth cookies to the request and Best Practices dropped to 77. The header now uses the same self-hosted `/images/icjia-logo.png`, removing the last runtime third-party request

## [1.6.0] - 2026-06-10

### Performance

- **Bundle:** Replace the full highlight.js build (~190 languages, the bulk of a 2.1 MB chunk) with `highlight.js/lib/core` plus 18 registered languages researchers actually use (R, Stata, SAS, SQL, Python, JavaScript/TypeScript, JSON, YAML, HTML/XML, CSS, Markdown, Java, C, C++, C#, Bash, diff); unregistered languages degrade gracefully to escaped plain text
- **LCP:** Self-host the tutorial sample image and the welcome-modal ICJIA logo (previously fetched from Unsplash and icjia.illinois.gov at runtime); add explicit width/height to the logo
- **Rendering:** `useMarkdown` is now a shared module singleton — the preview pane, status bar, and exports reuse one render pipeline instead of instantiating three
- **Word count:** Statistics now compute from the debounced content instead of running ~17 regex passes over the entire document on every keystroke; logic extracted to pure, unit-tested `utils/markdown/text-stats`
- **Scroll sync:** Scroll handlers are requestAnimationFrame-throttled, the preview line search early-exits once past the viewport top, and listeners are guaranteed to attach once (each `useScrollSync()` caller previously registered duplicate handlers via its own element watcher)

### Fixed

- **Auto-save:** State is now module-level with reference-counted initialization — `AppHeader` and `EditorLayout` each instantiated a full auto-save instance, causing a duplicate restore dispatch into CodeMirror, doubled screen-reader announcements, and duplicate 30 s save intervals and window blur/beforeunload listeners
- **Auto-save:** Content changes save 2 s after typing pauses (at most every 10 s while typing continuously), closing the window where a crash could lose up to 30 s of work
- **Export:** Copied/downloaded HTML renders from the live editor content (was up to 150 ms stale); exported documents now include the KaTeX and highlight.js stylesheets so math and code blocks render styled
- **Security hardening:** `renderMarkdown` returns an empty string during SSR/SSG instead of unsanitized HTML (latent footgun — nothing prerenders markdown today, and the preview waits for client hydration)
- **Keyboard:** "Open table builder" moved from Ctrl/Cmd+T — which is browser-reserved and cannot be intercepted in Chrome/Safari/Firefox — to Ctrl/Cmd+Alt+T; all shortcut matchers now check the Alt modifier explicitly to avoid collisions. Toolbar button label, in-app tutorial content, README, and docs all updated to match (the tutorial's Download row also corrected from Ctrl+Shift+S to the actual Ctrl+S)
- **Upload:** The hidden file input is removed from the DOM when the change event fires with no file selected
- **Tour:** Focus-restoration race when the tour restarts within 50 ms of closing; dev-mode target-validation timer is now cleared on unmount
- **Tour:** Intro slides support ArrowLeft to navigate back, matching the tour overlay
- **Tools modal:** Tool links navigate natively instead of `@click.prevent` + `window.open` double-handling — middle-click and Cmd/Ctrl+click now work as expected

### Removed

- Dead code: orphaned `app/types/tour.ts` (superseded by `app/modules/tour/types.ts`), unused `codeBlockIndex` counter in PreviewPane, unused `scrollDebounce` config field, unused `openTool` action

### Testing

- New unit tests covering the syntax-highlight language registry contract, markdown text statistics, and the HTML export template

## [1.5.0] - 2026-03-23

### Added

- **SEO:** Canonical URL (`<link rel="canonical">`) and matching `og:url`, resolving the missing-canonical finding from meta-tag audits
- **SEO / AI readiness:** WebApplication JSON-LD structured data (Schema.org) — includes authorship (ICJIA as author and publisher), content-freshness dates, license, and software version
- **SEO / AI readiness:** `author` meta tag (Illinois Criminal Justice Information Authority)
- **AI readiness:** `llms.txt` describing the editor for LLM consumption (per llmstxt.org)

### Fixed

- **Security:** Sanitize code block language attribute to prevent XSS via crafted fenced code blocks
- **Security:** Add 10 MB file size limit on markdown file uploads to prevent browser tab crashes
- **Security:** Sanitize download filenames — strip path traversal, invalid characters, enforce max length
- **Race condition:** Move `copyStatusTimeout` from module scope to composable scope in `useExport`
- **Race condition:** Move scroll sync timer state to component-scoped refs in `EditorLayout`
- **Accessibility:** Change tool cards from `<article role="button">` to semantic `<a>` elements (ARIA compliance)
- **Accessibility:** Achieve WCAG AAA contrast globally — bump `--color-text-muted` from `#94a3b8` to `#cbd5e1` (7:1+ ratio) across status bar, blockquotes, autosave, strikethrough, and checked task text
- **Accessibility:** Fix Reka UI `aria-labelledby` mismatch in all three modals (Tools, Download, Table Builder) — patch dialog to reference actual title element IDs
- **Accessibility:** Remove broken `aria-describedby` reference from Tools modal dialog
- **Accessibility:** Add `inert` attribute to header and main content when any modal is open, preventing keyboard focus from escaping into hidden background
- **Accessibility:** Fix dark mode color toggle contrast — white text on slate gradient (7.1:1 ratio, was 3.1:1)
- **Accessibility:** Fix WCAG 2.5.3 "Label in Name" — ensure `aria-label` contains the exact visible text (including casing) for Start Editing, Tour, Tools, and Display Markdown Tutorial buttons
- **Accessibility:** Fix WCAG 1.3.1 empty list container — hide Nuxt UI toast viewport from accessibility tree when no toasts are visible
- **Resilience:** Disable auto-save and notify user when localStorage quota is exceeded

### Removed

- Dead code: unused `markAsEdited()` function in `useEditor`
- Redundant keyboard handler in `ConversionToolsModal` (now handled natively by `<a>`)

## [1.4.0] - 2026-03-20

### Added

- DOMPurify XSS sanitization on all rendered markdown HTML output
- Unit test suite with 35 tests (markdown rendering and table builder utilities)
- Vitest configuration with jsdom environment
- PDF Audit tool in the conversion tools modal (https://audit.icjia.app/)
- `yarn test:unit` script for running unit tests

### Fixed

- Bounded scroll sync retry to 10 attempts (previously retried indefinitely)
- Scroll sync timeout cleanup on component unmount
- Removed dead `highlight` callback superseded by custom fence renderer

## [1.3.0] - 2026-02-23

### Added

- Squish image compression tool in the conversion tools modal
- Open Graph image for social previews
- Comprehensive accessibility, security, and code quality improvements
- Privacy statement for Squish and Ipsumify in tools modal

### Fixed

- WCAG 2.1 AA accessibility improvements across components
- Security hardening for external links and code rendering

## [1.2.0] - 2026-01-31

### Added

- "Start Editing" button to clear tutorial content for new users
- Ipsumify placeholder text generator in tools modal
- Markdown explanations added to the guided tour
- ICJIA logo in header (clickable to scroll to top, with error fallback)
- Keyboard shortcuts for scroll sync toggle
- Comprehensive JSDoc documentation on all composables

### Fixed

- Toolbar and status bar layout improvements
- Tooltip positioning and navbar layout shift issues
- CodeMirror v6 type compatibility for undo/redo
- Tour modal welcome message and padding
- Copy to clipboard error handling
- Editor placeholder text after clearing default content

## [1.1.0] - 2026-01-30

### Added

- Interactive guided tour with 25-step onboarding (WCAG 2.1 AA compliant)
- Tutorial reset button to restore markdown tutorial content
- MIT license

### Fixed

- Scroll synchronization refactored for reliability
- Auto-save countdown display
- Onboarding overlay height and styling
- Siteimprove `<pre>` element compliance

## [1.0.0] - 2026-01-28

### Added

- Nuxt 4 project with CodeMirror 6 markdown editor
- Real-time twin-pane layout (editor + preview)
- Dark/light mode with system preference detection
- markdown-it with footnotes, task lists, strikethrough, mark, and KaTeX math
- Formatting toolbar (bold, italic, code, headings, lists, links, tables)
- Keyboard shortcuts (Cmd/Ctrl+B, +I, +1-6, etc.)
- Scroll synchronization between editor and preview
- Copy as Markdown or HTML to clipboard
- Download as Markdown or styled HTML file
- Upload Markdown files
- Word count, character count, and reading time in status bar
- Auto-save to localStorage every 30 seconds
- Table builder modal with visual grid editor
- Download modal with custom filename support
- Skip link and semantic HTML structure
- Screen reader announcements via `useAccessibility` composable
- Static site generation for Netlify deployment

[1.5.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/releases/tag/v1.0.0
