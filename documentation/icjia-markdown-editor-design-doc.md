# ICJIA Markdown Editor v1 - Design Document

## Executive Summary

This document outlines the design for a modern, accessible markdown editor built with Nuxt 4 and Nuxt UI. The editor replaces the existing Vue 2-based markdown.icjia.cloud with a streamlined, WCAG 2.1 AA compliant application focused on the core needs of ICJIA researchers writing reports.

**Key Design Principles:**
- Accessibility first (WCAG 2.1 AA - non-negotiable)
- Modern and sleek UI (Nuxt UI, dark mode default)
- Simplicity over feature bloat
- Twin-pane editor/preview as the core experience

---

## ⚠️ Accessibility Commitment

**WCAG 2.1 Level AA compliance is mandatory and non-negotiable for this project.**

This is not a "Phase 4" concern or a "nice-to-have" - accessibility must be built into every component, every feature, and every line of code from day one. This commitment exists because:

1. **Legal requirement**: Federal agencies and their tools must meet ADA Title II requirements (April 24, 2026 deadline)
2. **Ethical imperative**: All ICJIA staff deserve equal access to internal tools
3. **Better design**: Accessible software is better software for everyone

### Accessibility Gates

No feature ships unless it passes:
- [ ] Keyboard-only operation test
- [ ] Screen reader test (VoiceOver + NVDA)
- [ ] Color contrast verification (4.5:1 text, 3:1 UI)
- [ ] axe DevTools scan (0 critical/serious issues)
- [ ] Focus indicator visibility check

### Accessibility in Every Phase

| Phase | Accessibility Requirements |
|-------|---------------------------|
| Phase 1: Foundation | Skip link, semantic HTML, focus-visible styles, color mode respects system preference |
| Phase 2: Core Features | Keyboard shortcuts work, toolbar buttons have aria-labels, all actions announced to screen readers |
| Phase 3: Advanced Features | Modal focus trapping, table builder grid navigation, image alt text required |
| Phase 4: Polish | Full audit, screen reader testing, documentation of accessible usage |
| Phase 5: Launch | Lighthouse Accessibility = 100, WAVE errors = 0, axe critical = 0 |

---

## Goals & Non-Goals

### Goals
1. Provide a clean, accessible markdown editing experience for researchers
2. Offer real-time preview with scroll synchronization
3. Simplify table creation with a visual builder
4. Support image insertion via URL (with placeholder option)
5. Enable easy export (copy markdown, copy HTML, download)
6. Default to dark mode with light mode toggle
7. Meet WCAG 2.1 AA accessibility standards throughout
8. Deploy as a static site on Netlify

### Non-Goals (v1)
- WYSIWYG editing mode
- Real-time collaboration
- Strapi Media Library integration (deferred to v1.1)
- YAML front matter support
- Math/LaTeX rendering
- Multiple document modes
- User accounts or authentication

---

## User Personas

### Primary: Research Analyst
- **Name:** Sarah, Research Analyst at ICJIA
- **Tech comfort:** Moderate - comfortable with markdown basics
- **Use case:** Writing research reports, policy briefs, grant documentation
- **Pain points:** Tables are tedious, loses work on browser refresh, image workflow is clunky
- **Needs:** Reliable editor, easy formatting, HTML export for email/web

### Secondary: Communications Staff
- **Name:** Marcus, Communications Coordinator
- **Tech comfort:** Lower - prefers visual tools but can learn markdown
- **Use case:** Blog posts, newsletter content, web page updates
- **Pain points:** Needs preview to verify formatting, unfamiliar with markdown syntax
- **Needs:** Toolbar buttons, live preview, copy HTML for CMS

### Tertiary: Developer (Chris)
- **Name:** Chris, Web Developer
- **Tech comfort:** High
- **Use case:** Documentation, README files, converting content to HTML
- **Pain points:** Current editor has unnecessary complexity
- **Needs:** Keyboard shortcuts, HTML export, clean output

---

## Feature Specification

### 1. Editor Core

