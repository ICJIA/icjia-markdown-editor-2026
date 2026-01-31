<script setup lang="ts">
/**
 * Main Editor Page
 * The primary and only page of the application
 */

import { useTour } from '~/modules/tour/composables/useTour'
import TourOverlay from '~/modules/tour/components/TourOverlay.vue'
import TourWelcome from '~/modules/tour/components/TourWelcome.vue'
import { tourConfig } from '~/config/tour'

// Page meta for SEO and accessibility
useHead({
  title: 'ICJIA Markdown Editor 2.0',
  meta: [
    { name: 'description', content: 'Accessible markdown editor for ICJIA researchers. Write, preview, and export markdown documents.' },
  ],
})

// Initialize global keyboard shortcuts (Ctrl+S, Ctrl+Shift+C, etc.)
useKeyboardShortcuts()

// Announce page load to screen readers
const { announce } = useAccessibility()

// Initialize tour
const tour = useTour(tourConfig)

// Welcome modal state - shown for first-time users
const showWelcome = ref(false)

onMounted(() => {
  // Small delay to ensure components are ready
  setTimeout(() => {
    announce('ICJIA Markdown Editor 2.0 ready. Press Tab to navigate to the editor.')
  }, 100)
  
  // Show welcome modal for first-time users instead of auto-starting tour
  if (tour.autoStart && !tour.hasCompletedTour.value) {
    setTimeout(() => {
      showWelcome.value = true
    }, tour.autoStartDelay)
  }
})

// Handle welcome modal - user wants to start tour
function handleWelcomeStart() {
  showWelcome.value = false
  // Small delay to let the welcome modal fade out
  setTimeout(() => {
    tour.start()
  }, 100)
}

// Handle welcome modal - user wants to skip tour
function handleWelcomeSkip() {
  showWelcome.value = false
  // Mark as seen so we don't ask again (uses explicit localStorage write for Safari)
  tour.markAsSeen()
  announce('Tour skipped. You can start it anytime from the Tour button in the header.')
}

// Handle tour start from header button (manual trigger)
function handleStartTour() {
  tour.start()
}

// Provide tour start function to child components
provide('startTour', handleStartTour)
</script>

<template>
  <div class="page-container">
    <!-- Header landmark -->
    <AppHeader />
    
    <!-- Main content landmark -->
    <main class="main-content" role="main">
      <EditorLayout />
    </main>
    
    <!-- Modals -->
    <DownloadModal />
    <ConversionToolsModal />
    
    <!-- Guided Tour Welcome Modal (first-time users) -->
    <TourWelcome
      :is-visible="showWelcome"
      @start-tour="handleWelcomeStart"
      @skip-tour="handleWelcomeSkip"
    />
    
    <!-- Guided Tour Overlay -->
    <TourOverlay
      :is-active="tour.isActive.value"
      :current-step="tour.currentStep.value"
      :progress="tour.progress.value"
      @next="tour.next()"
      @previous="tour.previous()"
      @cancel="tour.cancel()"
    />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
</style>
