<script setup lang="ts">
/**
 * Tour Trigger Component
 * @description Reusable button to manually start or restart the tour.
 * Uses Nuxt UI components for consistent styling.
 * 
 * @module modules/tour/components/TourTrigger
 */

withDefaults(defineProps<{
  /** Button label text */
  label?: string
  /** Button icon (iconify format) */
  icon?: string
  /** Button variant */
  variant?: 'solid' | 'soft' | 'ghost' | 'outline' | 'link'
  /** Button color */
  color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error'
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show only the icon (no label) */
  iconOnly?: boolean
  /** Tooltip text */
  tooltip?: string
}>(), {
  label: 'Take a tour',
  icon: 'i-heroicons-question-mark-circle',
  variant: 'ghost',
  color: 'neutral',
  size: 'sm',
  iconOnly: false,
  tooltip: 'Start the guided tour'
})

const emit = defineEmits<{
  /** Emitted when the trigger button is clicked */
  click: []
}>()
</script>

<template>
  <UTooltip 
    :text="tooltip"
    :content="{ side: 'bottom', sideOffset: 8 }"
  >
    <UButton
      :icon="icon"
      :variant="variant"
      :color="color"
      :size="size"
      :aria-label="iconOnly ? label : undefined"
      :square="iconOnly"
      @click="emit('click')"
    >
      <template v-if="!iconOnly">
        {{ label }}
      </template>
    </UButton>
  </UTooltip>
</template>
