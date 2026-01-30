<script setup lang="ts">
/**
 * Tour Welcome Component
 * @description Displays an intro modal asking first-time users if they want to take the guided tour.
 * WCAG 2.1 AA compliant with focus trap and screen reader support.
 * 
 * @module modules/tour/components/TourWelcome
 */

const props = defineProps<{
  /** Whether the welcome modal is visible */
  isVisible: boolean
}>()

const emit = defineEmits<{
  /** Emitted when user chooses to start the tour */
  startTour: []
  /** Emitted when user chooses to skip the tour */
  skipTour: []
}>()

// Reference to the dialog for focus management
const dialogRef = ref<HTMLElement | null>(null)

// Focus the dialog when it becomes visible
watch(() => props.isVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      dialogRef.value?.focus()
    })
  }
})

// Handle keyboard events
function handleKeydown(event: KeyboardEvent) {
  if (!props.isVisible) return
  
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('skipTour')
  }
}

// Global keyboard listener for Escape
watch(() => props.isVisible, (visible) => {
  if (import.meta.client) {
    if (visible) {
      window.addEventListener('keydown', handleKeydown)
    } else {
      window.removeEventListener('keydown', handleKeydown)
    }
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="welcome-fade">
      <div 
        v-if="isVisible"
        class="welcome-overlay"
      >
        <!-- Backdrop -->
        <div class="welcome-backdrop" aria-hidden="true" />
        
        <!-- Dialog -->
        <div
          ref="dialogRef"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          aria-describedby="welcome-description"
          tabindex="-1"
          class="welcome-dialog"
        >
          <UCard
            class="welcome-card"
            :ui="{
              root: 'w-96 max-w-[90vw] bg-white dark:bg-gray-900',
              header: 'pb-3',
              body: 'pt-0 pb-4',
              footer: 'pt-4'
            }"
          >
            <template #header>
              <div class="welcome-header">
                <div class="welcome-icon-wrapper">
                  <UIcon 
                    name="i-heroicons-academic-cap" 
                    class="welcome-icon"
                    aria-hidden="true"
                  />
                </div>
                <h2 id="welcome-title" class="welcome-title">
                  Welcome to ICJIA Markdown Editor!
                </h2>
              </div>
            </template>
            
            <div id="welcome-description" class="welcome-content">
              <p class="welcome-text">
                This appears to be your first time here. Would you like a quick guided tour 
                to learn about the editor's features?
              </p>
              <p class="welcome-subtext">
                The tour takes about 2 minutes and covers all the main features including 
                text formatting, keyboard shortcuts, and how your work is automatically saved.
              </p>
            </div>
            
            <template #footer>
              <div class="welcome-footer">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="md"
                  @click="emit('skipTour')"
                >
                  No thanks, I'll explore on my own
                </UButton>
                
                <UButton
                  color="primary"
                  size="md"
                  icon="i-heroicons-play"
                  @click="emit('startTour')"
                >
                  Start Tour
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.welcome-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.welcome-dialog {
  position: relative;
  z-index: 2;
  outline: none;
}

.welcome-card {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  background: var(--ui-bg, #ffffff) !important;
}

/* Ensure solid background in dark mode */
.dark .welcome-card,
:root.dark .welcome-card {
  background: var(--ui-bg, #1e293b) !important;
}

.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.welcome-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ui-primary) 0%, var(--ui-primary-600, #2563eb) 100%);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.welcome-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: white;
}

.welcome-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ui-text);
  margin: 0;
  line-height: 1.3;
}

.welcome-content {
  text-align: center;
}

.welcome-text {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--ui-text-muted);
  margin: 0 0 0.75rem;
}

.welcome-subtext {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ui-text-dimmed);
  margin: 0;
}

.welcome-footer {
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
}

@media (min-width: 480px) {
  .welcome-footer {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

/* Transition animations */
.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: opacity 0.25s ease;
}

.welcome-fade-enter-from,
.welcome-fade-leave-to {
  opacity: 0;
}

.welcome-fade-enter-active .welcome-dialog {
  animation: welcome-scale 0.25s ease-out;
}

@keyframes welcome-scale {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .welcome-fade-enter-active,
  .welcome-fade-leave-active {
    transition: none;
  }
  
  .welcome-fade-enter-active .welcome-dialog {
    animation: none;
  }
}
</style>
