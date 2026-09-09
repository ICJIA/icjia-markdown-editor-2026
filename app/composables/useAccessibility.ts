/**
 * @fileoverview Accessibility Composable
 * @description Provides accessibility utilities for screen reader announcements
 * and focus management. WCAG 2.1 AA compliant implementation.
 * 
 * @module composables/useAccessibility
 * 
 * @example
 * ```typescript
 * const { announce } = useAccessibility()
 *
 * // Announce a polite message
 * announce('Content saved successfully')
 *
 * // Announce an urgent message that interrupts the reader
 * announce('Error: Failed to save', 'assertive')
 * ```
 */

/**
 * Accessibility composable for screen reader announcements.
 * Creates and manages a live region for announcing messages to assistive technology.
 * 
 * @returns {Object} Accessibility methods
 * @returns {Function} returns.announce - Announce a message to screen readers
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
  
  return { announce }
}
