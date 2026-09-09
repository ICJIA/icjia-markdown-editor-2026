# Changelog

All notable changes to ICJIA Markdown Editor 2.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-09-09

### Fixed

- **The editor no longer talks over the author using a screen reader.** Three elements were live regions whose content changes as you type, and each re-announced itself continuously. The preview pane carried `aria-live="polite"` while `v-html` replaced its entire subtree on every debounce tick, so the whole rendered document was queued for announcement 150ms after each pause in typing. The status bar's `role="status"` — which implies `aria-live` *and* `aria-atomic`, so the element is re-announced in full on any change — had been scoped to `.status-left` to spare the heading-issue count, but `.status-left` is where the word count and reading time live, the two values that change most. And the header's auto-save indicator wrapped a countdown that ticks once a second, announcing "Next save: 29s", "28s", "27s" for as long as the editor was open. None of the three is a live region now. Announcements that are genuinely events — a save, a copy, a file load — still go through the announcer in `app.vue`, at the moment they happen. No automated checker reports this: axe-core has no rule for an over-chatty live region, which is why the AAA run stayed green through all three.
- **Exported HTML printed as invisible text.** Inlining `github-markdown-dark.css` to make exports self-contained (1.8.0) left the template's `@media print` block dead: it sets `body { color: black }` at specificity 0-0-1, and the inlined `.markdown-body { color: #f0f6fc }` applies to the same element at 0-1-0 and wins. Measured in Chrome, body text printed at **1.09:1 against white paper**, links at 3.1:1, blockquotes at 2.91:1. Since the previous CDN stylesheet switched on `prefers-color-scheme`, this was a regression for anyone on a light-mode OS. The print rules are now written at class specificity in GitHub's light palette: body text 15.8:1, links 5.2:1, blockquotes 6.1:1, code blocks 14.8:1.
- **Auto-save could replace a document with an empty one.** The window-blur and page-unload handlers saved unconditionally, while the interval and the debounced watcher both refused to persist empty content. So select-all, delete, switch tabs, and the stored record became empty — on the next load there was nothing to restore and the author got the tutorial back instead of their work. A save now refuses any write that would replace stored content with an empty document.
- **Two tabs silently erased each other.** Both write one storage key, so whichever saved last won and the other tab's document was gone. A tab now follows another tab's save only when it has nothing unsaved of its own; a tab being actively edited keeps its work.
- **Auto-save failing looked exactly like auto-save working.** Running out of storage was announced to screen readers and to nobody else — the header kept counting down to a save that would never happen. The indicator now shows an explicit "Not saving — download your work" state.
- **The auto-save countdown did not correspond to anything.** A content-change save reset the displayed countdown without touching the 30-second interval, so the two drifted apart. Both now derive from the last save, which makes the display true by construction rather than by coincidence.
- **⌘S and ⌘O stopped working with Caps Lock on.** Both branches compared `event.key` against a lowercase letter, and with Caps Lock the key is `'S'`. The shortcut stopped matching, `preventDefault()` never ran, and ⌘S fell through to the browser's own Save-page dialog.
- **Toggling scroll sync announced the opposite of what happened.** The announcement read the shared state after toggling it, with the ternary the wrong way round, so enabling sync said "Scroll sync disabled". The visible toolbar label was correct throughout, so this was wrong only for the people relying on the announcement.
- **`position: fixed !important` survived sanitization.** The pattern stripping escape-the-pane CSS required the declaration to end immediately after `fixed`, so any trailing token carried it through — `!important` and a CSS comment (`position:/**/fixed`) both did. `z-index` was unaffected only because its pattern already ran to the semicolon. Each alternative now matches the whole declaration, and comments are removed before matching. `contain: paint` on the preview meant this was never exploitable there, but the table builder's HTML preview has no such containment.
- **Table cells silently dropped a backslash before a pipe.** `escapeCell` escaped the pipe but not the backslash, so an author's `a\|b` was written as `a\\|b` — an escaped backslash followed by a bare pipe. The row survived; the backslash did not.
- **The cursor position was never updated.** `updateCursorPosition` had no callers, so the shared `cursorPosition` sat at line 1 for the life of the session. The editor already computed the line for scroll sync; it now reaches the shared state too.

### Added

- **Document outline.** The status bar reports the document's heading count and expands into a navigable outline: every heading, indented by level, click to jump to its line, with the section the cursor is in marked. It is built from the same heading parse as the linter — extracted to `utils/markdown/heading-tokens` so the two cannot disagree about what a heading is or what it is called. Raw HTML headings appear in neither, for the reason already documented on the linter.
- **Word-count goals.** The status-bar word count is now a control: click it to set a target, and it shows progress towards it with a bar and a percentage. With no goal set it reads exactly as it did before. The percentage floors rather than rounds below the target, so 1,499 of 1,500 words reads 99% — telling an author they are finished when they are not is the one thing a progress indicator must not do. The target is remembered between sessions under its own storage key, so clearing a draft does not clear the goal and a goal can never make an auto-save record unreadable.

