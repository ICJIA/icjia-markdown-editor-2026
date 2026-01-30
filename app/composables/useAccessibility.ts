/**
 * @fileoverview Accessibility Composable
 * @description Provides accessibility utilities for screen reader announcements
 * and focus management. WCAG 2.1 AA compliant implementation.
 * 
 * @module composables/useAccessibility
 * 
 * @example
 * ```typescript
 * const { announce, announceUrgent } = useAccessibility()
 * 
 * // Announce a polite message
 * announce('Content saved successfully')
 * 
 * // Announce an urgent message
 * announceUrgent('Error: Failed to save')
 * ```
 */

/**
 * Accessibility composable for screen reader announcements.
 * Creates and manages a live region for announcing messages to assistive technology.
 * 
 * @returns {Object} Accessibility methods
 * @returns {Function} returns.announce - Announce a message to screen readers
 * @returns {Function} returns.announceUrgent - Announce an urgent message
 */
export function useAccessibility() {
  /**
   * Reference to the announcer live region element.
   * @type {Ref<HTMLElement | null>}
   */
  const announcer = ref<HTMLElement | null>(null)
  
  /**
   * Lifecycle hook that reuses the screen reader announcer element from app.vue.
   * The announcer is defined in the template within an ARIA landmark (aside).
   */
  onMounted(() => {
    // Use the existing announcer element from app.vue template
    // It's placed inside an aside landmark to satisfy ARIA requirements
    const existing = document.getElementById('sr-announcer')
    if (existing) {
      announcer.value = existing
    }
  })
  
  /**
   * Lifecycle hook for cleanup.
   * The announcer is kept around for the app lifetime to avoid recreation.
   */
  onUnmounted(() => {
    // Only remove if we created it and no other components are using it
    // In practice, we keep it around for the app lifetime
  })
  
  /**
   * Announces a message to screen readers via the live region.
   * Clears the region first to ensure screen readers detect the change.
   * 
   * @param {string} message - The message to announce
   * @param {'polite' | 'assertive'} [priority='polite'] - The announcement priority
   *   - 'polite': Waits for user to finish current task (default)
   *   - 'assertive': Interrupts current task immediately
   * @returns {void}
   */
  function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (announcer.value) {
      // Set priority
      announcer.value.setAttribute('aria-live', priority)
      
      // Clear and set with delay to ensure screen reader picks up the change
      announcer.value.textContent = ''
      setTimeout(() => {
        if (announcer.value) {
          announcer.value.textContent = message
        }
      }, 50)
    }
  }
  
  /**
   * Announces an urgent message that interrupts the user's current task.
   * Use sparingly for critical notifications like errors.
   * 
   * @param {string} message - The urgent message to announce
   * @returns {void}
   */
  function announceUrgent(message: string) {
    announce(message, 'assertive')
  }
  
  return { 
    announce, 
    announceUrgent 
  }
}

/**
 * Focus trap composable for modal accessibility.
 * Traps keyboard focus within a container element, required for WCAG 2.4.3 compliance.
 * When the user tabs past the last focusable element, focus wraps to the first.
 * 
 * @param {Ref<HTMLElement | null>} containerRef - Ref to the container element to trap focus within
 * @returns {Object} Focus trap methods
 * @returns {Function} returns.handleKeyDown - Tab key handler for the focus trap
 * @returns {Function} returns.getFocusableElements - Get all focusable elements in container
 * @returns {Function} returns.focusFirst - Focus the first focusable element
 * 
 * @example
 * ```typescript
 * const modalRef = ref<HTMLElement | null>(null)
 * const { handleKeyDown, focusFirst } = useFocusTrap(modalRef)
 * 
 * // On modal open
 * focusFirst()
 * 
 * // In template: @keydown="handleKeyDown"
 * ```
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
  /**
   * CSS selector for all focusable elements within the container.
   * @constant {string}
   */
  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  /**
   * Gets all focusable elements within the container.
   * 
   * @returns {HTMLElement[]} Array of focusable elements
   */
  function getFocusableElements(): HTMLElement[] {
    if (!containerRef.value) return []
    return Array.from(containerRef.value.querySelectorAll(focusableSelector))
  }
  
  /**
   * Handles keyboard events for the focus trap.
   * Intercepts Tab key to wrap focus within the container.
   * 
   * @param {KeyboardEvent} event - The keyboard event to handle
   * @returns {void}
   */
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    
    const focusable = getFocusableElements()
    if (focusable.length === 0) return
    
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    
    if (!first || !last) return
    
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  
  /**
   * Focuses the first focusable element in the container.
   * Useful for initially focusing when a modal opens.
   * 
   * @returns {void}
   */
  function focusFirst() {
    const focusable = getFocusableElements()
    const first = focusable[0]
    if (first) {
      first.focus()
    }
  }
  
  return { 
    handleKeyDown, 
    getFocusableElements, 
    focusFirst 
  }
}
