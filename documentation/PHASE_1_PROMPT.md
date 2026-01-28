# Phase 1: Foundation - Initial Development Prompt

Copy everything below the line to use as an LLM prompt.

**Important**: When using this prompt, also attach or reference these files:
- `@documentation/icjia-markdown-editor-design-doc.md`
- `@documentation/icjia-markdown-editor-technical-architecture.md`

---

## Prompt

You are building the **ICJIA Markdown Editor**, a modern, accessible markdown editor using Nuxt 4 and CodeMirror 6. This is Phase 1: Foundation.

### Required Reading

Before starting, read these documentation files:

1. **Design Document** (`documentation/icjia-markdown-editor-design-doc.md`)
   - Sections to focus on: Executive Summary, Accessibility Commitment, Goals & Non-Goals, Feature Specification § 1 (Editor Core), Appearance § 7

2. **Technical Architecture** (`documentation/icjia-markdown-editor-technical-architecture.md`)
   - Sections to focus on: Accessibility-First Architecture, Technology Stack, Project Structure, Component Architecture, State Management, CodeMirror 6 Configuration, Nuxt Configuration

### Project Context

- **Purpose**: Replace existing Vue 2-based markdown.icjia.cloud with a WCAG 2.1 AA compliant editor
- **Primary Users**: ICJIA researchers writing reports, policy briefs, and documentation
- **Key Principles**: Accessibility first, dark mode default, simplicity over features

### Critical Requirements

**WCAG 2.1 Level AA compliance is MANDATORY and NON-NEGOTIABLE.**

Every component must include:
- Keyboard-only operation
- Screen reader support (ARIA labels, live regions)
- Color contrast 4.5:1 for text, 3:1 for UI
- Focus indicators (2px minimum, 3:1 contrast)

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Nuxt | 4.x | Application framework |
| Vue | 3.5+ | Reactive UI |
| TypeScript | 5.x | Type safety |
| Nuxt UI | 2.x | Component library |
| CodeMirror | 6.x | Text editor engine |
| markdown-it | 14.x | Markdown parsing |
| Yarn | 1.22.22 | Package manager |

### Phase 1 Objectives

Complete these tasks to establish the project foundation:

1. **Nuxt 4 Project Setup**
   - Initialize new Nuxt 4 project
   - Configure `nuxt.config.ts` with required modules
   - Set up TypeScript strict mode

2. **Install Dependencies**
   ```bash
   # Core dependencies
   yarn add @codemirror/commands @codemirror/lang-markdown @codemirror/language \
     @codemirror/language-data @codemirror/search @codemirror/state @codemirror/view \
     @nuxt/ui @vueuse/core @vueuse/nuxt highlight.js markdown-it markdown-it-anchor \
     markdown-it-footnote

   # Dev dependencies
   yarn add -D @nuxt/devtools @nuxt/fonts @nuxt/test-utils vitest
   ```

3. **Create Project Structure**
   ```
   icjia-markdown-editor/
   ├── app.vue
   ├── pages/
   │   └── index.vue
   ├── components/
   │   ├── editor/
   │   │   ├── EditorPane.vue
   │   │   ├── PreviewPane.vue
   │   │   └── EditorLayout.vue
   │   └── ui/
   │       ├── AppHeader.vue
   │       ├── ColorModeToggle.vue
   │       └── SkipLink.vue
   ├── composables/
   │   ├── useEditor.ts
   │   ├── useMarkdown.ts
   │   └── useAccessibility.ts
   ├── utils/
   │   ├── editor/
   │   │   ├── config.ts
   │   │   ├── theme-dark.ts
   │   │   └── theme-light.ts
   │   └── markdown/
   │       └── config.ts
   ├── assets/css/
   │   └── main.css
   └── nuxt.config.ts
   ```

4. **Implement Basic Twin-Pane Layout**
   - Side-by-side editor and preview (50/50 split)
   - Responsive: stack vertically on screens < 768px

5. **Set Up Dark/Light Mode**
   - Dark mode as default
   - Respect `prefers-color-scheme` on first visit
   - Toggle with sun/moon icon
   - Persist preference to localStorage

6. **Configure markdown-it**
   ```typescript
   const md = new MarkdownIt({
     html: false,        // Disable raw HTML for security
     xhtmlOut: true,     // XHTML compliant output
     breaks: true,       // Convert \n to <br>
     linkify: true,      // Auto-link URLs
     typographer: true,  // Smart quotes, dashes
   })
   ```

### Nuxt Configuration

Create `nuxt.config.ts` with these settings:

```typescript
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/fonts',
  ],

  ui: {
    icons: ['heroicons', 'lucide'],
  },
  
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },
  
  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600] },
    ],
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
  
  css: ['~/assets/css/main.css'],
  
  nitro: {
    preset: 'netlify-static',
  },
  
  typescript: {
    strict: true,
    typeCheck: true,
  },

  ssr: true,
  
  routeRules: {
    '/': { prerender: true },
  },
})
```

### Accessibility Requirements for Phase 1

These MUST be implemented in Phase 1:

1. **Skip Link** (first focusable element)
   ```vue
   <!-- components/ui/SkipLink.vue -->
   <template>
     <a 
       href="#main-editor" 
       class="skip-link"
       @click.prevent="skipToMain"
     >
       Skip to editor
     </a>
   </template>
   ```

2. **Semantic HTML**
   - Use `<main>`, `<header>`, `<nav>` landmarks
   - Proper heading hierarchy (h1 → h2 → h3)

