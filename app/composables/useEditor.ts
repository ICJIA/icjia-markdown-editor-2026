/**
 * Editor Composable
 * Manages CodeMirror state and provides editor actions
 */

import type { EditorView } from '@codemirror/view'

// Default content shown when no saved content exists in localStorage
const DEFAULT_CONTENT = `# Welcome to ICJIA Markdown Editor

Start typing your markdown content here. This editor is fully **accessible** and supports all standard markdown features.

## Features Overview

This editor provides a comprehensive set of tools for creating and editing markdown documents:

- **Bold** and *italic* text formatting
- [Links](https://icjia.illinois.gov) to external resources
- Code blocks with syntax highlighting
- Tables for structured data
- Blockquotes for citations
- Ordered and unordered lists
- Headings (H1-H6)
- Horizontal rules
- And much more!

## Getting Started

### Basic Text Formatting

You can make text **bold** by wrapping it with double asterisks, or *italic* by using single underscores. For \`inline code\`, use backticks.

### Creating Links

Links are created using the format \`[text](url)\`. For example: [Visit ICJIA](https://icjia.illinois.gov)

### Adding Images

Images use a similar syntax: \`![alt text](image-url)\`

## Code Examples

### JavaScript

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Using the function
const message = greet('World');
console.log(message); // Output: Hello, World!
\`\`\`

### Python

\`\`\`python
def calculate_statistics(data):
    """Calculate basic statistics for a dataset."""
    n = len(data)
    mean = sum(data) / n
    variance = sum((x - mean) ** 2 for x in data) / n
    std_dev = variance ** 0.5
    return {
        'count': n,
        'mean': mean,
        'variance': variance,
        'std_dev': std_dev
    }
\`\`\`

### SQL

\`\`\`sql
SELECT 
    county_name,
    COUNT(*) as incident_count,
    AVG(response_time) as avg_response
FROM incidents
WHERE year = 2024
GROUP BY county_name
ORDER BY incident_count DESC
LIMIT 10;
\`\`\`

## Tables

Tables are useful for presenting structured data:

| Feature | Status | Priority |
|---------|--------|----------|
| Dark Mode | ✅ Complete | High |
| Auto-save | ✅ Complete | High |
| Export HTML | ✅ Complete | Medium |
| Table Builder | 🔄 In Progress | Medium |
| Image Upload | ⏳ Planned | Low |

## Accessibility Features

This editor is designed to meet **WCAG 2.1 Level AA** standards:

1. **Full keyboard navigation** - All features accessible via keyboard
2. **Screen reader support** - Proper ARIA labels and announcements
3. **High contrast colors** - 4.5:1 contrast ratio for text
4. **Visible focus indicators** - Clear focus states on all interactive elements
5. **Skip links** - Quick navigation to main content
6. **Semantic HTML** - Proper heading hierarchy and landmarks

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Bold | Ctrl/⌘ + B |
| Italic | Ctrl/⌘ + I |
| Link | Ctrl/⌘ + K |
| Heading 1-6 | Ctrl/⌘ + 1-6 |
| Save | Ctrl/⌘ + S |
| Copy Markdown | Ctrl/⌘ + Shift + C |
| Copy HTML | Ctrl/⌘ + Shift + H |

## Blockquotes

Use blockquotes to highlight important information or citations:

> "The measure of intelligence is the ability to change."
> — Albert Einstein

Blockquotes can also contain multiple paragraphs:

> This is the first paragraph of a multi-paragraph blockquote.
>
> This is the second paragraph. You can include **formatting** and [links](https://example.com) inside blockquotes as well.

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item 1
  - Nested item 2
- Third item

### Ordered Lists

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step
4. Fourth step

### Task Lists

- [x] Complete Phase 1: Foundation
- [x] Complete Phase 2: Core Features
- [ ] Complete Phase 3: Advanced Features
- [ ] Complete Phase 4: Testing & Polish
- [ ] Complete Phase 5: Launch

## Research Applications

The ICJIA Markdown Editor is designed specifically for criminal justice researchers who need to:

### Write Reports

Create comprehensive research reports with proper formatting, citations, and data presentation. The real-time preview ensures your document looks exactly as intended.

### Draft Policy Briefs

Develop policy recommendations with clear structure and professional formatting. Export to HTML for easy distribution or integration with content management systems.

### Document Findings

Record research findings with code examples, statistical outputs, and detailed methodology descriptions. Syntax highlighting makes technical content more readable.

## Technical Specifications

### Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.0s
- Cumulative Layout Shift: < 0.1
- Total Bundle Size: < 500KB (gzipped)

### Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

### Screen Reader Support

- VoiceOver (macOS/iOS)
- NVDA (Windows)
- JAWS (Windows)

---

## Auto-Save Feature

Your work is automatically saved to your browser's local storage every 15 seconds. The save status is displayed in the status bar at the bottom of the editor.

**Note:** If you see "Saved just now" or a similar message, your content is being preserved automatically. This default content only appears when there is no previously saved content.

---

> **Tip:** Scroll through this document to test the scroll synchronization feature. The editor and preview panes should scroll together, keeping your position in sync!

---

*This is the end of the default content. Start editing to create your own markdown document!*
`

// Shared state across the application
const content = ref<string>(DEFAULT_CONTENT)

const editorView = ref<EditorView | null>(null)
const cursorPosition = ref({ line: 1, column: 1 })
const isModified = ref(false)
const initialContent = ref(content.value)