#### 1.1 Twin-Pane Layout
| Attribute | Specification |
|-----------|---------------|
| Layout | Side-by-side, 50/50 split |
| Responsive | Stack vertically on screens < 768px |
| Resize | Draggable divider to adjust pane widths |
| Toggle | Button to show editor-only, preview-only, or split |
| Default | Split view on desktop, editor with preview toggle on mobile |

#### 1.2 CodeMirror 6 Editor
| Attribute | Specification |
|-----------|---------------|
| Language | Markdown syntax highlighting |
| Line numbers | Enabled by default, toggleable |
| Line wrapping | Enabled (soft wrap) |
| Theme | Custom dark theme matching Nuxt UI |
| Font | Monospace, user-resizable (Ctrl+/- or settings) |
| Undo/Redo | Full history with Ctrl+Z / Ctrl+Shift+Z |
| Find/Replace | Ctrl+F / Ctrl+H |
| Accessibility | ARIA labels, keyboard navigation, screen reader support |

#### 1.3 Scroll Synchronization
| Attribute | Specification |
|-----------|---------------|
| Behavior | Editor scroll position syncs to preview |
| Direction | Bidirectional (editor ↔ preview) |
| Toggle | On/off switch in toolbar |
| Default | Enabled |
| Method | Percentage-based with heading anchors for accuracy |

### 2. Toolbar

#### 2.1 Formatting Actions
| Button | Action | Shortcut | Accessibility |
|--------|--------|----------|---------------|
| Bold | Wrap selection in `**` | Ctrl+B | aria-label="Bold" |
| Italic | Wrap selection in `_` | Ctrl+I | aria-label="Italic" |
| Heading | Dropdown: H1-H6 | Ctrl+1-6 | aria-expanded, role="menu" |
| Quote | Prefix with `> ` | Ctrl+Q | aria-label="Block quote" |
| Code | Wrap in backticks | Ctrl+` | aria-label="Inline code" |
| Code Block | Wrap in triple backticks | Ctrl+Shift+` | aria-label="Code block" |
| Bullet List | Prefix with `- ` | Ctrl+Shift+8 | aria-label="Bullet list" |
| Numbered List | Prefix with `1. ` | Ctrl+Shift+7 | aria-label="Numbered list" |
| Link | Insert `[text](url)` | Ctrl+K | Opens modal |
| Image | Insert `![alt](url)` | Ctrl+Shift+I | Opens modal |
| Table | Open table builder | Ctrl+T | Opens modal |
| Horizontal Rule | Insert `---` | Ctrl+- | aria-label="Horizontal rule" |
| Footnote | Insert `[^1]` and reference | Ctrl+Shift+F | aria-label="Footnote" |

#### 2.2 Toolbar Accessibility
- All buttons have visible focus indicators (2px outline minimum)
- Tooltips appear on hover AND focus
- Keyboard navigable (Tab through buttons, Enter/Space to activate)
- Dropdown menus support arrow key navigation
- Screen reader announces button state and available shortcuts

### 3. Visual Table Builder

#### 3.1 Table Modal Interface
| Component | Description |
|-----------|-------------|
| Dimensions | Row/column inputs (min 1, max 20) |
| Live Preview | Shows table structure as user configures |
| Cell Editor | Click cell to edit content |
| Alignment | Per-column alignment (left, center, right) |
| Add/Remove | Buttons to add/remove rows and columns |
| Header Row | First row is always header (markdown standard) |
| Insert | Button inserts markdown at cursor position |
| Cancel | Closes modal without changes |

#### 3.2 Generated Markdown
```markdown
| Header 1 | Header 2 | Header 3 |
|:---------|:--------:|---------:|
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |
```

#### 3.3 Table Builder Accessibility
- Modal traps focus while open
- Escape key closes modal
- All inputs labeled
- Grid navigation with arrow keys
- Announce cell position to screen readers

### 4. Image Handling

