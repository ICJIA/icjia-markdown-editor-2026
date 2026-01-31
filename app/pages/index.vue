<script setup lang="ts">
/**
 * Main Editor Page
 * The primary and only page of the application
 */

import { useTour } from '~/modules/tour/composables/useTour'
import TourOverlay from '~/modules/tour/components/TourOverlay.vue'
import TourWelcome from '~/modules/tour/components/TourWelcome.vue'
import TourIntro from '~/modules/tour/components/TourIntro.vue'
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

// Intro slides state - shown after welcome, before tour
const showIntro = ref(false)

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
  // Show intro slides after welcome
  setTimeout(() => {
    showIntro.value = true
  }, 100)
}

// Handle intro slides - user completed intro, start actual tour
function handleIntroNext() {
  showIntro.value = false
  // Small delay to let the intro modal fade out
  setTimeout(() => {
    tour.start()
  }, 100)
}

// Handle intro slides - user wants to skip tour
function handleIntroSkip() {
  showIntro.value = false
  // Mark as seen so we don't ask again (uses explicit localStorage write for Safari)
  tour.markAsSeen()
  announce('Tour skipped. You can start it anytime from the Tour button in the header.')
}

// Handle welcome modal - user wants to skip tour
function handleWelcomeSkip() {
  showWelcome.value = false
  // Mark as seen so we don't ask again (uses explicit localStorage write for Safari)
  tour.markAsSeen()
  announce('Tour skipped. You can start it anytime from the Tour button in the header.')
}

// Handle tour start from header button (manual trigger)
// Shows welcome screen first, then starts tour
function handleStartTour() {
  showWelcome.value = true
}

// Reset tour completion and show welcome again (for Tutorial button)
function handleResetTour() {
  tour.resetCompletion()
  showWelcome.value = true
}

// Provide tour functions to child components
provide('startTour', handleStartTour)
provide('resetTour', handleResetTour)
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
    
    <!-- Guided Tour Intro Slides (What is Markdown?) -->
    <TourIntro
      :is-visible="showIntro"
      @next="handleIntroNext"
      @skip="handleIntroSkip"
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