export function useEditor() {
  /**
   * Set the editor view instance
   */
  function setEditorView(view: EditorView) {
    editorView.value = view
  }
  
  /**
   * Update content from editor
   */
  function updateContent(newContent: string) {
    content.value = newContent
    isModified.value = newContent !== initialContent.value
  }
  
  /**
   * Set content programmatically
   */
  function setContent(newContent: string, resetModified = true) {
    content.value = newContent
    if (resetModified) {
      initialContent.value = newContent
      isModified.value = false
    }
    
    // Update the editor view if it exists
    if (editorView.value) {
      const view = editorView.value
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newContent,
        },
      })
    }
  }
  
  /**
   * Clear editor content
   */
  function clearContent() {
    setContent('')
  }
  
  /**
   * Update cursor position
   */
  function updateCursorPosition(line: number, column: number) {
    cursorPosition.value = { line, column }
  }
  
  /**
   * Insert text at current cursor position
   */
  function insertText(text: string): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from } = view.state.selection.main
    
    view.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length },
    })
    
    view.focus()
    return true
  }
  
  /**
   * Wrap current selection with before/after strings
   */
  function wrapSelection(before: string, after: string): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from, to } = view.state.selection.main
    const selectedText = view.state.sliceDoc(from, to)
    
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
  
  /**
   * Replace current selection with text
   */
  function replaceSelection(text: string): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from, to } = view.state.selection.main
    
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    })
    
    view.focus()
    return true
  }
  
  /**
   * Toggle bold formatting
   */
  function toggleBold(): boolean {
    return wrapSelection('**', '**')
  }
  
  /**
   * Toggle italic formatting
   */
  function toggleItalic(): boolean {
    return wrapSelection('_', '_')
  }
  
  /**
   * Toggle inline code formatting
   */
  function toggleInlineCode(): boolean {
    return wrapSelection('`', '`')
  }
  
  /**
   * Insert a code block
   */
  function insertCodeBlock(language = ''): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from, to } = view.state.selection.main
    const selectedText = view.state.sliceDoc(from, to)
    
    const codeBlock = `\`\`\`${language}\n${selectedText || 'code here'}\n\`\`\``
    
    view.dispatch({
      changes: { from, to, insert: codeBlock },
      selection: { anchor: from + 4 + language.length, head: from + 4 + language.length + (selectedText.length || 9) },
    })
    
    view.focus()
    return true
  }
  
  /**
   * Insert a link
   */
  function insertLink(url = '', text = ''): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from, to } = view.state.selection.main
    const selectedText = view.state.sliceDoc(from, to)
    
    const linkText = text || selectedText || 'link text'
    const linkUrl = url || 'https://example.com'
    const markdown = `[${linkText}](${linkUrl})`
    
    view.dispatch({
      changes: { from, to, insert: markdown },
      selection: { anchor: from + markdown.length },
    })
    
    view.focus()
    return true
  }
  
  /**
   * Insert a heading
   */
  function insertHeading(level: number): boolean {
    if (!editorView.value || level < 1 || level > 6) return false
    
    const view = editorView.value
    const { from } = view.state.selection.main
    
    // Find the start of the current line
    const line = view.state.doc.lineAt(from)
    const lineStart = line.from
    
    // Check if line already has a heading
    const lineText = line.text
    const existingHeading = lineText.match(/^(#{1,6})\s/)
    
    const prefix = '#'.repeat(level) + ' '
    
    if (existingHeading) {
      // Replace existing heading
      view.dispatch({
        changes: { from: lineStart, to: lineStart + existingHeading[0].length, insert: prefix },
      })
    } else {
      // Add heading prefix
      view.dispatch({
        changes: { from: lineStart, insert: prefix },
      })
    }
    
    view.focus()
    return true
  }
  
  /**
   * Insert a blockquote
   */
  function insertBlockquote(): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    
    view.dispatch({
      changes: { from: line.from, insert: '> ' },
    })
    
    view.focus()
    return true
  }
  
  /**
   * Insert a bullet list item
   */
  function insertBulletList(): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    
    view.dispatch({
      changes: { from: line.from, insert: '- ' },
    })
    
    view.focus()
    return true
  }
  
  /**
   * Insert a numbered list item
   */
  function insertNumberedList(): boolean {
    if (!editorView.value) return false
    
    const view = editorView.value
    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    
    view.dispatch({
      changes: { from: line.from, insert: '1. ' },
    })
    
    view.focus()
    return true
  }
  
  /**
   * Insert a horizontal rule
   */
  function insertHorizontalRule(): boolean {
    return insertText('\n---\n')
  }
  
  /**
   * Focus the editor
   */
  function focus() {
    editorView.value?.focus()
  }
  
  return {
    // State (readonly)
    content: readonly(content),
    editorView: readonly(editorView),
    cursorPosition: readonly(cursorPosition),
    isModified: readonly(isModified),
    
    // Setters
    setEditorView,
    updateContent,
    setContent,
    clearContent,
    updateCursorPosition,
    
    // Editor actions
    insertText,
    wrapSelection,
    replaceSelection,
    toggleBold,
    toggleItalic,
    toggleInlineCode,
    insertCodeBlock,
    insertLink,
    insertHeading,
    insertBlockquote,
    insertBulletList,
    insertNumberedList,
    insertHorizontalRule,
    focus,
  }
}
