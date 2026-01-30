/**
 * View Mode Composable
 * Manages the editor/preview pane visibility state
 */

export type ViewMode = 'split' | 'editor' | 'preview'

// Shared state across components
const viewMode = ref<ViewMode>('split')
const showEditor = ref(true)
const showPreview = ref(true)

export function useViewMode() {
  /**
   * Cycle through view modes: split -> editor -> preview -> split
   */
  function cycleViewMode() {
    const modes: readonly ViewMode[] = ['split', 'editor', 'preview']
    const currentIndex = modes.indexOf(viewMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    const nextMode = modes[nextIndex] ?? 'split'
    viewMode.value = nextMode
    
    showEditor.value = nextMode !== 'preview'
    showPreview.value = nextMode !== 'editor'
  }

  /**
   * Get the icon for the current view mode
   */
  const viewModeIcon = computed(() => {
    switch (viewMode.value) {
      case 'split': return 'i-heroicons-squares-2x2'
      case 'editor': return 'i-heroicons-pencil-square'
      case 'preview': return 'i-heroicons-eye'
    }
  })

  /**
   * Get the label for the current view mode
   */
  const viewModeLabel = computed(() => {
    switch (viewMode.value) {
      case 'split': return 'Split view'
      case 'editor': return 'Editor only'
      case 'preview': return 'Preview only'
    }
  })

  return {
    viewMode: readonly(viewMode),
    showEditor: readonly(showEditor),
    showPreview: readonly(showPreview),
    cycleViewMode,
    viewModeIcon,
    viewModeLabel,
  }
}
