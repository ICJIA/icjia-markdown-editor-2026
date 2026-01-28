# ICJIA Markdown Editor

A modern, accessible markdown editor built with Nuxt 4 and CodeMirror 6. Designed for ICJIA researchers to write reports, policy briefs, and documentation with full WCAG 2.1 AA compliance.

## Features

- **Real-time Preview** - See your formatted document as you type with synchronized scrolling
- **Dark/Light Mode** - Easy on the eyes with dark mode default and system preference detection
- **Keyboard Shortcuts** - Speed up your workflow with comprehensive shortcuts
- **Table Builder** - Visual table creation modal (Cmd/Ctrl+T)
- **Auto-save** - Never lose your work (saves every 30 seconds to localStorage with visual indicator)
- **Export Options** - Copy as Markdown, copy as HTML, or download files with custom filenames
- **Footnote Support** - Full footnote syntax with automatic numbering and back-references
- **Accessibility First** - WCAG 2.1 Level AA compliant with full keyboard navigation and screen reader support
- **Static Deployment** - Deploy anywhere as a static site (Netlify-ready)
- **Fully Documented** - Comprehensive JSDoc comments on all composables and utilities

## Documentation

| Document | Description |
|----------|-------------|
| [Design Document](./documentation/icjia-markdown-editor-design-doc.md) | Features, UX requirements, user personas, accessibility gates |
| [Technical Architecture](./documentation/icjia-markdown-editor-technical-architecture.md) | Implementation details, code examples, component specs |
| [Accessibility Checklist](./documentation/ACCESSIBILITY_CHECKLIST.md) | Manual testing procedures for WCAG 2.1 AA |
| [Quick Start Guide](./documentation/QUICK_START.md) | Getting started in 5 minutes |
| [Browser Support](./documentation/BROWSER_SUPPORT.md) | Supported browsers and screen readers |
| [Troubleshooting](./documentation/TROUBLESHOOTING.md) | Common issues and solutions |

## Development Progress

### Phase 1: Foundation - COMPLETE

- [x] Nuxt 4 project setup with Nuxt UI
- [x] CodeMirror 6 integration with markdown syntax highlighting
- [x] Basic twin-pane layout (editor/preview)
- [x] Dark/light mode theming with system preference detection
- [x] markdown-it configuration with footnotes and syntax highlighting
- [x] Skip link and semantic HTML structure
- [x] Focus indicators on all interactive elements
- [x] `useAccessibility` composable with screen reader announcements

### Phase 2: Core Features - COMPLETE

- [x] Formatting toolbar with all buttons (Bold, Italic, Code, etc.)
- [x] Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+1-6, etc.)
- [x] Scroll synchronization between editor and preview
- [x] Copy Markdown to clipboard
- [x] Copy HTML to clipboard
- [x] Download as Markdown file
- [x] Upload Markdown file
- [x] Word count and character count in status bar

### Phase 3: Advanced Features - COMPLETE

- [x] Table builder modal with visual grid editor
- [x] Footnote support via markdown-it-footnote
- [x] Auto-save to localStorage (every 30 seconds with countdown indicator)
- [x] Download modal with custom filename support
- [x] HTML export with styled document wrapper
- [x] Comprehensive JSDoc documentation for all composables and utilities
- [x] Save indicator with visual feedback (green dot on save)

### Phase 4: Accessibility & Polish - PENDING

- [ ] Full accessibility audit (axe-core, WAVE)
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Keyboard navigation refinement
- [ ] Help modal with shortcuts reference
- [ ] Image insertion modal with placeholder option
- [ ] Link insertion modal with URL validation
- [ ] Find & Replace functionality
- [ ] Error handling improvements
- [ ] Loading state refinements

### Phase 5: Testing & Launch - PENDING

- [ ] Unit tests for utilities
- [ ] Component tests
- [ ] E2E tests for critical paths
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Lighthouse score optimization (target: 100 accessibility)
- [ ] Production deployment documentation

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Nuxt | 4.x | Application framework |
| Vue | 3.5+ | Reactive UI |
| TypeScript | 5.x | Type safety |
| Nuxt UI | 3.x | Component library |
| CodeMirror | 6.x | Text editor engine |
| markdown-it | 14.x | Markdown parsing |
| highlight.js | 11.x | Code syntax highlighting |

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 1.22.22+

### Installation

