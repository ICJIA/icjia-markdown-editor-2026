# ICJIA Markdown Editor v1 - Technical Architecture

## Overview

This document describes the technical implementation of the ICJIA Markdown Editor, a Nuxt 4 application using CodeMirror 6 for editing and markdown-it for parsing.

---

## ⚠️ Accessibility-First Architecture

**Every technical decision in this document is made with WCAG 2.1 AA compliance as a hard requirement.**

### Accessibility Built Into the Stack

| Layer | Accessibility Implementation |
|-------|------------------------------|
| **Framework** | Nuxt UI components are accessible by default (proper ARIA, keyboard support) |
| **Editor** | CodeMirror 6 has built-in accessibility (ARIA roles, screen reader support, keyboard navigation) |
| **State** | `useAccessibility` composable provides live region announcements and focus management |
| **Testing** | vitest-axe for unit tests, Playwright a11y project for E2E, dedicated `tests/a11y/` directory |
| **CI/CD** | Accessibility tests block deployment on failure |

### Accessibility Patterns Used Throughout

```typescript
// Pattern 1: All interactive elements have visible focus
'&:focus-visible': {
  outline: '2px solid var(--ui-primary)',
  outlineOffset: '2px',
}

// Pattern 2: Screen reader announcements for actions
const { announce } = useAccessibility()
announce('Table inserted with 3 rows and 4 columns')

// Pattern 3: Keyboard alternatives for all mouse actions
// Every click handler has a keydown handler for Enter/Space

// Pattern 4: Required alt text for images
// Image modal won't allow insert without alt text

// Pattern 5: Focus trapping in modals
const { handleKeyDown } = useFocusTrap(modalRef)
```

### Accessibility Acceptance Criteria

Before ANY component is considered complete:

1. **Keyboard**: Can complete all actions without a mouse
2. **Screen Reader**: All content and state changes are announced
3. **Visual**: Focus indicators visible, contrast ratios met
4. **Semantic**: Proper heading hierarchy, landmark regions, button/link distinction
5. **Testing**: Passes axe-core with 0 violations

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Nuxt | 4.x | Application framework |
| Vue | 3.5+ | Reactive UI |
| TypeScript | 5.x | Type safety |
| Nuxt UI | 2.x | Component library (Tailwind-based) |

> **Note:** Nuxt UI 3 is in alpha. We're using Nuxt UI 2.x for stability. Migration to v3 can happen post-launch when it's stable.

### Editor & Parsing
| Technology | Version | Purpose |
|------------|---------|---------|
| CodeMirror | 6.x | Text editor engine |
| @codemirror/lang-markdown | latest | Markdown syntax support |
| markdown-it | 14.x | Markdown → HTML parsing |
| markdown-it-footnote | 4.x | Footnote support |
| highlight.js | 11.x | Code syntax highlighting |

### Build & Deploy
| Technology | Purpose |
|------------|---------|
| Vite | Build tool (via Nuxt) |
| Netlify | Static hosting |
| Yarn | Package manager (1.22.22) |

---

## Project Structure

```
icjia-markdown-editor/
├── .nuxt/                    # Nuxt build output (gitignored)
├── node_modules/             # Dependencies (gitignored)
├── public/
│   └── favicon.ico
├── assets/
│   └── css/
│       ├── main.css          # Global styles & overrides
│       └── print.css         # Print stylesheet
├── components/
│   ├── editor/
│   │   ├── EditorPane.vue    # CodeMirror wrapper
│   │   ├── PreviewPane.vue   # Rendered markdown display
│   │   ├── EditorToolbar.vue # Formatting toolbar
│   │   ├── EditorStatusBar.vue # Word count, position
│   │   └── EditorLayout.vue  # Split pane container
│   ├── modals/
│   │   ├── TableBuilderModal.vue
│   │   ├── ImageInsertModal.vue
│   │   ├── LinkInsertModal.vue
│   │   ├── ShortcutsHelpModal.vue
│   │   └── ConfirmModal.vue
│   ├── toolbar/
│   │   ├── ToolbarButton.vue
│   │   ├── ToolbarDropdown.vue
│   │   ├── ToolbarDivider.vue
│   │   └── ToolbarGroup.vue
│   └── ui/
│       ├── AppHeader.vue
│       ├── ColorModeToggle.vue
│       └── SkipLink.vue      # Accessibility skip link
├── composables/
│   ├── useEditor.ts          # CodeMirror state & actions
│   ├── useMarkdown.ts        # markdown-it configuration
│   ├── useScrollSync.ts      # Bidirectional scroll sync
│   ├── useAutoSave.ts        # localStorage persistence
│   ├── useExport.ts          # Copy/download functions
│   ├── useWordCount.ts       # Word/character counting
│   └── useAccessibility.ts   # Focus management, announcements
├── utils/
│   ├── markdown/
│   │   ├── config.ts         # markdown-it setup
│   │   └── plugins.ts        # Plugin registration
│   ├── editor/
│   │   ├── commands.ts       # Editor commands (bold, italic, etc)
│   │   ├── keymaps.ts        # Keyboard shortcut definitions
│   │   ├── theme-dark.ts     # CodeMirror dark theme
│   │   └── theme-light.ts    # CodeMirror light theme
│   ├── table-builder.ts      # Table markdown generation
│   ├── html-export.ts        # HTML output formatting
│   └── storage.ts            # localStorage helpers
├── types/
│   ├── editor.ts             # Editor-related types
│   └── index.ts              # Re-exports
├── tests/
│   ├── unit/                 # Vitest unit tests
│   ├── components/           # Vue component tests
│   ├── e2e/                  # Playwright E2E tests
│   └── a11y/                 # Accessibility tests
├── app.vue                   # Root component
├── pages/
│   └── index.vue             # Main (only) page
├── nuxt.config.ts            # Nuxt configuration
├── vitest.config.ts          # Vitest test configuration
├── playwright.config.ts      # Playwright E2E configuration
├── tsconfig.json             # TypeScript config
├── package.json
├── yarn.lock
├── .gitignore
├── README.md
└── netlify.toml              # Netlify deployment config
```

---

## Component Architecture

### Component Hierarchy

```
app.vue
└── pages/index.vue
    ├── SkipLink
    ├── AppHeader
    │   └── ColorModeToggle
    ├── EditorLayout
    │   ├── EditorToolbar
    │   │   ├── ToolbarGroup (formatting)
    │   │   │   ├── ToolbarButton (bold, italic, etc)
    │   │   │   └── ToolbarDropdown (headings)
    │   │   ├── ToolbarDivider
    │   │   ├── ToolbarGroup (insert)
    │   │   │   └── ToolbarButton (link, image, table)
    │   │   └── ToolbarGroup (export)
    │   │       └── ToolbarButton (copy, download)
    │   ├── EditorPane (CodeMirror)
    │   ├── PreviewPane (rendered HTML)
    │   └── EditorStatusBar
    │       ├── WordCount
    │       └── ScrollSyncToggle
    └── Modals (teleported to body)
        ├── TableBuilderModal
        ├── ImageInsertModal
        ├── LinkInsertModal
        ├── ShortcutsHelpModal
        └── ConfirmModal
```

