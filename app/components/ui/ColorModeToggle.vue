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
const label = computed(() => isDark.value ? 'Switch to light mode' : 'Switch to dark mode')
</script>

<template>
  <UButton
    :icon="icon"
    :aria-label="label"
    variant="ghost"
    color="neutral"
    size="md"
    @click="toggleColorMode"
  />
</template>
