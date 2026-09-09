import { describe, it, expect } from 'vitest'
import { MAX_WORD_GOAL, parseWordGoal, wordGoalProgress } from '~/utils/word-goal'

describe('parseWordGoal', () => {
  it('reads a plain number', () => {
    expect(parseWordGoal('1500')).toBe(1500)
  })

  it('reads a number written with thousands separators', () => {
    // Writers type the number the way they say it.
    expect(parseWordGoal('1,500')).toBe(1500)
  })

  it('ignores surrounding whitespace', () => {
    expect(parseWordGoal('  2000  ')).toBe(2000)
  })

  it('rejects zero, which is not a goal', () => {
    expect(parseWordGoal('0')).toBeNull()
  })

  it('rejects a negative number', () => {
    expect(parseWordGoal('-5')).toBeNull()
  })

  it('rejects a fraction', () => {
    expect(parseWordGoal('1.5')).toBeNull()
  })

  it('rejects text', () => {
    expect(parseWordGoal('lots')).toBeNull()
  })

  it('rejects an empty entry', () => {
    expect(parseWordGoal('')).toBeNull()
  })

  it('rejects a goal beyond anything a document could reach', () => {
    expect(parseWordGoal(String(MAX_WORD_GOAL + 1))).toBeNull()
    expect(parseWordGoal(String(MAX_WORD_GOAL))).toBe(MAX_WORD_GOAL)
  })
})

describe('wordGoalProgress', () => {
  it('reports nothing when no goal is set', () => {
    expect(wordGoalProgress(500, null)).toBeNull()
  })

  it('reports zero progress on an empty document', () => {
    expect(wordGoalProgress(0, 1500)).toEqual({ percent: 0, met: false, remaining: 1500 })
  })

  it('reports partial progress', () => {
    expect(wordGoalProgress(247, 1500)).toEqual({ percent: 16, met: false, remaining: 1253 })
  })

  it('never rounds up to 100% before the goal is met', () => {
    // 1499/1500 rounds to 100%, which would tell the author they were finished.
    expect(wordGoalProgress(1499, 1500)).toEqual({ percent: 99, met: false, remaining: 1 })
  })

  it('reports the goal met exactly on the last word', () => {
    expect(wordGoalProgress(1500, 1500)).toEqual({ percent: 100, met: true, remaining: 0 })
  })

  it('clamps progress past the goal', () => {
    expect(wordGoalProgress(1512, 1500)).toEqual({ percent: 100, met: true, remaining: 0 })
  })
})