### Component Specifications

> **Note**: Every component must meet accessibility requirements before being considered complete. See the accessibility acceptance criteria above.

#### EditorPane.vue

**Accessibility Requirements:**
- CodeMirror instance has `role="textbox"` and `aria-multiline="true"`
- `aria-label="Markdown editor"` describes the purpose
- Focus indicator visible (2px outline, 3:1 contrast ratio)
- Screen reader announces line/column position on cursor movement

```vue
<script setup lang="ts">
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'scroll', position: number): void
  (e: 'cursorChange', position: { line: number; column: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Expose editor instance for toolbar commands
const editorView = ref<EditorView | null>(null)
defineExpose({ editorView })
</script>
```

#### PreviewPane.vue

**Accessibility Requirements:**
- Container has `role="region"` and `aria-label="Markdown preview"`
- Generated HTML uses semantic elements (headings, lists, etc.)
- Images in preview display alt text visually if image fails to load
- Links have visible focus indicators
- `aria-live="polite"` announces content updates to screen readers

```vue
<script setup lang="ts">
interface Props {
  html: string
  scrollPosition?: number
}

const props = defineProps<Props>()
const emit = defineEmits<['scroll']>()

// Scroll sync: receive position from editor
watch(() => props.scrollPosition, (pos) => {
  if (pos !== undefined) {
    scrollToPercentage(pos)
  }
})
</script>
```

#### EditorToolbar.vue

**Accessibility Requirements:**
- Toolbar has `role="toolbar"` and `aria-label="Formatting toolbar"`
- All buttons have `aria-label` describing their action
- Buttons show tooltips on hover AND focus (not just hover)
- Dropdown menus use `aria-expanded`, `aria-haspopup`, and `role="menu"`
- Arrow key navigation within toolbar groups
- Tab moves between groups, arrows move within groups
- Keyboard shortcuts shown in tooltips (e.g., "Bold (Ctrl+B)")

```vue
<script setup lang="ts">
import type { EditorView } from '@codemirror/view'

interface Props {
  editor: EditorView | null
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<['action']>()

// Toolbar actions call editor commands
const handleBold = () => {
  if (props.editor) {
    wrapSelection(props.editor, '**', '**')
  }
}
</script>
```

---

## State Management

### Composable-Based Architecture

No Pinia store needed for v1. All state managed through composables:

```typescript
// composables/useEditor.ts
export function useEditor() {
  const content = ref('')
  const editorView = ref<EditorView | null>(null)
  const cursorPosition = ref({ line: 1, column: 1 })
  const isModified = ref(false)
  
  // Editor actions
  function insertText(text: string) { /* ... */ }
  function wrapSelection(before: string, after: string) { /* ... */ }
  function replaceSelection(text: string) { /* ... */ }
  
  // State management
  function setContent(newContent: string) { /* ... */ }
  function clearContent() { /* ... */ }
  
  return {
    content: readonly(content),
    editorView,
    cursorPosition: readonly(cursorPosition),
    isModified: readonly(isModified),
    insertText,
    wrapSelection,
    replaceSelection,
    setContent,
    clearContent,
  }
}
```

```typescript
// composables/useMarkdown.ts
export function useMarkdown() {
  const md = createMarkdownIt()
  
  const renderedHtml = computed(() => {
    const editor = useEditor()
    return md.render(editor.content.value)
  })
  
  return {
    renderedHtml,
    md, // Expose for advanced use
  }
}
```

```typescript
// composables/useAutoSave.ts
export function useAutoSave(options: AutoSaveOptions = {}) {
  const { interval = 30000, key = 'icjia-md-autosave' } = options
  const editor = useEditor()
  
  // Auto-save on interval
  const { pause, resume } = useIntervalFn(() => {
    save()
  }, interval)
  
  // Auto-save on blur
  useEventListener(window, 'blur', save)
  
  function save() {
    localStorage.setItem(key, editor.content.value)
  }
  
  function restore(): string | null {
    return localStorage.getItem(key)
  }
  
  function clear() {
    localStorage.removeItem(key)
  }
  
  return { save, restore, clear, pause, resume }
}
```

```typescript
// composables/useWordCount.ts
import { computed } from 'vue'
import { refDebounced } from '@vueuse/core'

export interface WordCountStats {
  words: number
  characters: number
  charactersNoSpaces: number
  lines: number
  paragraphs: number
}

export function useWordCount(content: Ref<string>) {
  // Debounce to avoid excessive recalculation while typing
  const debouncedContent = refDebounced(content, 300)
  
  const stats = computed<WordCountStats>(() => {
    const text = debouncedContent.value
    
    if (!text || text.trim().length === 0) {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        lines: 0,
        paragraphs: 0,
      }
    }
    
    // Word count: split on whitespace, filter empty strings
    const words = text.trim().split(/\s+/).filter(Boolean).length
    
    // Character counts
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    
    // Line count
    const lines = text.split('\n').length
    
    // Paragraph count (separated by blank lines)
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 0).length
    
    return {
      words,
      characters,
      charactersNoSpaces,
      lines,
      paragraphs,
    }
  })
  
  // Formatted display string
  const displayText = computed(() => {
    const { words, characters } = stats.value
    return `${words.toLocaleString()} words · ${characters.toLocaleString()} characters`
  })
  
  return {
    stats,
    displayText,
  }
}
```

---

## CodeMirror 6 Configuration

### Editor Setup

```typescript
// utils/editor/config.ts
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { icjiaTheme, icjiaHighlightStyle } from './theme'
import { markdownKeymap } from './keymaps'

// Compartments for dynamic configuration
export const themeCompartment = new Compartment()
export const lineNumbersCompartment = new Compartment()
export const readOnlyCompartment = new Compartment()

export function createEditorState(
  doc: string,
  onChange: (value: string) => void
): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      // Core
      history(),
      closeBrackets(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      
      // Line numbers (toggleable)
      lineNumbersCompartment.of(lineNumbers()),
      
      // Markdown language
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      
      // Theme (toggleable for dark/light)
      themeCompartment.of(icjiaTheme),
      
      // Keymaps
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...markdownKeymap,
      ]),
      
      // Change listener
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString())
        }
      }),
      
      // Accessibility
      EditorView.contentAttributes.of({
        'aria-label': 'Markdown editor',
        'role': 'textbox',
        'aria-multiline': 'true',
      }),
    ],
  })
}
```

### Custom Theme

