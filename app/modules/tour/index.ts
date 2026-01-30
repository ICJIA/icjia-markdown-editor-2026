/**
 * @fileoverview Tour Module Entry Point
 * @description Re-exports all tour module components and utilities.
 * 
 * @module modules/tour
 * 
 * @example
 * ```typescript
 * import { useTour, type TourConfig, type TourStep } from '~/modules/tour'
 * ```
 */

// Types
export type {
  TourPosition,
  TourAlign,
  TourStep,
  TourConfig,
  TourProgress,
  UseTourReturn
} from './types'

// Composables
export { useTour } from './composables/useTour'

// Note: Components should be imported directly from their files
// due to Vue SFC compilation requirements:
// import TourOverlay from '~/modules/tour/components/TourOverlay.vue'
// import TourTrigger from '~/modules/tour/components/TourTrigger.vue'
