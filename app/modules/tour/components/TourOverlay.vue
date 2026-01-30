<script setup lang="ts">
/**
 * Tour Overlay Component
 * @description Displays the tour step dialog positioned relative to target elements.
 * Uses manual positioning for reliable placement across all viewport sizes.
 * WCAG 2.1 AA compliant with focus management and screen reader support.
 * 
 * @module modules/tour/components/TourOverlay
 */

import type { TourStep, TourProgress } from '../types'

const props = defineProps<{
  /** Whether the tour is currently active */
  isActive: boolean
  /** Current step data */
  currentStep: TourStep | null
  /** Progress information */
  progress: TourProgress
}>()

const emit = defineEmits<{
  /** Emitted when user clicks Next or presses ArrowRight */
  next: []
  /** Emitted when user clicks Back or presses ArrowLeft */
  previous: []
  /** Emitted when user clicks Skip or presses Escape */
  cancel: []
}>()

// Reference to the dialog for focus management
const dialogRef = ref<HTMLElement | null>(null)

// Computed target element based on current step
const targetElement = computed(() => {
  if (!props.currentStep?.target || !import.meta.client) return null
  return document.querySelector(props.currentStep.target) as HTMLElement | null
})

// Calculate dialog position based on target element and preferred position
// Position dialog close to the target element with minimal gap
const dialogStyle = computed(() => {
  if (!targetElement.value || !import.meta.client) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
  
  const rect = targetElement.value.getBoundingClientRect()
  const position = props.currentStep?.position ?? 'bottom'
  const dialogWidth = 384 // w-96 = 24rem = 384px
  const dialogHeight = 280 // Fixed height for consistent button position
  const gap = 8 // Reduced from 16px to keep dialog closer to target
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  let top = 0
  let left = 0
  
  // Calculate position based on preference - keep dialog adjacent to target
  switch (position) {
    case 'bottom':
      top = rect.bottom + gap
      left = rect.left + (rect.width / 2) - (dialogWidth / 2)
      break
    case 'top':
      top = rect.top - dialogHeight - gap
      left = rect.left + (rect.width / 2) - (dialogWidth / 2)
      break
    case 'left':
      top = rect.top + (rect.height / 2) - (dialogHeight / 2)
      left = rect.left - dialogWidth - gap
      break
    case 'right':
      top = rect.top + (rect.height / 2) - (dialogHeight / 2)
      left = rect.right + gap
      break
  }
  
  // Clamp to viewport bounds with small margin
  left = Math.max(8, Math.min(left, viewportWidth - dialogWidth - 8))
  top = Math.max(8, Math.min(top, viewportHeight - dialogHeight - 8))
  
  // If dialog would be off-screen, center it
  if (top < 0 || top > viewportHeight - 100) {
    top = viewportHeight / 2 - dialogHeight / 2
  }
  
  return {
    top: `${top}px`,
    left: `${left}px`
  }
})

// Global keyboard navigation handler
function handleGlobalKeydown(event: KeyboardEvent) {
  if (!props.isActive) return
  
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      emit('cancel')
      break
    case 'ArrowRight':
      event.preventDefault()
      emit('next')
      break
    case 'ArrowLeft':
      event.preventDefault()
      emit('previous')
      break
  }
}

// Set up global keyboard listener when tour is active (client-side only)
watch(() => props.isActive, (active) => {
  if (import.meta.client) {
    if (active) {
      window.addEventListener('keydown', handleGlobalKeydown)
    } else {
      window.removeEventListener('keydown', handleGlobalKeydown)
    }
  }
})

// Clean up on unmount
onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleGlobalKeydown)
  }
})

// Focus the dialog when step changes
watch(() => props.currentStep?.id, () => {
  if (props.isActive) {
    nextTick(() => {
      dialogRef.value?.focus()
    })
  }
})

