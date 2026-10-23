import { describe, it, expect } from 'vitest'
import { buildLevelData, tileToPx } from './level'
import { LEVEL_ROWS, LEVEL_COLS, TILE, DRONE_ROUTES } from './GameConfig'

describe('buildLevelData', () => {
  it('map is 20 rows, every row 25 chars', () => {
    const lvl = buildLevelData()
    expect(lvl.walls.length).toBe(LEVEL_ROWS)
    for (const row of lvl.walls) expect(row.length).toBe(LEVEL_COLS)
  })

  it('walls array matches map structure', () => {
    const lvl = buildLevelData()
    // Outer borders fully walled.
    for (let c = 0; c < LEVEL_COLS; c++) {
      expect(lvl.walls[0][c]).toBe(true)
      expect(lvl.walls[LEVEL_ROWS - 1][c]).toBe(true)
    }
    for (let r = 0; r < LEVEL_ROWS; r++) {
      expect(lvl.walls[r][0]).toBe(true)
      expect(lvl.walls[r][LEVEL_COLS - 1]).toBe(true)
    }
    // Hall pillars (single-cell walls at rows 9–10, cols 8 and 14).
    expect(lvl.walls[9][8]).toBe(true)
    expect(lvl.walls[10][8]).toBe(true)
    expect(lvl.walls[9][14]).toBe(true)
    expect(lvl.walls[10][14]).toBe(true)
    // Room divider col 5 is solid except the rows 2–3 gap.
    expect(lvl.walls[1][5]).toBe(true)
    expect(lvl.walls[2][5]).toBe(false)
    expect(lvl.walls[3][5]).toBe(false)
    expect(lvl.walls[4][5]).toBe(true)
    // Vault door: col 18 open only at rows 3–4.
    expect(lvl.walls[2][18]).toBe(true)
    expect(lvl.walls[3][18]).toBe(false)
    expect(lvl.walls[4][18]).toBe(false)
    expect(lvl.walls[6][18]).toBe(true)
    // Hall→south gaps on row 13 at cols 10–11 and col 16.
    expect(lvl.walls[13][5]).toBe(true)
    expect(lvl.walls[13][10]).toBe(false)
    expect(lvl.walls[13][11]).toBe(false)
    expect(lvl.walls[13][12]).toBe(true)
    expect(lvl.walls[13][16]).toBe(false)
    expect(lvl.walls[13][17]).toBe(true)
    // Room A south wall row 5: wall at col 1, gap at cols 2–3.
    expect(lvl.walls[5][1]).toBe(true)
    expect(lvl.walls[5][2]).toBe(false)
    expect(lvl.walls[5][3]).toBe(false)
  })

  it('exactly 3 extraction tiles, 5 fragments, 1 vault, 1 cache, 1 playerSpawn at the contract tiles', () => {
    const lvl = buildLevelData()
    expect(lvl.extractionTiles).toEqual([
      { row: 9, col: 1 },
      { row: 10, col: 1 },
      { row: 11, col: 1 },
    ])
    expect(lvl.fragments).toEqual([
      { row: 2, col: 2 },
      { row: 2, col: 8 },
      { row: 2, col: 15 },
      { row: 17, col: 9 },
      { row: 17, col: 16 },
    ])
    expect(lvl.vault).toEqual({ row: 3, col: 21 })
    expect(lvl.cache).toEqual({ row: 1, col: 23 })
    expect(lvl.playerSpawn).toEqual({ row: 10, col: 2 })
  })

  it('pickup/spawn tiles are floor in walls[][]', () => {
    const lvl = buildLevelData()
    const specials = [
      lvl.playerSpawn,
      lvl.vault,
      lvl.cache,
      ...lvl.extractionTiles,
      ...lvl.fragments,
    ]
    for (const t of specials) expect(lvl.walls[t.row][t.col]).toBe(false)
  })

  it('every drone route point is floor', () => {
    const lvl = buildLevelData()
    for (const route of DRONE_ROUTES) {
      for (const p of route.pts) expect(lvl.walls[p.row][p.col]).toBe(false)
    }
  })
})

describe('tileToPx', () => {
  it('returns the tile center in world pixels', () => {
    expect(tileToPx({ row: 0, col: 0 })).toEqual({ x: TILE / 2, y: TILE / 2 })
    expect(tileToPx({ row: 10, col: 2 })).toEqual({
      x: 2 * TILE + TILE / 2,
      y: 10 * TILE + TILE / 2,
    })
  })
})
