<script setup lang="ts">
/**
 * Application Header Component
 * Contains app title, auto-save status, view mode toggle, tour trigger, and color mode toggle
 * Uses semantic <header> landmark for accessibility
 */

const { cycleViewMode, viewModeIcon, viewModeLabel } = useViewMode()
const { showSaveIndicator, countdownToSave } = useAutoSave()

/** Dynamic tooltip text showing countdown and storage info */
const autosaveTooltip = computed(() => {
  if (showSaveIndicator.value) {
    return 'Just saved to browser local storage!'
  }
  return `Next save in ${countdownToSave.value}s · Saved to browser local storage`
})

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
        <!-- Auto-save status - informational text with tooltip, NOT a button -->
        <UTooltip
          :text="autosaveTooltip"
          :content="{ side: 'bottom', sideOffset: 8 }"
        >
          <div 
            class="autosave-status" 
            role="status" 
            aria-label="Auto Save is always enabled. Your work is saved to browser storage automatically."
            data-tour="auto-save"
          >
            <Transition name="fade">
              <span v-if="showSaveIndicator" class="autosave-saved" aria-live="polite">
                <UIcon name="i-heroicons-check-circle" class="autosave-icon" />
                Saved!
              </span>
            </Transition>
            <span v-if="!showSaveIndicator" class="autosave-label">
              <UIcon name="i-heroicons-arrow-path" class="autosave-icon" />
              Auto Save
            </span>
          </div>
        </UTooltip>
        
        <!-- View mode toggle - polished gradient button (purple) -->
        <UTooltip
          text="Click to cycle: Split → Editor → Preview"
          :content="{ side: 'bottom', sideOffset: 8 }"
        >
          <button
            type="button"
            class="view-mode-button"
            :aria-label="`View mode: ${viewModeLabel}. Click to cycle between split, editor-only, and preview-only views.`"
            data-tour="view-mode"
            @click="cycleViewMode"
          >
            <UIcon :name="viewModeIcon" class="view-mode-icon" />
            <span>{{ viewModeLabel }}</span>
          </button>
        </UTooltip>
        
        <!-- Tour trigger button - polished gradient button (blue) -->
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

/* View mode button - polished gradient button (purple/violet) */
.view-mode-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #7c3aed 100%);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 1px 3px rgba(139, 92, 246, 0.3),
    0 4px 6px -2px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.view-mode-button:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #6d28d9 100%);
  box-shadow: 
    0 2px 8px rgba(139, 92, 246, 0.4),
    0 6px 12px -2px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.view-mode-button:active {
  transform: translateY(0);
  box-shadow: 
    0 1px 2px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.view-mode-button:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

.view-mode-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

/* Dark mode adjustments for view mode button */
.dark .view-mode-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #8b5cf6 100%);
  box-shadow: 
    0 1px 3px rgba(139, 92, 246, 0.4),
    0 4px 8px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.dark .view-mode-button:hover {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #a78bfa 100%);
}

/* Auto-save status - plain text indicator, NOT a button */
.autosave-status {
  display: flex;
  align-items: center;
  cursor: help; /* Indicate tooltip is available */
  user-select: none;
}

.autosave-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: #94a3b8; /* slate-400 - muted */
  white-space: nowrap;
  cursor: default;
}

.autosave-icon {
  width: 0.875rem;
  height: 0.875rem;
  opacity: 0.7;
}

.autosave-saved {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4ade80; /* green-400 */
  white-space: nowrap;
}

.autosave-saved .autosave-icon {
  opacity: 1;
  color: #4ade80;
}

/* Light mode */
:root:not(.dark) .autosave-label,
.light .autosave-label {
  color: #64748b; /* slate-500 */
}

:root:not(.dark) .autosave-saved,
.light .autosave-saved {
  color: #16a34a; /* green-600 */
}

:root:not(.dark) .autosave-saved .autosave-icon,
.light .autosave-saved .autosave-icon {
  color: #16a34a;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
