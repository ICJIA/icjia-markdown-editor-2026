/**
 * @fileoverview Editor Composable
 * @description Manages CodeMirror editor state and provides editor manipulation actions.
 * This composable serves as the central state management for the markdown editor,
 * handling content updates, cursor position tracking, and text manipulation operations.
 * 
 * @module composables/useEditor
 * @requires @codemirror/view
 * 
 * @example
 * ```typescript
 * const { content, toggleBold, insertLink } = useEditor()
 * 
 * // Toggle bold formatting on selected text
 * toggleBold()
 * 
 * // Insert a link at cursor
 * insertLink('https://example.com', 'Example')
 * ```
 */

import type { EditorView } from '@codemirror/view'
import type { EditorState } from '@codemirror/state'
import { undo as cmUndo, redo as cmRedo } from '@codemirror/commands'

/**
 * Default content shown when no saved content exists in localStorage.
 * Uses inline code instead of code blocks to avoid Siteimprove SIA-R79 accessibility warnings.
 * @constant {string}
 */
const DEFAULT_CONTENT = `# Welcome to the ICJIA Markdown Editor 2.0

This is the **updated version** of the ICJIA Markdown Editor, rebuilt from the ground up with modern web technologies. If you used our previous editor from several years ago, you'll find this version faster, more accessible, and packed with new features.

This editor helps you write beautifully formatted documents using **Markdown** — a simple, readable syntax that converts to HTML.

---

## What is Markdown?

**Markdown** is a lightweight markup language that uses simple, readable text formatting to create structured documents. Instead of clicking buttons or using complex formatting tools, you write plain text with special characters to indicate formatting.

**Why use Markdown?**

- **Platform Independent** — Plain text files work everywhere, with no proprietary formats or compatibility issues
- **Human Readable** — The raw text is easy to read even without rendering, unlike HTML or other markup languages
- **Fast & Efficient** — Focus on writing without distractions from menus, toolbars, or formatting delays
- **Web Ready** — Easily converts to HTML for websites, blogs, documentation, and more
- **Widely Supported** — Used by GitHub, Reddit, Stack Overflow, Slack, Discord, and countless other platforms

**Quick Examples:**

- Type \`**bold**\` to make text **bold**
- Type \`*italic*\` to make text *italic*
- Type \`# Heading\` to create a heading
- Type \`[link](url)\` to create a hyperlink

> Markdown was created in 2004 by John Gruber to make writing for the web easier and more readable.

---

## Markdown Is NOT Coding

Despite its technical-sounding name, **Markdown is not programming or coding**—it's just a simple formatting system that anyone can learn in minutes. Think of it as a bridge that converts your everyday documents into web-ready content.

### Converting Documents to Web Format

**The Problem:** Word documents (\`.docx\`) and PDFs can't be displayed directly on websites. Web browsers need HTML to display content properly.

**The Solution:** Markdown acts as a universal translator between desktop documents and web content:

1. **Word → Web**
   - Write or convert your Word document to Markdown
   - Markdown instantly converts to clean HTML for any website
   - No manual recreation or complex web design needed

2. **PDF → Editable**
   - Convert PDFs to Markdown for easy editing
   - Publish online with proper formatting intact
   - Make updates without starting from scratch

3. **Plain Text → Professional**
   - Transform simple text into structured, formatted documents
   - Add headings, lists, tables, and links without coding
   - Export ready-to-publish content in seconds

> **Real-World Example:** Your research team writes reports in Word. Your communications department needs them on the website. Instead of manually recreating each report as a webpage, convert it to Markdown—then it becomes web-ready HTML instantly! No coding knowledge required.

### Why This Matters

- **Saves Time** — No need to learn HTML or web design
- **Maintains Formatting** — Headings, lists, tables, and emphasis carry over perfectly
- **Easy Updates** — Edit the Markdown file and republish in seconds
- **One Source, Many Outputs** — Same Markdown file becomes HTML, PDF, or styled documents

---

## Quick Start Guide

### Text Formatting

| Format | Syntax | Result |
|:-------|:-------|:-------|
| Bold | \`**text**\` or \`__text__\` | **bold text** |
| Italic | \`*text*\` or \`_text_\` | *italic text* |
| Bold + Italic | \`***text***\` | ***both styles*** |
| Strikethrough | \`~~text~~\` | ~~crossed out~~ |
| Inline Code | \`\\\`code\\\`\` | \`code snippet\` |

### Headings

Use hash symbols for headings: \`# H1\`, \`## H2\`, \`### H3\`, and so on up to \`###### H6\`.

### Links and Images

- **Link:** \`[Link Text](https://example.com)\` → [Visit ICJIA](https://icjia.illinois.gov)
- **Image:** \`![Alt text](image-url.jpg)\`

Here's an example image:

![A serene mountain landscape with a lake](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop)

*Image: Mountain landscape from Unsplash[^1]*

### Footnotes

Add references with footnotes using \`[^1]\` syntax:

Research shows that data-driven policies improve outcomes[^2]. The Illinois Criminal Justice Information Authority (ICJIA) conducts research to inform evidence-based practices[^3].

[^1]: Photo from Unsplash, free to use under the Unsplash License.
[^2]: Smith, J. (2024). "Evidence-Based Policy Making." *Journal of Public Policy*, 12(3), 45-67.
[^3]: For more information, visit the [ICJIA Research Hub](https://icjia.illinois.gov/researchhub/).

### Task Lists

Create interactive checklists with \`- [ ]\` and \`- [x]\`:

- [x] Write introduction
- [x] Add formatting examples
- [ ] Review and edit
- [ ] Share with team

### Lists

**Unordered list** — use \`-\`, \`*\`, or \`+\`:

- First item
- Second item
  - Nested item
- Third item

**Ordered list** — use numbers:

1. Step one
2. Step two
3. Step three

### Blockquotes

Use \`>\` at the start of a line:

> "The only way to do great work is to love what you do." — Steve Jobs

### Tables

Create tables with pipes \`|\` and hyphens \`-\`:

| Feature | Status | Notes |
|:--------|:------:|:------|
| Dark Mode | ✅ | Toggle in header |
| Auto-save | ✅ | Every 30 seconds |
| Export | ✅ | Markdown or HTML |

> **Tip:** Use the Table Builder (⌘/Ctrl + T) for an easier way to create tables!

### Embedding HTML in Markdown

Markdown supports **inline HTML** for cases where you need more control—especially useful for complex tables. This is valid in GitHub Flavored Markdown and most renderers.

**Why use HTML tables?**

- More control over formatting and structure
- Better accessibility with \`<caption>\`, \`<thead>\`, \`<th scope>\` attributes
- Familiar syntax if you know basic HTML
- Works when Markdown tables become unwieldy

**Example — HTML Table:**

<table>
  <caption>Quarterly Report Summary</caption>
  <thead>
    <tr>
      <th scope="col">Quarter</th>
      <th scope="col">Revenue</th>
      <th scope="col">Growth</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Q1 2025</td>
      <td>$1.2M</td>
      <td>+12%</td>
    </tr>
    <tr>
      <td>Q2 2025</td>
      <td>$1.4M</td>
      <td>+17%</td>
    </tr>
    <tr>
      <td>Q3 2025</td>
      <td>$1.5M</td>
      <td>+7%</td>
    </tr>
  </tbody>
</table>

> **Note:** When using HTML in Markdown, leave a blank line before and after the HTML block. The HTML above renders as a proper accessible table with semantic structure.

> **⚠️ Caution:** While embedding HTML in Markdown is valid, it **increases complexity** and creates a higher potential for errors. You're mixing two different syntaxes, which can make files harder to read, edit, and maintain. Use HTML sparingly—only when Markdown tables can't meet your needs (e.g., accessibility requirements, complex layouts, or row/column spanning).

---

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|:-------|:---:|:-------------:|
| Bold | ⌘ + B | Ctrl + B |
| Italic | ⌘ + I | Ctrl + I |
| Link | ⌘ + K | Ctrl + K |
| Inline Code | ⌘ + E | Ctrl + E |
| Headings | ⌘ + 1-6 | Ctrl + 1-6 |
| Insert Table | ⌘ + T | Ctrl + T |
| Copy Markdown | ⌘ + Shift + C | Ctrl + Shift + C |
| Copy HTML | ⌘ + Shift + H | Ctrl + Shift + H |
| Download | ⌘ + Shift + S | Ctrl + Shift + S |

---

## About This Editor

The **ICJIA Markdown Editor 2.0** is designed for researchers, writers, and anyone who needs a clean, accessible writing environment.

**Key Features:**

- **Real-time Preview** — See your formatted document as you type
- **Auto-save** — Never lose your work (saves every 30 seconds to browser storage)
- **Accessibility** — WCAG 2.1 Level AA compliant
- **Dark/Light Mode** — Easy on the eyes in any lighting
- **Export Options** — Download as Markdown or copy as HTML

---

## Try It Out

Delete this content and start writing your own document. Your work is automatically saved!

**Need help?** Click the **Tour** button in the header for a guided walkthrough.

---

*For more Markdown syntax, visit [markdownguide.org](https://www.markdownguide.org)*
`

