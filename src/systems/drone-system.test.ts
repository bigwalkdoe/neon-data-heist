import { describe, it, expect } from 'vitest'
import { isPlayerSeen } from './vision'

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
