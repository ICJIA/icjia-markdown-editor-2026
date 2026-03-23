<script setup lang="ts">
/**
 * Root Application Component
 * Sets up global layout structure with accessibility features
 */

// Provide accessibility features globally
const { announce } = useAccessibility()

// Make announce available for other components if needed
provide('announce', announce)

// Fix Nuxt UI toast viewport: the <ol data-slot="viewport"> is always in the DOM
// but empty when no toasts are visible, triggering WCAG 1.3.1 "empty list container".
// Hide it from the accessibility tree when empty.
onMounted(() => {
  const viewport = document.querySelector('ol[data-slot="viewport"]')
  if (viewport) {
    const observer = new MutationObserver(() => {
      const isEmpty = viewport.children.length === 0
      viewport.setAttribute('role', isEmpty ? 'presentation' : 'list')
    })
    observer.observe(viewport, { childList: true })
    // Set initial state
    viewport.setAttribute('role', 'presentation')
  }
})
</script>

<template>
  <!-- UApp provides required context providers (TooltipProvider, etc.) -->
  <UApp>
    <div id="app">
      <!-- Skip link - first focusable element (WCAG 2.4.1) -->
      <SkipLink />

      <!-- 
        Live region container for screen reader announcements
        Placed inside a landmark (complementary) to satisfy ARIA landmark requirements
        All live regions (route announcer, status messages) go here
      -->
      <aside 
        id="live-region-container"
        aria-label="Announcements"
        class="sr-only"
      >
        <!-- Route announcer for SPA navigation -->
        <NuxtRouteAnnouncer />
        
        <!-- Screen reader announcer element (managed by useAccessibility) -->
        <div 
          id="sr-announcer"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        ></div>
      </aside>

      <!-- Page content -->
      <NuxtPage />
    </div>
  </UApp>
</template>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-background, #0f172a);
  color: var(--color-text, #f1f5f9);
}

/* Screen reader only - visually hidden but accessible */
#live-region-container {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

</style>