#### 4.1 Image Modal (v1)
| Field | Description |
|-------|-------------|
| URL Input | Text field for image URL |
| Alt Text | Required field for accessibility |
| Placeholder Option | Checkbox: "Insert placeholder image" |
| Preview | Shows image thumbnail if URL is valid |
| Insert | Inserts markdown at cursor |

#### 4.2 Placeholder Images
When "Insert placeholder" is checked:
```markdown
![Description of image](https://placehold.co/600x400?text=Image+Placeholder)
```
- Uses placehold.co (free, no API key)
- Customizable dimensions in modal
- Placeholder text from alt text field

#### 4.3 Drag and Drop (v1)
- Drag image file onto editor → Opens image modal
- URL field shows: "Upload coming in v1.1 - paste URL or use placeholder"
- Does NOT attempt to upload or base64 encode

#### 4.4 Future: Strapi Integration (v1.1)
- Drag image → Upload to Strapi Media Library
- Returns URL, inserts into document
- Requires Strapi API token configuration

### 5. Export & Output

#### 5.1 Copy Actions
| Action | Description | Shortcut |
|--------|-------------|----------|
| Copy Markdown | Raw markdown to clipboard | Ctrl+Shift+C |
| Copy HTML | Rendered HTML to clipboard | Ctrl+Shift+H |

#### 5.2 Download Actions
| Action | Description |
|--------|-------------|
| Download .md | Saves current content as markdown file |
| Download .html | Saves rendered HTML with basic styling |

#### 5.3 HTML Output Quality
- Clean, semantic HTML
- No inline styles (uses class names)
- Includes optional GitHub-style CSS
- Properly escaped entities
- Valid HTML5 structure

### 6. Document State

#### 6.1 Auto-Save
| Attribute | Specification |
|-----------|---------------|
| Storage | Browser localStorage |
| Frequency | Every 30 seconds + on blur |
| Key | `icjia-markdown-editor-autosave` |
| Recovery | Prompt on load if autosave exists |
| Clear | Button to clear autosave |

#### 6.2 New Document
- Prompts if unsaved changes exist
- Clears editor and autosave
- Resets to default state

#### 6.3 Word Count
- Live count in status bar
- Shows: Words | Characters | Characters (no spaces)
- Updates on every change (debounced 300ms)

### 7. Appearance

#### 7.1 Color Mode
| Attribute | Specification |
|-----------|---------------|
| Default | Dark mode |
| Toggle | Sun/moon icon in header |
| Persistence | Saved to localStorage |
| System | Respects `prefers-color-scheme` on first visit |

#### 7.2 Dark Theme Colors (Nuxt UI)
```css
--color-background: #0f172a;    /* slate-900 */
--color-surface: #1e293b;       /* slate-800 */
--color-border: #334155;        /* slate-700 */
--color-text: #f1f5f9;          /* slate-100 */
--color-text-muted: #94a3b8;    /* slate-400 */
--color-primary: #3b82f6;       /* blue-500 */
--color-focus: #60a5fa;         /* blue-400 */
```

#### 7.3 Typography
| Element | Font | Size |
|---------|------|------|
| Editor | JetBrains Mono, monospace | 14px (configurable) |
| Preview | Inter, system-ui | 16px |
| Headings | Inter, system-ui | Scaled (2em → 1.1em) |
| Code | JetBrains Mono, monospace | 14px |

### 8. Keyboard Shortcuts

#### 8.1 Shortcut Reference
| Category | Shortcut | Action |
|----------|----------|--------|
| **Formatting** | | |
| | Ctrl+B | Bold |
| | Ctrl+I | Italic |
| | Ctrl+1-6 | Heading 1-6 |
| | Ctrl+Q | Block quote |
| | Ctrl+` | Inline code |
| | Ctrl+Shift+` | Code block |
| | Ctrl+Shift+8 | Bullet list |
| | Ctrl+Shift+7 | Numbered list |
| | Ctrl+K | Insert link |
| | Ctrl+Shift+I | Insert image |
| | Ctrl+T | Table builder |
| | Ctrl+Shift+F | Footnote |
| **Edit** | | |
| | Ctrl+Z | Undo |
| | Ctrl+Shift+Z | Redo |
| | Ctrl+F | Find |
| | Ctrl+H | Find & Replace |
| | Ctrl+A | Select all |
| **Export** | | |
| | Ctrl+Shift+C | Copy markdown |
| | Ctrl+Shift+H | Copy HTML |
| | Ctrl+S | Download .md |
| **View** | | |
| | Ctrl+\\ | Toggle preview |
| | Ctrl+Shift+\\ | Toggle scroll sync |
| | F1 | Show shortcut help |