3. **Focus-visible Styles**
   ```css
   :focus-visible {
     outline: 2px solid var(--color-primary);
     outline-offset: 2px;
   }
   ```

4. **Color Mode Respects System**
   - Check `prefers-color-scheme` on first visit
   - Apply user's system preference

5. **useAccessibility Composable**
   ```typescript
   // composables/useAccessibility.ts
   export function useAccessibility() {
     const announcer = ref<HTMLElement | null>(null)
     
     onMounted(() => {
       announcer.value = document.createElement('div')
       announcer.value.setAttribute('role', 'status')
       announcer.value.setAttribute('aria-live', 'polite')
       announcer.value.setAttribute('aria-atomic', 'true')
       announcer.value.className = 'sr-only'
       document.body.appendChild(announcer.value)
     })
     
     function announce(message: string) {
       if (announcer.value) {
         announcer.value.textContent = ''
         setTimeout(() => {
           if (announcer.value) {
             announcer.value.textContent = message
           }
         }, 50)
       }
     }
     
     return { announce }
   }
   ```

### Dark Theme Colors

Use these CSS variables:

```css
:root {
  --color-background: #0f172a;    /* slate-900 */
  --color-surface: #1e293b;       /* slate-800 */
  --color-border: #334155;        /* slate-700 */
  --color-text: #f1f5f9;          /* slate-100 */
  --color-text-muted: #94a3b8;    /* slate-400 */
  --color-primary: #3b82f6;       /* blue-500 */
  --color-focus: #60a5fa;         /* blue-400 */
}
```

### Typography

| Element | Font | Size |
|---------|------|------|
| Editor | JetBrains Mono, monospace | 14px |
| Preview | Inter, system-ui | 16px |
| Headings | Inter, system-ui | Scaled (2em → 1.1em) |

### Deliverables

At the end of Phase 1, the project should have:

- [ ] Working Nuxt 4 project with all dependencies installed
- [ ] Basic twin-pane layout (editor left, preview right)
- [ ] CodeMirror 6 integrated with markdown syntax highlighting
- [ ] markdown-it rendering preview in real-time
- [ ] Dark mode as default with light mode toggle
- [ ] Skip link as first focusable element
- [ ] Semantic HTML structure with landmarks
- [ ] Focus indicators on all interactive elements
- [ ] Color mode preference persisted to localStorage
- [ ] `useAccessibility` composable with `announce()` function

### File Structure to Create

Please create these files with working implementations:

1. `nuxt.config.ts` - Configuration as specified above
2. `app.vue` - Root component with NuxtLayout
3. `pages/index.vue` - Main page with EditorLayout
4. `components/ui/SkipLink.vue` - Accessibility skip link
5. `components/ui/AppHeader.vue` - Header with title and color toggle
6. `components/ui/ColorModeToggle.vue` - Dark/light mode switch
7. `components/editor/EditorLayout.vue` - Split pane container
8. `components/editor/EditorPane.vue` - CodeMirror wrapper
9. `components/editor/PreviewPane.vue` - Rendered markdown
10. `composables/useEditor.ts` - Editor state management
11. `composables/useMarkdown.ts` - markdown-it configuration
12. `composables/useAccessibility.ts` - Screen reader announcements
13. `utils/editor/config.ts` - CodeMirror state factory
14. `utils/editor/theme-dark.ts` - Dark theme for CodeMirror
15. `utils/editor/theme-light.ts` - Light theme for CodeMirror
16. `utils/markdown/config.ts` - markdown-it setup
17. `assets/css/main.css` - Global styles and CSS variables

### Important Notes

1. **Use the Nuxt MCP** for any Nuxt-specific questions or documentation lookups
2. **Use the augment-context-engine MCP** for code searches instead of grep
3. **Yarn 1.22.22** is the package manager - do not use npm or pnpm
4. **Accessibility is not optional** - every component must be keyboard accessible
5. **Dark mode is default** - but respect user's system preference on first visit

### Reference Documents

**PRIMARY REFERENCES** (read these before coding):

| Document | Path | Use For |
|----------|------|---------|
| **Design Document** | `documentation/icjia-markdown-editor-design-doc.md` | Feature specs, UX requirements, accessibility gates |
| **Technical Architecture** | `documentation/icjia-markdown-editor-technical-architecture.md` | Code examples, component specs, configuration |

**SUPPORTING REFERENCES** (consult as needed):

- `SCAFFOLDING_GUIDE.md` - Step-by-step scaffolding instructions
- `ACCESSIBILITY_CHECKLIST.md` - Testing requirements

### How to Use the Documentation

1. **For component structure**: Check Technical Architecture → Component Architecture
2. **For feature requirements**: Check Design Document → Feature Specification
3. **For accessibility patterns**: Check Technical Architecture → Accessibility-First Architecture
4. **For CodeMirror setup**: Check Technical Architecture → CodeMirror 6 Configuration
5. **For theming/colors**: Check Design Document → Appearance (§ 7)

### Getting Started

Please begin by:

1. **Reading** the Design Document sections on Accessibility Commitment and Goals
2. **Reading** the Technical Architecture sections on Project Structure and Component Architecture
3. **Creating** the Nuxt 4 project with the configuration specified
4. **Implementing** accessibility components first (`SkipLink`, `useAccessibility`)
5. **Building** the core layout and components

Start with accessibility to ensure it's built in from the foundation, not bolted on later.
