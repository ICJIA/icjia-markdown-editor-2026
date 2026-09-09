/**
 * @fileoverview Word Goal Composable
 * @description Holds the author's word-count target and remembers it between
 * sessions.
 *
 * The target lives under its own storage key rather than inside the auto-save
 * record. A goal is a property of how the author is working, not of the
 * document: clearing the draft should not clear the target, and — more
 * importantly — a goal must never be able to make an auto-save record
 * unreadable, because that record is the document.
 *
 * The arithmetic lives in `utils/word-goal`; this only stores and reads.
 *
 * @module composables/useWordGoal
 *
 * @example
 * ```typescript
 * const { goal, progress, setGoal, clearGoal } = useWordGoal()
 * setGoal('1500')
 * console.log(progress.value) // { percent: 16, met: false, remaining: 1253 }
 * ```
 */

import { parseWordGoal, wordGoalProgress } from '~/utils/word-goal'

/**
 * LocalStorage key for the word-count target.
 * @constant {string}
 */
const GOAL_KEY = 'icjia-markdown-editor-word-goal'

/** Shared so the status bar and any other caller agree on one target. */
const goal = ref<number | null>(null)

/** Read once per page load, on the first mount. */
let hydrated = false

/**
 * Word-goal state and controls.
 *
 * @returns {Object} Goal state and setters
 */
export function useWordGoal() {
  const { wordCount } = useMarkdown()

  /** Progress towards the goal, or null when none is set. */
  const progress = computed(() => wordGoalProgress(wordCount.value.words, goal.value))

  /**
   * Stores a goal from raw author input.
   *
   * @param {string} input - Text from the goal field
   * @returns {boolean} True when the entry was usable and stored
   */
  function setGoal(input: string): boolean {
    const parsed = parseWordGoal(input)
    if (parsed === null) return false

    goal.value = parsed
    try {
      localStorage.setItem(GOAL_KEY, String(parsed))
    } catch {
      // A goal that cannot be persisted still works for this session; storage
      // being unavailable is reported by the auto-save indicator, which is the
      // failure that actually matters.
    }
    return true
  }

  /** Removes the goal. */
  function clearGoal(): void {
    goal.value = null
    try {
      localStorage.removeItem(GOAL_KEY)
    } catch {
      // Nothing to recover from: the in-memory goal is already cleared.
    }
  }

  onMounted(() => {
    if (hydrated) return
    hydrated = true
    try {
      const stored = localStorage.getItem(GOAL_KEY)
      if (stored !== null) goal.value = parseWordGoal(stored)
    } catch {
      // No stored goal is the same as no goal.
    }
  })

  return {
    goal: readonly(goal),
    progress,
    setGoal,
    clearGoal,
  }
}