### Changed

- **Exported HTML is named after its first heading.** `<title>` was the constant "Exported Document", which is the browser tab, the bookmark, and the header a browser stamps on every printed page.
- **The export no longer ships fonts a document does not need.** Whether to embed the KaTeX and highlight.js stylesheets was decided by searching the rendered HTML for the substrings `katex` and `hljs`, so a report that merely mentioned either in prose carried twenty webfonts — roughly 400 KB on a file budgeted at 22 KB. It now matches the class attributes the renderers actually emit.
- **Raised the status-bar panels to AAA.** The secondary labels in the outline and heading-issues panels measured 5.71:1 — AA, but short of this project's target. Both panels are `v-show`-hidden, so the axe run never saw them; every string in both, in both themes, is now checked and clears 7:1.
- **The accessibility audit can no longer report a clean run it did not perform.** Dismissing the first-visit welcome dialog was best-effort: a fixed 1.5-second wait, then a silent skip if the dialog was not there yet. On a slow start axe ran with the dialog open and the header `inert`, which it walks straight past — producing a zero-violation report for a page it never fully examined, indistinguishable from a real pass. The audit now waits for the dialog, asserts it is gone, and confirms the header is no longer inert before scanning; it fails loudly instead.

### Removed

- **`useFocusTrap` and `announceUrgent`, neither of which had a single caller.** Reka UI handles the modal focus traps. ESLint does not flag unused exports, so 109 lines of documented, plausible-looking accessibility code survived the 1.8.0 sweep — including a focus trap that filtered nothing for visibility, and so would have trapped focus onto a `display: none` button had anyone adopted it.

## [1.8.0] - 2026-09-08

### Security

- **The preview no longer lets a document act on the application.** DOMPurify's default allowlist is wider than a markdown preview needs, and three tags were being carried through into the rendered output. `<style>` was the significant one: a document-supplied stylesheet is not scoped to the preview, so opening or pasting one containing `<style>body{background:red}</style>` repainted the entire editor UI. `<form>` with an external `action` rendered a working, on-brand submission target inside the app, and a `style` attribute carrying `position:fixed` with a large `z-index` could cover the whole viewport. Sanitization now forbids `style`, `form`, `button`, `select`, `textarea`, `option`, `fieldset` and `legend`; strips `position:fixed`, `position:sticky` and `z-index` from `style` attributes; and drops any `<input>` that is not a task-list checkbox. Everything the preview legitimately needs is untouched — KaTeX positions glyphs with inline `position:relative` and `height`, tables carry `text-align`, and task lists keep their real checkboxes. Note the `<style>` leak does not reproduce under jsdom, which has no CSSOM for DOMPurify to sanitize, so the regression test for it is meaningful only in a browser.
- **The preview pane is now a containing block.** `contain: paint` on `.preview-content` means a positioned descendant cannot escape the pane even if the sanitizer above is ever bypassed.
- **Raw-HTML links opening a new tab now carry `rel`.** Markdown-authored links already got `rel="noopener noreferrer"` from the renderer; a literal `<a target="_blank">` in a document did not. A sanitizer hook now guarantees it on both.
- **Added a Content-Security-Policy and HSTS to the deployed headers.** The policy is written against this app's actual threat — untrusted markdown rendered with raw HTML enabled — rather than copied from a list: `form-action 'none'` makes an injected form unsubmittable, `object-src`/`frame-src`/`base-uri 'none'` close the plugin, framing and relative-URL-repointing vectors, and `connect-src 'self'` keeps an editor that makes no network calls that way. `script-src`/`style-src` need `'unsafe-inline'` for Nuxt's hydration payload and KaTeX's per-glyph inline styles; the reasoning for each directive is recorded in `netlify.toml`.
- **Refreshed the dependency tree.** Advisories went from 29 to 1 (a low-severity esbuild dev-server issue that only affects Windows). DOMPurify — the only flagged package that ships to the browser — moved past its IN_PLACE XSS fix, Nuxt moved past the server-island RCE and payload-cache disclosure, and the critical unauthenticated Nuxt DevTools RPC advisory is cleared. Removed `@types/dompurify`, a deprecated stub that DOMPurify v3 supersedes with its own types.

### Fixed