/**
 * Shared reactive state for editor content across the application.
 * Starts empty and is populated after localStorage check.
 * @type {Ref<string>}
 */
const content = ref<string>('')

/**
 * Flag indicating if content has been initialized after localStorage check.
 * @type {Ref<boolean>}
 */
const isContentReady = ref(false)

/**
 * Reference to the CodeMirror EditorView instance.
 * @type {Ref<EditorView | null>}
 */
const editorView = ref<EditorView | null>(null)

/**
 * Current cursor position in the editor.
 * @type {Ref<{line: number, column: number}>}
 */
const cursorPosition = ref({ line: 1, column: 1 })

/**
 * Tracks whether content has been modified since last save.
 * @type {Ref<boolean>}
 */
const isModified = ref(false)

/**
 * Stores the initial content state for modification tracking.
 * @type {Ref<string>}
 */
const initialContent = ref('')

/**
 * Tracks whether the user has started editing (dismissed the default content).
 * @type {Ref<boolean>}
 */
const hasStartedEditing = ref(false)

/**
 * Store the default content for use when localStorage is empty.
 * @constant {string}
 */
const DEFAULT_CONTENT_VALUE = DEFAULT_CONTENT

/**
 * Editor composable for managing CodeMirror state and editor actions.
 * Provides reactive state for content, cursor position, and modification status,
 * along with methods for text manipulation and formatting.
 * 
 * @returns {Object} Editor state and action methods
 * @returns {Readonly<Ref<string>>} returns.content - Current editor content (readonly)
 * @returns {Readonly<Ref<EditorView | null>>} returns.editorView - CodeMirror view instance (readonly)
 * @returns {Readonly<Ref<{line: number, column: number}>>} returns.cursorPosition - Current cursor position (readonly)
 * @returns {Readonly<Ref<boolean>>} returns.isModified - Whether content is modified (readonly)
 * @returns {Readonly<Ref<boolean>>} returns.isContentReady - Whether content is initialized (readonly)
 * @returns {Function} returns.setEditorView - Set the editor view instance
 * @returns {Function} returns.updateContent - Update content from editor
 * @returns {Function} returns.setContent - Set content programmatically
 * @returns {Function} returns.clearContent - Clear all editor content
 * @returns {Function} returns.updateCursorPosition - Update cursor position
 * @returns {Function} returns.initializeWithDefault - Initialize with default tutorial content
 * @returns {Function} returns.markContentReady - Mark content as ready
 * @returns {Function} returns.getDefaultContent - Get the default tutorial content
 * @returns {Function} returns.insertText - Insert text at cursor
 * @returns {Function} returns.wrapSelection - Wrap selection with delimiters
 * @returns {Function} returns.replaceSelection - Replace current selection
 * @returns {Function} returns.toggleBold - Toggle bold formatting
 * @returns {Function} returns.toggleItalic - Toggle italic formatting
 * @returns {Function} returns.toggleInlineCode - Toggle inline code formatting
 * @returns {Function} returns.insertCodeBlock - Insert a code block
 * @returns {Function} returns.insertLink - Insert a markdown link
 * @returns {Function} returns.insertHeading - Insert a heading
 * @returns {Function} returns.insertBlockquote - Insert a blockquote
 * @returns {Function} returns.insertBulletList - Insert a bullet list item
 * @returns {Function} returns.insertNumberedList - Insert a numbered list item
 * @returns {Function} returns.insertHorizontalRule - Insert a horizontal rule
 * @returns {Function} returns.focus - Focus the editor
 */
