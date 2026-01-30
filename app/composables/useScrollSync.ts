/**
 * @fileoverview Scroll Synchronization Composable (Refactored)
 * @description Synchronizes scroll position between editor and preview panes.
 * 
 * Architecture:
 * - Singleton pattern using useState for shared state across components
 * - State machine: DISABLED | ACTIVE | SUPPRESSED
 * - Line-based sync using data-source-line attributes
 * 
 * State Transitions:
 * - Toggle OFF → DISABLED (no sync)
 * - Toggle ON → ACTIVE (full sync)
 * - Manual scroll (while ACTIVE) → SUPPRESSED (scroll sync works, cursor sync disabled)
 * - User types (while SUPPRESSED) → ACTIVE (re-enables cursor sync)
 */

import { EditorView } from '@codemirror/view'

/** Scroll sync state machine states */
type SyncState = 'DISABLED' | 'ACTIVE' | 'SUPPRESSED'

/** Configuration for scroll sync */
interface ScrollSyncConfig {
  /** Offset in pixels to prevent content hiding behind navbar */
  scrollOffset: number
  /** Debounce time for scroll events in ms */
  scrollDebounce: number
  /** Time to wait before allowing opposite pane to trigger sync */
  lockoutTime: number
}

const DEFAULT_CONFIG: ScrollSyncConfig = {
  scrollOffset: 80,
  scrollDebounce: 16,
  lockoutTime: 150,
}

/**
 * Shared state - singleton across all component instances
 * Using module-level variables for true singleton behavior
 */
const sharedState = {
  syncState: ref<SyncState>('ACTIVE'),
  activeScrollSource: ref<'editor' | 'preview' | null>(null),
  editorElement: ref<HTMLElement | null>(null),
  previewElement: ref<HTMLElement | null>(null),
  getEditorView: null as (() => EditorView | null) | null,
  initialized: false,
  lockoutTimeout: null as ReturnType<typeof setTimeout> | null,
}

/**
 * Scroll Synchronization Composable
 * 
 * @example
 * ```typescript
 * // In layout component
 * const { init, syncToCursor } = useScrollSync()
 * init(editorEl, previewEl, { getEditorView: () => view })
 * 
 * // In toolbar component  
 * const { enabled, toggle } = useScrollSync()
 * ```
 */
