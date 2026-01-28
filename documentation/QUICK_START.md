# Quick Start Guide

Get the ICJIA Markdown Editor running in 5 minutes.

---

## Prerequisites

- **Node.js**: 20.x or higher ([Download](https://nodejs.org/))
- **Yarn**: 1.22.22 (install: `npm install -g yarn@1.22.22`)
- **Git**: For cloning the repository

Check your versions:

```bash
node --version  # Should be v20.x or higher
yarn --version  # Should be 1.22.22
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ICJIA/icjia-markdown-editor.git
cd icjia-markdown-editor
```

### 2. Install Dependencies

```bash
yarn install
```

This will install all required packages including:
- Nuxt 4.x
- CodeMirror 6
- Nuxt UI
- markdown-it and plugins

### 3. Start Development Server

```bash
yarn dev
```

The app will open at: **http://localhost:3000**

---

## First Steps

### Try Basic Editing

1. Type `# Hello World` in the left pane
2. See it rendered as a heading in the right pane
3. Try the **Bold** button or press `Ctrl+B` (Mac: `⌘+B`)

### Test Key Features

| Feature | Keyboard Shortcut | Description |
|---------|-------------------|-------------|
| Table Builder | `Ctrl+T` | Visual table creator |
| Image Insert | `Ctrl+Shift+I` | Insert image with alt text |
| Copy HTML | `Ctrl+Shift+H` | Copy rendered HTML |
| Copy Markdown | `Ctrl+Shift+C` | Copy raw markdown |
| Toggle Preview | `Ctrl+\` | Show/hide preview pane |
| Dark/Light Mode | Click sun/moon icon | Toggle color mode |

### Keyboard Shortcuts

Press `F1` to see all available keyboard shortcuts.

---

## Development Commands

```bash
# Start development server (with hot reload)
yarn dev

# Run type checking
yarn typecheck

# Run linting
yarn lint

# Run unit tests
yarn test

# Run accessibility tests (REQUIRED before committing)
yarn test:a11y

# Run E2E tests
yarn test:e2e

# Build for production
yarn generate

# Preview production build
yarn preview
```

---

## Project Structure Overview

```
icjia-markdown-editor/
├── app.vue                   # Root component
├── pages/
│   └── index.vue             # Main (only) page
├── components/
│   ├── editor/               # Editor, preview, toolbar
│   │   ├── EditorPane.vue    # CodeMirror wrapper
│   │   ├── PreviewPane.vue   # Rendered markdown
│   │   ├── EditorToolbar.vue # Formatting toolbar
│   │   ├── EditorStatusBar.vue
│   │   └── EditorLayout.vue  # Split pane container
│   ├── modals/               # Table builder, image insert
│   │   ├── TableBuilderModal.vue
│   │   ├── ImageInsertModal.vue
│   │   ├── LinkInsertModal.vue
│   │   └── ShortcutsHelpModal.vue
│   └── ui/                   # App header, color mode
│       ├── AppHeader.vue
│       ├── ColorModeToggle.vue
│       └── SkipLink.vue
├── composables/              # Vue composables (state)
│   ├── useEditor.ts          # Editor state & actions
│   ├── useMarkdown.ts        # markdown-it config
│   ├── useAutoSave.ts        # localStorage persistence
│   ├── useExport.ts          # Copy/download functions
│   └── useAccessibility.ts   # Focus, announcements
├── utils/                    # Helper functions
│   ├── editor/
│   │   ├── commands.ts       # Bold, italic, etc.
│   │   ├── keymaps.ts        # Keyboard shortcuts
│   │   └── theme-dark.ts     # CodeMirror theme
│   ├── markdown/
│   │   └── config.ts         # markdown-it setup
│   └── table-builder.ts      # Table generation
├── tests/                    # All tests
│   ├── unit/                 # Vitest unit tests
│   ├── components/           # Component tests
│   ├── e2e/                  # Playwright E2E
│   └── a11y/                 # Accessibility tests
├── nuxt.config.ts            # Nuxt configuration
└── documentation/            # Project documentation
```

---

## Configuration

### Environment Variables (Optional)

Create a `.env` file for local configuration:

```bash
# .env
NUXT_PUBLIC_APP_TITLE="ICJIA Markdown Editor"
NUXT_PUBLIC_DEFAULT_COLOR_MODE="dark"
```

### Nuxt Configuration

Key settings in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/fonts',
  ],
  
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },
  
  // Static generation for Netlify
  nitro: {
    preset: 'netlify-static',
  },
})
```

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Use a different port
yarn dev --port 3001
```

### Dependencies Won't Install

```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock .nuxt
yarn install
```

### TypeScript Errors

```bash
# Regenerate Nuxt types
yarn nuxi prepare
```

### Tests Failing

```bash
# Run with verbose output
yarn test --reporter=verbose

# Run specific test file
yarn test tests/unit/table-builder.test.ts
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions.

---

## Next Steps

1. **If Scaffolding from Scratch**
   - [Scaffolding Guide](./SCAFFOLDING_GUIDE.md) - **Start here** for new projects
   - Follow phases 1-8 to build the complete application

2. **Read the Documentation**
   - [Design Document](./icjia-markdown-editor-design-doc.md) - Features, UX, accessibility
   - [Technical Architecture](./icjia-markdown-editor-technical-architecture.md) - Implementation details

3. **Understand Accessibility Requirements**
   - [Accessibility Checklist](./ACCESSIBILITY_CHECKLIST.md) - Manual testing procedures
   - Every feature must pass a11y tests before merge

4. **Start Development**
   - Pick a task from the Phase milestones
   - Write tests first (TDD encouraged)
   - Run `yarn test:a11y` before committing

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions, share ideas
- **Accessibility Concerns**: accessibility@icjia.gov

---

## Quick Reference

### Common Commands

| Task | Command |
|------|---------|
| Start dev server | `yarn dev` |
| Run all tests | `yarn test` |
| Run a11y tests | `yarn test:a11y` |
| Build for production | `yarn generate` |
| Preview build | `yarn preview` |
| Type check | `yarn typecheck` |
| Lint code | `yarn lint` |
| Fix lint issues | `yarn lint --fix` |

### Key Files to Know

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Nuxt configuration |
| `composables/useEditor.ts` | Editor state management |
| `utils/editor/commands.ts` | Toolbar action implementations |
| `tests/a11y/` | Accessibility test suites |
