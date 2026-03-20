# Changelog

All notable changes to ICJIA Markdown Editor 2.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.4.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ICJIA/icjia-markdown-editor-2026/releases/tag/v1.0.0
