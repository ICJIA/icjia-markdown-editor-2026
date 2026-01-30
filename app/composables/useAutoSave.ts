/**
 * @fileoverview Auto-save Composable
 * @description Manages automatic saving of editor content to localStorage.
 * Provides periodic auto-save every 30 seconds, saves on window blur and before page unload,
 * and restores previously saved content on page load.
 * 
 * @module composables/useAutoSave
 * 
 * @example
 * ```typescript
 * const { save, restore, lastSaveDisplay } = useAutoSave()
 * 
 * // Manually trigger a save
 * save()
 * 
 * // Display last save time
 * console.log(lastSaveDisplay.value) // "Saved just now" or "Saved 5m ago"
 * ```
 */

/**
 * LocalStorage key for persisting editor content.
 * @constant {string}
 */
const STORAGE_KEY = 'icjia-markdown-editor-autosave'

/**
 * Interval for automatic saves in milliseconds (30 seconds).
 * @constant {number}
 */
const SAVE_INTERVAL = 30000 // 30 seconds

/**
 * Auto-save composable for persisting editor content to localStorage.
 * Automatically saves content every 30 seconds, on window blur, and before page unload.
 * Restores previously saved content when the editor initializes.
 * 
 * @returns {Object} Auto-save state and methods
 * @returns {Function} returns.save - Manually save content to localStorage
 * @returns {Function} returns.restore - Restore content from localStorage
 * @returns {Function} returns.clear - Clear saved content from localStorage
 * @returns {Function} returns.hasSavedContent - Check if saved content exists
 * @returns {Function} returns.getSavedInfo - Get info about saved content
 * @returns {Readonly<Ref<number | null>>} returns.lastSaveTime - Timestamp of last save
 * @returns {ComputedRef<string | null>} returns.lastSaveDisplay - Human-readable last save time
 * @returns {Readonly<Ref<boolean>>} returns.isSaving - Whether a save is in progress
 * @returns {Readonly<Ref<boolean>>} returns.justSaved - Whether content was just saved
 * @returns {Readonly<Ref<boolean>>} returns.showSaveIndicator - Whether to show save indicator
 * @returns {Readonly<Ref<number>>} returns.countdownToSave - Seconds until next auto-save
 * @returns {Readonly<Ref<boolean>>} returns.hasRestoredFromStorage - Whether content was restored
 * @returns {Readonly<Ref<boolean>>} returns.storageAvailable - Whether localStorage is available
 * @returns {Readonly<Ref<boolean>>} returns.isContentReady - Whether content is initialized
 */
