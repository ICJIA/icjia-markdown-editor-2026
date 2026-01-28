/**
 * @fileoverview Scroll Synchronization Composable
 * @description Synchronizes scroll position between the editor and preview panes.
 * Uses percentage-based synchronization for consistent behavior regardless of
 * content height differences between the panes.
 * 
 * @module composables/useScrollSync
 * 
 * @example
 * ```typescript
 * const { enabled, init, toggle } = useScrollSync()
 * 
 * // Initialize with DOM elements
 * init(editorEl, previewEl)
 * 
 * // Toggle sync on/off
 * toggle()
 * ```
 */

/**
 * Scroll synchronization composable for keeping editor and preview in sync.
 * Prevents scroll loops by tracking the active scroll source.
 * 
 * @returns {Object} Scroll sync state and methods
 * @returns {Ref<boolean>} returns.enabled - Whether scroll sync is enabled
 * @returns {Ref<HTMLElement | null>} returns.editorElement - Reference to editor element
 * @returns {Ref<HTMLElement | null>} returns.previewElement - Reference to preview element
 * @returns {Function} returns.toggle - Toggle scroll sync on/off
 * @returns {Function} returns.init - Initialize with DOM elements
 * @returns {Function} returns.setupListeners - Set up scroll event listeners
 */
export function useScrollSync() {
  /**
   * Flag indicating if scroll synchronization is enabled.
   * @type {Ref<boolean>}
   */
  const enabled = ref(true)
  
  /**
   * Tracks which pane initiated the current scroll to prevent infinite loops.
   * @type {Ref<'editor' | 'preview' | null>}
   */
  const activeScrollSource = ref<'editor' | 'preview' | null>(null)
  
  /**
   * Reference to the editor scroll container element.
   * @type {Ref<HTMLElement | null>}
   */
  const editorElement = ref<HTMLElement | null>(null)
  
  /**
   * Reference to the preview scroll container element.
   * @type {Ref<HTMLElement | null>}
   */
  const previewElement = ref<HTMLElement | null>(null)
  
  /**
   * Timeout for resetting the active scroll source.
   * @type {ReturnType<typeof setTimeout> | null}
   */
  let resetTimeout: ReturnType<typeof setTimeout> | null = null
  
  /**
   * Calculates the scroll percentage of an element (0 to 1).
   * 
   * @param {HTMLElement} element - The element to calculate scroll percentage for
   * @returns {number} The scroll percentage between 0 and 1
   */
  function getScrollPercentage(element: HTMLElement): number {
    const scrollTop = element.scrollTop
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll <= 0) return 0
    return Math.min(1, Math.max(0, scrollTop / maxScroll))
  }
  
  /**
   * Applies a scroll percentage to an element.
   * Scrolls the element to the position corresponding to the given percentage.
   * 
   * @param {HTMLElement} element - The element to scroll
   * @param {number} percentage - The target scroll percentage (0 to 1)
   * @returns {void}
   */
  function setScrollPercentage(element: HTMLElement, percentage: number): void {
    const maxScroll = element.scrollHeight - element.clientHeight
    if (maxScroll > 0) {
      element.scrollTop = maxScroll * percentage
    }
  }
  
  /**
   * Handles editor scroll events and syncs to the preview pane.
   * Ignores events if sync is disabled or preview is the active source.
   * 
   * @returns {void}
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
   * Handles preview scroll events and syncs to the editor pane.
   * Ignores events if sync is disabled or editor is the active source.
   * 
   * @returns {void}
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
   * Should be called after both editor and preview elements are available.
   * 
   * @param {HTMLElement} editor - The editor scroll container element
   * @param {HTMLElement} preview - The preview scroll container element
   * @returns {void}
   */
  function init(editor: HTMLElement, preview: HTMLElement): void {
    editorElement.value = editor
    previewElement.value = preview
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
  }
}
