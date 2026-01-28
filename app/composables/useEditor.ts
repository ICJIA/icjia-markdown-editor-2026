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

/**
 * Default content shown when no saved content exists in localStorage.
 * Contains a comprehensive markdown tutorial demonstrating all supported syntax.
 * @constant {string}
 */
const DEFAULT_CONTENT = `# The Complete Markdown Tutorial

Welcome to this comprehensive guide to Markdown[^1]! This tutorial covers everything you need to know to write beautiful, well-structured documents using Markdown syntax.

[^1]: Markdown was created by John Gruber in 2004 as a lightweight markup language designed for easy readability and conversion to HTML.

---

## Table of Contents

1. [Introduction to Markdown](#introduction-to-markdown)
2. [Text Formatting](#text-formatting)
3. [Headings](#headings)
4. [Links and Images](#links-and-images)
5. [Lists](#lists)
6. [Blockquotes](#blockquotes)
7. [Code](#code)
8. [Tables](#tables)
9. [Horizontal Rules](#horizontal-rules)
10. [Footnotes](#footnotes)
11. [Advanced Tips](#advanced-tips)

---

## Introduction to Markdown

Markdown is a lightweight markup language that you can use to add formatting elements to plaintext documents. Created by John Gruber in 2004, Markdown is now one of the world's most popular markup languages[^2].

[^2]: According to GitHub statistics, Markdown is used in over 90% of README files and documentation across millions of repositories.

### Why Use Markdown?

- **Simplicity**: Easy to learn and read in its raw form
- **Portability**: Works across all platforms and applications
- **Flexibility**: Converts easily to HTML, PDF, and other formats
- **Future-proof**: Plain text files last forever
- **Widely supported**: Used by GitHub, Reddit, Stack Overflow, and many more

### How This Editor Works

This editor provides a **live preview** of your Markdown as you type. The left pane is where you write your Markdown, and the right pane shows the rendered output in real-time. Your work is automatically saved every 30 seconds[^autosave].

[^autosave]: Auto-save uses your browser's localStorage. Your content persists even if you close the browser, but clearing browser data will erase saved content.

---

## Text Formatting

### Bold Text

To make text **bold**, wrap it with double asterisks or double underscores:

\`\`\`markdown
**This is bold text**
__This is also bold text__
\`\`\`

**Result:** **This is bold text**

### Italic Text

To make text *italic*, wrap it with single asterisks or single underscores:

\`\`\`markdown
*This is italic text*
_This is also italic text_
\`\`\`

**Result:** *This is italic text*

### Bold and Italic Combined

You can combine bold and italic for ***extra emphasis***:

\`\`\`markdown
***Bold and italic***
___Also bold and italic___
**_Another way_**
\`\`\`

**Result:** ***Bold and italic***

### Strikethrough

To ~~strikethrough~~ text, wrap it with double tildes:

\`\`\`markdown
~~This text is crossed out~~
\`\`\`

**Result:** ~~This text is crossed out~~

### Inline Code

For \`inline code\`, wrap text with backticks:

\`\`\`markdown
Use the \`console.log()\` function for debugging.
\`\`\`

**Result:** Use the \`console.log()\` function for debugging.

---

## Headings

Markdown supports six levels of headings, created using hash symbols (\`#\`):

\`\`\`markdown
# Heading 1 (Largest)
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6 (Smallest)
\`\`\`

### Best Practices for Headings

1. **Use only one H1** per document (typically the title)
2. **Don't skip levels** — go from H2 to H3, not H2 to H4
3. **Keep headings descriptive** — they should summarize the content
4. **Use sentence case** — capitalize only the first word

> **Tip:** Proper heading hierarchy is essential for accessibility. Screen readers use headings to navigate documents, so a logical structure helps all users[^wcag].

[^wcag]: WCAG 2.1 Level AA requires a logical heading structure. This editor is designed to meet these accessibility standards.

---

## Links and Images

### Basic Links

Create links using the format \`[text](url)\`:

\`\`\`markdown
[Visit ICJIA](https://icjia.illinois.gov)
[Google](https://www.google.com "Google Homepage")
\`\`\`

**Result:** [Visit ICJIA](https://icjia.illinois.gov)

The optional title (in quotes) appears on hover.

### Reference-Style Links

For cleaner documents, use reference-style links:

\`\`\`markdown
Check out [ICJIA][1] for criminal justice research.
Also see [our publications][pubs].

[1]: https://icjia.illinois.gov
[pubs]: https://icjia.illinois.gov/publications
\`\`\`

### Email Links

\`\`\`markdown
Contact us at <email@example.com>
\`\`\`

### Images

Images use similar syntax with an exclamation mark:

\`\`\`markdown
![Alt text](image-url.jpg)
![Description of image](https://picsum.photos/600/300)
\`\`\`

**Live Image Examples:**

Here's an actual embedded image from a placeholder service:

![A beautiful landscape photograph](https://picsum.photos/seed/markdown/800/400)

*The image above is loaded from picsum.photos - a free placeholder image service.*

You can also specify exact dimensions:

![Small placeholder image](https://picsum.photos/seed/demo/400/200)

### Images with Links

Combine images and links to make clickable images:

\`\`\`markdown
[![Click to visit ICJIA](https://picsum.photos/seed/icjia/300/150)](https://icjia.illinois.gov)
\`\`\`

**Result:** (Click the image below to visit ICJIA)

[![Click to visit ICJIA](https://picsum.photos/seed/icjia/300/150)](https://icjia.illinois.gov)

### Image Best Practices

1. **Always include alt text** - Describes the image for screen readers
2. **Use descriptive filenames** - Helps with SEO and accessibility
3. **Consider image size** - Large images slow down page loading
4. **Use HTTPS URLs** - Ensures images load on secure pages

---

## Lists

### Unordered Lists

Create unordered lists with \`-\`, \`*\`, or \`+\`:

\`\`\`markdown
- First item
- Second item
  - Nested item (indent with 2 spaces)
  - Another nested item
- Third item
\`\`\`

**Result:**

- First item
- Second item
  - Nested item (indent with 2 spaces)
  - Another nested item
- Third item

### Ordered Lists

Create ordered lists with numbers:

\`\`\`markdown
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step
\`\`\`

**Result:**

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

> **Note:** The actual numbers don't matter! Markdown will auto-number them correctly.

### Task Lists (Checkboxes)

Create interactive task lists:

\`\`\`markdown
- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Future task
\`\`\`

**Result:**

- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Future task

### Definition Lists

Some Markdown processors support definition lists:

\`\`\`markdown
Term 1
: Definition of term 1

Term 2
: Definition of term 2
\`\`\`

---

## Blockquotes

Create blockquotes using the \`>\` character:

\`\`\`markdown
> This is a blockquote.
> It can span multiple lines.
\`\`\`

**Result:**

> This is a blockquote.
> It can span multiple lines.

### Nested Blockquotes

\`\`\`markdown
> First level quote
>> Nested quote
>>> Deeply nested quote
\`\`\`

**Result:**

> First level quote
>> Nested quote
>>> Deeply nested quote

### Blockquotes with Other Elements

> **Important Notice**
>
> Blockquotes can contain other Markdown elements:
>
> - Lists work here
> - *Formatting* **works** too
>
> \`\`\`javascript
> // Even code blocks!
> console.log("Hello from a blockquote!");
> \`\`\`

### Famous Quotes

> "The only way to do great work is to love what you do."
> — Steve Jobs

> "In the middle of difficulty lies opportunity."
> — Albert Einstein

---

## Code

### Inline Code

Use single backticks for inline code:

\`\`\`markdown
The \`Array.map()\` method creates a new array.
\`\`\`

**Result:** The \`Array.map()\` method creates a new array.

### Code Blocks

Use triple backticks for multi-line code blocks. Specify the language after the opening backticks for syntax highlighting[^highlight]:

[^highlight]: This editor uses highlight.js for syntax highlighting, supporting over 190 programming languages.

#### JavaScript Example

\`\`\`javascript
// Calculate factorial recursively
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Arrow function version
const factorialArrow = (n) => n <= 1 ? 1 : n * factorialArrow(n - 1);

// Usage
console.log(factorial(5));  // Output: 120
console.log(factorialArrow(5));  // Output: 120
\`\`\`

#### Python Example

\`\`\`python
from dataclasses import dataclass
from typing import List
import statistics

@dataclass
class DataAnalysis:
    """A class for performing basic statistical analysis."""
    data: List[float]
    
    def mean(self) -> float:
        """Calculate the arithmetic mean."""
        return statistics.mean(self.data)
    
    def median(self) -> float:
        """Calculate the median value."""
        return statistics.median(self.data)
    
    def std_dev(self) -> float:
        """Calculate standard deviation."""
        return statistics.stdev(self.data) if len(self.data) > 1 else 0.0
    
    def summary(self) -> dict:
        """Return a summary of all statistics."""
        return {
            'count': len(self.data),
            'mean': self.mean(),
            'median': self.median(),
            'std_dev': self.std_dev(),
            'min': min(self.data),
            'max': max(self.data)
        }

# Example usage
analysis = DataAnalysis([23, 45, 67, 89, 12, 34, 56, 78, 90, 11])
print(analysis.summary())
\`\`\`

#### SQL Example

\`\`\`sql
-- Criminal justice data analysis query
WITH incident_stats AS (
    SELECT 
        county_name,
        incident_type,
        COUNT(*) as total_incidents,
        AVG(response_time_minutes) as avg_response,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_minutes) as median_response
    FROM public.incidents
    WHERE report_year = 2024
      AND status = 'CLOSED'
    GROUP BY county_name, incident_type
)
SELECT 
    county_name,
    incident_type,
    total_incidents,
    ROUND(avg_response, 2) as avg_response_min,
    ROUND(median_response, 2) as median_response_min
FROM incident_stats
WHERE total_incidents >= 10
ORDER BY total_incidents DESC
LIMIT 25;
\`\`\`

#### CSS Example

\`\`\`css
/* Modern CSS with custom properties */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --text-color: #1f2937;
  --background-color: #f9fafb;
  --border-radius: 0.5rem;
  --transition-speed: 0.2s;
}

.card {
  background: var(--background-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform var(--transition-speed) ease,
              box-shadow var(--transition-speed) ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
\`\`\`

#### Bash/Shell Example

\`\`\`bash
#!/bin/bash
# Automated backup script with logging

BACKUP_DIR="/var/backups"
SOURCE_DIR="/var/www/html"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE="/var/log/backup.log"

# Create backup with compression
tar -czf "\${BACKUP_DIR}/backup_\${DATE}.tar.gz" "\${SOURCE_DIR}" 2>> "\${LOG_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "[\${DATE}] Backup completed successfully" >> "\${LOG_FILE}"
    
    # Remove backups older than 30 days
    find "\${BACKUP_DIR}" -name "backup_*.tar.gz" -mtime +30 -delete
else
    echo "[\${DATE}] Backup FAILED" >> "\${LOG_FILE}"
    exit 1
fi
\`\`\`

---

## Tables

### Basic Table Syntax

Create tables using pipes (\`|\`) and hyphens (\`-\`):

\`\`\`markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
\`\`\`

**Result:**

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Column Alignment

Control alignment with colons in the separator row:

\`\`\`markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L    | C      | R     |
| 1    | 2      | 3     |
\`\`\`

**Result:**

| Left | Center | Right |
|:-----|:------:|------:|
| L    | C      | R     |
| 1    | 2      | 3     |

### Real-World Table Example

| Feature | Status | Priority | Est. Completion |
|:--------|:------:|:--------:|----------------:|
| Dark Mode | ✅ Complete | High | — |
| Auto-save | ✅ Complete | High | — |
| Export HTML | ✅ Complete | Medium | — |
| Table Builder | ✅ Complete | Medium | — |
| Footnotes | ✅ Complete | Medium | — |
| Find & Replace | 🔄 In Progress | Medium | Q2 2026 |
| Image Upload | ⏳ Planned | Low | Q3 2026 |
| Collaboration | 💡 Proposed | Low | TBD |

### Data Table Example

| County | Population | Crime Rate | Change |
|:-------|----------:|:----------:|-------:|
| Cook | 5,150,233 | 4.2% | -0.3% |
| DuPage | 922,921 | 1.8% | -0.1% |
| Lake | 696,535 | 2.1% | +0.2% |
| Will | 690,743 | 2.4% | -0.2% |
| Kane | 516,522 | 2.0% | -0.4% |

> **Tip:** Use the Table Builder (Cmd/Ctrl + T) for an easier way to create tables!

---

## Horizontal Rules

Create horizontal rules (dividers) with three or more hyphens, asterisks, or underscores:

\`\`\`markdown
---
***
___
\`\`\`

All three produce the same result:

---

Use horizontal rules to separate major sections of your document.

---

## Footnotes

Footnotes allow you to add references and additional information without cluttering your main text[^syntax].

[^syntax]: Footnotes use a caret and bracket syntax: \`[^identifier]\` for the reference and \`[^identifier]: text\` for the definition.

### Creating Footnotes

\`\`\`markdown
Here is a statement that needs a citation[^1].

[^1]: This is the footnote content. It will appear at the bottom.
\`\`\`

### Multi-line Footnotes

\`\`\`markdown
Here's a complex topic[^complex].

[^complex]: This footnote has multiple paragraphs.

    Indent subsequent paragraphs with spaces.
    
    You can even include code blocks!
\`\`\`

### Footnote Examples in Context

Research shows that accessible design benefits everyone, not just users with disabilities[^universal]. The principles of universal design[^ud] have been widely adopted in web development, with WCAG guidelines serving as the primary standard[^wcag-ref].

[^universal]: Studies by Microsoft and the W3C have demonstrated that accessibility features like captions, keyboard navigation, and high contrast modes are regularly used by people without disabilities.

[^ud]: Universal Design is a framework for designing products and environments to be usable by all people, to the greatest extent possible, without the need for adaptation.

[^wcag-ref]: The Web Content Accessibility Guidelines (WCAG) 2.1 are published by the World Wide Web Consortium (W3C) and provide the international standard for web accessibility.

---

## Advanced Tips

### Escaping Special Characters

Use backslash to escape Markdown characters:

\`\`\`markdown
\\*This won't be italic\\*
\\# This won't be a heading
\`\`\`

**Result:** \\*This won't be italic\\*

### Line Breaks

- End a line with two spaces for a soft break
- Use a blank line for a paragraph break
- Use \`<br>\` for an explicit line break (if HTML is enabled)

### Keyboard Shortcuts

This editor supports many keyboard shortcuts for faster writing:

| Action | Mac | Windows/Linux |
|:-------|:---:|:-------------:|
| Bold | ⌘ + B | Ctrl + B |
| Italic | ⌘ + I | Ctrl + I |
| Link | ⌘ + K | Ctrl + K |
| Inline Code | ⌘ + E | Ctrl + E |
| Heading 1-6 | ⌘ + 1-6 | Ctrl + 1-6 |
| Blockquote | ⌘ + ' | Ctrl + ' |
| Insert Table | ⌘ + T | Ctrl + T |
| Copy Markdown | ⌘ + Shift + C | Ctrl + Shift + C |
| Copy HTML | ⌘ + Shift + H | Ctrl + Shift + H |
| Download | ⌘ + Shift + S | Ctrl + Shift + S |

### Combining Elements

You can nest and combine Markdown elements:

> **Pro Tip:** Create complex documents by combining elements:
>
> 1. Start with a **bold** heading
> 2. Add *emphasized* details
> 3. Include \`code snippets\` where needed
> 4. Reference sources with footnotes[^combo]
>
> | Element | Can Contain |
> |:--------|:------------|
> | Blockquote | Lists, code, tables |
> | List Item | Bold, italic, links |
> | Table Cell | Most inline elements |

[^combo]: This demonstrates how multiple Markdown features can work together in a single blockquote.

---

## Practice Section

Now it's your turn! Try editing this section to practice what you've learned:

### Your Turn: Basic Formatting

Replace this text with your own bold, italic, and ~~strikethrough~~ examples.

### Your Turn: Create a List

1. Replace this
2. With your own
3. Custom list

### Your Turn: Add a Code Block

\`\`\`
// Replace this with code in your favorite language
\`\`\`

### Your Turn: Build a Table

| Replace | This | Table |
|---------|------|-------|
| With    | Your | Own   |

---

## Resources and Further Reading

- [Markdown Guide](https://www.markdownguide.org) — Comprehensive Markdown reference
- [CommonMark Spec](https://commonmark.org) — The standardized Markdown specification
- [GitHub Flavored Markdown](https://github.github.com/gfm/) — GitHub's Markdown extensions
- [ICJIA Research Hub](https://icjia.illinois.gov) — Criminal justice research and publications

---

## About This Editor

The **ICJIA Markdown Editor** is designed for researchers, writers, and anyone who needs a clean, accessible writing environment. Key features include:

- **Real-time Preview** — See your formatted document as you type
- **Auto-save** — Never lose your work (saves every 30 seconds)
- **Accessibility** — WCAG 2.1 Level AA compliant
- **Dark/Light Mode** — Easy on the eyes in any lighting
- **Keyboard Shortcuts** — Speed up your workflow
- **Export Options** — Download as Markdown or copy as HTML

---

> **Congratulations!** You've completed the Markdown tutorial. Start editing above or clear this content to begin your own document.
>
> *Happy writing!* ✍️

---

*This tutorial is automatically loaded when no saved content exists. Your edits are automatically saved to your browser's local storage.*
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
   * 
   * @param {string} newContent - The new content from the editor
   * @returns {void}
   */
  function updateContent(newContent: string) {
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
    
    // Setters
    setEditorView,
    updateContent,
    setContent,
    clearContent,
    updateCursorPosition,
    initializeWithDefault,
    markContentReady,
    getDefaultContent,
    
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
