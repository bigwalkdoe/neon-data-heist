import { describe, it, expect } from 'vitest'
import { isPlayerSeen } from './vision'
import { wave2Routes } from '../config/missions'
import type { DroneRoute } from '../config/GameConfig'

// Drone at origin facing east (0 rad), standard cone 140px / 45°.
const RADIUS = 140
const HALF_ANGLE_DEG = 45
const origin = { x: 0, y: 0 }

describe('isPlayerSeen', () => {
  it('sees the player straight ahead at the edge of the cone', () => {
    expect(isPlayerSeen(origin, 0, { x: 140, y: 0 }, RADIUS, HALF_ANGLE_DEG)).toBe(true)
  })

  it('does not see the player beyond the radius', () => {
    expect(isPlayerSeen(origin, 0, { x: 141, y: 0 }, RADIUS, HALF_ANGLE_DEG)).toBe(false)
  })

  it('sees the player inside the angular bound', () => {
    // 100px out, 44° off-axis (within 45°).
    const ang = (44 * Math.PI) / 180
    expect(
      isPlayerSeen(origin, 0, { x: 100 * Math.cos(ang), y: 100 * Math.sin(ang) }, RADIUS, HALF_ANGLE_DEG),
    ).toBe(true)
  })

  it('greedy ≤: exactly 45° off-axis is still seen', () => {
    const ang = (45 * Math.PI) / 180
    expect(
      isPlayerSeen(origin, 0, { x: 100 * Math.cos(ang), y: 100 * Math.sin(ang) }, RADIUS, HALF_ANGLE_DEG),
    ).toBe(true)
  })

  it('does not see the player outside the angular bound', () => {
    const ang = (46 * Math.PI) / 180
    expect(
      isPlayerSeen(origin, 0, { x: 100 * Math.cos(ang), y: 100 * Math.sin(ang) }, RADIUS, HALF_ANGLE_DEG),
    ).toBe(false)
  })

  it('does not see the player directly behind', () => {
    expect(isPlayerSeen(origin, 0, { x: -50, y: 0 }, RADIUS, HALF_ANGLE_DEG)).toBe(false)
  })
})

describe('wave2Routes', () => {
  const normal: DroneRoute = { pts: [{ row: 1, col: 1 }], loop: true }
  const wave2: DroneRoute = { pts: [{ row: 2, col: 2 }], loop: true, wave2: true }

  it('selects only routes flagged wave2', () => {
    expect(wave2Routes([normal, wave2, wave2])).toEqual([wave2, wave2])
  })

  it('is empty when no route escalates', () => {
    expect(wave2Routes([normal])).toEqual([])
  })
})
