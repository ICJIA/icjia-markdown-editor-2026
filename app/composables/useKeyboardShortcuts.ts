/**
 * @fileoverview Global Keyboard Shortcuts Composable
 * @description Handles application-level keyboard shortcuts that require access to composables.
 * These shortcuts work when the editor has focus and provide quick access to common actions.
 * 
 * @module composables/useKeyboardShortcuts
 * 
 * Supported shortcuts:
 * - Ctrl/Cmd + Alt + T: Open table builder (plain Ctrl/Cmd+T is browser-reserved
 *   for "new tab" and cannot be intercepted in Chrome/Safari/Firefox)
 * - Ctrl/Cmd + S: Download markdown file
 * - Ctrl/Cmd + Shift + C: Copy markdown to clipboard
 * - Ctrl/Cmd + Shift + H: Copy HTML to clipboard
 * - Ctrl/Cmd + O: Upload/open markdown file
 * - Ctrl/Cmd + \: Toggle scroll synchronization
 * 
 * @example
 * ```typescript
 * // In a component setup
 * useKeyboardShortcuts() // Auto-initializes listeners on mount
 * ```
 */

/**
 * Global keyboard shortcuts composable for handling app-level shortcuts.
 * Automatically initializes keyboard listeners on mount and cleans up on unmount.
 * 
 * @returns {Object} Keyboard shortcut methods
 * @returns {Function} returns.handleKeyDown - The keydown event handler
 * @returns {Function} returns.init - Manually initialize keyboard listeners
 * @returns {Function} returns.cleanup - Manually remove keyboard listeners
 */
export function useKeyboardShortcuts() {
  const { copyMarkdown, copyHtml, downloadMarkdown, uploadMarkdown } = useExport()
  const { announce } = useAccessibility()
  const { openTableBuilder } = useTableBuilderModal()
  const { enabled: scrollSyncEnabled, toggle: toggleScrollSync } = useScrollSync()

  /**
   * Handles global keyboard shortcut events.
   * Processes modifier key combinations for various editor actions.
   * 
   * @param {KeyboardEvent} event - The keyboard event to handle
   * @returns {void}
   */
  function handleKeyDown(event: KeyboardEvent) {
    const isMod = event.metaKey || event.ctrlKey
    const isShift = event.shiftKey
    const isAlt = event.altKey

    // Ctrl/Cmd + Alt + T - Open table builder modal
    // (uses event.code because Option/Alt changes event.key on macOS, e.g. Alt+T = '†')
    if (isMod && isAlt && !isShift && event.code === 'KeyT') {
      event.preventDefault()
      openTableBuilder()
      announce('Table builder opened')
      return
    }

    // Ctrl/Cmd + S - Download markdown (prevent browser save dialog)
    if (isMod && !isShift && !isAlt && event.key === 's') {
      event.preventDefault()
      downloadMarkdown()
      announce('Markdown file downloaded')
      return
    }

    // Ctrl/Cmd + Shift + C - Copy markdown
    if (isMod && isShift && !isAlt && event.key.toLowerCase() === 'c') {
      event.preventDefault()
      copyMarkdown()
      return
    }

    // Ctrl/Cmd + Shift + H - Copy HTML
    if (isMod && isShift && !isAlt && event.key.toLowerCase() === 'h') {
      event.preventDefault()
      copyHtml()
      return
    }

    // Ctrl/Cmd + O - Upload/Open markdown file
    if (isMod && !isShift && !isAlt && event.key === 'o') {
      event.preventDefault()
      uploadMarkdown()
      return
    }

    // Ctrl/Cmd + \ - Toggle scroll sync
    if (isMod && !isShift && !isAlt && event.key === '\\') {
      event.preventDefault()
      toggleScrollSync()
      announce(scrollSyncEnabled.value ? 'Scroll sync disabled' : 'Scroll sync enabled')
      return
    }
  }
  
  /**
   * Initializes the global keyboard event listeners.
   * Only runs on the client side (not during SSR).
   * 
   * @returns {void}
   */
  function init() {
    if (import.meta.client) {
      window.addEventListener('keydown', handleKeyDown)
    }
  }
  
  /**
   * Removes the global keyboard event listeners.
   * Should be called on component unmount to prevent memory leaks.
   * 
   * @returns {void}
   */
  function cleanup() {
    if (import.meta.client) {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
  
  /**
   * Lifecycle hooks: Auto-initialize on mount, cleanup on unmount.
   * Ensures keyboard listeners are properly managed.
   */
  onMounted(init)
  onUnmounted(cleanup)
  
  return {
    handleKeyDown,
    init,
    cleanup,
  }
}
