<script setup lang="ts">
/**
 * Application Header Component
 * Contains app title, auto-save status, view mode toggle, tour trigger, and color mode toggle
 * Uses semantic <header> landmark for accessibility
 */

const { cycleViewMode, viewModeIcon, viewModeLabel } = useViewMode()
const { showSaveIndicator, countdownToSave } = useAutoSave()
const { openModal: openConversionTools } = useConversionToolsModal()
const { copyStatusMessage } = useExport()

// Handle opening conversion tools modal and closing tooltip
function handleOpenConversionTools(event: Event) {
  // Blur the button to close the tooltip
  const target = event.currentTarget as HTMLButtonElement
  target.blur()
  
  // Open the modal
  openConversionTools()
}

// Scroll the editor and preview panes to the top
function scrollToTop() {
  // Scroll the editor pane
  const editorScroller = document.getElementById('main-editor-scroller')
  if (editorScroller) {
    editorScroller.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Scroll the preview pane
  const previewPane = document.querySelector('.preview-pane')
  if (previewPane) {
    previewPane.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">
        <a 
          href="#" 
          class="title-link"
          @click.prevent="scrollToTop"
          aria-label="ICJIA Markdown Editor 2.0 - Click to scroll to top"
        >
          <!-- Decorative (alt=""): the link text names the destination, and axe counts
               a non-empty alt as visible text that must appear in the accessible name -->
          <img
            src="/images/icjia-logo.png"
            alt=""
            width="48"
            height="48"
            class="title-logo"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <span>ICJIA Markdown Editor 2.0</span>
        </a>
      </h1>
      
      <!-- Copy Status Message - Centered in header -->
      <Transition name="copy-status">
        <span 
          v-if="copyStatusMessage" 
          class="copy-status-message"
          role="status"
          aria-live="polite"
        >
          {{ copyStatusMessage }}
        </span>
      </Transition>
      
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
            <span class="button-label">{{ viewModeLabel }}</span>
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
            aria-label="Tools — open conversion tools menu"
            aria-haspopup="dialog"
            data-tour="conversion-tools"
            @click="handleOpenConversionTools"
          >
            <UIcon name="i-heroicons-wrench-screwdriver" class="conversion-tools-icon" />
            <span class="button-label">Tools</span>
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
  position: relative;
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
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #f1f5f9);
  margin: 0;
}

.title-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.title-link:hover {
  opacity: 0.85;
}

.title-link:focus-visible {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 4px;
  border-radius: 4px;
}

.title-logo {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Copy Status Message - high contrast purple, centered in viewport */
.copy-status-message {
  position: fixed;
  top: 0.625rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  /* White text on purple bg: 12.6:1 contrast ratio - exceeds WCAG AAA */
  color: #ffffff;
  background: rgba(88, 28, 135, 0.95);
  border: 1px solid rgba(168, 85, 247, 0.6);
  border-radius: 0.5rem;
  text-shadow: 0 0 8px rgba(168, 85, 247, 0.5);
  animation: copy-pulse 0.4s ease-out;
  z-index: 100;
  white-space: nowrap;
}

/* Light mode - dark purple text on light purple bg */
:root:not(.dark) .copy-status-message,
.light .copy-status-message {
  /* Dark purple #581c87 on light purple #f3e8ff: 8.9:1 contrast ratio - exceeds WCAG AAA */
  color: #581c87;
  background: rgba(243, 232, 255, 0.98);
  border-color: rgba(147, 51, 234, 0.5);
  text-shadow: none;
  font-weight: 700;
}

/* Pulse animation for attention */
@keyframes copy-pulse {
  0% {
    transform: translateX(-50%) scale(1.08);
    opacity: 0.7;
  }
  50% {
    transform: translateX(-50%) scale(1.02);
  }
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}

/* Transition for entering/leaving */
.copy-status-enter-active {
  transition: opacity 0.25s ease-out, transform 0.25s ease-out;
}

.copy-status-leave-active {
  transition: opacity 0.25s ease-in, transform 0.25s ease-in;
}

.copy-status-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}

.copy-status-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.9);
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
  color: #cbd5e1; /* slate-300 - WCAG AAA 7:1+ on #1e293b */
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
  color: #ffffff;
  background: linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%);
  box-shadow: 
    0 1px 3px rgba(20, 184, 166, 0.4),
    0 4px 8px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.dark .conversion-tools-button:hover {
  background: linear-gradient(135deg, #14b8a6 0%, #0f766e 50%, #115e59 100%);
}

/* Light mode adjustments for conversion tools button - ensure AA contrast */
:root:not(.dark) .conversion-tools-button,
.light .conversion-tools-button {
  color: #0f172a;
  background: linear-gradient(135deg, #5eead4 0%, #2dd4bf 50%, #14b8a6 100%);
  box-shadow: 
    0 1px 2px rgba(20, 184, 166, 0.2),
    0 2px 4px -1px rgba(20, 184, 166, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

:root:not(.dark) .conversion-tools-button:hover,
.light .conversion-tools-button:hover {
  background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%);
  box-shadow: 
    0 2px 8px rgba(20, 184, 166, 0.3),
    0 4px 12px -2px rgba(20, 184, 166, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
  
  /* Hide only the text labels — UIcon renders as a <span class="iconify"> too,
     so a bare `span` selector would hide the icons and collapse the buttons
     to empty 12px targets (WCAG 2.5.8 target-size failure) */
  .view-mode-button .button-label,
  .conversion-tools-button .button-label {
    display: none;
  }

  .conversion-tools-chevron {
    display: none;
  }

  .view-mode-button,
  .conversion-tools-button {
    justify-content: center;
    min-width: 2rem;
    min-height: 2rem;
    padding: 0.375rem;
  }

  .view-mode-icon,
  .conversion-tools-icon {
    width: 1rem;
    height: 1rem;
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
