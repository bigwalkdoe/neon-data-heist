import { describe, it, expect } from 'vitest'
import { MissionSystem, computeRunScore } from './mission-system'
import type { Tile } from '../config/GameConfig'

const FRAGS: Tile[] = [
  { row: 2, col: 2 },
  { row: 2, col: 8 },
  { row: 2, col: 15 },
  { row: 17, col: 9 },
  { row: 17, col: 16 },
]
const VAULT: Tile = { row: 3, col: 21 }
const CACHE: Tile = { row: 1, col: 23 }
const EXTRACTION: Tile[] = [
  { row: 9, col: 1 },
  { row: 10, col: 1 },
  { row: 11, col: 1 },
]

function fresh(): MissionSystem {
  return new MissionSystem(FRAGS, VAULT, CACHE, EXTRACTION)
}

describe('computeRunScore', () => {
  it('credits + cold-escape bonus at max score fitness', () => {
    expect(computeRunScore(900, 80)).toEqual({ credits: 900, bonus: 40, total: 940 })
  })

  it('burning to 100 percent forfeits the cold bonus', () => {
    expect(computeRunScore(1500, 100)).toEqual({ credits: 1500, bonus: 0, total: 1500 })
  })

  it('clamps out-of-range heat before scoring', () => {
    expect(computeRunScore(400, -10)).toEqual({ credits: 400, bonus: 200, total: 600 })
    expect(computeRunScore(400, 120)).toEqual({ credits: 400, bonus: 0, total: 400 })
  })
})

describe('MissionSystem pickups', () => {
  it('collecting a fragment returns its kind, credits and heat cost', () => {
    const m = fresh()
    expect(m.collect({ row: 2, col: 2 })).toEqual({
      kind: 'fragment',
      credits: 80,
      heatCost: 12,
    })
    expect(m.creditsStolen).toBe(80)
    expect(m.fragmentCount).toBe(1)
  })

  it('double-collect and empty tiles return null', () => {
    const m = fresh()
    expect(m.collect({ row: 2, col: 2 })).not.toBeNull()
    expect(m.collect({ row: 2, col: 2 })).toBeNull()
    expect(m.collect({ row: 5, col: 5 })).toBeNull()
  })

  it('full haul: 5 fragments + vault + cache = 1500', () => {
    const m = fresh()
    for (const f of FRAGS) m.collect(f)
    expect(m.creditsStolen).toBe(400)
    expect(m.collect(VAULT)).toEqual({ kind: 'vault', credits: 500, heatCost: 20 })
    expect(m.collect(CACHE)).toEqual({ kind: 'cache', credits: 600, heatCost: 20 })
    expect(m.creditsStolen).toBe(1500)
    expect(m.fragmentCount).toBe(5)
  })

  it('extraction requires carrying something', () => {
    const m = fresh()
    expect(m.canExtract()).toBe(false)
    m.collect(FRAGS[0])
    expect(m.canExtract()).toBe(true)
  })
})

describe('MissionSystem outcomes', () => {
  it('win scores the haul plus cold-escape bonus', () => {
    const m = fresh()
    m.collect(FRAGS[0])
    m.collect(VAULT) // 580 credits carried
    const r = m.win(80)
    expect(r.outcome).toBe('WON')
    expect(r.credits).toBe(580)
    expect(r.bonus).toBe(40)
    expect(r.total).toBe(620)
    expect(r.reason).toBeUndefined()
  })

  it('lose zeroes the haul and carries the reason', () => {
    const m = fresh()
    m.collect(FRAGS[0])
    const r = m.lose('caught')
    expect(r).toEqual({ outcome: 'LOST', credits: 0, bonus: 0, total: 0, reason: 'caught' })
  })

  it('terminal outcome makes further collect/win/lose no-ops', () => {
    const m = fresh()
    const lost = m.lose('caught')
    expect(m.collect(FRAGS[0])).toBeNull()
    expect(m.win(0)).toEqual(lost)
    expect(m.lose('lockdown')).toEqual(lost)
  })
})

describe('MissionSystem terminal routing', () => {
  const FRAGS2 = [{ row: 2, col: 2 }]
  const VAULT2 = { row: 3, col: 21 }
  const CACHE2 = { row: 1, col: 23 }
  const EXTRACTION2 = [{ row: 10, col: 1 }]

  it('lockdown beats same-tick contact', () => {
    const m = new MissionSystem(FRAGS2, VAULT2, CACHE2, EXTRACTION2)
    expect(m.resolveOutcome({ caughtNow: true, lockdownExpired: true })).toBe('lockdown')
    expect(m.resolveOutcome({ caughtNow: true, lockdownExpired: false })).toBe('caught')
    expect(m.resolveOutcome({ caughtNow: false, lockdownExpired: false })).toBeNull()
  })
})
