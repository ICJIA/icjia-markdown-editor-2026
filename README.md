# ICJIA Markdown Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5+-4FC08D?logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1_AA-green)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://markdown.icjia.cloud)

A modern, accessible markdown editor built with Nuxt 4 and CodeMirror 6. Designed for ICJIA researchers to write reports, policy briefs, and documentation with full WCAG 2.1 AA compliance.

**[Live Demo →](https://markdown.icjia.cloud)**

## Features

- **Real-time Preview** - See your formatted document as you type with synchronized scrolling
- **Dark/Light Mode** - Easy on the eyes with dark mode default and system preference detection
- **Keyboard Shortcuts** - Speed up your workflow with comprehensive shortcuts
- **Table Builder** - Visual table creation modal (Cmd/Ctrl+T)
- **Auto-save** - Never lose your work (saves every 30 seconds with live countdown in header)
- **Reset Button** - Clear saved content and reset to default with one click
- **Export Options** - Copy as Markdown, copy as HTML, or download files with custom filenames
- **Footnote Support** - Full footnote syntax with automatic numbering and back-references
- **Guided Tour** - Interactive 14-step onboarding covering all features (runs once, restartable anytime)
- **Accessibility First** - WCAG 2.1 Level AA compliant with full keyboard navigation and screen reader support
- **Static Deployment** - Deploy anywhere as a static site (Netlify-ready)
- **Fully Documented** - Comprehensive JSDoc comments on all composables and utilities
- **Reusable Tour Module** - Copy the tour module to any Nuxt project for instant onboarding

## Documentation

| Document | Description |
|----------|-------------|
| [Design Document](./documentation/icjia-markdown-editor-design-doc.md) | Features, UX requirements, user personas, accessibility gates |
| [Technical Architecture](./documentation/icjia-markdown-editor-technical-architecture.md) | Implementation details, code examples, component specs |
| [Accessibility Checklist](./documentation/ACCESSIBILITY_CHECKLIST.md) | Manual testing procedures for WCAG 2.1 AA |
| [Quick Start Guide](./documentation/QUICK_START.md) | Getting started in 5 minutes |
| [Browser Support](./documentation/BROWSER_SUPPORT.md) | Supported browsers and screen readers |
| [Troubleshooting](./documentation/TROUBLESHOOTING.md) | Common issues and solutions |
| [Tour Module](./app/modules/tour/README.md) | Reusable guided tour module documentation |

## Development Progress

### ✅ Phase 1: Foundation — COMPLETE

| Status | Feature |
|:------:|:--------|
| ✅ | Nuxt 4 project setup with Nuxt UI |
| ✅ | CodeMirror 6 integration with markdown syntax highlighting |
| ✅ | Basic twin-pane layout (editor/preview) |
| ✅ | Dark/light mode theming with system preference detection |
| ✅ | markdown-it configuration with footnotes and syntax highlighting |
| ✅ | Skip link and semantic HTML structure |
| ✅ | Focus indicators on all interactive elements |
| ✅ | `useAccessibility` composable with screen reader announcements |

### ✅ Phase 2: Core Features — COMPLETE

| Status | Feature |
|:------:|:--------|
| ✅ | Formatting toolbar with all buttons (Bold, Italic, Code, etc.) |
| ✅ | Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+1-6, etc.) |
| ✅ | Scroll synchronization between editor and preview |
| ✅ | Copy Markdown to clipboard |
| ✅ | Copy HTML to clipboard |
| ✅ | Download as Markdown file |
| ✅ | Upload Markdown file |
| ✅ | Word count and character count in status bar |

### ✅ Phase 3: Advanced Features — COMPLETE

| Status | Feature |
|:------:|:--------|
| ✅ | Table builder modal with visual grid editor |
| ✅ | Footnote support via markdown-it-footnote |
| ✅ | Auto-save to localStorage (every 30 seconds with countdown in header) |
| ✅ | Reset button to clear saved content |
| ✅ | Download modal with custom filename support |
| ✅ | HTML export with styled document wrapper |
| ✅ | Comprehensive JSDoc documentation for all composables and utilities |
| ✅ | Save indicator with visual feedback |

### 🔄 Phase 4: Accessibility & Polish — IN PROGRESS

| Status | Feature |
|:------:|:--------|
| ✅ | Guided tour/onboarding module (WCAG 2.1 AA compliant, 14 steps) |
| ✅ | Reusable tour module architecture for other projects |
| ✅ | Safari localStorage compatibility fix |
| ✅ | WCAG 1.4.12 text spacing compliance for code blocks |
| ⬜ | Full accessibility audit (axe-core, WAVE) |
| ⬜ | Screen reader testing (VoiceOver, NVDA) |
| ⬜ | Keyboard navigation refinement |
| ⬜ | Help modal with shortcuts reference |
| ⬜ | Image insertion modal with placeholder option |
| ⬜ | Link insertion modal with URL validation |
| ⬜ | Find & Replace functionality |
| ⬜ | Error handling improvements |
| ⬜ | Loading state refinements |

### ⬜ Phase 5: Testing & Launch — PENDING

| Status | Feature |
|:------:|:--------|
| ⬜ | Unit tests for utilities |
| ⬜ | Component tests |
| ⬜ | E2E tests for critical paths |
| ⬜ | Cross-browser testing |
| ⬜ | Performance optimization |
| ⬜ | Lighthouse score optimization (target: 100 accessibility) |
| ⬜ | Production deployment documentation |

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

### Tour Navigation

