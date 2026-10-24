import { describe, it, expect } from 'vitest'
import { MISSIONS, getMission } from './missions'
import { buildLevelData } from './level'
import { LEVEL_ROWS, LEVEL_COLS, type Tile } from './GameConfig'

const REQUIRED_FRAGMENTS = 5
const REQUIRED_EXTRACTION = 3

describe('MISSIONS registry', () => {
  it('has exactly two missions in order, with unique ids and planned names', () => {
    expect(MISSIONS.length).toBe(2)
    const ids = MISSIONS.map((m) => m.id)
    expect(new Set(ids).size).toBe(MISSIONS.length)
    expect(MISSIONS[0].id).toBe('kyoshi-delta-vault')
    expect(MISSIONS[0].name).toBe('KYOSHI-DELTA VAULT')
    expect(MISSIONS[1].id).toBe('meridian-9-blacksite')
    expect(MISSIONS[1].name).toBe('MERIDIAN-9 BLACKSITE')
  })

  it('getMission resolves by id and throws on unknown id', () => {
    expect(getMission('meridian-9-blacksite')).toBe(MISSIONS[1])
    expect(() => getMission('nope')).toThrow()
  })

  it('every mission map is 20 rows of 25 chars', () => {
    for (const m of MISSIONS) {
      expect(m.map.length, m.id).toBe(LEVEL_ROWS)
      for (const [row, line] of m.map.entries()) {
        expect(line.length, `${m.id} row ${row}`).toBe(LEVEL_COLS)
      }
    }
  })

  it('every mission keeps the authored layout contract (1P / 3E / 5F / 1V / 1C)', () => {
    for (const m of MISSIONS) {
      const lvl = buildLevelData(m.map)
      expect(lvl.playerSpawn, m.id).toBeDefined()
      expect(lvl.extractionTiles.length, m.id).toBe(REQUIRED_EXTRACTION)
      expect(lvl.fragments.length, m.id).toBe(REQUIRED_FRAGMENTS)
    }
  })

  it('specials sit on floor in every mission', () => {
    for (const m of MISSIONS) {
      const lvl = buildLevelData(m.map)
      const specials = [
        lvl.playerSpawn,
        lvl.vault,
        lvl.cache,
        ...lvl.extractionTiles,
        ...lvl.fragments,
      ]
      for (const t of specials) {
        expect(lvl.walls[t.row][t.col], `${m.id} ${t.row},${t.col}`).toBe(false)
      }
    }
  })

  it('outer border is solid wall in every mission', () => {
    for (const m of MISSIONS) {
      const lvl = buildLevelData(m.map)
      for (let c = 0; c < LEVEL_COLS; c++) {
        expect(lvl.walls[0][c], `${m.id} top r0 c${c}`).toBe(true)
        expect(lvl.walls[LEVEL_ROWS - 1][c], `${m.id} bottom c${c}`).toBe(true)
      }
      for (let r = 0; r < LEVEL_ROWS; r++) {
        expect(lvl.walls[r][0], `${m.id} left r${r}`).toBe(true)
        expect(lvl.walls[r][LEVEL_COLS - 1], `${m.id} right c24 r${r}`).toBe(true)
      }
    }
  })

  it('every drone route point is floor and in bounds in its own mission', () => {
    for (const m of MISSIONS) {
      const lvl = buildLevelData(m.map)
      for (const route of m.routes) {
        for (const p of route.pts) {
          expect(p.row >= 0 && p.row < LEVEL_ROWS, `${m.id} route r${p.row}`).toBe(true)
          expect(p.col >= 0 && p.col < LEVEL_COLS, `${m.id} route c${p.col}`).toBe(true)
          expect(lvl.walls[p.row][p.col], `${m.id} route ${p.row},${p.col}`).toBe(false)
        }
      }
    }
  })

  it('every laser strip runs over floor cells inside the map', () => {
    for (const m of MISSIONS) {
      const lvl = buildLevelData(m.map)
      for (const l of m.lasers) {
        expect(l.col, `${m.id} laser col ${l.col}`).toBeGreaterThan(0)
        expect(l.col, `${m.id} laser col ${l.col}`).toBeLessThan(LEVEL_COLS - 1)
        expect(l.rowStart, `${m.id} laser ${l.col} rowStart`).toBeGreaterThanOrEqual(0)
        expect(l.rowEnd, `${m.id} laser ${l.col} rowEnd`).toBeLessThan(LEVEL_ROWS)
        expect(l.rowStart, `${m.id} laser ${l.col} ordering`).toBeLessThanOrEqual(l.rowEnd)
        for (let row = l.rowStart; row <= l.rowEnd; row++) {
          expect(lvl.walls[row][l.col], `${m.id} laser cell ${row},${l.col}`).toBe(false)
        }
      }
    }
  })

  it('mission 02 security is denser than mission 01', () => {
    const m1 = MISSIONS[0]
    const m2 = MISSIONS[1]
    const m1Normal = m1.routes.filter((r) => !r.wave2).length
    const m2Normal = m2.routes.filter((r) => !r.wave2).length
    const m1Wave2 = m1.routes.filter((r) => r.wave2).length
    const m2Wave2 = m2.routes.filter((r) => r.wave2).length
    expect(m2Normal).toBeGreaterThan(m1Normal)
    expect(m2Wave2).toBeGreaterThan(m1Wave2)
    expect(m2.lasers.length).toBeGreaterThan(m1.lasers.length)
  })

  it('mission 01 content is preserved exactly (no accidental redesign)', () => {
    const m1 = MISSIONS[0]
    const lvl = buildLevelData(m1.map)
    expect(lvl.extractionTiles).toEqual([
      { row: 9, col: 1 },
      { row: 10, col: 1 },
      { row: 11, col: 1 },
    ] satisfies Tile[])
    expect(lvl.playerSpawn).toEqual({ row: 10, col: 2 })
    expect(m1.lasers).toHaveLength(2)
    expect(m1.routes.filter((r) => !r.wave2)).toHaveLength(3)
  })
})