export function useScrollSync() {
  const config = DEFAULT_CONFIG

  // Computed for easy enabled check
  const enabled = computed({
    get: () => sharedState.syncState.value !== 'DISABLED',
    set: (value: boolean) => {
      sharedState.syncState.value = value ? 'ACTIVE' : 'DISABLED'
    },
  })

  /**
   * Toggle sync on/off
   */
  function toggle(): void {
    if (sharedState.syncState.value === 'DISABLED') {
      sharedState.syncState.value = 'ACTIVE'
    } else {
      sharedState.syncState.value = 'DISABLED'
    }
  }

  /**
   * Set lockout to prevent ping-pong between panes
   */
  function setLockout(source: 'editor' | 'preview'): void {
    sharedState.activeScrollSource.value = source
    if (sharedState.lockoutTimeout) {
      clearTimeout(sharedState.lockoutTimeout)
    }
    sharedState.lockoutTimeout = setTimeout(() => {
      sharedState.activeScrollSource.value = null
    }, config.lockoutTime)
  }

  /**
   * Check if we should process scroll from this source
   */
  function canProcessScroll(source: 'editor' | 'preview'): boolean {
    if (sharedState.syncState.value === 'DISABLED') return false
    const opposite = source === 'editor' ? 'preview' : 'editor'
    return sharedState.activeScrollSource.value !== opposite
  }

  /**
   * Get scroll percentage of an element
   */
  function getScrollPercentage(element: HTMLElement): number {
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll <= 0) return 0
    return Math.min(1, Math.max(0, element.scrollTop / maxScroll))
  }

  /**
   * Set scroll percentage of an element
   */
  function setScrollPercentage(element: HTMLElement, percentage: number): void {
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll > 0) {
      element.scrollTop = maxScroll * percentage
    }
  }

  /**
   * Get the visible source line from editor viewport
   */
  function getVisibleLineFromEditor(): number | null {
    const view = sharedState.getEditorView?.()
    if (!view) return null
    const { from } = view.viewport
    return view.state.doc.lineAt(from).number
  }

  /**
   * Get the visible source line from preview viewport
   */
  function getVisibleLineFromPreview(): number | null {
    const preview = sharedState.previewElement.value
    if (!preview) return null
    
    const previewRect = preview.getBoundingClientRect()
    const elements = preview.querySelectorAll<HTMLElement>('[data-source-line]')
    
    let bestLine: number | null = null
    let bestDistance = Infinity
    
    for (const el of elements) {
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

  /**
   * Scroll preview to show a specific source line
   */
  function scrollPreviewToLine(
    lineNumber: number,
    options: { behavior?: ScrollBehavior; center?: boolean } = {}
  ): void {
    const preview = sharedState.previewElement.value
    if (!preview) return
    
    const element = preview.querySelector(`[data-source-line="${lineNumber}"]`) as HTMLElement | null
    if (!element) return

    setLockout('editor')
    
    const elementRect = element.getBoundingClientRect()
    const previewRect = preview.getBoundingClientRect()
    const elementTop = elementRect.top - previewRect.top + preview.scrollTop
    
    let targetScroll: number
    if (options.center) {
      targetScroll = elementTop - preview.clientHeight / 2 + elementRect.height / 2
    } else {
      targetScroll = elementTop - config.scrollOffset
    }
    
    const maxScroll = preview.scrollHeight - preview.clientHeight
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll))
    
    if (options.behavior === 'smooth') {
      preview.scrollTo({ top: targetScroll, behavior: 'smooth' })
    } else {
      preview.scrollTop = targetScroll
    }
  }

  /**
   * Scroll editor to show a specific source line
   */
  function scrollEditorToLine(lineNumber: number): void {
    const view = sharedState.getEditorView?.()
    if (!view) return
    
    const doc = view.state.doc
    if (lineNumber < 1 || lineNumber > doc.lines) return
    
    setLockout('preview')
    
    const line = doc.line(lineNumber)
    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: 'start' }),
    })
  }

  /**
   * Handle editor scroll events
   */
  function handleEditorScroll(): void {
    if (!canProcessScroll('editor')) return
    
    const editor = sharedState.editorElement.value
    const preview = sharedState.previewElement.value
    if (!editor || !preview) return

    // User is manually scrolling - suppress cursor sync
    if (sharedState.activeScrollSource.value === null && sharedState.syncState.value === 'ACTIVE') {
      sharedState.syncState.value = 'SUPPRESSED'
    }

    setLockout('editor')
    
    const line = getVisibleLineFromEditor()
    if (line !== null) {
      scrollPreviewToLine(line)
    } else {
      setScrollPercentage(preview, getScrollPercentage(editor))
    }
  }

  /**
   * Handle preview scroll events
   */
  function handlePreviewScroll(): void {
    if (!canProcessScroll('preview')) return
    
    const editor = sharedState.editorElement.value
    const preview = sharedState.previewElement.value
    if (!editor || !preview) return

    // User is manually scrolling - suppress cursor sync
    if (sharedState.activeScrollSource.value === null && sharedState.syncState.value === 'ACTIVE') {
      sharedState.syncState.value = 'SUPPRESSED'
    }

    setLockout('preview')
    
    const line = getVisibleLineFromPreview()
    if (line !== null && sharedState.getEditorView?.()) {
      scrollEditorToLine(line)
    } else {
      setScrollPercentage(editor, getScrollPercentage(preview))
    }
  }

  /**
   * Sync preview to cursor position (called when user types or moves cursor)
   * 
   * @param lineNumber - The source line number to sync to
   * @param isTyping - True if this is from actual typing (re-enables sync)
   */
  function syncToCursor(lineNumber: number, isTyping = false): void {
    // Never sync when disabled
    if (sharedState.syncState.value === 'DISABLED') return
    
    // If typing, re-enable full sync
    if (isTyping) {
      sharedState.syncState.value = 'ACTIVE'
      scrollPreviewToLine(lineNumber, { center: true })
      return
    }
    
    // If suppressed (user scrolled manually), don't sync cursor movement
    if (sharedState.syncState.value === 'SUPPRESSED') return
    
    // Active state - sync to cursor
    scrollPreviewToLine(lineNumber, { behavior: 'smooth' })
  }

  /**
   * Set up scroll event listeners
   */
  function setupListeners(): void {
    removeListeners()
    
    const editor = sharedState.editorElement.value
    const preview = sharedState.previewElement.value
    
    if (editor) {
      editor.addEventListener('scroll', handleEditorScroll, { passive: true })
    }
    if (preview) {
      preview.addEventListener('scroll', handlePreviewScroll, { passive: true })
    }
  }

  /**
   * Remove scroll event listeners
   */
  function removeListeners(): void {
    const editor = sharedState.editorElement.value
    const preview = sharedState.previewElement.value
    
    if (editor) {
      editor.removeEventListener('scroll', handleEditorScroll)
    }
    if (preview) {
      preview.removeEventListener('scroll', handlePreviewScroll)
    }
  }

  /**
   * Initialize scroll sync with DOM elements
   */
  function init(
    editor: HTMLElement,
    preview: HTMLElement,
    options?: { getEditorView?: () => EditorView | null }
  ): void {
    sharedState.editorElement.value = editor
    sharedState.previewElement.value = preview
    sharedState.getEditorView = options?.getEditorView ?? null
    sharedState.initialized = true
    setupListeners()
  }

  // Watch for element changes
  watch(
    [() => sharedState.editorElement.value, () => sharedState.previewElement.value],
    ([editor, preview]) => {
      if (editor && preview) {
        setupListeners()
      }
    }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    removeListeners()
    if (sharedState.lockoutTimeout) {
      clearTimeout(sharedState.lockoutTimeout)
    }
  })

  return {
    // State
    enabled,
    syncState: sharedState.syncState,
    
    // Actions
    toggle,
    init,
    syncToCursor,
    
    // For debugging
    _sharedState: sharedState,
  }
}