| Action | Key |
|--------|-----|
| Next Step | → (Arrow Right) |
| Previous Step | ← (Arrow Left) |
| Cancel Tour | Esc |

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
- **Guided Tour** - Accessible onboarding with keyboard navigation (Arrow keys, Escape)

## Guided Tour / Onboarding

The application includes an interactive guided tour that introduces users to all major features. The tour is:

- **WCAG 2.1 AA Compliant** - Full keyboard navigation (←/→/Esc), screen reader announcements
- **Runs Once by Default** - Automatically starts for first-time visitors
- **Cancellable Anytime** - Users can skip with a button or press Escape
- **Manually Restartable** - Click the ? button in the header to restart
- **Responsive** - Works on desktop and mobile devices

### Tour Steps

The tour follows a logical left-to-right, top-to-bottom order:

**Toolbar (left to right):**
1. **Text Formatting** - Bold, italic, inline code
2. **Headings** - H1-H6 with keyboard shortcuts
3. **Block Elements** - Quotes, code blocks, horizontal rules
4. **Lists** - Bullet and numbered lists
5. **Tables & Links** - Visual table builder, link insertion
6. **Scroll Sync** - Synchronized scrolling toggle
7. **Upload & Download** - File operations
8. **Copy to Clipboard** - Markdown and HTML export

**Main Content:**
9. **Editor Pane** - Where to write markdown
10. **Preview Pane** - Live rendering

**Header Controls:**
11. **Auto-Save** - Browser localStorage with countdown timer
12. **View Modes** - Split/editor/preview toggle
13. **Reset** - Clear saved content and reset to default
14. **Light/Dark Mode** - Theme toggle

### Reusing the Tour Module

The tour module is designed to be portable. Copy it to any Nuxt project:

#### 1. Copy the Module

```bash
# Copy the entire tour module folder
cp -r app/modules/tour /path/to/your-project/app/modules/
```

#### 2. Import Tour Styles

Add to your main CSS file:

```css
@import '~/modules/tour/styles/tour.css';
```

#### 3. Create Your Configuration

Create `app/config/tour.ts`:

```typescript
import type { TourConfig } from '~/modules/tour/types'

export const tourConfig: TourConfig = {
  version: 1,
  autoStart: true,
  autoStartDelay: 800,
  storageKeyPrefix: 'my-app-tour',
  steps: [
    {
      id: 'welcome',
      target: '[data-tour="header"]',
      title: 'Welcome!',
      content: 'This is a quick tour of the main features.',
      position: 'bottom',
      icon: 'i-heroicons-hand-raised'
    },
    // Add more steps...
  ]
}
```

#### 4. Add Tour Targets

Add `data-tour` attributes to elements you want to highlight:

```vue
<template>
  <header data-tour="header">...</header>
  <button data-tour="save-button">Save</button>
</template>
```

#### 5. Wire Up in Your Page

```vue
<script setup lang="ts">
import { useTour } from '~/modules/tour/composables/useTour'
import TourOverlay from '~/modules/tour/components/TourOverlay.vue'
import { tourConfig } from '~/config/tour'

const tour = useTour(tourConfig)

onMounted(() => {
  if (tour.autoStart && !tour.hasCompletedTour.value) {
    setTimeout(() => tour.start(), tour.autoStartDelay)
  }
})
</script>

<template>
  <!-- Add restart button -->
  <button @click="tour.start()">Start Tour</button>
  
  <!-- Add tour overlay -->
  <TourOverlay
    :is-active="tour.isActive.value"
    :current-step="tour.currentStep.value"
    :progress="tour.progress.value"
    @next="tour.next()"
    @previous="tour.previous()"
    @cancel="tour.cancel()"
  />
</template>
```

### Tour Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `version` | `number` | - | Increment to reset completion for all users |
| `autoStart` | `boolean` | `true` | Auto-start for first-time visitors |
| `autoStartDelay` | `number` | `800` | Delay (ms) before auto-starting |
| `storageKeyPrefix` | `string` | - | LocalStorage key prefix |
| `steps` | `TourStep[]` | - | Array of tour step definitions |

### Step Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | - | Unique identifier |
| `target` | `string` | - | CSS selector (e.g., `[data-tour="id"]`) |
| `title` | `string` | - | Step title |
| `content` | `string` | - | Step description |
| `tip` | `string` | - | Optional tip shown in highlighted box |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Popover position |
| `icon` | `string` | - | Iconify icon name |
| `shortcut` | `string[]` | - | Keyboard shortcut to display |

See `app/modules/tour/README.md` for complete documentation.

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
│   ├── config/             # App configuration
│   │   └── tour.ts         # Tour step definitions for this app
│   ├── modules/            # Reusable modules
│   │   └── tour/           # Guided tour module (portable to other projects)
│   │       ├── README.md           # Module documentation
│   │       ├── types.ts            # TypeScript definitions
│   │       ├── index.ts            # Module exports
│   │       ├── composables/
│   │       │   └── useTour.ts      # Tour state and navigation
│   │       ├── components/
│   │       │   ├── TourOverlay.vue # Main tour dialog UI
│   │       │   └── TourTrigger.vue # Reusable trigger button
│   │       └── styles/
│   │           └── tour.css        # Highlight ring animations
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Illinois Criminal Justice Information Authority (ICJIA).

## Acknowledgments

- [Nuxt](https://nuxt.com) - The Vue Framework
- [CodeMirror](https://codemirror.net) - Extensible code editor
- [Nuxt UI](https://ui.nuxt.com) - Beautiful UI components
- [markdown-it](https://github.com/markdown-it/markdown-it) - Markdown parser