```typescript
// utils/editor/theme-dark.ts
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const icjiaDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--ui-bg)',
    color: 'var(--ui-text)',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  '.cm-content': {
    caretColor: 'var(--ui-primary)',
    padding: '16px',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--ui-primary)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.3) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.4) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--ui-bg)',
    color: 'var(--ui-text-muted)',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--ui-text)',
  },
  // Focus indicator for accessibility (WCAG 2.1 AA)
  '&.cm-focused': {
    outline: '2px solid var(--ui-primary)',
    outlineOffset: '2px',
  },
}, { dark: true })

export const icjiaDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: 'bold', fontSize: '1.5em', color: '#93c5fd' },
  { tag: tags.heading2, fontWeight: 'bold', fontSize: '1.3em', color: '#93c5fd' },
  { tag: tags.heading3, fontWeight: 'bold', fontSize: '1.1em', color: '#93c5fd' },
  { tag: tags.heading4, fontWeight: 'bold', color: '#93c5fd' },
  { tag: tags.strong, fontWeight: 'bold', color: '#f1f5f9' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#e2e8f0' },
  { tag: tags.link, color: '#60a5fa', textDecoration: 'underline' },
  { tag: tags.url, color: '#60a5fa' },
  { tag: tags.monospace, fontFamily: "'JetBrains Mono', monospace", color: '#4ade80' },
  { tag: tags.quote, color: '#94a3b8', fontStyle: 'italic' },
  { tag: tags.list, color: '#fbbf24' },
  { tag: tags.comment, color: '#64748b' },
])

export const darkTheme = [
  icjiaDarkTheme,
  syntaxHighlighting(icjiaDarkHighlightStyle),
]
```

```typescript
// utils/editor/theme-light.ts
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const icjiaLightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--ui-bg)',
    color: 'var(--ui-text)',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  '.cm-content': {
    caretColor: 'var(--ui-primary)',
    padding: '16px',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--ui-primary)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.3) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--ui-bg)',
    color: 'var(--ui-text-muted)',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: 'var(--ui-text)',
  },
  // Focus indicator for accessibility (WCAG 2.1 AA)
  '&.cm-focused': {
    outline: '2px solid var(--ui-primary)',
    outlineOffset: '2px',
  },
}, { dark: false })

export const icjiaLightHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: 'bold', fontSize: '1.5em', color: '#1d4ed8' },
  { tag: tags.heading2, fontWeight: 'bold', fontSize: '1.3em', color: '#1d4ed8' },
  { tag: tags.heading3, fontWeight: 'bold', fontSize: '1.1em', color: '#1d4ed8' },
  { tag: tags.heading4, fontWeight: 'bold', color: '#1d4ed8' },
  { tag: tags.strong, fontWeight: 'bold', color: '#0f172a' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#334155' },
  { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
  { tag: tags.url, color: '#2563eb' },
  { tag: tags.monospace, fontFamily: "'JetBrains Mono', monospace", color: '#16a34a' },
  { tag: tags.quote, color: '#64748b', fontStyle: 'italic' },
  { tag: tags.list, color: '#d97706' },
  { tag: tags.comment, color: '#94a3b8' },
])

export const lightTheme = [
  icjiaLightTheme,
  syntaxHighlighting(icjiaLightHighlightStyle),
]
```

### Keyboard Shortcuts

```typescript
// utils/editor/keymaps.ts
import { KeyBinding } from '@codemirror/view'
import { 
  toggleBold, 
  toggleItalic, 
  insertLink,
  insertImage,
  insertCodeBlock,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
} from './commands'

export const markdownKeymap: KeyBinding[] = [
  { key: 'Mod-b', run: toggleBold, preventDefault: true },
  { key: 'Mod-i', run: toggleItalic, preventDefault: true },
  { key: 'Mod-k', run: insertLink, preventDefault: true },
  { key: 'Mod-Shift-i', run: insertImage, preventDefault: true },
  { key: 'Mod-`', run: toggleInlineCode, preventDefault: true },
  { key: 'Mod-Shift-`', run: insertCodeBlock, preventDefault: true },
  { key: 'Mod-q', run: toggleBlockquote, preventDefault: true },
  { key: 'Mod-Shift-8', run: toggleBulletList, preventDefault: true },
  { key: 'Mod-Shift-7', run: toggleOrderedList, preventDefault: true },
  { key: 'Mod-t', run: openTableBuilder, preventDefault: true },
  { key: 'Mod-Shift-f', run: insertFootnote, preventDefault: true },
  { key: 'Mod-Shift-c', run: copyMarkdown, preventDefault: true },
  { key: 'Mod-Shift-h', run: copyHtml, preventDefault: true },
  { key: 'Mod-s', run: downloadMarkdown, preventDefault: true },
  { key: 'F1', run: showHelp, preventDefault: true },
]
```

### Editor Commands

```typescript
// utils/editor/commands.ts
import { EditorView } from '@codemirror/view'

export function wrapSelection(
  view: EditorView,
  before: string,
  after: string
): boolean {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)
  
  view.dispatch({
    changes: {
      from,
      to,
      insert: `${before}${selectedText}${after}`,
    },
    selection: {
      anchor: from + before.length,
      head: from + before.length + selectedText.length,
    },
  })
  
  view.focus()
  return true
}

export function toggleBold(view: EditorView): boolean {
  return wrapSelection(view, '**', '**')
}

export function toggleItalic(view: EditorView): boolean {
  return wrapSelection(view, '_', '_')
}

export function insertAtCursor(view: EditorView, text: string): boolean {
  const { state } = view
  const { from } = state.selection.main
  
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  })
  
  view.focus()
  return true
}

export function insertLink(view: EditorView): boolean {
  // Opens modal - return false to indicate modal should open
  return false // Handled by modal system
}

export function insertTable(view: EditorView, markdown: string): boolean {
  return insertAtCursor(view, markdown)
}
```

---

## Markdown-it Configuration

```typescript
// utils/markdown/config.ts
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
import anchor from 'markdown-it-anchor'
import hljs from 'highlight.js'

