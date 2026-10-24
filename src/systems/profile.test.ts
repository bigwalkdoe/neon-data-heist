import { describe, it, expect } from 'vitest'
import {
  defaultProfile,
  loadProfile,
  saveProfile,
  applyWin,
  PROFILE_KEY,
  type StorageLike,
} from './profile'

function mockStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
}

describe('loadProfile', () => {
  it('returns a fresh profile when storage is empty', () => {
    const s = mockStorage()
    expect(loadProfile(s)).toEqual({ unlockedThrough: 0, best: {} })
  })

  it('returns a fresh profile when the stored payload is corrupted', () => {
    const s = mockStorage({ [PROFILE_KEY]: '{not json' })
    expect(loadProfile(s)).toEqual({ unlockedThrough: 0, best: {} })
  })

  it('returns a fresh profile when the payload has the wrong shape', () => {
    const s = mockStorage({ [PROFILE_KEY]: JSON.stringify({ unlockedThrough: 'x', best: 7 }) })
    expect(loadProfile(s)).toEqual({ unlockedThrough: 0, best: {} })
  })

  it('round-trips a valid stored profile', () => {
    const stored = { unlockedThrough: 1, best: { 'kyoshi-delta-vault': 620 } }
    const s = mockStorage({ [PROFILE_KEY]: JSON.stringify(stored) })
    expect(loadProfile(s)).toEqual(stored)
  })
})

describe('applyWin', () => {
  it('records the best score and unlocks the next mission', () => {
    const p = defaultProfile()
    const { profile, isNewBest } = applyWin(p, 'kyoshi-delta-vault', 620, 0)
    expect(isNewBest).toBe(true)
    expect(profile.best['kyoshi-delta-vault']).toBe(620)
    expect(profile.unlockedThrough).toBe(1)
  })

  it('keeps the higher score across repeated wins', () => {
    const p = defaultProfile()
    const { profile: after620 } = applyWin(p, 'kyoshi-delta-vault', 620, 0)
    const second = applyWin(after620, 'kyoshi-delta-vault', 940, 0)
    expect(second.isNewBest).toBe(true)
    expect(second.profile.best['kyoshi-delta-vault']).toBe(940)
    const third = applyWin(second.profile, 'kyoshi-delta-vault', 300, 0)
    expect(third.isNewBest).toBe(false)
    expect(third.profile.best['kyoshi-delta-vault']).toBe(940)
  })

  it('tracks bests per mission independently', () => {
    const p = defaultProfile()
    const { profile: p2 } = applyWin(p, 'kyoshi-delta-vault', 600, 0)
    const { profile, isNewBest } = applyWin(p2, 'meridian-9-blacksite', 700, 1)
    expect(isNewBest).toBe(true)
    expect(profile.best).toEqual({ 'kyoshi-delta-vault': 600, 'meridian-9-blacksite': 700 })
  })

  it('does not unlock beyond missions that exist', () => {
    const p = defaultProfile()
    const { profile } = applyWin(p, 'meridian-9-blacksite', 700, 1)
    expect(profile.unlockedThrough).toBe(2)
  })
})

describe('saveProfile', () => {
  it('writes the profile as JSON under the agreed key', () => {
    const s = mockStorage()
    const p = { unlockedThrough: 1, best: { 'kyoshi-delta-vault': 620 } }
    saveProfile(s, p)
    expect(s.data.get(PROFILE_KEY)).toBe(JSON.stringify(p))
  })

  it('swallows storage failures', () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }
    expect(() => saveProfile(failing, defaultProfile())).not.toThrow()
  })
})
