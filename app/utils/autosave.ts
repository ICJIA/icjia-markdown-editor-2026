/**
 * @fileoverview Auto-save Decisions
 * @description The rules that decide whether a save is safe to make, whether a
 * stored record can be trusted, and what another browser tab's save means for
 * this one.
 *
 * Extracted from `useAutoSave` for the same reason as `utils/filename`: the
 * composable needs a Nuxt runtime, timers, and a live `localStorage`, and these
 * rules need none of them. Auto-save is the only thing standing between an
 * author and a lost afternoon, so the part that decides whether to overwrite
 * their work should be testable on its own.
 *
 * @module utils/autosave
 */

/**
 * Shape version stamped into every stored record.
 *
 * Bump it when the stored shape changes in a way an older build would misread.
 * `parseSavedRecord` refuses anything newer than this, so a build that predates
 * a change shows the author the default document rather than a misparsed one.
 *
 * @constant {number}
 */
export const AUTOSAVE_VERSION = 1

/** A validated auto-save record. */
export interface SavedRecord {
  /** The markdown the author had when the record was written. */
  content: string
  /** Epoch milliseconds. */
  savedAt: number
  /** The shape version that wrote it. */
  version: number
}

/** This tab's view of its own content, for cross-tab decisions. */
export interface LocalState {
  /** What the editor is showing right now. */
  content: string
  /** What this tab last wrote to storage, or null if it has not written yet. */
  lastSavedContent: string | null
}

/**
 * Parses and validates a raw stored value.
 *
 * Returns null rather than throwing for every unusable input — absent, corrupt,
 * wrong-typed, or written by a newer build — so callers can treat "nothing
 * trustworthy is stored" as one case.
 *
 * @param {string | null} raw - The raw `localStorage` value
 * @returns {SavedRecord | null} A validated record, or null
 *
 * @example
 * ```typescript
 * parseSavedRecord('{"content":"# Hi","savedAt":1,"version":1}')
 * // { content: '# Hi', savedAt: 1, version: 1 }
 * parseSavedRecord('{ not json')  // null
 * ```
 */
export function parseSavedRecord(raw: string | null): SavedRecord | null {
  if (!raw) return null

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof data !== 'object' || data === null) return null
  const { content, savedAt, version } = data as Partial<SavedRecord>

  if (typeof content !== 'string') return null

  // Records predate versioning, so a missing version is this version. A version
  // *ahead* of this build is the one case worth refusing: its shape is unknown,
  // and guessing risks showing the author something other than what they wrote.
  const recordVersion = typeof version === 'number' ? version : AUTOSAVE_VERSION
  if (recordVersion > AUTOSAVE_VERSION) return null

  return {
    content,
    savedAt: typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : Date.now(),
    version: recordVersion,
  }
}

/**
 * Whether writing `next` over `stored` would destroy the author's work.
 *
 * The one case is an empty document replacing a saved non-empty one. It reaches
 * storage through the window-blur and page-unload handlers, which save
 * unconditionally: select-all, delete, switch tabs, and the record becomes
 * empty. On the next load there is nothing to restore and the author gets the
 * tutorial back instead of their document. Nothing in the app needs to persist
 * an empty document — clearing is what `clear()` is for — so refusing is free.
 *
 * @param {string} next - Content about to be written
 * @param {SavedRecord | null} stored - The record it would replace
 * @returns {boolean} True when the write would lose work
 *
 * @example
 * ```typescript
 * isDestructiveSave('', parseSavedRecord(saved))  // true — refuse
 * isDestructiveSave('# Report', null)             // false
 * ```
 */
export function isDestructiveSave(next: string, stored: SavedRecord | null): boolean {
  if (next.trim().length > 0) return false
  return stored !== null && stored.content.trim().length > 0
}

/**
 * Whether a save made by another tab should replace what this tab shows.
 *
 * Two tabs share one storage key, so without this the last writer wins and the
 * other tab's document is gone. Adopting unconditionally is no better — it
 * would overwrite whatever the author is typing in *this* tab.
 *
 * The safe middle is to adopt only when this tab has nothing to lose: its
 * content still matches what it last wrote itself. An actively edited tab keeps
 * its work; an idle one follows along. A tab that has never saved is left alone,
 * since there is nothing to compare against and its content may be untouched
 * default material the author has not looked at yet.
 *
 * @param {SavedRecord | null} incoming - The record another tab wrote
 * @param {LocalState} local - This tab's content and last write
 * @returns {boolean} True when this tab should load `incoming.content`
 */
export function shouldAdoptExternalSave(incoming: SavedRecord | null, local: LocalState): boolean {
  if (!incoming || incoming.content.trim().length === 0) return false
  if (local.lastSavedContent === null) return false
  if (incoming.content === local.content) return false
  return local.content === local.lastSavedContent
}

/**
 * Seconds remaining until the next safety-net save is due.
 *
 * Derived from the last save rather than counted down independently, so the
 * number the status bar shows always corresponds to the timer that will
 * actually fire. Rounds up, so it never reads `0` while a save is still pending.
 *
 * @param {number | null} lastSaveTime - Epoch ms of the last save, or null
 * @param {number} now - Epoch ms of the moment being displayed
 * @param {number} intervalMs - The safety-net interval
 * @returns {number} Whole seconds remaining, never negative
 */
export function secondsUntilNextSave(
  lastSaveTime: number | null,
  now: number,
  intervalMs: number,
): number {
  if (lastSaveTime === null) return Math.ceil(intervalMs / 1000)
  const remaining = lastSaveTime + intervalMs - now
  return Math.max(0, Math.ceil(remaining / 1000))
}
