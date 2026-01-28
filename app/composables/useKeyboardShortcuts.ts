/**
 * Global Keyboard Shortcuts Composable
 * Handles app-level keyboard shortcuts that need access to composables
 * These shortcuts work when the editor has focus
 */

export function useKeyboardShortcuts() {
  const { copyMarkdown, copyHtml, downloadMarkdown, uploadMarkdown } = useExport()
  const { announce } = useAccessibility()
  const { openTableBuilder } = useTableBuilderModal()

  /**
   * Handle global keyboard shortcuts
   */
  function handleKeyDown(event: KeyboardEvent) {
    const isMod = event.metaKey || event.ctrlKey
    const isShift = event.shiftKey

    // Ctrl/Cmd + T - Open table builder modal
    if (isMod && !isShift && event.key.toLowerCase() === 't') {
      event.preventDefault()
      openTableBuilder()
      announce('Table builder opened')
      return
    }

    // Ctrl/Cmd + S - Download markdown (prevent browser save dialog)
    if (isMod && !isShift && event.key === 's') {
      event.preventDefault()
      downloadMarkdown()
      announce('Markdown file downloaded')
      return
    }
    
    // Ctrl/Cmd + Shift + C - Copy markdown
    if (isMod && isShift && event.key.toLowerCase() === 'c') {
      event.preventDefault()
      copyMarkdown()
      return
    }
    
    // Ctrl/Cmd + Shift + H - Copy HTML
    if (isMod && isShift && event.key.toLowerCase() === 'h') {
      event.preventDefault()
      copyHtml()
      return
    }
    
    // Ctrl/Cmd + O - Upload/Open markdown file
    if (isMod && !isShift && event.key === 'o') {
      event.preventDefault()
      uploadMarkdown()
      return
    }
  }
  
  /**
   * Initialize global keyboard listeners
   */
  function init() {
    if (import.meta.client) {
      window.addEventListener('keydown', handleKeyDown)
    }
  }
  
  /**
   * Cleanup keyboard listeners
   */
  function cleanup() {
    if (import.meta.client) {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
  
  // Auto-initialize on mount, cleanup on unmount
  onMounted(init)
  onUnmounted(cleanup)
  
  return {
    handleKeyDown,
    init,
    cleanup,
  }
}
