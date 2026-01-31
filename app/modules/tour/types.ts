/**
 * @fileoverview Tour Module Type Definitions
 * @description Reusable type definitions for the guided tour/onboarding module.
 * Copy this entire modules/tour/ folder to reuse in other Nuxt projects.
 * 
 * @module modules/tour/types
 */

/**
 * Position of the tour popover relative to the target element.
 */
export type TourPosition = 'top' | 'bottom' | 'left' | 'right'

/**
 * Alignment of the tour popover along the position axis.
 */
export type TourAlign = 'start' | 'center' | 'end'

/**
 * Definition of a single tour step.
 */
export interface TourStep {
  /**
   * Unique identifier for the step.
   * Used for programmatic navigation and localStorage tracking.
   */
  id: string

  /**
   * CSS selector to find the target element.
   * Typically uses data-tour attributes: '[data-tour="step-id"]'
   */
  target: string

  /**
   * Title displayed in the popover header.
   * Should be concise (2-5 words).
   */
  title: string

  /**
   * Main descriptive content for the step.
   * Explain what the feature does and why it's useful.
   */
  content: string

  /**
   * Optional additional tip or warning.
   * Displayed in smaller text below the main content.
   */
  tip?: string

  /**
   * Popover position relative to target element.
   * @default 'bottom'
   */
  position?: TourPosition

  /**
   * Popover alignment along the position axis.
   * @default 'center'
   */
  align?: TourAlign

  /**
   * Whether to show highlight ring around target element.
   * @default true
   */
  highlight?: boolean

  /**
   * Optional icon to display in the step header.
   * Use iconify format: 'i-heroicons-bolt'
   */
  icon?: string

  /**
   * Optional keyboard shortcut to display for Mac.
   * Array of key symbols: ['⌘', 'B'] or ['⌘', 'Shift', 'C']
   */
  shortcut?: string[]

  /**
   * Optional keyboard shortcut for Windows/Linux.
   * Array of key symbols: ['Ctrl', 'B'] or ['Ctrl', 'Shift', 'C']
   * If not provided, Mac shortcut with ⌘ replaced by Ctrl will be shown.
   */
  shortcutWin?: string[]
}

/**
 * Configuration for the tour module.
 */
export interface TourConfig {
  /**
   * Tour version number.
   * Increment when making breaking changes to force users to see the tour again.
   */
  version: number

  /**
   * Whether to automatically start the tour for first-time users.
   * @default true
   */
  autoStart: boolean

  /**
   * Delay in milliseconds before auto-starting the tour.
   * Allows the UI to settle before showing the first step.
   * @default 800
   */
  autoStartDelay: number

  /**
   * LocalStorage key prefix for tracking tour completion.
   * The version number is appended: 'app-tour-v1'
   */
  storageKeyPrefix: string

  /**
   * Ordered array of tour steps.
   * Steps are shown in the order they appear in this array.
   */
  steps: TourStep[]
}

/**
 * Progress information for the current tour.
 */
export interface TourProgress {
  /** Current step number (1-indexed for display) */
  current: number
  /** Total number of steps */
  total: number
  /** Completion percentage (0-100) */
  percentage: number
}

/**
 * Return type for the useTour composable.
 */
export interface UseTourReturn {
  // Configuration
  /** All tour steps from config */
  steps: TourStep[]
  /** Tour version from config */
  version: number
  /** Whether auto-start is enabled */
  autoStart: boolean
  /** Auto-start delay in ms */
  autoStartDelay: number

  // State
  /** Current step index (-1 when not active) */
  currentStepIndex: Ref<number>
  /** Current step data (null when not active) */
  currentStep: ComputedRef<TourStep | null>
  /** Whether the tour is currently running */
  isActive: ComputedRef<boolean>
  /** Whether the user has completed the tour */
  hasCompletedTour: Ref<boolean>
  /** Progress information */
  progress: ComputedRef<TourProgress>

  // Navigation
  /** Start the tour from the beginning */
  start: () => void
  /** Go to the next step or complete if on last step */
  next: () => void
  /** Go to the previous step */
  previous: () => void
  /** Cancel the tour and mark as seen (won't auto-start again) */
  cancel: () => void
  /** Complete the tour and mark as finished */
  complete: () => void
  /** Jump to a specific step by index */
  goToStep: (index: number) => void

  // Utilities
  /** Get a step by its ID */
  getStepById: (id: string) => TourStep | undefined
  /** Get the index of a step by its ID */
  getStepIndex: (id: string) => number
  /** Keyboard event handler for the tour */
  handleKeydown: (event: KeyboardEvent) => void
  /** Mark tour as seen with explicit localStorage write for Safari */
  markAsSeen: () => void
  /** Reset tour completion status so tour will auto-start again */
  resetCompletion: () => void
}

// Re-export Ref types for external use
import type { Ref, ComputedRef } from 'vue'
