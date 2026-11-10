/**
 * @fileoverview Auto-save Composable
 * @description Manages automatic saving of editor content to localStorage.
 * Saves on a debounced content change (2s after typing pauses, at most every
 * 10s while typing continuously), on a 30-second safety interval, on window
 * blur, when the tab is hidden, and before page unload. Restores previously
 * saved content on page load.
 *
 * State and timers are module-level and initialization is reference-counted,
 * so multiple components may call useAutoSave() (e.g. AppHeader for the save
 * indicator, EditorLayout for the behavior) without duplicating intervals,
 * event listeners, restores, or screen reader announcements.
 *
 * Two rules protect the author's work, both in `utils/autosave` so they can be
 * tested without a Nuxt runtime:
 *
 *   - A save never replaces stored content with an empty document. The blur and
 *     unload handlers save unconditionally, so without this a select-all-delete
 *     followed by switching tabs left nothing to restore and the author got the
 *     tutorial back instead of their work.
 *   - A save made in another tab is adopted here only when this tab has nothing
 *     unsaved. Both tabs write one key, so the alternative is that whichever
 *     saves last silently erases the other.
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

import {
  AUTOSAVE_VERSION,
  parseSavedRecord,
  isDestructiveSave,
  isTutorialOverwrite,
  shouldAdoptExternalSave,
  secondsUntilNextSave,
  type SavedRecord,
} from '~/utils/autosave'

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

/**
 * True when a save was refused because it would have destroyed stored work.
 * Surfaced so the status indicator can say the document is not being saved
 * rather than showing a countdown to a save that will not happen.
 */
const lastSaveRefused = ref(false)

/**
 * True when the page was opened in recovery mode (`/?recover`).
 *
 * Recovery mode is the way back in when a saved draft is the thing stopping the
 * editor from working: the draft is neither opened nor rendered, and nothing is
 * written to storage, so it stays exactly as it was until the author decides
 * what to do with it. The render worker should make this unnecessary; it exists
 * because "should" is not a recovery plan.
 */
const isRecoveryMode = ref(false)

/**
 * Whether this page load asked for recovery mode.
 *
 * Reads the URL the browser actually navigated to, from the Navigation Timing
 * entry, rather than `location.search`. While Nuxt hydrates a prerendered page
 * its router briefly rewrites the address bar to the prerendered path — without
 * the query string — and puts it back a moment later. Auto-save initializes
 * inside that window, so `location.search` is empty exactly when it is read.
 * The navigation entry is fixed for the life of the page.
 */
function openedInRecoveryMode(): boolean {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  const url = entry?.name || window.location.href
  try {
    return new URL(url).searchParams.has('recover')
  } catch {
    return false
  }
}

/**
 * What this tab last wrote to storage. Compared against the live content to
 * tell "this tab has unsaved edits" from "this tab is idle", which is what
 * decides whether another tab's save may be adopted.
 */
const lastSavedContent = ref<string | null>(null)

/** Ticks once a second; drives both the countdown and the safety-net save. */
const nowTick = ref(Date.now())

/** Trigger for forcing reactivity updates on the relative time display. */
const timeUpdateTrigger = ref(0)

/** Timer handles — module-level so they exist at most once. */
let timeUpdateInterval: ReturnType<typeof setInterval> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null
let hideIndicatorTimeout: ReturnType<typeof setTimeout> | null = null

/** Detached scope owning the debounced content-change watcher. */
let changeWatchScope: ReturnType<typeof effectScope> | null = null

/** The exact handler registered on window blur/beforeunload, for symmetric removal. */
let registeredSaveHandler: (() => void) | null = null

/** The exact handler registered on `storage`, for symmetric removal. */
let registeredStorageHandler: ((event: StorageEvent) => void) | null = null

/** Number of mounted components currently using this composable. */
let mountedInstances = 0

/**
 * Auto-save composable for persisting editor content to localStorage.
 * Returns shared state; initialization happens once regardless of caller count.
 *
 * @returns {Object} Auto-save state and methods
 */
