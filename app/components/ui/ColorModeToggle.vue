<script setup lang="ts">
/**
 * Color Mode Toggle - Dark/Light mode switch
 * Respects prefers-color-scheme on first visit
 * Persists preference to localStorage via Nuxt color mode
 */

const colorMode = useColorMode()
const { announce } = useAccessibility()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})

function toggleColorMode() {
  isDark.value = !isDark.value
  const mode = isDark.value ? 'dark' : 'light'
  announce(`Switched to ${mode} mode`)
}

// Icon based on current mode
const icon = computed(() => isDark.value ? 'i-heroicons-moon' : 'i-heroicons-sun')
// aria-label must include visible text per WCAG 2.5.3 "Label in Name"
const label = computed(() => isDark.value ? 'Dark mode active. Click to switch to light mode.' : 'Light mode active. Click to switch to dark mode.')
</script>

<template>
  <UTooltip
    :text="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :content="{ side: 'bottom', sideOffset: 8, avoidCollisions: true }"
  >
    <button
      type="button"
      class="color-mode-button"
      :aria-label="label"
      data-tour="color-mode"
      @click="toggleColorMode"
    >
      <UIcon :name="icon" class="mode-icon" />
      <span class="mode-label">{{ isDark ? 'Dark' : 'Light' }}</span>
    </button>
  </UTooltip>
</template>

<style scoped>
/* Color mode button - polished gradient button (slate/gray tones) */
.color-mode-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #64748b 0%, #475569 50%, #64748b 100%);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 
    0 1px 2px rgba(100, 116, 139, 0.3),
    0 2px 4px -1px rgba(100, 116, 139, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.color-mode-button:hover {
  background: linear-gradient(135deg, #475569 0%, #334155 50%, #475569 100%);
  transform: translateY(-1px);
  box-shadow: 
    0 2px 8px rgba(100, 116, 139, 0.4),
    0 4px 12px -2px rgba(100, 116, 139, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.color-mode-button:active {
  transform: translateY(0);
}

.color-mode-button:focus-visible {
  outline: 2px solid #94a3b8;
  outline-offset: 2px;
}

.mode-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.mode-label {
  min-width: 2rem;
  text-align: left;
}

/* Dark mode - white text on slate gradient for WCAG AA 4.5:1+ contrast */
.dark .color-mode-button {
  background: linear-gradient(135deg, #64748b 0%, #475569 50%, #64748b 100%);
  color: #ffffff;
  box-shadow:
    0 1px 3px rgba(148, 163, 184, 0.3),
    0 4px 8px -2px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.dark .color-mode-button:hover {
  background: linear-gradient(135deg, #475569 0%, #334155 50%, #475569 100%);
}
</style>
