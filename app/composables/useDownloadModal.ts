/**
 * @fileoverview Download Modal Composable
 * @description Manages the download filename modal state and provides methods
 * for opening, confirming, and canceling downloads with custom filenames.
 * 
 * @module composables/useDownloadModal
 * 
 * @example
 * ```typescript
 * const { openModal, confirm, cancel } = useDownloadModal()
 * 
 * // Open modal for markdown download
 * const filename = await openModal('markdown')
 * if (filename) {
 *   // Proceed with download
 * }
 * ```
 */

/**
 * Type of content to download.
 * @typedef {'markdown' | 'html'} DownloadType
 */
export type DownloadType = 'markdown' | 'html'

/**
 * Flag indicating if the download modal is currently open.
 * @type {Ref<boolean>}
 */
const isOpen = ref(false)

/**
 * The type of download currently being processed.
 * @type {Ref<DownloadType>}
 */
const downloadType = ref<DownloadType>('markdown')

/**
 * The current filename entered by the user.
 * @type {Ref<string>}
 */
const filename = ref('')

/**
 * Promise resolver for the modal result.
 * @type {Ref<((value: string | null) => void) | null>}
 */
const resolvePromise = ref<((value: string | null) => void) | null>(null)

/**
 * Generates a default filename with an ISO timestamp.
 * Format: markdown-YYYY-MM-DD_HH-MM-SS.{ext}
 * 
 * @param {DownloadType} type - The type of download (determines file extension)
 * @returns {string} The generated filename with appropriate extension
 * 
 * @example
 * generateDefaultFilename('markdown') // 'markdown-2026-01-28_14-30-00.md'
 * generateDefaultFilename('html') // 'markdown-2026-01-28_14-30-00.html'
 */
function generateDefaultFilename(type: DownloadType): string {
  const now = new Date()
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19)
  
  const extension = type === 'markdown' ? 'md' : 'html'
  return `markdown-${timestamp}.${extension}`
}

/**
 * Download modal composable for managing filename selection before downloads.
 * Provides a promise-based API for opening the modal and getting the user's chosen filename.
 * 
 * @returns {Object} Modal state and control methods
 * @returns {Readonly<Ref<boolean>>} returns.isOpen - Whether the modal is currently open
 * @returns {Readonly<Ref<DownloadType>>} returns.downloadType - Current download type
 * @returns {Ref<string>} returns.filename - Current filename (editable)
 * @returns {Function} returns.openModal - Open modal and get filename via promise
 * @returns {Function} returns.confirm - Confirm download with current filename
 * @returns {Function} returns.cancel - Cancel the download
 * @returns {Function} returns.useDefault - Use default filename and confirm
 * @returns {Function} returns.generateDefaultFilename - Generate a timestamped filename
 */
export function useDownloadModal() {
  /**
   * Opens the download modal and returns a promise that resolves with the filename.
   * Generates a default filename based on the download type.
   * 
   * @param {DownloadType} type - The type of download ('markdown' or 'html')
   * @returns {Promise<string | null>} Resolves with filename on confirm, null on cancel
   */
  function openModal(type: DownloadType): Promise<string | null> {
    return new Promise((resolve) => {
      downloadType.value = type
      filename.value = generateDefaultFilename(type)
      resolvePromise.value = resolve
      isOpen.value = true
    })
  }
  
  /**
   * Confirms the download with the current filename.
   * Ensures the filename has the correct extension for the download type.
   * Resolves the pending promise with the corrected filename.
   * 
   * @returns {void}
   */
  function confirm() {
    const finalFilename = filename.value.trim() || generateDefaultFilename(downloadType.value)

    // Ensure correct extension
    const extension = downloadType.value === 'markdown' ? '.md' : '.html'
    const withExtension = finalFilename.endsWith(extension)
      ? finalFilename
      : finalFilename.replace(/\.(md|html|txt)$/, '') + extension

    // Sanitize: strip path traversal, invalid chars, enforce max length
    const correctedFilename = withExtension
      .replace(/\.\./g, '')
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/^\.+/, '')
      .slice(0, 255)

    if (resolvePromise.value) {
      resolvePromise.value(correctedFilename)
      resolvePromise.value = null
    }
    isOpen.value = false
  }
  
  /**
   * Cancels the download and closes the modal.
   * Resolves the pending promise with null.
   * 
   * @returns {void}
   */
  function cancel() {
    if (resolvePromise.value) {
      resolvePromise.value(null)
      resolvePromise.value = null
    }
    isOpen.value = false
  }
  
  /**
   * Uses the default filename and immediately confirms the download.
   * Useful for quick downloads without customization.
   * 
   * @returns {void}
   */
  function useDefault() {
    filename.value = generateDefaultFilename(downloadType.value)
    confirm()
  }
  
  return {
    // State (readonly)
    isOpen: readonly(isOpen),
    downloadType: readonly(downloadType),
    filename,
    
    // Actions
    openModal,
    confirm,
    cancel,
    useDefault,
    generateDefaultFilename,
  }
}
