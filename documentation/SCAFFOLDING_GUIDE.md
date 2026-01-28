# Scaffolding Guide

This guide explains which documentation to use when initially setting up the ICJIA Markdown Editor project.

> **Quick Start**: For AI-assisted development, use [PHASE_1_PROMPT.md](./PHASE_1_PROMPT.md) to kick off the initial scaffolding.

---

## Document Usage Order

When scaffolding the application from scratch, use the documentation in this order:

### Phase 1: Project Setup

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Technical Architecture** | Technology Stack, Project Structure | Understand dependencies and folder layout |
| 2 | **Technical Architecture** | Nuxt Configuration | Set up `nuxt.config.ts` with correct modules |
| 3 | **Technical Architecture** | Dependency List | Install correct packages with versions |

**Commands to run:**
```bash
# Create new Nuxt 4 project
npx nuxi@latest init icjia-markdown-editor
cd icjia-markdown-editor

# Install dependencies from Technical Architecture doc
yarn add @codemirror/commands @codemirror/lang-markdown @codemirror/language \
  @codemirror/language-data @codemirror/search @codemirror/state @codemirror/view \
  @nuxt/ui @vueuse/core @vueuse/nuxt highlight.js markdown-it markdown-it-anchor \
  markdown-it-footnote

yarn add -D @axe-core/playwright @nuxt/devtools @nuxt/fonts @nuxt/test-utils \
  @playwright/test @vue/test-utils vitest vitest-axe
```

---

### Phase 2: Core Components

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Technical Architecture** | Component Architecture, Component Hierarchy | Create component file structure |
| 2 | **Technical Architecture** | EditorPane.vue, PreviewPane.vue, EditorToolbar.vue | Implement core editor components |
| 3 | **Design Document** | Feature Specification § 1 (Editor Core) | Understand layout requirements |

**Key files to create first:**
```
components/
├── editor/
│   ├── EditorPane.vue      # Start here - CodeMirror wrapper
│   ├── PreviewPane.vue     # Rendered markdown display
│   ├── EditorToolbar.vue   # Formatting toolbar
│   ├── EditorStatusBar.vue # Word count display
│   └── EditorLayout.vue    # Split pane container
└── ui/
    ├── AppHeader.vue       # App header with title
    ├── ColorModeToggle.vue # Dark/light mode switch
    └── SkipLink.vue        # Accessibility skip link
```

---

### Phase 3: State Management

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Technical Architecture** | State Management, Composable-Based Architecture | Create composables |
| 2 | **Technical Architecture** | CodeMirror 6 Configuration | Set up editor state |

**Key composables to create:**
```
composables/
├── useEditor.ts          # First - core editor state
├── useMarkdown.ts        # Second - markdown-it setup
├── useWordCount.ts       # Third - word counting
├── useAutoSave.ts        # Fourth - localStorage
├── useExport.ts          # Fifth - copy/download
├── useScrollSync.ts      # Sixth - scroll sync
├── useAccessibility.ts   # Always include from start
└── useNotifications.ts   # Error/success toasts
```

---

### Phase 4: Utilities & Helpers

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Technical Architecture** | CodeMirror 6 Configuration | Theme and keymap setup |
| 2 | **Technical Architecture** | Editor Commands, Keyboard Shortcuts | Command implementations |
| 3 | **Technical Architecture** | Markdown-it Configuration | Parser setup |
| 4 | **Technical Architecture** | Table Builder Implementation | Table generation utility |

**Key utilities to create:**
```
utils/
├── editor/
│   ├── config.ts         # CodeMirror state factory
│   ├── commands.ts       # Bold, italic, etc.
│   ├── keymaps.ts        # Keyboard shortcuts
│   ├── theme-dark.ts     # Dark theme
│   └── theme-light.ts    # Light theme
├── markdown/
│   ├── config.ts         # markdown-it setup
│   └── plugins.ts        # Plugin registration
├── table-builder.ts      # Table generation
├── html-export.ts        # HTML wrapping for download
├── storage.ts            # localStorage helpers
├── validation.ts         # Form validation
└── browser-support.ts    # Feature detection
```

---

### Phase 5: Modals & Advanced Features

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Design Document** | Feature Specification § 3 (Table Builder) | Table modal requirements |
| 2 | **Design Document** | Feature Specification § 4 (Image Handling) | Image modal requirements |
| 3 | **Technical Architecture** | Table Builder Implementation | Modal code example |

**Modal components to create:**
```
components/modals/
├── TableBuilderModal.vue     # Visual table creator
├── ImageInsertModal.vue      # Image with alt text
├── LinkInsertModal.vue       # Link insertion
├── ShortcutsHelpModal.vue    # F1 help modal
└── ConfirmModal.vue          # Destructive action confirm
```

---

### Phase 6: Styling & Theming

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Design Document** | Appearance § 7.2 (Dark Theme Colors) | CSS variables |
| 2 | **Design Document** | Appearance § 7.3 (Typography) | Font setup |
| 3 | **Technical Architecture** | Custom Theme (CodeMirror) | Editor theme |

**CSS files to create:**
```
assets/css/
├── main.css              # Global styles, CSS variables
└── print.css             # Print stylesheet
```

---

