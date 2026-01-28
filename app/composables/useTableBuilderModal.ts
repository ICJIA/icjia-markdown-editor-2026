/**
 * Table Builder Modal State
 * Shared state so toolbar button and Ctrl+T shortcut can open the modal
 */

const isTableBuilderOpen = ref(false)

export function useTableBuilderModal() {
  function openTableBuilder() {
    isTableBuilderOpen.value = true
  }

  function closeTableBuilder() {
    isTableBuilderOpen.value = false
  }

  return {
    isTableBuilderOpen: readonly(isTableBuilderOpen),
    openTableBuilder,
    closeTableBuilder,
  }
}
