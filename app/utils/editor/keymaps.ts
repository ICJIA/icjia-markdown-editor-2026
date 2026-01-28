/**
 * Custom Markdown Keyboard Shortcuts
 * WCAG 2.1 AA compliant - all shortcuts documented and discoverable
 */

import type { KeyBinding } from '@codemirror/view'
import type { EditorView } from '@codemirror/view'

/**
 * Wrap selected text with before/after strings
 */
function wrapSelection(view: EditorView, before: string, after: string): boolean {
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

/**
 * Insert text at cursor position
 */
function insertAtCursor(view: EditorView, text: string): boolean {
  const { state } = view
  const { from } = state.selection.main
  
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  })
  
  view.focus()
  return true
}

/**
 * Insert prefix at the start of the current line
 */
function insertLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  
  view.dispatch({
    changes: { from: line.from, insert: prefix },
  })
  
  view.focus()
  return true
}

/**
 * Insert or replace heading at current line
 */
function insertHeading(view: EditorView, level: number): boolean {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const lineText = line.text
  
  // Check if line already has a heading
  const existingHeading = lineText.match(/^(#{1,6})\s/)
  const prefix = '#'.repeat(level) + ' '
  
  if (existingHeading) {
    // Replace existing heading
    view.dispatch({
      changes: { from: line.from, to: line.from + existingHeading[0].length, insert: prefix },
    })
  } else {
    // Add heading prefix
    view.dispatch({
      changes: { from: line.from, insert: prefix },
    })
  }
  
  view.focus()
  return true
}

/**
 * Insert a code block with optional language
 */
function insertCodeBlock(view: EditorView): boolean {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)
  
  const codeBlock = `\`\`\`\n${selectedText || 'code here'}\n\`\`\``
  
  view.dispatch({
    changes: { from, to, insert: codeBlock },
    selection: { anchor: from + 4, head: from + 4 + (selectedText.length || 9) },
  })
  
  view.focus()
  return true
}

/**
 * Insert a link at cursor or wrap selection
 */
function insertLink(view: EditorView): boolean {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)
  
  const linkText = selectedText || 'link text'
  const markdown = `[${linkText}](url)`
  
  view.dispatch({
    changes: { from, to, insert: markdown },
    // Select "url" for easy replacement
    selection: { anchor: from + linkText.length + 3, head: from + linkText.length + 6 },
  })
  
  view.focus()
  return true
}

/**
 * Custom markdown keymap with all formatting shortcuts
 * Following the design spec requirements
 */
export const markdownKeymap: KeyBinding[] = [
  // Text formatting
  {
    key: 'Mod-b',
    run: (view) => wrapSelection(view, '**', '**'),
    preventDefault: true,
  },
  {
    key: 'Mod-i',
    run: (view) => wrapSelection(view, '_', '_'),
    preventDefault: true,
  },
  {
    key: 'Mod-`',
    run: (view) => wrapSelection(view, '`', '`'),
    preventDefault: true,
  },
  {
    key: 'Mod-Shift-`',
    run: insertCodeBlock,
    preventDefault: true,
  },
  
  // Headings (Mod+1 through Mod+6)
  {
    key: 'Mod-1',
    run: (view) => insertHeading(view, 1),
    preventDefault: true,
  },
  {
    key: 'Mod-2',
    run: (view) => insertHeading(view, 2),
    preventDefault: true,
  },
  {
    key: 'Mod-3',
    run: (view) => insertHeading(view, 3),
    preventDefault: true,
  },
  {
    key: 'Mod-4',
    run: (view) => insertHeading(view, 4),
    preventDefault: true,
  },
  {
    key: 'Mod-5',
    run: (view) => insertHeading(view, 5),
    preventDefault: true,
  },
  {
    key: 'Mod-6',
    run: (view) => insertHeading(view, 6),
    preventDefault: true,
  },
  
  // Block formatting
  {
    key: 'Mod-q',
    run: (view) => insertLinePrefix(view, '> '),
    preventDefault: true,
  },
  
  // Lists
  {
    key: 'Mod-Shift-8',
    run: (view) => insertLinePrefix(view, '- '),
    preventDefault: true,
  },
  {
    key: 'Mod-Shift-7',
    run: (view) => insertLinePrefix(view, '1. '),
    preventDefault: true,
  },
  
  // Insert elements
  {
    key: 'Mod-k',
    run: insertLink,
    preventDefault: true,
  },
  {
    key: 'Mod--',
    run: (view) => insertAtCursor(view, '\n---\n'),
    preventDefault: true,
  },
]

/**
 * Export keyboard shortcuts for use in the app
 * These are handled at the app level (not in CodeMirror)
 * because they need access to composables
 */
export interface AppShortcut {
  key: string
  description: string
  action: string
}

export const appShortcuts: AppShortcut[] = [
  { key: 'Mod-s', description: 'Download markdown', action: 'downloadMarkdown' },
  { key: 'Mod-Shift-c', description: 'Copy markdown', action: 'copyMarkdown' },
  { key: 'Mod-Shift-h', description: 'Copy HTML', action: 'copyHtml' },
  { key: 'Mod-o', description: 'Upload markdown', action: 'uploadMarkdown' },
]