export function useAutoSave() {
  const { content, setContent, initializeWithDefault, markContentReady, isContentReady, getDefaultContent } = useEditor()
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
    // Recovery mode never writes: the stored draft is what is being recovered.
    if (isRecoveryMode.value) return false

    try {
      isSaving.value = true

      // Refuse a write that would replace stored work with an empty document.
      // The blur and beforeunload handlers save unconditionally, so without this
      // a select-all-delete followed by switching tabs empties the record, and
      // the next load has nothing to restore.
      // The same goes for the tutorial: showing it must not cost the author
      // the draft the reset dialog has just told them is safe.
      const stored = parseSavedRecord(localStorage.getItem(STORAGE_KEY))
      if (
        isDestructiveSave(content.value, stored)
        || isTutorialOverwrite(content.value, getDefaultContent(), stored)
      ) {
        lastSaveRefused.value = true
        return false
      }
      lastSaveRefused.value = false

      const data = {
        content: content.value,
        savedAt: Date.now(),
        version: AUTOSAVE_VERSION,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      lastSavedContent.value = content.value
      lastSaveTime.value = Date.now()

      // Visual feedback - show green dot briefly
      justSaved.value = true
      showSaveIndicator.value = true

      // The countdown is derived from lastSaveTime, so it has already moved.

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
      const record = parseSavedRecord(localStorage.getItem(STORAGE_KEY))
      if (!record || !record.content) return false

      setContent(record.content, true)
      lastSavedContent.value = record.content
      hasRestoredFromStorage.value = true
      lastSaveTime.value = record.savedAt
      markContentReady()
      return true
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
      const record = parseSavedRecord(localStorage.getItem(STORAGE_KEY))
      return record !== null && record.content.trim().length > 0
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
      const record = parseSavedRecord(localStorage.getItem(STORAGE_KEY))
      if (!record || !record.content) return null

      return {
        savedAt: new Date(record.savedAt),
        wordCount: record.content.trim().split(/\s+/).filter(Boolean).length,
      }
    } catch {
      return null
    }
  }

  /**
   * Reads the stored draft without opening it in the editor.
   * Used by recovery mode to describe the draft and to download it.
   *
   * @returns {SavedRecord | null} The stored record, or null if there is none
   */
  function getSavedDraft(): SavedRecord | null {
    try {
      const record = parseSavedRecord(localStorage.getItem(STORAGE_KEY))
      return record && record.content.trim() ? record : null
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
  /**
   * Seconds until the next safety-net save, derived from the last save rather
   * than counted down separately so it always matches the timer that fires.
   *
   * @type {ComputedRef<number>}
   */
  const countdownToSave = computed(() =>
    secondsUntilNextSave(lastSaveTime.value, nowTick.value, SAVE_INTERVAL),
  )

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
    if (countdownInterval) return

    // One second-tick drives both the displayed countdown and the safety-net
    // save. They were separate timers, and because a content-change save reset
    // the countdown without touching the 30-second interval, the number in the
    // status bar stopped corresponding to when a save would actually happen.
    // Deriving both from `lastSaveTime` makes the display true by construction.
    countdownInterval = setInterval(() => {
      nowTick.value = Date.now()
      const due = secondsUntilNextSave(lastSaveTime.value, nowTick.value, SAVE_INTERVAL) === 0
      if (due && content.value.trim().length > 0) {
        save()
      }
    }, 1000)
  }

  /**
   * Stops the auto-save interval and countdown timer.
   * Cleans up all interval references.
   *
   * @returns {void}
   */
  function stopAutoSave() {
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

    isRecoveryMode.value = openedInRecoveryMode()
    if (isRecoveryMode.value) {
      // Show the tutorial, leave the draft untouched, and start no timers.
      initializeWithDefault()
      announce('Recovery mode. Your saved draft was not opened.')
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
    //
    // `visibilitychange` is listed alongside them because mobile browsers
    // frequently never fire `beforeunload` — a swipe away from Safari on iOS
    // ends the page without it — and hiding the tab is the last reliable moment
    // to write.
    registeredSaveHandler = () => {
      save()
    }
    window.addEventListener('blur', registeredSaveHandler)
    window.addEventListener('beforeunload', registeredSaveHandler)
    document.addEventListener('visibilitychange', registeredSaveHandler)

    // Follow another tab's save when this tab has nothing unsaved of its own.
    // Both tabs write the same key, so without this the last writer silently
    // wins and the other tab's document is gone on its next save.
    registeredStorageHandler = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const incoming = parseSavedRecord(event.newValue)
      if (!shouldAdoptExternalSave(incoming, {
        content: content.value,
        lastSavedContent: lastSavedContent.value,
      })) return

      setContent(incoming!.content, true)
      lastSavedContent.value = incoming!.content
      lastSaveTime.value = incoming!.savedAt
      announce('Updated with changes saved in another tab')
    }
    window.addEventListener('storage', registeredStorageHandler)
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
      document.removeEventListener('visibilitychange', registeredSaveHandler)
      registeredSaveHandler = null
    }
    if (registeredStorageHandler) {
      window.removeEventListener('storage', registeredStorageHandler)
      registeredStorageHandler = null
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
    countdownToSave,
    hasRestoredFromStorage: readonly(hasRestoredFromStorage),
    storageAvailable: readonly(storageAvailable),
    lastSaveRefused: readonly(lastSaveRefused),
    isRecoveryMode: readonly(isRecoveryMode),
    getSavedDraft,
    isContentReady,
  }
}
