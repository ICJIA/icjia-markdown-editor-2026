<script setup lang="ts">
/**
 * Application Header Component
 * Contains app title and color mode toggle
 * Uses semantic <header> landmark for accessibility
 */
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">
        <UIcon name="i-heroicons-document-text" class="title-icon" />
        ICJIA Markdown Editor
      </h1>
      
      <nav class="header-actions" aria-label="Application controls">
        <ColorModeToggle />
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: var(--color-surface, #1e293b);
  border-bottom: 1px solid var(--color-border, #334155);
  padding: 0.75rem 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
  margin: 0 auto;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #f1f5f9);
  margin: 0;
}

.title-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary, #3b82f6);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
