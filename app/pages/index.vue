<script setup lang="ts">
/**
 * Main Editor Page
 * The primary and only page of the application
 */

// Page meta for SEO and accessibility
useHead({
  title: 'ICJIA Markdown Editor',
  meta: [
    { name: 'description', content: 'Accessible markdown editor for ICJIA researchers. Write, preview, and export markdown documents.' },
  ],
})

// Initialize global keyboard shortcuts (Ctrl+S, Ctrl+Shift+C, etc.)
useKeyboardShortcuts()

// Announce page load to screen readers
const { announce } = useAccessibility()

onMounted(() => {
  // Small delay to ensure components are ready
  setTimeout(() => {
    announce('ICJIA Markdown Editor ready. Press Tab to navigate to the editor.')
  }, 100)
})
</script>

<template>
  <div class="page-container">
    <!-- Header landmark -->
    <AppHeader />
    
    <!-- Main content landmark -->
    <main class="main-content" role="main">
      <EditorLayout />
    </main>
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
