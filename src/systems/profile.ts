// Session-to-session progression state: per-mission best scores and mission
// unlocks. Pure module — storage is injected (localStorage in the app, mocks
// in tests); no Phaser or config imports so scene glue stays testable.

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface Profile {
  /** Highest mission index playable without winning anything before it. */
  unlockedThrough: number
  /** Best total score per mission id. */
  best: Record<string, number>
}

export const PROFILE_KEY = 'neon-data-heist:profile:v1'

export function defaultProfile(): Profile {
  return { unlockedThrough: 0, best: {} }
}

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  if (typeof p.unlockedThrough !== 'number') return false
  if (typeof p.best !== 'object' || p.best === null) return false
  for (const v of Object.values(p.best as Record<string, unknown>)) {
    if (typeof v !== 'number') return false
  }
  return true
}

export function loadProfile(storage: StorageLike): Profile {
  try {
    const raw = storage.getItem(PROFILE_KEY)
    if (!raw) return defaultProfile()
    const parsed: unknown = JSON.parse(raw)
    if (!isProfile(parsed)) return defaultProfile()
    return parsed
  } catch {
    return defaultProfile()
  }
}

// Winning mission at index i grants access to index i+1. Score ties keep the
// earlier best (isNewBest requires strictly greater).
export function applyWin(
  profile: Profile,
  missionId: string,
  total: number,
  missionIndex: number,
): { profile: Profile; isNewBest: boolean } {
  const prevBest = profile.best[missionId]
  const isNewBest = prevBest === undefined || total > prevBest
  const best = { ...profile.best }
  if (isNewBest) best[missionId] = total
  const next = {
    unlockedThrough: Math.max(profile.unlockedThrough, missionIndex + 1),
    best,
  }
  return { profile: next, isNewBest }
}

export function saveProfile(storage: StorageLike, profile: Profile): void {
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // Persistent storage is best-effort; a full quota must never break a run.
  }
}