```bash
# Clone the repository
git clone https://github.com/ICJIA/icjia-markdown-editor-2026.git
cd icjia-markdown-editor-2026

# Install dependencies
yarn install
```

### Development

```bash
# Start development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Generate static site
yarn generate

# Preview production build locally
npx serve dist
```

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Bold | ⌘ + B | Ctrl + B |
| Italic | ⌘ + I | Ctrl + I |
| Inline Code | ⌘ + ` | Ctrl + ` |
| Code Block | ⌘ + Shift + ` | Ctrl + Shift + ` |
| Heading 1-6 | ⌘ + 1-6 | Ctrl + 1-6 |
| Block Quote | ⌘ + Q | Ctrl + Q |
| Bullet List | ⌘ + Shift + 8 | Ctrl + Shift + 8 |
| Numbered List | ⌘ + Shift + 7 | Ctrl + Shift + 7 |
| Insert Table | ⌘ + T | Ctrl + T |
| Insert Link | ⌘ + K | Ctrl + K |
| Horizontal Rule | ⌘ + - | Ctrl + - |
| Copy Markdown | ⌘ + Shift + C | Ctrl + Shift + C |
| Copy HTML | ⌘ + Shift + H | Ctrl + Shift + H |
| Download | ⌘ + S | Ctrl + S |
| Open File | ⌘ + O | Ctrl + O |

## Code Documentation

All composables and utility files include comprehensive JSDoc documentation:

- **File-level documentation** with `@fileoverview` and `@module` tags
- **Function documentation** with `@param`, `@returns`, and `@example` tags
- **Type documentation** for interfaces, types, and constants
- **WCAG compliance notes** in theme files with color contrast ratios

This documentation enables better IDE intellisense, easier onboarding for new developers, and serves as inline reference for the codebase.

## Accessibility

This project is committed to WCAG 2.1 Level AA compliance. Key accessibility features include:

- **Skip Link** - Jump directly to the editor
- **Keyboard Navigation** - Full functionality without a mouse
- **Screen Reader Support** - ARIA labels and live region announcements
- **Focus Indicators** - Clear, visible focus states on all interactive elements
- **Color Contrast** - 4.5:1 for text, 3:1 for UI components
- **Reduced Motion** - Respects `prefers-reduced-motion` setting

## Deployment

### Netlify

The project includes a `netlify.toml` configuration file for seamless deployment:

```bash
# Build command
yarn generate

# Publish directory
dist
```

## Project Structure

```
icjia-markdown-editor-2026/
├── app/
│   ├── components/
│   │   ├── editor/         # EditorPane, PreviewPane, EditorLayout
│   │   ├── modals/         # TableBuilderModal, DownloadModal
│   │   ├── toolbar/        # EditorToolbar, ToolbarButton, ToolbarDivider
│   │   └── ui/             # AppHeader, ColorModeToggle, SkipLink
│   ├── composables/        # Vue composables (fully documented with JSDoc)
│   │   ├── useAccessibility.ts   # Screen reader announcements, focus trap
│   │   ├── useAutoSave.ts        # localStorage persistence
│   │   ├── useDownloadModal.ts   # Download filename modal state
│   │   ├── useEditor.ts          # Editor state and text manipulation
│   │   ├── useExport.ts          # Copy/download functionality
│   │   ├── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   │   ├── useMarkdown.ts        # Markdown rendering and stats
│   │   ├── useScrollSync.ts      # Editor/preview scroll sync
│   │   └── useTableBuilderModal.ts # Table builder state
│   ├── pages/              # Nuxt pages
│   └── utils/              # Utility functions (fully documented with JSDoc)
│       ├── editor/         # CodeMirror config, themes, keymaps
│       ├── markdown/       # markdown-it configuration
│       └── table-builder.ts # Table generation utilities
├── documentation/          # Project documentation
├── public/                 # Static assets
├── tests/                  # Test files
└── nuxt.config.ts          # Nuxt configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Note:** All contributions must pass accessibility tests before merging.

## License

This project is developed for the Illinois Criminal Justice Information Authority (ICJIA).

## Acknowledgments

- [Nuxt](https://nuxt.com) - The Vue Framework
- [CodeMirror](https://codemirror.net) - Extensible code editor
- [Nuxt UI](https://ui.nuxt.com) - Beautiful UI components
- [markdown-it](https://github.com/markdown-it/markdown-it) - Markdown parser