### Phase 7: Testing Setup

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Technical Architecture** | Testing Strategy, Test Configuration | Vitest/Playwright config |
| 2 | **Technical Architecture** | Accessibility Tests | a11y test examples |
| 3 | **Accessibility Checklist** | Pre-Flight: Automated Tests | Testing commands |

**Test files to create:**
```
tests/
├── setup.ts              # Test setup with mocks
├── unit/                 # Utility tests
├── components/           # Component tests
├── e2e/                  # Playwright E2E
└── a11y/                 # Accessibility tests (REQUIRED)
```

---

### Phase 8: Deployment

| Priority | Document | Sections to Use | Purpose |
|----------|----------|-----------------|---------|
| 1 | **Technical Architecture** | Netlify Configuration | `netlify.toml` setup |
| 2 | **Technical Architecture** | CI/CD Accessibility Gate | GitHub Actions workflow |
| 3 | **Design Document** | Performance Targets | Optimization goals |

---

## Quick Reference: Which Doc for What

| Task | Primary Document | Secondary Document |
|------|------------------|-------------------|
| **Install dependencies** | Technical Architecture (Dependency List) | - |
| **Create component** | Technical Architecture (Component Specs) | Design Document (Feature Specs) |
| **Implement feature** | Design Document (Feature Specification) | Technical Architecture (Code Examples) |
| **Add keyboard shortcut** | Design Document (§ 8 Shortcuts) | Technical Architecture (Keymaps) |
| **Style something** | Design Document (§ 7 Appearance) | Technical Architecture (Themes) |
| **Add accessibility** | Accessibility Checklist | Design Document (§ Accessibility) |
| **Fix a bug** | Troubleshooting | - |
| **Test browser support** | Browser Support | - |
| **Write tests** | Technical Architecture (Testing Strategy) | Accessibility Checklist |
| **Deploy** | Technical Architecture (Netlify Config) | - |

---

## Scaffolding Checklist

Use this checklist when scaffolding a new project:

### Project Initialization
- [ ] Create Nuxt 4 project with `npx nuxi@latest init`
- [ ] Copy `nuxt.config.ts` settings from Technical Architecture
- [ ] Install all dependencies from Technical Architecture
- [ ] Create `.gitignore` (already done in this project)
- [ ] Set up folder structure per Technical Architecture

### Core Implementation
- [ ] Create `app.vue` with basic layout
- [ ] Create `pages/index.vue` as main page
- [ ] Implement `SkipLink.vue` (accessibility first!)
- [ ] Implement `EditorPane.vue` with CodeMirror
- [ ] Implement `PreviewPane.vue` with markdown-it
- [ ] Implement `EditorLayout.vue` split pane
- [ ] Implement `EditorToolbar.vue` with buttons
- [ ] Implement `EditorStatusBar.vue` with word count

### State & Utilities
- [ ] Create `useEditor.ts` composable
- [ ] Create `useMarkdown.ts` composable
- [ ] Create `useAccessibility.ts` composable
- [ ] Create editor commands (`commands.ts`)
- [ ] Create keymaps (`keymaps.ts`)
- [ ] Create dark/light themes

### Testing Setup
- [ ] Configure Vitest (`vitest.config.ts`)
- [ ] Configure Playwright (`playwright.config.ts`)
- [ ] Create test setup file (`tests/setup.ts`)
- [ ] Write first accessibility test
- [ ] Verify `yarn test:a11y` passes

### Deployment Setup
- [ ] Create `netlify.toml`
- [ ] Set up GitHub Actions workflow
- [ ] Configure Lighthouse CI

---

## Important Notes

1. **Accessibility First**: Always implement `SkipLink.vue` and `useAccessibility.ts` before other components

2. **Test Early**: Set up testing infrastructure in Phase 7 but run `yarn test:a11y` after every component

3. **Use Code Examples**: The Technical Architecture document contains copy-paste-ready code - use it!

4. **Check Versions**: The Dependency List in Technical Architecture has specific versions - don't upgrade without testing

5. **Dark Mode Default**: Follow Design Document § 7.1 - dark mode is the default

---

## Getting Started Command

Run this to scaffold the basic structure:

```bash
# From project root
mkdir -p components/{editor,modals,toolbar,ui}
mkdir -p composables
mkdir -p utils/{editor,markdown}
mkdir -p types
mkdir -p tests/{unit,components,e2e,a11y}
mkdir -p assets/css
mkdir -p public

# Create placeholder files
touch components/editor/{EditorPane,PreviewPane,EditorToolbar,EditorStatusBar,EditorLayout}.vue
touch components/modals/{TableBuilderModal,ImageInsertModal,LinkInsertModal,ShortcutsHelpModal,ConfirmModal}.vue
touch components/toolbar/{ToolbarButton,ToolbarDropdown,ToolbarDivider,ToolbarGroup}.vue
touch components/ui/{AppHeader,ColorModeToggle,SkipLink}.vue
touch composables/{useEditor,useMarkdown,useScrollSync,useAutoSave,useExport,useWordCount,useAccessibility,useNotifications}.ts
touch utils/editor/{config,commands,keymaps,theme-dark,theme-light}.ts
touch utils/markdown/{config,plugins}.ts
touch utils/{table-builder,html-export,storage,validation,browser-support}.ts
touch types/{editor,index}.ts
touch tests/setup.ts
touch assets/css/{main,print}.css
```

Then follow the phases above to implement each file.