#### 8.2 Shortcut Help Modal
- Accessible via F1 or help button
- Grouped by category
- Searchable
- Shows Mac equivalents (⌘ for Ctrl)

---

## Accessibility Requirements (WCAG 2.1 AA)

### Perceivable

#### 1.1 Text Alternatives
- [ ] All images have alt text (enforced in image modal)
- [ ] Icons have aria-labels or visible text
- [ ] Decorative images marked with `aria-hidden="true"`

#### 1.3 Adaptable
- [ ] Semantic HTML structure (headings, landmarks, lists)
- [ ] Reading order matches visual order
- [ ] No reliance on sensory characteristics alone

#### 1.4 Distinguishable
- [ ] **Color contrast minimum 4.5:1** for normal text
- [ ] **Color contrast minimum 3:1** for large text and UI components
- [ ] Text resizable to 200% without loss of functionality
- [ ] No loss of content at 320px viewport width
- [ ] Focus indicators visible (2px minimum, 3:1 contrast)
- [ ] No content flashing more than 3 times per second

### Operable

#### 2.1 Keyboard Accessible
- [ ] All functionality available via keyboard
- [ ] No keyboard traps (except intentional modals with escape)
- [ ] Shortcut keys documented and discoverable
- [ ] Skip link to main content

#### 2.4 Navigable
- [ ] Page has descriptive title
- [ ] Focus order logical and predictable
- [ ] Link/button purpose clear from text
- [ ] Multiple ways to navigate (keyboard, shortcuts, mouse)
- [ ] Headings and labels descriptive

#### 2.5 Input Modalities
- [ ] Touch targets minimum 44x44px
- [ ] Functionality not dependent on motion
- [ ] Pointer gestures have keyboard alternatives

### Understandable

#### 3.1 Readable
- [ ] Language of page declared (`lang="en"`)
- [ ] Jargon/abbreviations explained

#### 3.2 Predictable
- [ ] No unexpected context changes on focus
- [ ] Consistent navigation and identification
- [ ] Changes initiated only by user action

#### 3.3 Input Assistance
- [ ] Errors identified and described in text
- [ ] Labels provided for all inputs
- [ ] Error suggestions provided when possible
- [ ] Confirmation before destructive actions

### Robust

#### 4.1 Compatible
- [ ] Valid HTML
- [ ] ARIA used correctly (roles, states, properties)
- [ ] Status messages announced to screen readers
- [ ] Works with common assistive technologies

### Testing Requirements
- [ ] WAVE browser extension (0 errors)
- [ ] axe DevTools (0 critical/serious issues)
- [ ] Keyboard-only navigation test
- [ ] Screen reader testing (VoiceOver + NVDA)
- [ ] Color blindness simulation (Sim Daltonism)
- [ ] Zoom to 200% functionality test

---

## Markdown Processing

### Parser: markdown-it

#### Plugins (v1)
| Plugin | Purpose | Priority |
|--------|---------|----------|
| markdown-it-footnote | Footnote syntax | Required |
| markdown-it-highlightjs | Code syntax highlighting | Required |
| markdown-it-anchor | Heading IDs for linking | Required |
| markdown-it-attrs | Custom attributes (for accessibility) | Optional |