export function createMarkdownIt(): MarkdownIt {
  const md = new MarkdownIt({
    html: false,          // Disable raw HTML (security)
    xhtmlOut: true,       // Use XHTML-compliant output
    breaks: true,         // Convert \n to <br>
    linkify: true,        // Auto-convert URLs to links
    typographer: true,    // Enable smartquotes, dashes
    
    // Syntax highlighting for code blocks
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`
        } catch (e) {
          console.error('Highlight error:', e)
        }
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    },
  })
  
  // Plugins
  md.use(footnote)
  md.use(anchor, {
    permalink: anchor.permalink.headerLink(),
    permalinkClass: 'header-anchor',
    permalinkSymbol: '#',
    permalinkAttrs: () => ({ 'aria-hidden': 'true' }),
  })
  
  // Custom renderer for accessibility
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
  
  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    // Add rel="noopener" to external links
    const href = tokens[idx].attrGet('href')
    if (href && href.startsWith('http')) {
      tokens[idx].attrPush(['rel', 'noopener noreferrer'])
      tokens[idx].attrPush(['target', '_blank'])
    }
    return defaultRender(tokens, idx, options, env, self)
  }
  
  return md
}
```

---

## Table Builder Implementation

```typescript
// utils/table-builder.ts
export interface TableConfig {
  rows: number
  columns: number
  headers: string[]
  cells: string[][]
  alignments: ('left' | 'center' | 'right')[]
}

export function generateTableMarkdown(config: TableConfig): string {
  const { headers, cells, alignments } = config
  const lines: string[] = []
  
  // Header row
  lines.push(`| ${headers.join(' | ')} |`)
  
  // Alignment row
  const alignmentRow = alignments.map((align) => {
    switch (align) {
      case 'left': return ':---'
      case 'center': return ':---:'
      case 'right': return '---:'
    }
  })
  lines.push(`| ${alignmentRow.join(' | ')} |`)
  
  // Data rows
  for (const row of cells) {
    lines.push(`| ${row.join(' | ')} |`)
  }
  
  return lines.join('\n')
}

export function createEmptyTable(rows: number, cols: number): TableConfig {
  return {
    rows,
    columns: cols,
    headers: Array(cols).fill('Header'),
    cells: Array(rows).fill(null).map(() => Array(cols).fill('')),
    alignments: Array(cols).fill('left'),
  }
}
```

```vue
<!-- components/modals/TableBuilderModal.vue -->
<script setup lang="ts">
import { createEmptyTable, generateTableMarkdown, type TableConfig } from '~/utils/table-builder'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'insert', markdown: string): void
}>()

const rows = ref(3)
const cols = ref(3)
const table = ref<TableConfig>(createEmptyTable(3, 3))

watch([rows, cols], ([r, c]) => {
  table.value = createEmptyTable(r, c)
})

function handleInsert() {
  const markdown = generateTableMarkdown(table.value)
  emit('insert', markdown)
  emit('close')
}
</script>

<template>
  <UModal 
    :open="open" 
    @close="emit('close')"
    aria-labelledby="table-builder-title"
  >
    <template #header>
      <h2 id="table-builder-title">Insert Table</h2>
    </template>
    
    <div class="space-y-4">
      <!-- Dimension controls -->
      <div class="flex gap-4">
        <UFormField label="Rows">
          <UInput 
            v-model.number="rows" 
            type="number" 
            :min="1" 
            :max="20"
            aria-describedby="rows-help"
          />
          <span id="rows-help" class="sr-only">Number of table rows, 1-20</span>
        </UFormField>
        
        <UFormField label="Columns">
          <UInput 
            v-model.number="cols" 
            type="number" 
            :min="1" 
            :max="10"
            aria-describedby="cols-help"
          />
          <span id="cols-help" class="sr-only">Number of table columns, 1-10</span>
        </UFormField>
      </div>
      
      <!-- Table editor grid -->
      <div 
        class="overflow-auto"
        role="grid"
        aria-label="Table content editor"
      >
        <!-- Header row -->
        <div role="row" class="flex">
          <div 
            v-for="(header, i) in table.headers" 
            :key="`header-${i}`"
            role="columnheader"
          >
            <UInput 
              v-model="table.headers[i]"
              :aria-label="`Column ${i + 1} header`"
              class="font-bold"
            />
          </div>
        </div>
        
        <!-- Alignment row -->
        <div role="row" class="flex">
          <div 
            v-for="(_, i) in table.alignments" 
            :key="`align-${i}`"
            role="cell"
          >
            <USelect
              v-model="table.alignments[i]"
              :options="[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]"
              :aria-label="`Column ${i + 1} alignment`"
            />
          </div>
        </div>
        
        <!-- Data rows -->
        <div 
          v-for="(row, rowIndex) in table.cells" 
          :key="`row-${rowIndex}`"
          role="row"
          class="flex"
        >
          <div 
            v-for="(cell, colIndex) in row" 
            :key="`cell-${rowIndex}-${colIndex}`"
            role="cell"
          >
            <UInput 
              v-model="table.cells[rowIndex][colIndex]"
              :aria-label="`Row ${rowIndex + 1}, Column ${colIndex + 1}`"
            />
          </div>
        </div>
      </div>
      
      <!-- Preview -->
      <details>
        <summary>Preview Markdown</summary>
        <pre class="text-sm bg-gray-800 p-2 rounded overflow-auto">{{ 
          generateTableMarkdown(table) 
        }}</pre>
      </details>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" @click="emit('close')">
          Cancel
        </UButton>
        <UButton @click="handleInsert">
          Insert Table
        </UButton>
      </div>
    </template>
  </UModal>
</template>
```

---

## Scroll Synchronization

```typescript
// composables/useScrollSync.ts
import { debounce } from '~/utils/debounce'

export function useScrollSync() {
  const enabled = ref(true)
  const isScrolling = ref(false)
  
  const editorRef = ref<HTMLElement | null>(null)
  const previewRef = ref<HTMLElement | null>(null)
  
  // Calculate scroll percentage
  function getScrollPercentage(element: HTMLElement): number {
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    return scrollHeight > 0 ? scrollTop / scrollHeight : 0
  }
  
  // Apply scroll percentage to element
  function setScrollPercentage(element: HTMLElement, percentage: number) {
    const scrollHeight = element.scrollHeight - element.clientHeight
    element.scrollTop = scrollHeight * percentage
  }
  
  // Sync preview to editor
  const syncPreviewToEditor = debounce((percentage: number) => {
    if (!enabled.value || !previewRef.value || isScrolling.value) return
    
    isScrolling.value = true
    setScrollPercentage(previewRef.value, percentage)
    
    requestAnimationFrame(() => {
      isScrolling.value = false
    })
  }, 16)
  
  // Sync editor to preview
  const syncEditorToPreview = debounce((percentage: number) => {
    if (!enabled.value || !editorRef.value || isScrolling.value) return
    
    isScrolling.value = true
    setScrollPercentage(editorRef.value, percentage)
    
    requestAnimationFrame(() => {
      isScrolling.value = false
    })
  }, 16)
  
  // Event handlers
  function handleEditorScroll(event: Event) {
    const target = event.target as HTMLElement
    syncPreviewToEditor(getScrollPercentage(target))
  }
  
  function handlePreviewScroll(event: Event) {
    const target = event.target as HTMLElement
    syncEditorToPreview(getScrollPercentage(target))
  }
  
  // Toggle
  function toggle() {
    enabled.value = !enabled.value
  }
  
  return {
    enabled,
    editorRef,
    previewRef,
    handleEditorScroll,
    handlePreviewScroll,
    toggle,
  }
}
```

---

## Export Functionality

```typescript
// composables/useExport.ts
import { useClipboard } from '@vueuse/core'

export function useExport() {
  const { copy, copied } = useClipboard()
  const editor = useEditor()
  const { renderedHtml } = useMarkdown()
  
  async function copyMarkdown() {
    await copy(editor.content.value)
    announceToScreenReader('Markdown copied to clipboard')
  }
  
  async function copyHtml() {
    await copy(renderedHtml.value)
    announceToScreenReader('HTML copied to clipboard')
  }
  
  function downloadMarkdown(filename = 'document.md') {
    const blob = new Blob([editor.content.value], { type: 'text/markdown' })
    downloadBlob(blob, filename)
  }
  
  function downloadHtml(filename = 'document.html') {
    const fullHtml = wrapHtmlDocument(renderedHtml.value)
    const blob = new Blob([fullHtml], { type: 'text/html' })
    downloadBlob(blob, filename)
  }
  
  return {
    copyMarkdown,
    copyHtml,
    downloadMarkdown,
    downloadHtml,
    copied,
  }
}

// utils/html-export.ts
export function wrapHtmlDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
    }
    @media (max-width: 767px) {
      body { padding: 15px; }
    }
  </style>
</head>
<body class="markdown-body">
${content}
</body>
</html>`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

---

## Accessibility Implementation

```typescript
// composables/useAccessibility.ts
export function useAccessibility() {
  const announcer = ref<HTMLElement | null>(null)
  
  // Live region for screen reader announcements
  onMounted(() => {
    announcer.value = document.createElement('div')
    announcer.value.setAttribute('role', 'status')
    announcer.value.setAttribute('aria-live', 'polite')
    announcer.value.setAttribute('aria-atomic', 'true')
    announcer.value.className = 'sr-only'
    document.body.appendChild(announcer.value)
  })
  
  onUnmounted(() => {
    announcer.value?.remove()
  })
  
  function announce(message: string) {
    if (announcer.value) {
      announcer.value.textContent = ''
      // Small delay ensures screen reader picks up the change
      setTimeout(() => {
        if (announcer.value) {
          announcer.value.textContent = message
        }
      }, 50)
    }
  }
  
  return { announce }
}

// Utility for focus management
export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  function getFocusableElements(): HTMLElement[] {
    if (!containerRef.value) return []
    return Array.from(containerRef.value.querySelectorAll(focusableSelector))
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    
    const focusable = getFocusableElements()
    if (focusable.length === 0) return
    
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  
  return { handleKeyDown, getFocusableElements }
}
```

---

## Error Handling Strategy

### Error Categories

| Category | Severity | Recovery | Example |
|----------|----------|----------|---------|
| **User Input Errors** | Low | Automatic | Invalid table dimensions, missing alt text |
| **Storage Errors** | Medium | Graceful degradation | localStorage quota exceeded, private browsing |
| **Parser Errors** | Low | Fallback | Malformed markdown syntax |
| **System Errors** | Critical | User notification | CodeMirror init failure, browser incompatibility |

### Error Handling Composable

```typescript
// composables/useNotifications.ts
import type { Toast } from '#ui/types'

export function useNotifications() {
  const toast = useToast()
  const { announce } = useAccessibility()
  
  function error(message: string, options?: Partial<Toast> & { action?: { label: string; onClick: () => void } }) {
    // Announce to screen readers
    announce(`Error: ${message}`)
    
    toast.add({
      title: 'Error',
      description: message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
      timeout: 5000,
      ...options,
    })
  }
  
  function warning(message: string) {
    announce(`Warning: ${message}`)
    
    toast.add({
      title: 'Warning',
      description: message,
      color: 'orange',
      icon: 'i-heroicons-exclamation-circle',
      timeout: 4000,
    })
  }
  
  function success(message: string) {
    announce(message)
    
    toast.add({
      title: 'Success',
      description: message,
      color: 'green',
      icon: 'i-heroicons-check-circle',
      timeout: 3000,
    })
  }
  
  return { error, warning, success }
}
```

### Storage Error Handling

```typescript
// composables/useAutoSave.ts (error handling portion)
function save(): boolean {
  try {
    localStorage.setItem(key, editor.content.value)
    lastSaveTime.value = Date.now()
    return true
  } catch (e) {
    if (e instanceof DOMException) {
      if (e.name === 'QuotaExceededError') {
        useNotifications().error(
          'Storage full. Download your work to avoid data loss.',
          { 
            action: { 
              label: 'Download', 
              onClick: () => useExport().downloadMarkdown() 
            } 
          }
        )
        pause() // Stop auto-save attempts
      } else if (e.name === 'SecurityError') {
        useNotifications().warning(
          'Auto-save unavailable in private browsing mode.'
        )
        pause()
      }
    }
    return false
  }
}

function checkStorageAvailability(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}
```

### Error Boundary Component

```vue
<!-- components/ErrorBoundary.vue -->
<script setup lang="ts">
interface Props {
  fallbackMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: 'Something went wrong. Please refresh the page.',
})

const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

onErrorCaptured((err, instance, info) => {
  error.value = err as Error
  errorInfo.value = info
  
  // Log error for debugging
  console.error('Component error:', err)
  console.error('Error info:', info)
  
  // Prevent error from propagating
  return false
})

function handleReload() {
  window.location.reload()
}

function handleReset() {
  error.value = null
  errorInfo.value = ''
}
</script>

<template>
  <div 
    v-if="error" 
    class="error-boundary" 
    role="alert"
    aria-live="assertive"
  >
    <div class="error-content">
      <UIcon name="i-heroicons-exclamation-triangle" class="error-icon" />
      <h2>Something went wrong</h2>
      <p>{{ props.fallbackMessage }}</p>
      
      <details v-if="import.meta.dev" class="error-details">
        <summary>Error Details (Development Only)</summary>
        <pre>{{ error.message }}</pre>
        <pre>{{ error.stack }}</pre>
      </details>
      
      <div class="error-actions">
        <UButton @click="handleReset" variant="outline">
          Try Again
        </UButton>
        <UButton @click="handleReload" color="primary">
          Reload Page
        </UButton>
      </div>
    </div>
  </div>
  <slot v-else />
</template>
```

### Form Validation Errors

```typescript
// utils/validation.ts
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateImageInsert(data: { url: string; alt: string }): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!data.alt.trim()) {
    errors.alt = 'Alt text is required for accessibility'
  }
  
  if (data.url && !isValidUrl(data.url)) {
    errors.url = 'Please enter a valid URL'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateTableConfig(config: { rows: number; cols: number }): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (config.rows < 1 || config.rows > 20) {
    errors.rows = 'Rows must be between 1 and 20'
  }
  
  if (config.cols < 1 || config.cols > 10) {
    errors.cols = 'Columns must be between 1 and 10'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}
```

---

## Loading States & Async Feedback

### Loading State Types

| Scenario | Duration | UI Treatment |
|----------|----------|--------------|
| Initial App Load | 1-3s | Skeleton loader |
| Modal Opening | Instant | No loader needed |
| File Download | Variable | Progress indicator |
| Copy to Clipboard | < 100ms | Success feedback |
| Large Document Render | Debounced | Visual indicator |

### Skeleton Loader

```vue
<!-- components/editor/EditorSkeleton.vue -->
<script setup lang="ts">
// Shown during initial app hydration
</script>

<template>
  <div 
    class="editor-skeleton" 
    aria-busy="true" 
    aria-label="Loading editor"
  >
    <!-- Toolbar skeleton -->
    <div class="toolbar-skeleton">
      <USkeleton class="h-10 w-full rounded-lg" />
    </div>
    
    <!-- Editor panes skeleton -->
    <div class="panes-skeleton">
      <div class="pane-skeleton">
        <USkeleton class="h-4 w-3/4 mb-2" />
        <USkeleton class="h-4 w-full mb-2" />
        <USkeleton class="h-4 w-5/6 mb-2" />
        <USkeleton class="h-4 w-2/3 mb-2" />
        <USkeleton class="h-4 w-full mb-2" />
      </div>
      <div class="pane-skeleton">
        <USkeleton class="h-8 w-1/2 mb-4" />
        <USkeleton class="h-4 w-full mb-2" />
        <USkeleton class="h-4 w-full mb-2" />
        <USkeleton class="h-4 w-3/4 mb-2" />
      </div>
    </div>
    
    <!-- Status bar skeleton -->
    <div class="statusbar-skeleton">
      <USkeleton class="h-6 w-48" />
    </div>
  </div>
</template>

<style scoped>
.editor-skeleton {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem;
  gap: 1rem;
}

.panes-skeleton {
  display: flex;
  flex: 1;
  gap: 1rem;
}

.pane-skeleton {
  flex: 1;
  padding: 1rem;
  background: var(--ui-bg-muted);
  border-radius: 0.5rem;
}
</style>
```

### Action Feedback Pattern

```typescript
// composables/useExport.ts (with loading states)
import { useClipboard } from '@vueuse/core'

export function useExport() {
  const { copy } = useClipboard()
  const { content } = useEditor()
  const { renderedHtml } = useMarkdown()
  const { success, error } = useNotifications()
  
  // Loading and success states
  const isCopyingMarkdown = ref(false)
  const isCopyingHtml = ref(false)
  const isDownloading = ref(false)
  const copyMarkdownSuccess = ref(false)
  const copyHtmlSuccess = ref(false)
  
  async function copyMarkdown() {
    isCopyingMarkdown.value = true
    
    try {
      await copy(content.value)
      copyMarkdownSuccess.value = true
      success('Markdown copied to clipboard')
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        copyMarkdownSuccess.value = false
      }, 2000)
    } catch (e) {
      error('Failed to copy markdown to clipboard')
    } finally {
      isCopyingMarkdown.value = false
    }
  }
  
  async function copyHtml() {
    isCopyingHtml.value = true
    
    try {
      await copy(renderedHtml.value)
      copyHtmlSuccess.value = true
      success('HTML copied to clipboard')
      
      setTimeout(() => {
        copyHtmlSuccess.value = false
      }, 2000)
    } catch (e) {
      error('Failed to copy HTML to clipboard')
    } finally {
      isCopyingHtml.value = false
    }
  }
  
  function downloadMarkdown(filename = 'document.md') {
    isDownloading.value = true
    
    try {
      const blob = new Blob([content.value], { type: 'text/markdown' })
      downloadBlob(blob, filename)
      success(`Downloaded ${filename}`)
    } catch (e) {
      error('Failed to download file')
    } finally {
      isDownloading.value = false
    }
  }
  
  return {
    // Actions
    copyMarkdown,
    copyHtml,
    downloadMarkdown,
    downloadHtml,
    // States
    isCopyingMarkdown: readonly(isCopyingMarkdown),
    isCopyingHtml: readonly(isCopyingHtml),
    isDownloading: readonly(isDownloading),
    copyMarkdownSuccess: readonly(copyMarkdownSuccess),
    copyHtmlSuccess: readonly(copyHtmlSuccess),
  }
}
```

### Button with Loading State

```vue
<!-- components/toolbar/ToolbarButton.vue -->
<script setup lang="ts">
interface Props {
  label: string
  icon: string
  shortcut?: string
  loading?: boolean
  success?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  success: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const tooltipText = computed(() => {
  if (props.shortcut) {
    return `${props.label} (${props.shortcut})`
  }
  return props.label
})
</script>

<template>
  <UTooltip :text="tooltipText">
    <UButton
      :aria-label="label"
      :disabled="disabled || loading"
      :loading="loading"
      variant="ghost"
      size="sm"
      square
      @click="emit('click')"
    >
      <template v-if="success">
        <UIcon name="i-heroicons-check" class="text-green-500" />
      </template>
      <template v-else>
        <UIcon :name="icon" />
      </template>
    </UButton>
  </UTooltip>
</template>
```

### Large Document Rendering

```typescript
// composables/useMarkdown.ts (with rendering state)
export function useMarkdown() {
  const md = createMarkdownIt()
  const { content } = useEditor()
  
  // Debounce content for performance
  const debouncedContent = refDebounced(content, 150)
  
  // Track rendering state for large documents
  const isRendering = ref(false)
  
  const renderedHtml = computed(() => {
    // Mark as rendering for large documents
    if (debouncedContent.value.length > 50000) {
      isRendering.value = true
    }
    
    const html = md.render(debouncedContent.value)
    
    // Use nextTick to update state after DOM update
    nextTick(() => {
      isRendering.value = false
    })
    
    return html
  })
  
  // Optional: Show loading indicator for very large documents
  const showRenderingIndicator = computed(() => {
    return isRendering.value && debouncedContent.value.length > 100000
  })
  
  return {
    renderedHtml,
    isRendering: readonly(isRendering),
    showRenderingIndicator,
    md,
  }
}
```

### Minimum Display Time for Loaders

```typescript
// utils/loading.ts
// Prevent flash of loading indicator for fast operations

export async function withMinimumDisplayTime<T>(
  promise: Promise<T>,
  minTime: number = 300
): Promise<T> {
  const start = Date.now()
  const result = await promise
  
  const elapsed = Date.now() - start
  if (elapsed < minTime) {
    await new Promise(resolve => setTimeout(resolve, minTime - elapsed))
  }
  
  return result
}

// Usage:
// const data = await withMinimumDisplayTime(fetchData(), 300)
```

---

## Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/fonts',
  ],

  // Nuxt UI configuration
  ui: {
    icons: ['heroicons', 'lucide'],
  },
  
  // Color mode - default to dark
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },
  
  // Google Fonts via @nuxt/fonts
  fonts: {
    google: {
      families: {
        'Inter': [400, 500, 600, 700],
        'JetBrains Mono': [400, 500, 600],
      },
    },
  },
  
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'ICJIA Markdown Editor',
      meta: [
        { name: 'description', content: 'Accessible markdown editor for ICJIA researchers' },
        { name: 'theme-color', content: '#0f172a' },
      ],
    },
  },
  
  css: [
    '~/assets/css/main.css',
  ],
  
  // Static generation for Netlify
  nitro: {
    preset: 'netlify-static',
  },
  
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Ensure proper SSG behavior
  ssr: true,
  
  // Route rules for static generation
  routeRules: {
    '/': { prerender: true },
  },
})
```

---

## Netlify Configuration

```toml
# netlify.toml
[build]
  command = "yarn generate"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Testing Strategy

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.ts', 'tests/a11y/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '.nuxt/'],
    },
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Accessibility testing
    {
      name: 'a11y',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*a11y.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

```typescript
// tests/setup.ts
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
})

// Global test config
config.global.stubs = {
  // Stub teleport for modal testing
  teleport: true,
}
```

### Unit Tests (Vitest)
```typescript
// tests/utils/table-builder.test.ts
import { describe, it, expect } from 'vitest'
import { generateTableMarkdown, createEmptyTable } from '~/utils/table-builder'

describe('generateTableMarkdown', () => {
  it('generates correct markdown for a simple table', () => {
    const config = {
      rows: 2,
      columns: 2,
      headers: ['Name', 'Value'],
      cells: [['A', '1'], ['B', '2']],
      alignments: ['left', 'right'] as const,
    }
    
    const result = generateTableMarkdown(config)
    
    expect(result).toContain('| Name | Value |')
    expect(result).toContain('| :--- | ---: |')
    expect(result).toContain('| A | 1 |')
  })
})
```

### Component Tests (Vue Test Utils)
```typescript
// tests/components/EditorToolbar.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EditorToolbar from '~/components/editor/EditorToolbar.vue'

describe('EditorToolbar', () => {
  it('renders all formatting buttons', () => {
    const wrapper = mount(EditorToolbar)
    
    expect(wrapper.find('[aria-label="Bold"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Italic"]').exists()).toBe(true)
  })
  
  it('buttons are keyboard accessible', async () => {
    const wrapper = mount(EditorToolbar)
    const boldButton = wrapper.find('[aria-label="Bold"]')
    
    await boldButton.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('action')).toBeTruthy()
  })
})
```

### Accessibility Tests

**These tests are MANDATORY and block deployment on failure.**

```typescript
// tests/a11y/editor.test.ts
import { describe, it, expect } from 'vitest'
import { axe, toHaveNoViolations } from 'vitest-axe'
import { mount } from '@vue/test-utils'
import EditorLayout from '~/components/editor/EditorLayout.vue'
import EditorToolbar from '~/components/editor/EditorToolbar.vue'
import TableBuilderModal from '~/components/modals/TableBuilderModal.vue'

expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
  describe('EditorLayout', () => {
    it('has no accessibility violations', async () => {
      const wrapper = mount(EditorLayout)
      const results = await axe(wrapper.element)
      expect(results).toHaveNoViolations()
    })

    it('has proper landmark regions', () => {
      const wrapper = mount(EditorLayout)
      expect(wrapper.find('[role="toolbar"]').exists()).toBe(true)
      expect(wrapper.find('[role="textbox"]').exists()).toBe(true)
      expect(wrapper.find('[role="region"]').exists()).toBe(true)
    })

    it('has skip link as first focusable element', () => {
      const wrapper = mount(EditorLayout)
      const skipLink = wrapper.find('a[href="#main-editor"]')
      expect(skipLink.exists()).toBe(true)
    })
  })

  describe('EditorToolbar', () => {
    it('has no accessibility violations', async () => {
      const wrapper = mount(EditorToolbar)
      const results = await axe(wrapper.element)
      expect(results).toHaveNoViolations()
    })

    it('all buttons have accessible names', () => {
      const wrapper = mount(EditorToolbar)
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        const ariaLabel = button.attributes('aria-label')
        const textContent = button.text()
        expect(ariaLabel || textContent).toBeTruthy()
      })
    })

    it('dropdown menus have proper ARIA attributes', () => {
      const wrapper = mount(EditorToolbar)
      const dropdownTrigger = wrapper.find('[aria-haspopup="menu"]')
      expect(dropdownTrigger.exists()).toBe(true)
      expect(dropdownTrigger.attributes('aria-expanded')).toBeDefined()
    })
  })

  describe('TableBuilderModal', () => {
    it('has no accessibility violations when open', async () => {
      const wrapper = mount(TableBuilderModal, {
        props: { open: true }
      })
      const results = await axe(wrapper.element)
      expect(results).toHaveNoViolations()
    })

    it('traps focus within modal', async () => {
      const wrapper = mount(TableBuilderModal, {
        props: { open: true }
      })
      const modal = wrapper.find('[role="dialog"]')
      expect(modal.attributes('aria-modal')).toBe('true')
    })

    it('has accessible grid navigation', () => {
      const wrapper = mount(TableBuilderModal, {
        props: { open: true }
      })
      const grid = wrapper.find('[role="grid"]')
      expect(grid.exists()).toBe(true)
      const cells = wrapper.findAll('[role="gridcell"], [role="columnheader"]')
      cells.forEach(cell => {
        expect(cell.attributes('aria-label') || cell.text()).toBeTruthy()
      })
    })
  })

  describe('Color Contrast', () => {
    it('text meets WCAG AA contrast requirements', async () => {
      const wrapper = mount(EditorLayout)
      const results = await axe(wrapper.element, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Focus Management', () => {
    it('focus indicators are visible', async () => {
      const wrapper = mount(EditorToolbar)
      const button = wrapper.find('button')
      await button.trigger('focus')
      
      // Check that focus styles are applied
      const styles = window.getComputedStyle(button.element)
      // Focus should have outline
      expect(styles.outlineStyle).not.toBe('none')
    })
  })
})
```

```typescript
// tests/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility E2E', () => {
  test('full page has no accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('can navigate entire app with keyboard only', async ({ page }) => {
    await page.goto('/')
    
    // Start at skip link
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="#main-editor"]')).toBeFocused()
    
    // Skip to main content
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-editor')).toBeFocused()
    
    // Navigate toolbar
    await page.keyboard.press('Tab')
    await expect(page.locator('[aria-label="Bold"]')).toBeFocused()
    
    // Use keyboard shortcut
    await page.keyboard.press('Tab')
    await page.keyboard.type('Hello')
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+b')
    
    // Verify action worked
    const editor = page.locator('.cm-editor')
    await expect(editor).toContainText('**Hello**')
  })

  test('screen reader announcements work', async ({ page }) => {
    await page.goto('/')
    
    // Find live region
    const liveRegion = page.locator('[aria-live="polite"]')
    await expect(liveRegion).toBeAttached()
    
    // Trigger an action that should announce
    await page.keyboard.press('Control+Shift+c')
    
    // Verify announcement
    await expect(liveRegion).toHaveText(/copied/i)
  })

  test('modals trap focus correctly', async ({ page }) => {
    await page.goto('/')
    
    // Open table builder
    await page.keyboard.press('Control+t')
    
    // Verify modal is open
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    
    // Tab through modal - should not leave
    const firstFocusable = modal.locator('button, input, select').first()
    const lastFocusable = modal.locator('button, input, select').last()
    
    // Go to last element
    await lastFocusable.focus()
    await page.keyboard.press('Tab')
    
    // Should wrap to first element
    await expect(firstFocusable).toBeFocused()
    
    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
  })

  test('color mode respects system preference', async ({ page }) => {
    // Test dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
  })

  test('works at 200% zoom', async ({ page }) => {
    await page.goto('/')
    
    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2'
    })
    
    // Verify content is still usable
    const editor = page.locator('.cm-editor')
    await expect(editor).toBeVisible()
    
    const toolbar = page.locator('[role="toolbar"]')
    await expect(toolbar).toBeVisible()
    
    // No horizontal scroll should be required
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/editor.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Markdown Editor', () => {
  test('can type and see preview', async ({ page }) => {
    await page.goto('/')
    
    const editor = page.locator('.cm-editor')
    await editor.click()
    await page.keyboard.type('# Hello World')
    
    const preview = page.locator('.preview-pane')
    await expect(preview.locator('h1')).toHaveText('Hello World')
  })
  
  test('keyboard shortcuts work', async ({ page }) => {
    await page.goto('/')
    
    await page.keyboard.type('test')
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+b')
    
    const editor = page.locator('.cm-editor')
    await expect(editor).toContainText('**test**')
  })
  
  test('is keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab to toolbar
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    const boldButton = page.locator('[aria-label="Bold"]')
    await expect(boldButton).toBeFocused()
  })
})
```

---

## Performance Optimization

### Code Splitting
```typescript
// Lazy load modals
const TableBuilderModal = defineAsyncComponent(() => 
  import('~/components/modals/TableBuilderModal.vue')
)

const ShortcutsHelpModal = defineAsyncComponent(() => 
  import('~/components/modals/ShortcutsHelpModal.vue')
)
```

### Debouncing
```typescript
// Debounce markdown rendering for performance
const debouncedContent = refDebounced(content, 150)

const renderedHtml = computed(() => {
  return md.render(debouncedContent.value)
})
```

### Virtual Scrolling (if needed for large documents)
```typescript
// For very large documents, consider virtualized preview
// Using @tanstack/vue-virtual if document > 10,000 lines
```

---

## Dependency List

```json
{
  "dependencies": {
    "@codemirror/commands": "^6.3.3",
    "@codemirror/lang-markdown": "^6.2.4",
    "@codemirror/language": "^6.10.1",
    "@codemirror/language-data": "^6.4.1",
    "@codemirror/search": "^6.5.6",
    "@codemirror/state": "^6.4.1",
    "@codemirror/view": "^6.24.1",
    "@nuxt/ui": "^2.18.0",
    "@vueuse/core": "^10.9.0",
    "@vueuse/nuxt": "^10.9.0",
    "highlight.js": "^11.9.0",
    "markdown-it": "^14.0.0",
    "markdown-it-anchor": "^9.0.0",
    "markdown-it-footnote": "^4.0.0"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.8.5",
    "@nuxt/devtools": "latest",
    "@nuxt/fonts": "^0.7.0",
    "@nuxt/test-utils": "^3.12.0",
    "@playwright/test": "^1.42.1",
    "@vue/test-utils": "^2.4.4",
    "nuxt": "^4.0.0",
    "typescript": "^5.4.2",
    "vitest": "^1.3.1",
    "vitest-axe": "^0.1.0"
  }
}
```

> **Note:** This project uses Nuxt 4.x, the current stable version. Ensure all modules are compatible with Nuxt 4 before adding them.
```

---

## Development Workflow

```bash
# Install dependencies
yarn install

# Development server
yarn dev

# Type checking
yarn typecheck

# Linting
yarn lint

# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Accessibility audit (REQUIRED before merge)
yarn test:a11y

# Build for production
yarn generate

# Preview production build
yarn preview
```

### CI/CD Accessibility Gate

**Accessibility tests MUST pass before deployment.** Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml (example)
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      
      - run: yarn install --frozen-lockfile
      - run: yarn typecheck
      - run: yarn lint
      - run: yarn test
      
      # Accessibility tests - BLOCKS deployment on failure
      - name: Accessibility Tests
        run: yarn test:a11y
      
      - run: yarn generate

  # Lighthouse CI for production accessibility score
  lighthouse:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      
      - run: yarn install --frozen-lockfile
      - run: yarn generate
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "staticDistDir": "./.output/public"
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:performance": ["warn", { "minScore": 0.9 }]
      }
    }
  }
}
```

### Pre-commit Hook (Recommended)

```json
// package.json addition
{
  "scripts": {
    "test:a11y": "vitest run --project a11y && playwright test --project=a11y"
  },
  "lint-staged": {
    "*.{vue,ts}": ["eslint --fix", "vitest related --run"]
  }
}
```

---

## Future Architecture Considerations (v1.1+)

### Strapi Integration Module
```typescript
// modules/strapi-media/
// - usestrapiUpload composable
// - StrapiImageModal component
// - API token management
```

### Plugin System (if needed later)
```typescript
// plugins/markdown-extensions.ts
// Allow users to enable/disable markdown-it plugins
// Store preferences in localStorage
```

### PWA Support (if offline editing desired)
```typescript
// nuxt.config.ts addition
modules: ['@vite-pwa/nuxt']
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [Design Document](./icjia-markdown-editor-design-doc.md) | Features, UX, accessibility requirements, user personas |
| [Scaffolding Guide](./SCAFFOLDING_GUIDE.md) | **Start here** - Step-by-step guide for initial project setup |
| [Quick Start Guide](./QUICK_START.md) | Getting started in 5 minutes |
| [Accessibility Checklist](./ACCESSIBILITY_CHECKLIST.md) | Manual testing procedures for WCAG 2.1 AA |
| [Browser Support](./BROWSER_SUPPORT.md) | Supported browsers and screen readers |
| [Troubleshooting](./TROUBLESHOOTING.md) | Common issues and solutions |
