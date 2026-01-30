/**
 * @fileoverview Tour Type Definitions
 * @description Type definitions for the onboarding tour system.
 * Provides structure for tour configuration and step management.
 * 
 * @module types/tour
 */

/**
 * Represents a single step in the onboarding tour.
 * Each step highlights a UI element and provides explanatory content.
 */
export interface TourStep {
  /**
   * Unique identifier for the step.
   * Used for tracking, navigation, and CSS targeting.
   */
  id: string

  /**
   * CSS selector to find the target element.
   * Typically uses data-tour attributes: '[data-tour="step-id"]'
   */
  target: string

  /**
   * Step title displayed in the popover header.
   * Should be concise and descriptive.
   */
  title: string

  /**
   * Main descriptive content explaining the feature.
   * Can include basic explanation of functionality.
   */
  content: string

  /**
   * Optional additional tip or warning shown in smaller/emphasized text.
   * Use for important caveats or helpful hints.
   */
  tip?: string

  /**
   * Popover position relative to the target element.
   * Defaults to 'bottom' if not specified.
   */
  position?: 'top' | 'bottom' | 'left' | 'right'

  /**
   * Whether to show a highlight ring around the target.
   * Defaults to true if not specified.
   */
  highlight?: boolean

  /**
   * Optional icon name to display in the step header.
   * Uses Heroicons/Lucide icon naming convention.
   */
  icon?: string

  /**
   * Optional keyboard shortcut keys to display.
   * Array of key names for UKbd component rendering.
   */
  shortcut?: string[]
}

/**
 * Configuration for the entire tour system.
 * Controls tour behavior and contains all step definitions.
 */
export interface TourConfig {
  /**
   * Tour version number.
   * Increment when making significant changes to reset user completion state.
   */
  version: number

  /**
   * Whether to automatically start the tour for first-time users.
   */
  autoStart: boolean

  /**
   * Delay in milliseconds before auto-starting.
   * Allows the UI to fully render before the tour begins.
   */
  autoStartDelay: number

  /**
   * LocalStorage key for tracking tour completion.
   * Include version in the key to reset on major updates.
   */
  storageKey: string

  /**
   * Ordered array of tour steps.
   * Steps are presented in array order.
   */
  steps: TourStep[]
}
