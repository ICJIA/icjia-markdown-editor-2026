/**
 * @fileoverview Table Builder Modal Composable
 * @description Provides shared state for the table builder modal.
 * Allows both the toolbar button and Ctrl+T keyboard shortcut to control the modal.
 * 
 * @module composables/useTableBuilderModal
 * 
 * @example
 * ```typescript
 * const { isTableBuilderOpen, openTableBuilder, closeTableBuilder } = useTableBuilderModal()
 * 
 * // Open the table builder
 * openTableBuilder()
 * 
 * // Check if open
 * if (isTableBuilderOpen.value) {
 *   // Modal is visible
 * }
 * ```
 */

/**
 * Flag indicating if the table builder modal is currently open.
 * Shared across all component instances using this composable.
 * @type {Ref<boolean>}
 */
const isTableBuilderOpen = ref(false)

/**
 * Table builder modal composable for managing the modal visibility state.
 * Provides methods to open and close the table builder modal.
 * 
 * @returns {Object} Modal state and control methods
 * @returns {Readonly<Ref<boolean>>} returns.isTableBuilderOpen - Whether modal is open (readonly)
 * @returns {Function} returns.openTableBuilder - Opens the table builder modal
 * @returns {Function} returns.closeTableBuilder - Closes the table builder modal
 */
export function useTableBuilderModal() {
  /**
   * Opens the table builder modal.
   * Sets the isTableBuilderOpen flag to true.
   * 
   * @returns {void}
   */
  function openTableBuilder() {
    isTableBuilderOpen.value = true
  }

  /**
   * Closes the table builder modal.
   * Sets the isTableBuilderOpen flag to false.
   * 
   * @returns {void}
   */
  function closeTableBuilder() {
    isTableBuilderOpen.value = false
  }

  return {
    isTableBuilderOpen: readonly(isTableBuilderOpen),
    openTableBuilder,
    closeTableBuilder,
  }
}
