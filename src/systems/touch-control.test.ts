import { describe, it, expect } from 'vitest'
import { directionFromStick } from './touch-control'

describe('directionFromStick', () => {
  it('zero stick → zero direction', () => {
    expect(directionFromStick({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it('unit stick → unit direction', () => {
    expect(directionFromStick({ x: 30, y: 40 })).toEqual({ x: 0.6, y: 0.8 })
  })

  it('oversized stick resolves to its unit direction', () => {
    expect(directionFromStick({ x: 100, y: 0 })).toEqual({ x: 1, y: 0 })
  })
})
