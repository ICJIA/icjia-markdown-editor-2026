/**
 * @fileoverview Scroll Synchronization Composable
 * @description Synchronizes scroll position between the editor and preview panes.
 * Uses line-number-based sync via data-source-line attributes for accurate
 * correspondence between markdown source and rendered preview.
 *
 * @module composables/useScrollSync
 *
 * @example
 * ```typescript
 * const { enabled, init, toggle, syncToCursor } = useScrollSync()
 * init(editorEl, previewEl, { getEditorView: () => editorView.value })
 * syncToCursor(currentLine) // when cursor changes
 * ```
 */

import { EditorView } from '@codemirror/view'

export interface ScrollSyncOptions {
  /** Returns the CodeMirror EditorView for line-based sync and scrollEditorToLine. */
  getEditorView?: () => EditorView | null
}

export interface SyncToCursorOptions {
  behavior?: ScrollBehavior
  /** 'center' keeps the typing line in the middle of the preview (good when typing). */
  block?: ScrollLogicalPosition
}

export function useScrollSync() {
  const enabled = ref(true)
  const activeScrollSource = ref<'editor' | 'preview' | null>(null)
  const editorElement = ref<HTMLElement | null>(null)
  const previewElement = ref<HTMLElement | null>(null)
  let resetTimeout: ReturnType<typeof setTimeout> | null = null
  let getEditorView: (() => EditorView | null) | null = null
  
  /**
   * Flag to suppress cursor-based syncing after manual scrolling.
   * Set to true when user manually scrolls, cleared only when user types.
   */
  const suppressCursorSync = ref(false)

  function getScrollPercentage(element: HTMLElement): number {
    const scrollTop = element.scrollTop
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll <= 0) return 0
    return Math.min(1, Math.max(0, scrollTop / maxScroll))
  }

  function setScrollPercentage(element: HTMLElement, percentage: number): void {
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll > 0) {
      element.scrollTop = maxScroll * percentage
    }
  }

  /** Get the top visible source line from the editor viewport (1-based). */
  function getVisibleSourceLineFromEditor(): number | null {
    const view = getEditorView?.() ?? null
    if (!view) return null
    const { from } = view.viewport
    const line = view.state.doc.lineAt(from)
    return line.number
  }

  /** Offset in pixels to prevent content from being hidden behind navbar/header. */
  const SCROLL_OFFSET_PX = 80

  /** Scroll the preview so the element with data-source-line for the given line is in view. */
  function scrollPreviewToLine(
    lineNumber: number,
    behavior: ScrollBehavior = 'auto',
    block: ScrollLogicalPosition = 'start'
  ): void {
    const preview = previewElement.value
    if (!preview) return
    const selector = `[data-source-line="${lineNumber}"]`
    const element = preview.querySelector(selector) as HTMLElement | null
    if (element) {
      activeScrollSource.value = 'editor'
      
      // Calculate scroll position with offset to prevent content hiding behind navbar
      const elementRect = element.getBoundingClientRect()
      const previewRect = preview.getBoundingClientRect()
      const elementTop = elementRect.top - previewRect.top + preview.scrollTop
      
      let targetScroll: number
      if (block === 'center') {
        // Center the element in the viewport
        targetScroll = elementTop - preview.clientHeight / 2 + elementRect.height / 2
      } else {
        // 'start' - place at top with offset for navbar
        targetScroll = elementTop - SCROLL_OFFSET_PX
      }
      
      // Clamp to valid scroll range
      const maxScroll = preview.scrollHeight - preview.clientHeight
      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll))
      
      if (behavior === 'smooth') {
        preview.scrollTo({ top: targetScroll, behavior: 'smooth' })
      } else {
        preview.scrollTop = targetScroll
      }
      
      if (resetTimeout) clearTimeout(resetTimeout)
      resetTimeout = setTimeout(() => { activeScrollSource.value = null }, 100)
    }
  }

  /** Get the source line number of the element nearest the top of the preview viewport. */
  function getVisibleSourceLineFromPreview(): number | null {
    const preview = previewElement.value
    if (!preview) return null
    const previewRect = preview.getBoundingClientRect()
    const elements = preview.querySelectorAll<HTMLElement>('[data-source-line]')
    let bestLine: number | null = null
    let bestDistance = Infinity
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]!
      const lineStr = el.getAttribute('data-source-line')
      if (!lineStr) continue
      const lineNum = parseInt(lineStr, 10)
      if (Number.isNaN(lineNum)) continue
      const elRect = el.getBoundingClientRect()
      const distance = Math.abs(elRect.top - previewRect.top)
      if (distance < bestDistance) {
        bestDistance = distance
        bestLine = lineNum
      }
    }
    return bestLine
  }

  /** Scroll the editor so the given line (1-based) is in view. */
  function scrollEditorToLine(lineNumber: number): void {
    const view = getEditorView?.() ?? null
    if (!view || !editorElement.value) return
    const doc = view.state.doc
    if (lineNumber < 1 || lineNumber > doc.lines) return
    const line = doc.line(lineNumber)
    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: 'start' }),
    })
    activeScrollSource.value = 'preview'
    if (resetTimeout) clearTimeout(resetTimeout)
    resetTimeout = setTimeout(() => { activeScrollSource.value = null }, 100)
  }

  /**
   * Sync preview to the given source line (e.g. cursor line). Use when the user is editing or typing.
   * Call with block: 'center' for immediate typing sync so the current line stays visible.
   * 
   * @param isTyping - If true, this is from actual typing (docChanged), clears suppression and always syncs.
   *                   If false/undefined, this is from cursor movement only - suppressed after manual scroll.
   */
  function syncToCursor(
    lineNumber: number,
    options: SyncToCursorOptions | ScrollBehavior = 'smooth',
    isTyping = false
  ): void {
    if (!enabled.value) return
    
    // If user is typing, clear suppression and sync
    if (isTyping) {
      suppressCursorSync.value = false
    }
    
    // If suppressed (user manually scrolled), don't sync on cursor movement
    if (suppressCursorSync.value && !isTyping) {
      return
    }
    
    const opts = typeof options === 'string' ? { behavior: options } : options
    const behavior = opts.behavior ?? 'smooth'
    const block = opts.block ?? 'start'
    scrollPreviewToLine(lineNumber, behavior, block)
  }

  function handleEditorScroll(): void {
    if (!enabled.value) return
    if (!editorElement.value || !previewElement.value) return
    if (activeScrollSource.value === 'preview') return
    
    // Only suppress cursor sync if this is a user-initiated scroll (not from syncToCursor)
    // activeScrollSource being null means this is a fresh user scroll, not a programmatic one
    if (activeScrollSource.value === null) {
      suppressCursorSync.value = true
    }
    
    activeScrollSource.value = 'editor'
    const line = getVisibleSourceLineFromEditor()
    if (line !== null) {
      scrollPreviewToLine(line, 'auto')
    } else {
      const percentage = getScrollPercentage(editorElement.value)
      setScrollPercentage(previewElement.value, percentage)
    }

    if (resetTimeout) clearTimeout(resetTimeout)
    resetTimeout = setTimeout(() => {
      activeScrollSource.value = null
    }, 100)
  }

  function handlePreviewScroll(): void {
    if (!enabled.value) return
    if (!editorElement.value || !previewElement.value) return
    if (activeScrollSource.value === 'editor') return

    // Only suppress cursor sync if this is a user-initiated scroll (not programmatic)
    if (activeScrollSource.value === null) {
      suppressCursorSync.value = true
    }
    
    activeScrollSource.value = 'preview'
    const line = getVisibleSourceLineFromPreview()
    if (line !== null && getEditorView?.()) {
      scrollEditorToLine(line)
    } else {
      const percentage = getScrollPercentage(previewElement.value)
      setScrollPercentage(editorElement.value, percentage)
    }

    if (resetTimeout) clearTimeout(resetTimeout)
    resetTimeout = setTimeout(() => {
      activeScrollSource.value = null
    }, 100)
  }
  
  /**
   * Toggles scroll synchronization on or off.
   * 
   * @returns {void}
   */
  function toggle(): void {
    enabled.value = !enabled.value
  }
  
  /**
   * Reference to the editor scroll event listener for cleanup.
   * @type {(() => void) | null}
   */
  let editorListener: (() => void) | null = null
  
  /**
   * Reference to the preview scroll event listener for cleanup.
   * @type {(() => void) | null}
   */
  let previewListener: (() => void) | null = null
  
  /**
   * Sets up scroll event listeners on the editor and preview elements.
   * Removes any existing listeners before adding new ones.
   * 
   * @returns {void}
   */
  function setupListeners(): void {
    // Clean up old listeners first
    removeListeners()
    
    if (editorElement.value) {
      editorListener = handleEditorScroll
      editorElement.value.addEventListener('scroll', editorListener, { passive: true })
    }
    
    if (previewElement.value) {
      previewListener = handlePreviewScroll
      previewElement.value.addEventListener('scroll', previewListener, { passive: true })
    }
  }
  
  /**
   * Removes scroll event listeners from the editor and preview elements.
   * Called during cleanup or before setting up new listeners.
   * 
   * @returns {void}
   */
  function removeListeners(): void {
    if (editorElement.value && editorListener) {
      editorElement.value.removeEventListener('scroll', editorListener)
      editorListener = null
    }
    if (previewElement.value && previewListener) {
      previewElement.value.removeEventListener('scroll', previewListener)
      previewListener = null
    }
  }
  
  /**
   * Initializes scroll synchronization with the DOM elements.
   * Optionally pass getEditorView so line-based sync and scrollEditorToLine work.
   */
  function init(editor: HTMLElement, preview: HTMLElement, options?: ScrollSyncOptions): void {
    editorElement.value = editor
    previewElement.value = preview
    getEditorView = options?.getEditorView ?? null
    setupListeners()
  }
  
  /**
   * Watcher that re-sets up listeners when elements change.
   * Ensures scroll sync works even if elements are replaced.
   */
  watch([editorElement, previewElement], ([newEditor, newPreview]) => {
    if (newEditor && newPreview) {
      setupListeners()
    }
  }, { immediate: false })
  
  /**
   * Lifecycle hook that cleans up listeners and timeouts on unmount.
   */
  onUnmounted(() => {
    removeListeners()
    if (resetTimeout) clearTimeout(resetTimeout)
  })
  
  return {
    enabled,
    editorElement,
    previewElement,
    toggle,
    init,
    setupListeners,
    syncToCursor,
  }
}
