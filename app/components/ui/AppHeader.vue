<script setup lang="ts">
/**
 * Application Header Component
 * Contains app title, tour trigger, and color mode toggle
 * Uses semantic <header> landmark for accessibility
 */

defineEmits<{
  /** Emitted when the tour trigger button is clicked */
  startTour: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">
        <UIcon name="i-heroicons-document-text" class="title-icon" />
        ICJIA Markdown Editor 2.0
      </h1>
      
      <nav class="header-actions" aria-label="Application controls">
        <!-- Tour trigger button - polished gradient button -->
        <button
          type="button"
          class="tour-button"
          aria-label="Start guided tour"
          @click="$emit('startTour')"
        >
          <UIcon name="i-heroicons-academic-cap" class="tour-icon" />
          <span>Tour</span>
        </button>
        
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
  gap: 0.75rem;
}

/* Tour button - polished gradient button */
.tour-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #2563eb 100%);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 1px 3px rgba(59, 130, 246, 0.3),
    0 4px 6px -2px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.tour-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1d4ed8 100%);
  box-shadow: 
    0 2px 8px rgba(59, 130, 246, 0.4),
    0 6px 12px -2px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.tour-button:active {
  transform: translateY(0);
  box-shadow: 
    0 1px 2px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.tour-button:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

.tour-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

/* Dark mode adjustments */
.dark .tour-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #3b82f6 100%);
  box-shadow: 
    0 1px 3px rgba(59, 130, 246, 0.4),
    0 4px 8px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.dark .tour-button:hover {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #60a5fa 100%);
}
</style>
