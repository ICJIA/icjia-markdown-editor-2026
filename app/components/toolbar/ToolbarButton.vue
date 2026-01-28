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

// Split shortcut into array for Nuxt UI kbds prop
const keyboardShortcuts = computed(() => {
  if (!props.shortcut) return []
  return props.shortcut.split('+').map(key => {
    if (key === 'Mod') return 'meta'
    return key
  })
})

function handleClick() {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<template>
  <UTooltip
    :text="label"
    :kbds="keyboardShortcuts"
    :content="{ side: 'top', sideOffset: 8 }"
  >
    <UButton
      :icon="icon"
      :aria-label="label"
      :disabled="disabled"
      :class="[
        'toolbar-button',
        { 'toolbar-button-active': active }
      ]"
      variant="soft"
      color="neutral"
      size="sm"
      square
      @click="handleClick"
    />
  </UTooltip>
</template>

<style scoped>
/* Scoped styles removed in favor of global .toolbar-button styles in main.css */
</style>
