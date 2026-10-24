import { describe, it, expect } from 'vitest'
import { HeatSystem, type HeatState } from './heat-system'
import { HEAT } from '../config/GameConfig'

function start(): HeatSystem {
  return new HeatSystem(HEAT)
}

describe('HeatSystem', () => {
  it('starts calm at 0 pct with full grace', () => {
    const h = start()
    expect(h.pct).toBe(0)
    expect(h.state).toBe<HeatState>('CALM')
    expect(h.lockdownGraceS).toBe(HEAT.LOCKDOWN_GRACE_S)
    expect(h.isLockdown()).toBe(false)
  })

  it('addHeat clamps at LOCKDOWN_AT (100) and never below zero', () => {
    const h = start()
    h.addHeat(120)
    expect(h.pct).toBe(100)
    h.addHeat(-500)
    expect(h.pct).toBe(0)
  })

  it('passive tick raises pct at PASSIVE_PER_S per second', () => {
    const h = start()
    h.tick(4)
    expect(h.pct).toBeCloseTo(4 * HEAT.PASSIVE_PER_S, 6) // ≈ 2
  })

  it('state thresholds hit at >= 50 / 75 / 100', () => {
    const h = start()
    h.addHeat(49.9)
    expect(h.state).toBe<HeatState>('CALM')
    h.addHeat(0.1)
    expect(h.state).toBe<HeatState>('SUSPICIOUS')
    h.addHeat(24.9)
    expect(h.state).toBe<HeatState>('SUSPICIOUS')
    h.addHeat(0.1)
    expect(h.state).toBe<HeatState>('ALERT')
    h.addHeat(24.9)
    expect(h.state).toBe<HeatState>('ALERT')
    h.addHeat(0.1)
    expect(h.state).toBe<HeatState>('LOCKDOWN')
    expect(h.isLockdown()).toBe(true)
  })

  it('lockdown grace starts at 15.0, counts down only during lockdown, stops at 0', () => {
    const h = start()
    h.tick(10)
    expect(h.lockdownGraceS).toBe(HEAT.LOCKDOWN_GRACE_S) // grace irrelevant pre-lockdown
    h.addHeat(100)
    expect(h.lockdownGraceS).toBe(15)
    h.tick(5)
    expect(h.lockdownGraceS).toBe(10)
    h.tick(10)
    expect(h.lockdownGraceS).toBe(0)
    h.tick(1)
    expect(h.lockdownGraceS).toBe(0)
    expect(h.isLockdown()).toBe(true)
  })

  it('addHeat then tick composes', () => {
    const h = start()
    h.addHeat(12)
    h.tick(2)
    expect(h.pct).toBeCloseTo(13, 6)
  })
})