export function useAutoSave() {
  const { content, setContent, initializeWithDefault, markContentReady, isContentReady } = useEditor()
  const { announce } = useAccessibility()
  
  /**
   * Timestamp of the last successful save operation.
   * @type {Ref<number | null>}
   */
  const lastSaveTime = ref<number | null>(null)
  
  /**
   * Flag indicating if a save operation is currently in progress.
   * @type {Ref<boolean>}
   */
  const isSaving = ref(false)
  
  /**
   * Flag indicating if content was successfully restored from localStorage.
   * @type {Ref<boolean>}
   */
  const hasRestoredFromStorage = ref(false)
  
  /**
   * Flag indicating if localStorage is available in this browser.
   * @type {Ref<boolean>}
   */
  const storageAvailable = ref(true)
  
  /**
   * Checks if localStorage is available and functional.
   * Tests by attempting to set and remove a test value.
   * 
   * @returns {boolean} True if localStorage is available, false otherwise
   */
  function checkStorageAvailability(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Saves the current editor content to localStorage.
   * Updates the save indicator and countdown timer.
   * Announces storage full errors to screen readers.
   * 
   * @returns {boolean} True if save was successful, false otherwise
   */
  function save(): boolean {
    if (!storageAvailable.value) return false
    
    try {
      isSaving.value = true
      const data = {
        content: content.value,
        savedAt: Date.now(),
        version: 1,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      lastSaveTime.value = Date.now()
      
      // Visual feedback - show green dot briefly
      justSaved.value = true
      showSaveIndicator.value = true
      
      // Reset countdown to next save
      countdownToSave.value = SAVE_INTERVAL / 1000
      
      // Clear any existing timeout
      if (hideIndicatorTimeout) {
        clearTimeout(hideIndicatorTimeout)
      }
      
      // Hide the indicator after 3 seconds
      hideIndicatorTimeout = setTimeout(() => {
        showSaveIndicator.value = false
        justSaved.value = false
      }, 3000)
      
      return true
    } catch (e) {
      console.error('Auto-save failed:', e)
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        announce('Storage full. Please download your work to avoid data loss.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }
  
  /**
   * Restores editor content from localStorage.
   * Sets the editor content and marks it as ready.
   * Updates the lastSaveTime from the stored data.
   * 
   * @returns {boolean} True if restore was successful, false otherwise
   */
  function restore(): boolean {
    if (!storageAvailable.value) return false
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      
      const data = JSON.parse(stored)
      if (data.content && typeof data.content === 'string') {
        setContent(data.content, true)
        hasRestoredFromStorage.value = true
        lastSaveTime.value = data.savedAt || Date.now()
        markContentReady()
        return true
      }
      return false
    } catch (e) {
      console.error('Restore from storage failed:', e)
      return false
    }
  }
  
  /**
   * Checks if there is saved content available in localStorage.
   * Validates that the content is non-empty.
   * 
   * @returns {boolean} True if valid saved content exists, false otherwise
   */
  function hasSavedContent(): boolean {
    if (!storageAvailable.value) return false
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      
      const data = JSON.parse(stored)
      return Boolean(data.content && data.content.trim().length > 0)
    } catch {
      return false
    }
  }
  
  /**
   * Retrieves information about the saved content.
   * Returns the save timestamp and word count for UI display.
   * 
   * @returns {{ savedAt: Date, wordCount: number } | null} Info object or null if no saved content
   */
  function getSavedInfo(): { savedAt: Date; wordCount: number } | null {
    if (!storageAvailable.value) return null
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      if (!data.content) return null
      
      const wordCount = data.content.trim().split(/\s+/).filter(Boolean).length
      return {
        savedAt: new Date(data.savedAt),
        wordCount,
      }
    } catch {
      return null
    }
  }
  
  /**
   * Clears all saved content from localStorage.
   * Resets the lastSaveTime to null.
   * 
   * @returns {void}
   */
  function clear(): void {
    if (!storageAvailable.value) return
    
    try {
      localStorage.removeItem(STORAGE_KEY)
      lastSaveTime.value = null
    } catch (e) {
      console.error('Clear storage failed:', e)
    }
  }
  
  /**
   * Trigger for forcing reactivity updates on time display.
   * Incremented periodically to update relative time strings.
   * @type {Ref<number>}
   */
  const timeUpdateTrigger = ref(0)
  
  /**
   * Interval reference for updating the time display.
   * @type {ReturnType<typeof setInterval> | null}
   */
  let timeUpdateInterval: ReturnType<typeof setInterval> | null = null
  
  /**
   * Computed property that formats the last save time for display.
   * Returns human-readable strings like "Saved just now" or "Saved 5m ago".
   * 
   * @type {ComputedRef<string | null>}
   */
  const lastSaveDisplay = computed(() => {
    // Include trigger to force reactivity updates
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    timeUpdateTrigger.value
    
    if (!lastSaveTime.value) return null
    
    const now = Date.now()
    const diff = now - lastSaveTime.value
    
    if (diff < 60000) {
      return 'Saved just now'
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `Saved ${minutes}m ago`
    } else {
      const date = new Date(lastSaveTime.value)
      return `Saved at ${date.toLocaleTimeString()}`
    }
  })
  
  /**
   * Flag for visual feedback when content was just saved.
   * @type {Ref<boolean>}
   */
  const justSaved = ref(false)
  
  /**
   * Flag controlling visibility of the save indicator (green dot).
   * @type {Ref<boolean>}
   */
  const showSaveIndicator = ref(false)
  
  /**
   * Countdown timer to next auto-save in seconds.
   * @type {Ref<number>}
   */
  const countdownToSave = ref(SAVE_INTERVAL / 1000)
  
  /**
   * Interval reference for the countdown timer.
   * @type {ReturnType<typeof setInterval> | null}
   */
  let countdownInterval: ReturnType<typeof setInterval> | null = null
  
  /**
   * Timeout reference for hiding the save indicator.
   * @type {ReturnType<typeof setTimeout> | null}
   */
  let hideIndicatorTimeout: ReturnType<typeof setTimeout> | null = null
  
  /**
   * Interval reference for the auto-save timer.
   * @type {ReturnType<typeof setInterval> | null}
   */
  let saveInterval: ReturnType<typeof setInterval> | null = null
  
  /**
   * Starts the auto-save interval and countdown timer.
   * Saves every 30 seconds if content is non-empty.
   * 
   * @returns {void}
   */
  function startAutoSave() {
    if (saveInterval) return
    
    // Start countdown timer (updates every second)
    countdownInterval = setInterval(() => {
      if (countdownToSave.value > 0) {
        countdownToSave.value--
      }
    }, 1000)
    
    // Save every 30 seconds regardless of content changes
    // This ensures continuous protection of user work
    saveInterval = setInterval(() => {
      // Only save if there's actual content (not empty)
      if (content.value.trim().length > 0) {
        save()
      } else {
        // Reset countdown even if not saving (no content)
        countdownToSave.value = SAVE_INTERVAL / 1000
      }
    }, SAVE_INTERVAL)
  }
  
  /**
   * Stops the auto-save interval and countdown timer.
   * Cleans up all interval references.
   * 
   * @returns {void}
   */
  function stopAutoSave() {
    if (saveInterval) {
      clearInterval(saveInterval)
      saveInterval = null
    }
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }
  
  /**
   * Lifecycle hook that initializes auto-save on component mount.
   * Checks storage availability, restores saved content, and sets up listeners.
   */
  onMounted(() => {
    storageAvailable.value = checkStorageAvailability()
    
    if (storageAvailable.value) {
      // Try to restore saved content
      if (hasSavedContent()) {
        restore()
        announce('Previous work restored from auto-save')
      } else {
        // No saved content - initialize with default
        initializeWithDefault()
      }
      
      // Start auto-save interval
      startAutoSave()
      
      // Start time display update interval (every 30 seconds)
      timeUpdateInterval = setInterval(() => {
        timeUpdateTrigger.value++
      }, 30000)
      
      // Save on window blur (user switches tabs/apps)
      window.addEventListener('blur', save)
      
      // Save before page unload
      window.addEventListener('beforeunload', save)
    } else {
      // Storage not available - still initialize with default
      initializeWithDefault()
    }
  })
  
  /**
   * Lifecycle hook that cleans up auto-save on component unmount.
   * Stops intervals and removes event listeners.
   */
  onUnmounted(() => {
    stopAutoSave()
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
    if (hideIndicatorTimeout) {
      clearTimeout(hideIndicatorTimeout)
      hideIndicatorTimeout = null
    }
    window.removeEventListener('blur', save)
    window.removeEventListener('beforeunload', save)
  })
  
  return {
    save,
    restore,
    clear,
    hasSavedContent,
    getSavedInfo,
    lastSaveTime: readonly(lastSaveTime),
    lastSaveDisplay,
    isSaving: readonly(isSaving),
    justSaved: readonly(justSaved),
    showSaveIndicator: readonly(showSaveIndicator),
    countdownToSave: readonly(countdownToSave),
    hasRestoredFromStorage: readonly(hasRestoredFromStorage),
    storageAvailable: readonly(storageAvailable),
    isContentReady,
  }
}