export function useEditor() {
  /**
   * Sets the CodeMirror EditorView instance for the composable.
   * Must be called after the editor is mounted to enable editor actions.
   * 
   * @param {EditorView} view - The CodeMirror EditorView instance
   * @returns {void}
   */
  function setEditorView(view: EditorView) {
    editorView.value = view
  }
  
  /**
   * Updates the editor content and tracks modification status.
   * Called by the editor's change listener when content changes.
   * Also marks as edited if the user modifies the default content.
   * 
   * @param {string} newContent - The new content from the editor
   * @returns {void}
   */
  function updateContent(newContent: string) {
    // Check if user has started editing the default content
    if (!hasStartedEditing.value && content.value === DEFAULT_CONTENT_VALUE && newContent !== DEFAULT_CONTENT_VALUE) {
      hasStartedEditing.value = true
    }
    
    content.value = newContent
    isModified.value = newContent !== initialContent.value
  }
  
  /**
   * Sets the editor content programmatically.
   * Optionally resets the modification tracking state.
   * Updates the CodeMirror view if available.
   * 
   * @param {string} newContent - The content to set
   * @param {boolean} [resetModified=true] - Whether to reset modification tracking
   * @returns {void}
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
   * Clears all editor content by setting it to an empty string.
   * Resets the modification state.
   * 
   * @returns {void}
   */
  function clearContent() {
    setContent('')
  }
  
  /**
   * Initializes the editor with the default tutorial content.
   * Called when no saved content exists in localStorage.
   * Marks content as ready after initialization.
   * 
   * @returns {void}
   */
  function initializeWithDefault() {
    setContent(DEFAULT_CONTENT_VALUE)
    isContentReady.value = true
  }
  
  /**
   * Marks the content as ready after the localStorage check is complete.
   * This flag is used to prevent rendering before content is loaded.
   * 
   * @returns {void}
   */
  function markContentReady() {
    isContentReady.value = true
  }
  
  /**
   * Returns the default tutorial content.
   * Useful for resetting the editor to its initial state.
   * 
   * @returns {string} The default markdown tutorial content
   */
  function getDefaultContent(): string {
    return DEFAULT_CONTENT_VALUE
  }
  
  /**
   * Resets the editor content to the default tutorial content.
   * Also clears localStorage to ensure fresh start.
   * 
   * @returns {void}
   */
  function resetContent(): void {
    // Note: We intentionally do NOT clear localStorage here.
    // The user's auto-saved content is preserved so they can recover it
    // by reloading the page (before the tutorial content is auto-saved).
    // Set the default content
    setContent(DEFAULT_CONTENT_VALUE)
    // Reset the editing flag so the "Start Editing" button reappears
    hasStartedEditing.value = false
  }
  
  /**
   * Computed property to check if the editor is showing the default content.
   * Used to show/hide the "Start Editing" button.
   * 
   * Conditions for showing the button:
   * 1. Content is ready (loaded from storage or initialized with default)
   * 2. Content equals the default tutorial content
   * 3. User hasn't started editing yet
   * 
   * @returns {boolean} True if showing default content and user hasn't started editing
   */
  const isShowingDefaultContent = computed(() => {
    return isContentReady.value && content.value === DEFAULT_CONTENT_VALUE && !hasStartedEditing.value
  })
  
  /**
   * Clears the default content and prepares the editor for user input.
   * Called when user clicks "Start Editing" button.
   * 
   * @returns {void}
   */
  function startEditing(): void {
    hasStartedEditing.value = true
    setContent('')
    // Focus the editor
    focus()
  }
  
  /**
   * Marks that the user has started editing (for hiding the Start Editing button).
   * Called when user makes any edit to the default content.
   * 
   * @returns {void}
   */
  function markAsEdited(): void {
    if (!hasStartedEditing.value && content.value !== DEFAULT_CONTENT_VALUE) {
      hasStartedEditing.value = true
    }
  }
  
  /**
   * Updates the tracked cursor position in the editor.
   * Used to display line and column numbers in the UI.
   * 
   * @param {number} line - The current line number (1-based)
   * @param {number} column - The current column number (1-based)
   * @returns {void}
   */
  function updateCursorPosition(line: number, column: number) {
    cursorPosition.value = { line, column }
  }
  
  /**
   * Inserts text at the current cursor position.
   * Moves the cursor to the end of the inserted text.
   * 
   * @param {string} text - The text to insert
   * @returns {boolean} True if successful, false if editor view is not available
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
   * Wraps the current text selection with before/after delimiter strings.
   * If no text is selected, the delimiters are inserted at the cursor position.
   * The selection is maintained after wrapping.
   * 
   * @param {string} before - The string to insert before the selection
   * @param {string} after - The string to insert after the selection
   * @returns {boolean} True if successful, false if editor view is not available
   * 
   * @example
   * // Wrap selection with bold markers
   * wrapSelection('**', '**')
   * 
   * @example
   * // Wrap selection with italic markers
   * wrapSelection('_', '_')
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
   * Replaces the current text selection with the specified text.
   * Moves the cursor to the end of the inserted text.
   * 
   * @param {string} text - The text to replace the selection with
   * @returns {boolean} True if successful, false if editor view is not available
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
   * Toggles bold formatting on the current selection.
   * Wraps selected text with double asterisks (**).
   * 
   * @returns {boolean} True if successful, false if editor view is not available
   */
  function toggleBold(): boolean {
    return wrapSelection('**', '**')
  }
  
  /**
   * Toggles italic formatting on the current selection.
   * Wraps selected text with underscores (_).
   * 
   * @returns {boolean} True if successful, false if editor view is not available
   */
  function toggleItalic(): boolean {
    return wrapSelection('_', '_')
  }
  
  /**
   * Toggles inline code formatting on the current selection.
   * Wraps selected text with backticks (`).
   * 
   * @returns {boolean} True if successful, false if editor view is not available
   */
  function toggleInlineCode(): boolean {
    return wrapSelection('`', '`')
  }
  
  /**
   * Inserts a fenced code block at the cursor position.
   * If text is selected, it becomes the code block content.
   * Otherwise, placeholder text "code here" is inserted.
   * 
   * @param {string} [language=''] - The language identifier for syntax highlighting
   * @returns {boolean} True if successful, false if editor view is not available
   * 
   * @example
   * // Insert a JavaScript code block
   * insertCodeBlock('javascript')
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
   * Inserts a markdown link at the cursor position.
   * If text is selected, it becomes the link text.
   * If no URL is provided, a placeholder URL is inserted.
   * 
   * @param {string} [url=''] - The URL for the link
   * @param {string} [text=''] - The link text (uses selection or 'link text' if empty)
   * @returns {boolean} True if successful, false if editor view is not available
   * 
   * @example
   * // Insert a link with specific URL and text
   * insertLink('https://example.com', 'Example Site')
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
   * Inserts or replaces a heading on the current line.
   * If the line already has a heading, it is replaced with the new level.
   * 
   * @param {number} level - The heading level (1-6)
   * @returns {boolean} True if successful, false if level is invalid or editor view is not available
   * 
   * @example
   * // Insert an H2 heading
   * insertHeading(2)
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
   * Inserts a blockquote prefix at the start of the current line.
   * Adds "> " at the beginning of the line where the cursor is located.
   * 
   * @returns {boolean} True if successful, false if editor view is not available
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
   * Inserts a bullet list marker at the start of the current line.
   * Adds "- " at the beginning of the line where the cursor is located.
   * 
   * @returns {boolean} True if successful, false if editor view is not available
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
   * Inserts a numbered list marker at the start of the current line.
   * Adds "1. " at the beginning of the line where the cursor is located.
   * 
   * @returns {boolean} True if successful, false if editor view is not available
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
   * Inserts a horizontal rule (thematic break) at the cursor position.
   * Adds newlines before and after the rule for proper markdown formatting.
   * 
   * @returns {boolean} True if successful, false if editor view is not available
   */
  function insertHorizontalRule(): boolean {
    return insertText('\n---\n')
  }
  
  /**
   * Undoes the last change in the editor.
   * Uses CodeMirror's built-in history extension.
   * 
   * @returns {boolean} True if undo was successful, false otherwise
   */
  function undo(): boolean {
    if (!editorView.value) return false
    return cmUndo({
      state: editorView.value.state as EditorState,
      dispatch: editorView.value.dispatch,
    })
  }
  
  /**
   * Redoes the last undone change in the editor.
   * Uses CodeMirror's built-in history extension.
   * 
   * @returns {boolean} True if redo was successful, false otherwise
   */
  function redo(): boolean {
    if (!editorView.value) return false
    return cmRedo({
      state: editorView.value.state as EditorState,
      dispatch: editorView.value.dispatch,
    })
  }
  
  /**
   * Focuses the CodeMirror editor.
   * Useful for returning focus after modal dialogs or toolbar interactions.
   * 
   * @returns {void}
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
    isContentReady: readonly(isContentReady),
    isShowingDefaultContent,
    
    // Setters
    setEditorView,
    updateContent,
    setContent,
    clearContent,
    updateCursorPosition,
    initializeWithDefault,
    markContentReady,
    getDefaultContent,
    resetContent,
    startEditing,
    markAsEdited,
    
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
    undo,
    redo,
    focus,
  }
}
