<script setup lang="ts">
/**
 * Application Header Component
 * Contains app title, auto-save status, view mode toggle, tour trigger, and color mode toggle
 * Uses semantic <header> landmark for accessibility
 */

const { cycleViewMode, viewModeIcon, viewModeLabel } = useViewMode()
const { showSaveIndicator, countdownToSave } = useAutoSave()
const { openModal: openConversionTools } = useConversionToolsModal()
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">
        <UIcon name="i-heroicons-document-text" class="title-icon" />
        ICJIA Markdown Editor 2.0
      </h1>
      
      <nav class="header-actions" aria-label="Application controls">
        <!-- Auto-save status with countdown -->
        <UTooltip
          text="Your work is automatically saved to browser local storage"
          :content="{ side: 'bottom', sideOffset: 8, avoidCollisions: true }"
        >
          <div 
            class="autosave-status" 
            role="status" 
            aria-label="Auto Save is always enabled. Your work is saved to browser storage automatically."
            data-tour="auto-save"
          >
            <Transition name="fade" mode="out-in">
              <span v-if="showSaveIndicator" key="saved" class="autosave-saved" aria-live="polite">
                <UIcon name="i-heroicons-check-circle" class="autosave-icon" />
                Saved!
              </span>
              <span v-else key="countdown" class="autosave-label">
                <UIcon name="i-heroicons-arrow-path" class="autosave-icon" />
                <span class="autosave-text">Next save: {{ countdownToSave }}s</span>
              </span>
            </Transition>
          </div>
        </UTooltip>
        
        <!-- View mode toggle - polished gradient button (purple) -->
        <UTooltip
          text="Click to cycle: Split → Editor → Preview"
          :content="{ side: 'bottom', sideOffset: 8, avoidCollisions: true }"
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
        
        <!-- Conversion Tools dropdown button -->
        <UTooltip
          text="PDF, image, and document conversion tools"
          :content="{ side: 'bottom', sideOffset: 8, avoidCollisions: true }"
        >
          <button
            type="button"
            class="conversion-tools-button"
            aria-label="Open conversion tools menu"
            aria-haspopup="dialog"
            data-tour="conversion-tools"
            @click="openConversionTools"
          >
            <UIcon name="i-heroicons-wrench-screwdriver" class="conversion-tools-icon" />
            <span>Tools</span>
            <UIcon name="i-heroicons-chevron-down" class="conversion-tools-chevron" />
          </button>
        </UTooltip>
        
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
  height: 3.5rem; /* Fixed height to prevent layout shift */
  min-height: 3.5rem;
  max-height: 3.5rem;
  display: flex;
  align-items: center;
  overflow: visible; /* Allow tooltips to overflow */
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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

/* View mode button - polished gradient button (purple/violet) */
.view-mode-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #7c3aed 100%);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 
    0 1px 2px rgba(139, 92, 246, 0.3),
    0 2px 4px -1px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.view-mode-button:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #6d28d9 100%);
  transform: translateY(-1px);
  box-shadow: 
    0 2px 8px rgba(139, 92, 246, 0.4),
    0 4px 12px -2px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.view-mode-button:active {
  transform: translateY(0);
}

.view-mode-button:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

.view-mode-icon {
  width: 0.75rem;
  height: 0.75rem;
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

/* Conversion Tools button - polished gradient button (teal/cyan) */
.conversion-tools-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 
    0 1px 2px rgba(20, 184, 166, 0.3),
    0 2px 4px -1px rgba(20, 184, 166, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.conversion-tools-button:hover {
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%);
  transform: translateY(-1px);
  box-shadow: 
    0 2px 8px rgba(20, 184, 166, 0.4),
    0 4px 12px -2px rgba(20, 184, 166, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.conversion-tools-button:active {
  transform: translateY(0);
}

.conversion-tools-button:focus-visible {
  outline: 2px solid #2dd4bf;
  outline-offset: 2px;
}

.conversion-tools-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.conversion-tools-chevron {
  width: 0.625rem;
  height: 0.625rem;
  flex-shrink: 0;
  opacity: 0.8;
}

/* Dark mode adjustments for conversion tools button */
.dark .conversion-tools-button {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #14b8a6 100%);
  box-shadow: 
    0 1px 3px rgba(20, 184, 166, 0.4),
    0 4px 8px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.dark .conversion-tools-button:hover {
  background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 50%, #2dd4bf 100%);
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

/* Mobile responsive styles */
@media (max-width: 640px) {
  .app-header {
    padding: 0.5rem 0.75rem;
    height: 3rem;
    min-height: 3rem;
    max-height: 3rem;
  }
  
  .app-title {
    font-size: 0.875rem;
  }
  
  .title-icon {
    width: 1rem;
    height: 1rem;
  }
  
  .header-actions {
    gap: 0.375rem;
  }
  
  .autosave-text {
    display: none;
  }
  
  .autosave-label,
  .autosave-saved {
    font-size: 0.625rem;
  }
  
  .view-mode-button span,
  .conversion-tools-button span {
    display: none;
  }
  
  .conversion-tools-chevron {
    display: none;
  }
  
  .view-mode-button,
  .conversion-tools-button {
    padding: 0.375rem;
  }
}

/* Very small screens */
@media (max-width: 400px) {
  .app-title {
    font-size: 0.75rem;
  }
  
  .autosave-status {
    display: none;
  }
}
</style>
