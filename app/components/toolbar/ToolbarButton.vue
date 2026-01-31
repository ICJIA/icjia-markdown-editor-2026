<script setup lang="ts">
/**
 * Toolbar Button Component
 * Accessible button with responsive tooltip showing keyboard shortcuts for Mac and Windows
 * WCAG 2.1 AA: focus-visible, aria-label, role
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

// Detect if the user is on macOS
const isMac = computed(() => {
  if (import.meta.server) return true // Default to Mac for SSR
  return navigator.platform?.toLowerCase().includes('mac') || 
         navigator.userAgent?.toLowerCase().includes('mac')
})

// Parse shortcut string into Mac and Windows versions
const shortcuts = computed(() => {
  if (!props.shortcut) return { mac: [], win: [] }
  
  const parts = props.shortcut.split('+')
  const macParts: string[] = []
  const winParts: string[] = []
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed === 'Mod') {
      macParts.push('⌘')
      winParts.push('Ctrl')
    } else if (trimmed === 'Shift') {
      macParts.push('⇧')
      winParts.push('Shift')
    } else if (trimmed === 'Alt') {
      macParts.push('⌥')
      winParts.push('Alt')
    } else if (trimmed === 'Ctrl') {
      macParts.push('⌃')
      winParts.push('Ctrl')
    } else {
      // Regular key - capitalize it
      const key = trimmed.length === 1 ? trimmed.toUpperCase() : trimmed
      macParts.push(key)
      winParts.push(key)
    }
  }
  
  return { mac: macParts, win: winParts }
})

// Keyboard shortcuts array for the current platform (for aria-keyshortcuts)
const currentPlatformShortcut = computed(() => {
  if (!props.shortcut) return ''
  const parts = isMac.value ? shortcuts.value.mac : shortcuts.value.win
  return parts.join('+')
})

// Format shortcut for display (both platforms)
const shortcutDisplayMac = computed(() => shortcuts.value.mac.join(' '))
const shortcutDisplayWin = computed(() => shortcuts.value.win.join(' + '))

function handleClick() {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<template>
  <UPopover
    :content="{ 
      side: 'bottom', 
      sideOffset: 8, 
      align: 'center',
      avoidCollisions: true,
      collisionPadding: 12
    }"
    :open-delay="300"
    :close-delay="0"
    mode="hover"
    :arrow="true"
  >
    <UButton
      :icon="icon"
      :aria-label="shortcut ? `${label} (${currentPlatformShortcut})` : label"
      :aria-keyshortcuts="currentPlatformShortcut || undefined"
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
    
    <template #content>
      <div class="toolbar-tooltip" role="tooltip">
        <span class="tooltip-label">{{ label }}</span>
        
        <div v-if="shortcut" class="tooltip-shortcuts">
          <!-- Mac shortcut -->
          <div class="shortcut-row">
            <span class="shortcut-platform">Mac</span>
            <div class="shortcut-keys">
              <kbd 
                v-for="(key, index) in shortcuts.mac" 
                :key="`mac-${index}`"
                class="shortcut-key shortcut-key--mac"
              >{{ key }}</kbd>
            </div>
          </div>
          
          <!-- Windows shortcut -->
          <div class="shortcut-row">
            <span class="shortcut-platform">Win</span>
            <div class="shortcut-keys">
              <kbd 
                v-for="(key, index) in shortcuts.win" 
                :key="`win-${index}`"
                class="shortcut-key shortcut-key--win"
              >{{ key }}</kbd>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
/* Tooltip container */
.toolbar-tooltip {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  min-width: 120px;
  max-width: 220px;
}

/* Tooltip label */
.tooltip-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #f8fafc;
  text-align: center;
}

/* Shortcuts container */
.tooltip-shortcuts {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-top: 0.375rem;
  border-top: 1px solid #334155;
}

/* Shortcut row (platform + keys) */
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

/* Platform label */
.shortcut-platform {
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  min-width: 2rem;
}

/* Keys container */
.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Individual key */
.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.375rem;
  padding: 0 0.375rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: 0.25rem;
  background: #1e293b;
  border: 1px solid #475569;
  color: #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Mac-style keys - slightly larger symbols */
.shortcut-key--mac {
  font-size: 0.75rem;
}

/* Light mode adjustments */
.light .tooltip-label {
  color: #f8fafc;
}

.light .tooltip-shortcuts {
  border-top-color: #475569;
}

.light .shortcut-platform {
  color: #94a3b8;
}

.light .shortcut-key {
  background: #334155;
  border-color: #475569;
  color: #f1f5f9;
}

/* Responsive: on very small viewports, stack more compactly */
@media (max-width: 360px) {
  .toolbar-tooltip {
    min-width: 100px;
    max-width: 180px;
    padding: 0.375rem 0.5rem;
  }
  
  .tooltip-label {
    font-size: 0.75rem;
  }
  
  .shortcut-key {
    min-width: 1.25rem;
    height: 1.25rem;
    font-size: 0.625rem;
    padding: 0 0.25rem;
  }
  
  .shortcut-platform {
    font-size: 0.5625rem;
  }
}
</style>

<style>
/* Global tooltip styling for UPopover content - ensures solid background */
[data-radix-popper-content-wrapper] .toolbar-tooltip {
  background-color: #0f172a !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
  border: 1px solid #334155 !important;
}

.light [data-radix-popper-content-wrapper] .toolbar-tooltip {
  background-color: #1e293b !important;
  border-color: #475569 !important;
}
</style>
