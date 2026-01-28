/**
 * CodeMirror 6 Editor Configuration
 * Creates editor state with markdown support and accessibility features
 */

import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, rectangularSelection, crosshairCursor } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { bracketMatching, indentOnInput, foldGutter, foldKeymap } from '@codemirror/language'
import { darkTheme } from './theme-dark'
import { lightTheme } from './theme-light'
import { markdownKeymap } from './keymaps'

// Compartments for dynamic configuration
export const themeCompartment = new Compartment()
export const lineNumbersCompartment = new Compartment()
export const readOnlyCompartment = new Compartment()

/**
 * Get theme extensions based on color mode
 */
export function getTheme(isDark: boolean) {
  return isDark ? darkTheme : lightTheme
}

/**
 * Create CodeMirror editor state with full configuration
 */
export function createEditorState(
  doc: string,
  onChange: (value: string) => void,
  isDark: boolean = true
): EditorState {
  return EditorState.create({
    doc,
    extensions: [
      // Core editing features
      history(),
      closeBrackets(),
      bracketMatching(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      indentOnInput(),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      
      // Line numbers (toggleable via compartment)
      lineNumbersCompartment.of(lineNumbers()),
      
      // Folding
      foldGutter(),
      
      // Read-only mode (toggleable via compartment)
      readOnlyCompartment.of(EditorState.readOnly.of(false)),
      
      // Markdown language support with code block highlighting
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      
      // Theme (toggleable for dark/light via compartment)
      themeCompartment.of(getTheme(isDark)),
      
      // Keymaps - custom markdown shortcuts first for priority
      keymap.of([
        ...markdownKeymap,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        indentWithTab,
      ]),
      
      // Line wrapping (soft wrap)
      EditorView.lineWrapping,
      
      // Change listener
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString())
        }
      }),
      
      // Accessibility attributes
      EditorView.contentAttributes.of({
        'aria-label': 'Markdown editor',
        'role': 'textbox',
        'aria-multiline': 'true',
      }),
    ],
  })
}

/**
 * Update editor theme dynamically
 */
export function updateTheme(view: EditorView, isDark: boolean) {
  view.dispatch({
    effects: themeCompartment.reconfigure(getTheme(isDark))
  })
}

/**
 * Toggle line numbers visibility
 */
export function toggleLineNumbers(view: EditorView, show: boolean) {
  view.dispatch({
    effects: lineNumbersCompartment.reconfigure(show ? lineNumbers() : [])
  })
}

/**
 * Set read-only mode
 */
export function setReadOnly(view: EditorView, readOnly: boolean) {
  view.dispatch({
    effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly))
  })
}