#### Configuration
```javascript
const md = markdownit({
  html: false,        // Disable raw HTML for security
  xhtmlOut: true,     // XHTML compliant output
  breaks: true,       // Convert \n to <br>
  linkify: true,      // Auto-link URLs
  typographer: true,  // Smart quotes, dashes
})
```

### Output Styling
- GitHub Markdown CSS for preview
- Custom overrides for dark mode
- Print stylesheet included

---

## Security Considerations

### Content Security
- Raw HTML disabled in markdown parser
- URLs validated before rendering images
- XSS prevention in all user inputs
- No eval() or dynamic code execution

### Data Handling
- All data stays in browser (localStorage)
- No server-side storage in v1
- No analytics or tracking
- No cookies except color mode preference

### Dependencies
- Regular dependency audits
- Dependabot enabled
- Lock file committed
- No known vulnerabilities at launch

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| Total Bundle Size | < 500KB (gzipped) |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | 100 |

---

## Milestones & Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Nuxt 4 project setup with Nuxt UI
- [ ] CodeMirror 6 integration
- [ ] Basic twin-pane layout
- [ ] Dark/light mode theming
- [ ] Markdown-it configuration

### Phase 2: Core Features (Week 3-4)
- [ ] Toolbar with all formatting buttons
- [ ] Keyboard shortcuts
- [ ] Scroll synchronization
- [ ] Copy markdown/HTML
- [ ] Download functionality
- [ ] Word count

### Phase 3: Advanced Features (Week 5-6)
- [ ] Table builder modal
- [ ] Image insertion modal
- [ ] Footnote support
- [ ] Find/Replace
- [ ] Auto-save to localStorage

### Phase 4: Accessibility & Polish (Week 7-8)
- [ ] Full accessibility audit
- [ ] Screen reader testing
- [ ] Keyboard navigation refinement
- [ ] Help modal with shortcuts
- [ ] Error handling
- [ ] Loading states

### Phase 5: Testing & Launch (Week 9-10)
- [ ] Unit tests for utilities
- [ ] Component tests
- [ ] E2E tests for critical paths
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Netlify deployment
- [ ] Documentation

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Accessibility Score | 100 |
| WAVE Errors | 0 |
| axe Critical Issues | 0 |
| User-reported bugs (first month) | < 5 |
| Load time (3G connection) | < 5s |
| Works without JavaScript | Graceful degradation message |

---

## Future Considerations (v1.1+)

### v1.1: Strapi Integration
- Image upload to Strapi Media Library
- Optional Strapi content preview
- API token management in settings

### v1.2: Enhanced Editing
- WYSIWYG mode toggle (Tiptap integration)
- Spell check integration
- Word/character limits with warnings

### v1.3: Productivity
- Document templates
- Snippet library
- Export to DOCX (via Pandoc or similar)

---

## Appendix: Competitive Analysis

| Feature | ICJIA v1 | StackEdit | Dillinger | HackMD |
|---------|----------|-----------|-----------|--------|
| Dark mode | ✅ Default | ✅ | ✅ | ✅ |
| Offline | ✅ | ✅ | ❌ | ❌ |
| Table builder | ✅ | ❌ | ❌ | ❌ |
| Accessibility | ✅ WCAG AA | ❌ | ❌ | Partial |
| Free | ✅ | Partial | ✅ | Partial |
| Self-hosted | ✅ | ❌ | ✅ | ✅ |
| No account | ✅ | ❌ | ✅ | ✅ |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [Technical Architecture](./icjia-markdown-editor-technical-architecture.md) | Implementation details, code examples, configuration |
| [Quick Start Guide](./QUICK_START.md) | Getting started in 5 minutes |
| [Accessibility Checklist](./ACCESSIBILITY_CHECKLIST.md) | Manual testing procedures for WCAG 2.1 AA |
| [Browser Support](./BROWSER_SUPPORT.md) | Supported browsers and screen readers |
| [Troubleshooting](./TROUBLESHOOTING.md) | Common issues and solutions |
| [Scaffolding Guide](./SCAFFOLDING_GUIDE.md) | Step-by-step guide for initial project setup |
