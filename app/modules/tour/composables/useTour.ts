/**
 * @fileoverview Tour Composable
 * @description Reusable composable for managing guided tour state and navigation.
 * WCAG 2.1 AA compliant with screen reader announcements and keyboard support.
 * 
 * @module modules/tour/composables/useTour
 * 
 * @example
 * ```typescript
 * import { useTour } from '~/modules/tour/composables/useTour'
 * import { tourConfig } from '~/config/tour'
 * 
 * const tour = useTour(tourConfig)
 * 
 * // Start the tour
 * tour.start()
 * 
 * // Check if running
 * if (tour.isActive.value) {
 *   console.log('Currently on step:', tour.currentStep.value?.title)
 * }
 * ```
 */

import type { TourConfig, TourStep, TourProgress, UseTourReturn } from '../types'

/**
 * Creates a tour instance with the provided configuration.
 * 
 * @param config - Tour configuration object
 * @returns Tour state and methods
 */
export function useTour(config: TourConfig): UseTourReturn {
  const { steps, version, autoStart, autoStartDelay, storageKeyPrefix } = config
  
  // Compute storage key with version
  const storageKey = `${storageKeyPrefix}-v${version}`
  
  // State
  const currentStepIndex = ref(-1)
  const isActive = computed(() => currentStepIndex.value >= 0)
  const hasCompletedTour = useLocalStorage(storageKey, false)
  
  // Track previously focused element for focus restoration
  let previouslyFocused: HTMLElement | null = null
  
  // Get accessibility announce function if available
  const { announce } = useAccessibility()
  
  /**
   * Current step data, null when tour is not active.
   */
  const currentStep = computed<TourStep | null>(() => {
    if (currentStepIndex.value < 0 || currentStepIndex.value >= steps.length) {
      return null
    }
    return steps[currentStepIndex.value] ?? null
  })
  
  /**
   * Progress information for display.
   */
  const progress = computed<TourProgress>(() => ({
    current: currentStepIndex.value + 1,
    total: steps.length,
    percentage: steps.length > 0 
      ? Math.round(((currentStepIndex.value + 1) / steps.length) * 100)
      : 0
  }))
  
  /**
   * Get a step by its ID.
   */
  function getStepById(id: string): TourStep | undefined {
    return steps.find(s => s.id === id)
  }
  
  /**
   * Get the index of a step by its ID.
   */
  function getStepIndex(id: string): number {
    return steps.findIndex(s => s.id === id)
  }
  
  /**
   * Highlight the current target element.
   */
  function highlightTarget(): void {
    const step = currentStep.value
    if (!step) return
    
    const el = document.querySelector(step.target) as HTMLElement | null
    if (el && step.highlight !== false) {
      el.setAttribute('data-tour-active', 'true')
      
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }
  
  /**
   * Clear all highlight attributes.
   */
  function clearHighlight(): void {
    document.querySelectorAll('[data-tour-active]').forEach(el => {
      el.removeAttribute('data-tour-active')
    })
  }
  
  /**
   * Restore focus to the previously focused element.
   */
  function restoreFocus(): void {
    // Capture the target now: if the tour restarts before the timeout fires,
    // previouslyFocused is reassigned and the pending restore would focus the
    // wrong element.
    const target = previouslyFocused
    previouslyFocused = null
    if (target && typeof target.focus === 'function') {
      // Small delay to ensure the tour overlay is fully removed
      setTimeout(() => {
        target.focus()
      }, 50)
    }
  }
  
  /**
   * Announce the current step to screen readers.
   */
  function announceStep(): void {
    const step = currentStep.value
    if (step) {
      const message = `Tour step ${progress.value.current} of ${progress.value.total}: ${step.title}. ${step.content}`
      announce(message)
    }
  }
  
  /**
   * Start the tour from the beginning.
   */
  function start(): void {
    // Store current focus for restoration
    previouslyFocused = document.activeElement as HTMLElement
    
    // Start at first step
    currentStepIndex.value = 0
    
    // Apply highlight and announce
    nextTick(() => {
      highlightTarget()
      announceStep()
    })
  }
  
  /**
   * Go to the next step or complete if on last step.
   */
  function next(): void {
    clearHighlight()
    
    if (currentStepIndex.value < steps.length - 1) {
      currentStepIndex.value++
      nextTick(() => {
        highlightTarget()
        announceStep()
      })
    } else {
      complete()
    }
  }
  
  /**
   * Go to the previous step.
   */
  function previous(): void {
    if (currentStepIndex.value > 0) {
      clearHighlight()
      currentStepIndex.value--
      nextTick(() => {
        highlightTarget()
        announceStep()
      })
    }
  }
  
  /**
   * Jump to a specific step by index.
   */
  function goToStep(index: number): void {
    if (index >= 0 && index < steps.length) {
      clearHighlight()
      currentStepIndex.value = index
      nextTick(() => {
        highlightTarget()
        announceStep()
      })
    }
  }
  
  /**
   * Mark the tour as seen with explicit localStorage write for Safari compatibility.
   * Safari has known timing issues with reactive localStorage, so we write directly.
   */
  function markAsSeen(): void {
    hasCompletedTour.value = true
    // Explicitly write to localStorage for Safari compatibility
    // Safari may not sync reactive localStorage before page refresh
    if (import.meta.client) {
      try {
        localStorage.setItem(storageKey, 'true')
      } catch {
        // localStorage may be unavailable (private mode, quota exceeded, etc.)
        // The reactive ref will still work for the current session
      }
    }
  }
  
  /**
   * Reset the tour completion status so the tour will auto-start again.
   * Used when user clicks "Tutorial" button to review the onboarding experience.
   */
  function resetCompletion(): void {
    hasCompletedTour.value = false
    // Explicitly remove from localStorage for Safari compatibility
    if (import.meta.client) {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // localStorage may be unavailable (private mode, quota exceeded, etc.)
        // The reactive ref will still work for the current session
      }
    }
  }
  
  /**
   * Cancel the tour and mark as seen so it won't auto-start again.
   * Users can still manually restart via the Tour button.
   */
  function cancel(): void {
    clearHighlight()
    markAsSeen()
    currentStepIndex.value = -1
    restoreFocus()
    announce('Tour cancelled. You can restart it anytime from the Tour button in the header.')
  }
  
  /**
   * Complete the tour and mark as finished.
   */
  function complete(): void {
    clearHighlight()
    markAsSeen()
    currentStepIndex.value = -1
    restoreFocus()
    announce('Tour complete! You are ready to start using the editor.')
  }
  
  /**
   * Handle keyboard events for tour navigation.
   * - Escape: Cancel tour
   * - ArrowRight: Next step
   * - ArrowLeft: Previous step
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (!isActive.value) return
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        cancel()
        break
      case 'ArrowRight':
        // Only if not focused on an input/button
        if (!['INPUT', 'BUTTON', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
          event.preventDefault()
          next()
        }
        break
      case 'ArrowLeft':
        if (!['INPUT', 'BUTTON', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
          event.preventDefault()
          previous()
        }
        break
    }
  }
  
  // Development mode validation
  if (import.meta.dev) {
    let validationTimeout: ReturnType<typeof setTimeout> | null = null
    onMounted(() => {
      // Validate that all tour targets exist in the DOM
      validationTimeout = setTimeout(() => {
        for (const step of steps) {
          const el = document.querySelector(step.target)
          if (!el) {
            console.warn(`[Tour] Missing target for step "${step.id}": ${step.target}`)
          }
        }
      }, 1000)
    })
    onUnmounted(() => {
      if (validationTimeout) clearTimeout(validationTimeout)
    })
  }
  
  return {
    // Config
    steps,
    version,
    autoStart,
    autoStartDelay,
    
    // State
    currentStepIndex,
    currentStep,
    isActive,
    hasCompletedTour,
    progress,
    
    // Navigation
    start,
    next,
    previous,
    cancel,
    complete,
    goToStep,
    
    // Utilities
    getStepById,
    getStepIndex,
    handleKeydown,
    markAsSeen,
    resetCompletion
  }
}