// Check if on first/last step
const isFirstStep = computed(() => props.progress.current === 1)
const isLastStep = computed(() => props.progress.current === props.progress.total)
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div 
        v-if="isActive && currentStep"
        class="tour-overlay"
      >
        <!-- Semi-transparent backdrop - clicking closes the tour -->
        <div 
          class="tour-backdrop" 
          aria-hidden="true"
          @click="emit('cancel')"
        />
        
        <!-- Dialog positioned relative to target -->
        <div
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`tour-title-${currentStep.id}`"
          :aria-describedby="`tour-content-${currentStep.id}`"
          tabindex="-1"
          class="tour-dialog"
          :style="dialogStyle"
        >
            <UCard
            class="tour-card"
            :ui="{
              root: 'w-96 max-w-[90vw] bg-white dark:bg-gray-900',
              header: 'pb-2',
              body: 'pt-2 pb-3',
              footer: 'pt-3'
            }"
          >
            <template #header>
              <div class="tour-header">
                <div class="tour-title-row">
                  <UIcon 
                    v-if="currentStep.icon" 
                    :name="currentStep.icon" 
                    class="tour-icon"
                    aria-hidden="true"
                  />
                  <h2 
                    :id="`tour-title-${currentStep.id}`"
                    class="tour-title"
                  >
                    {{ currentStep.title }}
                  </h2>
                </div>
                <UBadge color="neutral" variant="subtle" size="xs">
                  {{ progress.current }} / {{ progress.total }}
                </UBadge>
              </div>
            </template>
            
            <div :id="`tour-content-${currentStep.id}`" class="tour-body">
              <p class="tour-content">
                {{ currentStep.content }}
              </p>
              
              <p v-if="currentStep.tip" class="tour-tip">
                {{ currentStep.tip }}
              </p>
              
              <div v-if="currentStep.shortcut?.length" class="tour-shortcut">
                <span class="tour-shortcut-label">Shortcut:</span>
                <span class="tour-shortcut-keys">
                  <UKbd v-for="key in currentStep.shortcut" :key="key" size="sm">
                    {{ key }}
                  </UKbd>
                </span>
              </div>
            </div>
            
            <template #footer>
              <div class="tour-footer">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click="emit('cancel')"
                >
                  Skip tour
                </UButton>
                
                <div class="tour-nav-buttons">
                  <UButton
                    v-if="!isFirstStep"
                    variant="soft"
                    color="neutral"
                    size="sm"
                    icon="i-heroicons-arrow-left"
                    @click="emit('previous')"
                  >
                    Back
                  </UButton>
                  <UButton
                    color="primary"
                    size="sm"
                    :icon="isLastStep ? 'i-heroicons-check' : 'i-heroicons-arrow-right'"
                    icon-trailing
                    @click="emit('next')"
                  >
                    {{ isLastStep ? 'Finish' : 'Next' }}
                  </UButton>
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
}

.tour-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
  cursor: pointer;
}

.tour-dialog {
  position: fixed;
  z-index: 2;
  outline: none;
}

.tour-card {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  background: var(--ui-bg, #ffffff) !important;
  /* Fixed size so Next button stays in same position */
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

/* Ensure solid background in dark mode */
.dark .tour-card,
:root.dark .tour-card {
  background: var(--ui-bg, #1e293b) !important;
}

.tour-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tour-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tour-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--ui-primary);
  flex-shrink: 0;
}

.tour-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-text);
  margin: 0;
  line-height: 1.3;
}

/* Fixed height body area so footer stays in same position */
.tour-body {
  min-height: 120px;
  max-height: 160px;
  overflow-y: auto;
}

.tour-content {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ui-text-muted);
  margin: 0;
  /* Fixed content height so dialog size is consistent */
  min-height: 3.5rem;
}

.tour-tip {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--ui-text-dimmed);
  margin: 0.75rem 0 0;
  padding: 0.5rem;
  background: var(--ui-bg-elevated);
  border-radius: 0.375rem;
  border-left: 3px solid var(--ui-primary);
}

.tour-shortcut {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
}

.tour-shortcut-label {
  flex-shrink: 0;
}

.tour-shortcut-keys {
  display: flex;
  gap: 0.25rem;
}

.tour-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tour-nav-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Transition animations */
.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .tour-dialog {
    left: 1rem !important;
    right: 1rem;
    width: auto;
  }
  
  .tour-card {
    max-width: 100%;
  }
  
  .tour-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .tour-footer > button:first-child {
    order: 2;
  }
  
  .tour-nav-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .tour-fade-enter-active,
  .tour-fade-leave-active {
    transition: none;
  }
}
</style>
