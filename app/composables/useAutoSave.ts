/**
 * @fileoverview Auto-save Composable
 * @description Manages automatic saving of editor content to localStorage.
 * Saves on a debounced content change (2s after typing pauses, at most every
 * 10s while typing continuously), on a 30-second safety interval, on window
 * blur, and before page unload. Restores previously saved content on page load.
 *
 * State and timers are module-level and initialization is reference-counted,
 * so multiple components may call useAutoSave() (e.g. AppHeader for the save
 * indicator, EditorLayout for the behavior) without duplicating intervals,
 * event listeners, restores, or screen reader announcements.
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
 * Interval for safety-net automatic saves in milliseconds (30 seconds).
 * @constant {number}
 */
const SAVE_INTERVAL = 30000 // 30 seconds

/**
 * Debounce for content-change saves (2s after typing pauses).
 * @constant {number}
 */
const CHANGE_SAVE_DEBOUNCE = 2000

/**
 * Maximum wait before a content-change save fires during continuous typing.
 * @constant {number}
 */
const CHANGE_SAVE_MAX_WAIT = 10000

/**
 * Threshold in milliseconds for "just now" display (1 minute).
 * @constant {number}
 */
const JUST_NOW_THRESHOLD = 60000

/**
 * Threshold in milliseconds for showing minutes ago vs absolute time (1 hour).
 * @constant {number}
 */
const MINUTES_AGO_THRESHOLD = 3600000

// ---------------------------------------------------------------------------
// Shared module-level state (one auto-save pipeline for the whole app)
// ---------------------------------------------------------------------------

/** Timestamp of the last successful save operation. */
const lastSaveTime = ref<number | null>(null)

/** Flag indicating if a save operation is currently in progress. */
const isSaving = ref(false)

/** Flag indicating if content was successfully restored from localStorage. */
const hasRestoredFromStorage = ref(false)

/** Flag indicating if localStorage is available in this browser. */
const storageAvailable = ref(true)

/** Flag for visual feedback when content was just saved. */
const justSaved = ref(false)

/** Flag controlling visibility of the save indicator (green dot). */
const showSaveIndicator = ref(false)

/** Countdown timer to next auto-save in seconds. */
const countdownToSave = ref(SAVE_INTERVAL / 1000)

/** Trigger for forcing reactivity updates on the relative time display. */
const timeUpdateTrigger = ref(0)

/** Timer handles — module-level so they exist at most once. */
let timeUpdateInterval: ReturnType<typeof setInterval> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null
let hideIndicatorTimeout: ReturnType<typeof setTimeout> | null = null
let saveInterval: ReturnType<typeof setInterval> | null = null

/** Detached scope owning the debounced content-change watcher. */
let changeWatchScope: ReturnType<typeof effectScope> | null = null

/** The exact handler registered on window blur/beforeunload, for symmetric removal. */
let registeredSaveHandler: (() => void) | null = null

/** Number of mounted components currently using this composable. */
let mountedInstances = 0

/**
 * Auto-save composable for persisting editor content to localStorage.
 * Returns shared state; initialization happens once regardless of caller count.
 *
 * @returns {Object} Auto-save state and methods
 */
export function useAutoSave() {
  const { content, setContent, initializeWithDefault, markContentReady, isContentReady } = useEditor()
  const { announce } = useAccessibility()

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
        storageAvailable.value = false
        stopAutoSave()
        announce('Storage full. Auto-save disabled. Please download your work to avoid data loss.')
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
   * Computed property that formats the last save time for display.
   * Returns human-readable strings like "Saved just now" or "Saved 5m ago".
   *
   * @type {ComputedRef<string | null>}
   */
  const lastSaveDisplay = computed(() => {
    // Force reactivity update for time display
    void timeUpdateTrigger.value

    if (!lastSaveTime.value) return null

    const now = Date.now()
    const diff = now - lastSaveTime.value

    if (diff < JUST_NOW_THRESHOLD) {
      return 'Saved just now'
    } else if (diff < MINUTES_AGO_THRESHOLD) {
      const minutes = Math.floor(diff / JUST_NOW_THRESHOLD)
      return `Saved ${minutes}m ago`
    } else {
      const date = new Date(lastSaveTime.value)
      return `Saved at ${date.toLocaleTimeString()}`
    }
  })

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

    // Safety-net save every 30 seconds regardless of change events
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
   * One-time initialization: storage check, restore, intervals, listeners,
   * and the debounced content-change save. Guarded by the mount ref-count.
   */
  function initialize() {
    storageAvailable.value = checkStorageAvailability()

    if (!storageAvailable.value) {
      // Storage not available - still initialize with default
      initializeWithDefault()
      return
    }

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

    // Save shortly after the user stops typing (and at most every 10s while
    // typing) so a crash can lose at most a few seconds of work, not 30.
    changeWatchScope = effectScope(true)
    changeWatchScope.run(() => {
      watchDebounced(
        content,
        () => {
          if (content.value.trim().length > 0) {
            save()
          }
        },
        { debounce: CHANGE_SAVE_DEBOUNCE, maxWait: CHANGE_SAVE_MAX_WAIT },
      )
    })

    // Save on window blur (user switches tabs/apps) and before page unload.
    // Keep the registered reference so teardown removes the same handler.
    registeredSaveHandler = () => {
      save()
    }
    window.addEventListener('blur', registeredSaveHandler)
    window.addEventListener('beforeunload', registeredSaveHandler)
  }

  /**
   * Tears down everything initialize() set up. Runs when the last component
   * using this composable unmounts.
   */
  function teardown() {
    stopAutoSave()
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
    if (hideIndicatorTimeout) {
      clearTimeout(hideIndicatorTimeout)
      hideIndicatorTimeout = null
    }
    if (changeWatchScope) {
      changeWatchScope.stop()
      changeWatchScope = null
    }
    if (registeredSaveHandler) {
      window.removeEventListener('blur', registeredSaveHandler)
      window.removeEventListener('beforeunload', registeredSaveHandler)
      registeredSaveHandler = null
    }
  }

  onMounted(() => {
    mountedInstances++
    if (mountedInstances === 1) {
      initialize()
    }
  })

  onUnmounted(() => {
    mountedInstances--
    if (mountedInstances === 0) {
      teardown()
    }
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
