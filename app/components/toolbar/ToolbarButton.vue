<script setup lang="ts">
/**
 * Toolbar Button Component
 * Accessible button with tooltip showing keyboard shortcut
 */

interface Props {
  icon: string
  label: string
  shortcut?: string
  disabled?: boolean
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  active: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

// Format tooltip text with shortcut
const tooltipText = computed(() => {
  if (props.shortcut) {
    // Convert Mod to platform-specific key
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
    const shortcut = props.shortcut
      .replace('Mod', isMac ? '⌘' : 'Ctrl')
      .replace('Shift', isMac ? '⇧' : 'Shift')
      .replace('Alt', isMac ? '⌥' : 'Alt')
    return `${props.label} (${shortcut})`
  }
  return props.label
})

function handleClick() {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<template>
  <UTooltip :text="tooltipText" :delay-duration="300">
    <UButton
      :icon="icon"
      :aria-label="label"
      :disabled="disabled"
      :class="{ 'toolbar-button-active': active }"
      variant="ghost"
      color="neutral"
      size="xs"
      square
      @click="handleClick"
    />
  </UTooltip>
</template>

<style scoped>
.toolbar-button-active {
  background: var(--color-primary, #3b82f6) !important;
  color: white !important;
}
</style>
