/**
 * Scroll Synchronization Composable
 * Synchronizes scroll position between editor and preview panes
 * 
 * Uses percentage-based synchronization for consistent behavior
 * regardless of content height differences between panes.
 */

export function useScrollSync() {
  const enabled = ref(true)
  
  // Track which pane is currently being scrolled to prevent loops
  const activeScrollSource = ref<'editor' | 'preview' | null>(null)
  
  // References to scroll containers
  const editorElement = ref<HTMLElement | null>(null)
  const previewElement = ref<HTMLElement | null>(null)
  
  // Debounce timeout for resetting scroll source
  let resetTimeout: ReturnType<typeof setTimeout> | null = null
  
  /**
   * Calculate scroll percentage of an element
   */
  function getScrollPercentage(element: HTMLElement): number {
    const scrollTop = element.scrollTop
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll <= 0) return 0
    return Math.min(1, Math.max(0, scrollTop / maxScroll))
  }
  
  /**
   * Apply scroll percentage to an element
   */
  function setScrollPercentage(element: HTMLElement, percentage: number): void {
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll > 0) {
      element.scrollTop = maxScroll * percentage
    }
  }
  
  /**
   * Handle editor scroll - sync to preview
   */
  function handleEditorScroll(): void {
    if (!enabled.value) return
    if (!editorElement.value || !previewElement.value) return
    if (activeScrollSource.value === 'preview') return
    
    activeScrollSource.value = 'editor'
    const percentage = getScrollPercentage(editorElement.value)
    setScrollPercentage(previewElement.value, percentage)
    
    // Reset active source after scrolling stops
    if (resetTimeout) clearTimeout(resetTimeout)
    resetTimeout = setTimeout(() => {
      activeScrollSource.value = null
    }, 100)
  }
  
  /**
   * Handle preview scroll - sync to editor
   */
  function handlePreviewScroll(): void {
    if (!enabled.value) return
    if (!editorElement.value || !previewElement.value) return
    if (activeScrollSource.value === 'editor') return
    
    activeScrollSource.value = 'preview'
    const percentage = getScrollPercentage(previewElement.value)
    setScrollPercentage(editorElement.value, percentage)
    
    if (resetTimeout) clearTimeout(resetTimeout)
    resetTimeout = setTimeout(() => {
      activeScrollSource.value = null
    }, 100)
  }
  
  /**
   * Toggle scroll sync on/off
   */
  function toggle(): void {
    enabled.value = !enabled.value
  }
  
  // Store listener references for proper cleanup
  let editorListener: (() => void) | null = null
  let previewListener: (() => void) | null = null
  
  /**
   * Set up scroll listeners on elements
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
   * Remove scroll listeners
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
   * Initialize scroll sync with the actual DOM elements
   * Call this after both elements are available
   */
  function init(editor: HTMLElement, preview: HTMLElement): void {
    editorElement.value = editor
    previewElement.value = preview
    setupListeners()
  }
  
  // Watch for element changes and re-setup listeners
  watch([editorElement, previewElement], ([newEditor, newPreview]) => {
    if (newEditor && newPreview) {
      setupListeners()
    }
  }, { immediate: false })
  
  // Cleanup on unmount
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
  }
}
