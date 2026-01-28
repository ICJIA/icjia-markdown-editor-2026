<script setup lang="ts">
/**
 * Root Application Component
 * Sets up global layout structure with accessibility features
 */

// Provide accessibility features globally
const { announce } = useAccessibility()

// Make announce available for other components if needed
provide('announce', announce)
</script>

<template>
  <!-- UApp provides required context providers (TooltipProvider, etc.) -->
  <UApp>
    <div id="app">
      <!-- Skip link - first focusable element (WCAG 2.4.1) -->
      <SkipLink />
      
      <!-- Route announcer for SPA navigation -->
      <NuxtRouteAnnouncer />
      
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
</style>