- **Download HTML was unreachable.** `handleDownloadHtml` existed and worked but was never wired to a control, so the export the README advertises could not be triggered from the interface. It is now in the Export group beside Copy HTML, and in the mobile menu.
- **Table builder cells containing `|` silently corrupted the table.** A cell holding `has | pipe` split into two cells, shifting every later cell left and dropping the last one off the end of the row — the content was lost, not just misrendered. Cell and header text is now escaped, and newlines are folded to spaces so a cell cannot break out of its row.
- **The tutorial's escaping table demonstrated the opposite of what it taught.** The Result column for the Asterisk and Underscore rows rendered as *italic text* instead of the literal `*text*` and `_text_`, because the escapes were consumed by the TypeScript template literal before markdown ever saw them. The Backtick row's Escaped cell rendered as a broken code span. All three now show what they claim.
- **Download filenames could lose their extension.** Sanitization ran after the extension was appended, so `a..md` became `amd` — a file no operating system associates with an application. The rules now run on the stem before the extension is added, and truncation leaves room for it. Extracted to `utils/filename.ts` so the behaviour is testable on its own.
- **Icons were missing in production.** Nuxt Icon defaults to a server bundle, which a static deployment has no server to serve; the pencil on the "Start Editing" button — the primary call to action for a first-time user — failed to load. The client bundle now scans the source and inlines the 98 icons the app uses.
- **`yarn lint` did not run.** The script invoked an ESLint that was never installed, against a config that did not exist, and exited 127. `@nuxt/eslint` is now configured, and the codebase is clean against it: the 20 errors it found on first run are fixed, including several unused declarations that turned out to mark dead code.

### Changed

- **`++inserted++` now renders as `<ins>`.** `markdown-it-ins` had been a declared dependency for some time without ever being registered, so the syntax rendered as literal text. It now sits alongside `==mark==` and `~~strike~~`.
- **HTML exports are self-contained.** They previously linked three stylesheets from cdnjs with no `integrity`, so an exported document rendered unstyled without a network connection and depended on a third party for its appearance — neither of which suits a file that gets emailed, attached to a record, or opened years later. Everything is now embedded. The cost is paid only where it buys something: a plain report carries the base stylesheet alone (~23 KB), the highlight.js theme is added only for documents with code, and the KaTeX stylesheet with its twenty webfonts only for documents with math. `downloadHtml` is async as a result, since those stylesheets load on demand rather than sitting in the editor's main bundle.
- **Raised light-mode text contrast to WCAG AAA.** Several muted colours measured 4.54:1 against AA's 4.5:1 — a margin of 0.04, where any future colour adjustment would have dropped them below AA without anyone noticing. `--color-text-muted` and the autosave, reading-time, tutorial-reset and GitHub labels moved from slate-500 to slate-600 (7.2:1); light-mode inline code moved from green-800 to green-900 (8.5:1); and the dark editor's heading and link colour moved to blue-200 so it clears 7:1 on the active-line highlight as well as the base background. `yarn test:a11y` now reports zero violations at AAA, where it had been reporting five and exiting non-zero.
- **Compressed `og-image.png` from 972 KB to 249 KB**, unchanged in dimensions and visually identical.

### Notes

- The checked-in `tests/a11y/a11y-results.json` had been stale since January and reported zero violations against code that had five. It now reflects a fresh run.
- `yarn upgrade` bumped Playwright, so `yarn playwright install chromium` is needed once before `yarn test:a11y` will run.

## [1.7.1] - 2026-07-09

### Changed

- **The heading linter no longer reserves `#` for the page title.** The editor serves more than CMS-published documents, so it no longer takes a position on the opening level: the first heading is never flagged, at any level — exactly matching axe-core's heading-order rule — and it sets the baseline for everything below. Mid-document h1s are also allowed, which axe does not flag either. Skipped levels and empty headings are still reported, and a bare `#` now reports as an empty h1 rather than a reserved-h1 error. Authors publishing through Strapi should still start at `##`, since Strapi supplies the `<h1>` page title; the README says so, the linter no longer enforces it.

## [1.7.0] - 2026-07-09

### Added

- **Heading hierarchy linter** — the status bar now reports headings that skip a level, sit at `#` (reserved for Strapi's page title), or are empty. Click the count to list issues and jump to the offending line. Parsing reuses the preview's `markdown-it` instance, so the linter never disagrees with the rendered output. Raw HTML headings are not checked.

### Changed

- The bundled markdown tutorial now opens at `##` rather than `#`, so it models the structure Strapi expects and lints clean on first load.
- `role="status"` is now scoped to the status bar's left group rather than the whole bar, so the heading-issue count is not announced on every keystroke.

### Fixed

- The linter no longer reports a heading as empty when its only content is a footnote reference (`## [^1]`). `markdown-it` gives a `footnote_ref` token an empty `content` even though it renders a visible `[1]` marker, so emptiness is now decided from token types rather than from joined text. The same fix covers headings whose only content is an image with alt text; an image with no alt text is still reported, since it gives the heading no accessible name.
- The `no-h1` suggestion now quotes the author's own source line, so it preserves footnote references, code spans, emphasis, and images. It previously rebuilt the text from tokens and silently dropped them — copying `Use "## Title"` for a `# Title[^1]` heading would have deleted the footnote reference. Multi-line setext headings are joined with a space rather than fused into one word. A heading nested inside a blockquote or list item is still reported, but without a quoted suggestion, since its source line carries the container's own prefix.

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
