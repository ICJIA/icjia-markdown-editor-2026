/**
 * Accessibility composable for screen reader announcements and focus management
 * WCAG 2.1 AA compliant - provides live region announcements
 */

export function useAccessibility() {
  const announcer = ref<HTMLElement | null>(null)
  
  // Live region for screen reader announcements
  onMounted(() => {
    // Check if announcer already exists (prevents duplicates)
    const existing = document.getElementById('sr-announcer')
    if (existing) {
      announcer.value = existing
      return
    }
    
    announcer.value = document.createElement('div')
    announcer.value.id = 'sr-announcer'
    announcer.value.setAttribute('role', 'status')
    announcer.value.setAttribute('aria-live', 'polite')
    announcer.value.setAttribute('aria-atomic', 'true')
    announcer.value.className = 'sr-only'
    document.body.appendChild(announcer.value)
  })
  
  onUnmounted(() => {
    // Only remove if we created it and no other components are using it
    // In practice, we keep it around for the app lifetime
  })
  
  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param priority - 'polite' or 'assertive' (default: 'polite')
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
   * Announce an urgent message (uses assertive priority)
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
 * Focus trap composable for modal accessibility
 * Traps focus within a container element (required for WCAG 2.4.3)
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  function getFocusableElements(): HTMLElement[] {
    if (!containerRef.value) return []
    return Array.from(containerRef.value.querySelectorAll(focusableSelector))
  }
  
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
   * Focus the first focusable element in the container
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
