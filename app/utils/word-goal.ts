/**
 * @fileoverview Word-Count Goal
 * @description Reads the target an author types and works out how far along
 * they are.
 *
 * Kept apart from the composable that stores the goal so the arithmetic — which
 * is where a progress indicator gets its credibility — can be tested directly.
 *
 * @module utils/word-goal
 */

/**
 * Largest accepted goal.
 *
 * Well past any real document, and low enough that a mistyped entry becomes an
 * obvious rejection rather than a progress bar frozen near zero.
 *
 * @constant {number}
 */
export const MAX_WORD_GOAL = 1_000_000

/** How far a document has got towards its goal. */
export interface GoalProgress {
  /** 0–100, never reporting 100 before the goal is actually met. */
  percent: number
  /** Whether the goal has been reached. */
  met: boolean
  /** Words still to write; 0 once the goal is met. */
  remaining: number
}

/**
 * Reads a goal from what the author typed.
 *
 * Accepts thousands separators, because a writer setting a 1,500-word target
 * types it the way they say it. Rejects everything that is not a whole positive
 * number within range, returning null rather than a nonsense goal.
 *
 * @param {string} input - Raw text from the goal field
 * @returns {number | null} The goal, or null when the entry is unusable
 *
 * @example
 * ```typescript
 * parseWordGoal('1,500')  // 1500
 * parseWordGoal('lots')   // null
 * ```
 */
export function parseWordGoal(input: string): number | null {
  const cleaned = input.replace(/,/g, '').trim()
  if (!/^\d+$/.test(cleaned)) return null

  const goal = Number(cleaned)
  if (!Number.isSafeInteger(goal) || goal <= 0 || goal > MAX_WORD_GOAL) return null
  return goal
}

/**
 * How far `words` has got towards `goal`.
 *
 * The percentage floors rather than rounds below the goal: 1,499 of 1,500 words
 * rounds to 100%, and telling an author they are finished when they are not is
 * the one thing a progress indicator must not do. It reads 100 only when the
 * goal is genuinely met, and clamps there afterwards so overshooting does not
 * produce a bar past its end.
 *
 * @param {number} words - Current word count
 * @param {number | null} goal - The target, or null when none is set
 * @returns {GoalProgress | null} Progress, or null when there is no goal
 *
 * @example
 * ```typescript
 * wordGoalProgress(247, 1500)  // { percent: 16, met: false, remaining: 1253 }
 * ```
 */
export function wordGoalProgress(words: number, goal: number | null): GoalProgress | null {
  if (goal === null || goal <= 0) return null

  const met = words >= goal
  return {
    percent: met ? 100 : Math.floor((words / goal) * 100),
    met,
    remaining: met ? 0 : goal - words,
  }
}
