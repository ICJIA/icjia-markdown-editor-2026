import { describe, it, expect } from 'vitest'
import {
  AUTOSAVE_VERSION,
  parseSavedRecord,
  isDestructiveSave,
  shouldAdoptExternalSave,
  secondsUntilNextSave,
} from '~/utils/autosave'

const record = (content: string, savedAt = 1_000) =>
  JSON.stringify({ content, savedAt, version: AUTOSAVE_VERSION })

describe('parseSavedRecord', () => {
  it('reads a well-formed record', () => {
    expect(parseSavedRecord(record('# Report', 42))).toEqual({
      content: '# Report',
      savedAt: 42,
      version: AUTOSAVE_VERSION,
    })
  })

  it('returns null for absent storage', () => {
    expect(parseSavedRecord(null)).toBeNull()
  })

  it('returns null for content that is not a string', () => {
    expect(parseSavedRecord(JSON.stringify({ content: 42, savedAt: 1, version: 1 }))).toBeNull()
  })

  it('returns null for malformed JSON rather than throwing', () => {
    expect(parseSavedRecord('{ not json')).toBeNull()
  })

  it('returns null for a record written by a newer version of the app', () => {
    // The shape is not knowable, so reading it as if it were current risks
    // showing the author something other than what they wrote.
    expect(parseSavedRecord(JSON.stringify({ content: 'x', savedAt: 1, version: 99 }))).toBeNull()
  })

  it('accepts a record with no version, from before versions were checked', () => {
    const parsed = parseSavedRecord(JSON.stringify({ content: 'legacy', savedAt: 7 }))
    expect(parsed?.content).toBe('legacy')
  })

  it('substitutes a usable timestamp when the record carries none', () => {
    const parsed = parseSavedRecord(JSON.stringify({ content: 'x' }))
    expect(Number.isFinite(parsed?.savedAt)).toBe(true)
  })
})

describe('isDestructiveSave', () => {
  it('refuses to replace saved work with an empty document', () => {
    expect(isDestructiveSave('', parseSavedRecord(record('# Report')))).toBe(true)
  })

  it('refuses to replace saved work with whitespace', () => {
    expect(isDestructiveSave('   \n\t ', parseSavedRecord(record('# Report')))).toBe(true)
  })

  it('allows an empty save when nothing is stored yet', () => {
    expect(isDestructiveSave('', null)).toBe(false)
  })

  it('allows an empty save over an already-empty record', () => {
    expect(isDestructiveSave('', parseSavedRecord(record('')))).toBe(false)
  })

  it('allows any non-empty save', () => {
    expect(isDestructiveSave('a', parseSavedRecord(record('# Report')))).toBe(false)
  })
})

describe('shouldAdoptExternalSave', () => {
  const incoming = parseSavedRecord(record('written in the other tab'))

  it('adopts another tab’s save when this tab has nothing unsaved', () => {
    expect(shouldAdoptExternalSave(incoming, {
      content: 'older text',
      lastSavedContent: 'older text',
    })).toBe(true)
  })

  it('keeps this tab’s work when it has unsaved edits', () => {
    // Adopting here would destroy whatever the author is in the middle of.
    expect(shouldAdoptExternalSave(incoming, {
      content: 'half-finished sentence',
      lastSavedContent: 'older text',
    })).toBe(false)
  })

  it('does nothing when the other tab saved what this tab already shows', () => {
    expect(shouldAdoptExternalSave(incoming, {
      content: 'written in the other tab',
      lastSavedContent: 'written in the other tab',
    })).toBe(false)
  })

  it('never adopts an empty document', () => {
    expect(shouldAdoptExternalSave(parseSavedRecord(record('')), {
      content: 'real work',
      lastSavedContent: 'real work',
    })).toBe(false)
  })

  it('ignores an unreadable record', () => {
    expect(shouldAdoptExternalSave(null, {
      content: 'real work',
      lastSavedContent: 'real work',
    })).toBe(false)
  })

  it('adopts when this tab has never saved and is showing untouched content', () => {
    expect(shouldAdoptExternalSave(incoming, {
      content: 'untouched',
      lastSavedContent: null,
    })).toBe(false)
  })
})

describe('secondsUntilNextSave', () => {
  const INTERVAL = 30_000

  it('counts down from the last save', () => {
    expect(secondsUntilNextSave(10_000, 10_000, INTERVAL)).toBe(30)
    expect(secondsUntilNextSave(10_000, 20_000, INTERVAL)).toBe(20)
  })

  it('never reports a negative countdown', () => {
    expect(secondsUntilNextSave(10_000, 999_999, INTERVAL)).toBe(0)
  })

  it('reports a full interval before the first save', () => {
    expect(secondsUntilNextSave(null, 10_000, INTERVAL)).toBe(30)
  })

  it('rounds up so it never claims a save is due while one is still pending', () => {
    expect(secondsUntilNextSave(10_000, 10_001, INTERVAL)).toBe(30)
  })
})
