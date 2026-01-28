/**
 * CodeMirror 6 Dark Theme
 * Custom ICJIA dark theme matching Nuxt UI design
 * WCAG 2.1 AA compliant color contrast
 */

import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const icjiaDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e293b', // slate-800
    color: '#f1f5f9', // slate-100
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', monospace",
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#3b82f6', // blue-500
    padding: '16px',
    minHeight: '100%',
  },
  '.cm-cursor': {
    borderLeftColor: '#3b82f6', // blue-500
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
    backgroundColor: '#1e293b', // slate-800
    color: '#94a3b8', // slate-400 - WCAG AA compliant (4.68:1 contrast)
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#f1f5f9', // slate-100
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    // Note: focusability is handled by .cm-content which has tabindex
  },
  // Focus indicator for accessibility (WCAG 2.1 AA - 3:1 contrast minimum)
  '&.cm-focused': {
    outline: '2px solid #3b82f6', // blue-500
    outlineOffset: '-2px',
  },
  // Scrollbar styling
  '.cm-scroller::-webkit-scrollbar': {
    width: '12px',
    height: '12px',
  },
  '.cm-scroller::-webkit-scrollbar-track': {
    backgroundColor: '#0f172a', // slate-900
  },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    backgroundColor: '#475569', // slate-600
    borderRadius: '6px',
    border: '3px solid #0f172a',
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#64748b', // slate-500
  },
}, { dark: true })

export const icjiaDarkHighlightStyle = HighlightStyle.define([
  // Headings - blue tones for visibility
  { tag: tags.heading1, fontWeight: 'bold', fontSize: '1.5em', color: '#93c5fd' }, // blue-300
  { tag: tags.heading2, fontWeight: 'bold', fontSize: '1.3em', color: '#93c5fd' },
  { tag: tags.heading3, fontWeight: 'bold', fontSize: '1.1em', color: '#93c5fd' },
  { tag: tags.heading4, fontWeight: 'bold', color: '#93c5fd' },
  { tag: tags.heading5, fontWeight: 'bold', color: '#93c5fd' },
  { tag: tags.heading6, fontWeight: 'bold', color: '#93c5fd' },
  
  // Text formatting
  { tag: tags.strong, fontWeight: 'bold', color: '#f1f5f9' }, // slate-100
  { tag: tags.emphasis, fontStyle: 'italic', color: '#e2e8f0' }, // slate-200
  
  // Links - blue with underline for accessibility
  { tag: tags.link, color: '#60a5fa', textDecoration: 'underline' }, // blue-400
  { tag: tags.url, color: '#60a5fa' },
  
  // Code - green for distinction
  { tag: tags.monospace, fontFamily: "'JetBrains Mono', monospace", color: '#4ade80' }, // green-400
  
  // Quotes - muted italic
  { tag: tags.quote, color: '#94a3b8', fontStyle: 'italic' }, // slate-400
  
  // Lists - amber for markers
  { tag: tags.list, color: '#fbbf24' }, // amber-400
  
  // Meta/comments - muted
  { tag: tags.comment, color: '#64748b' }, // slate-500
  { tag: tags.meta, color: '#64748b' },
  
  // Processing instructions (like frontmatter)
  { tag: tags.processingInstruction, color: '#a78bfa' }, // violet-400
])

export const darkTheme = [
  icjiaDarkTheme,
  syntaxHighlighting(icjiaDarkHighlightStyle),
]
