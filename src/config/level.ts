import { LEVEL_ROWS, LEVEL_COLS, TILE, type Tile } from './GameConfig'

// Authored facility maps. Same vocabulary, one per mission:
// '#' wall · '.' floor · P player spawn · E extraction door ·
// F fragment (80 cr) · V vault jackpot · C bonus cache.
export const LEVEL_MAP: string[] = [
  '#########################', // row 0
  '#....#.......#....#....C#', // row 1
  '#.F.....F......F..#.....#', // row 2
  '#....................V..#', // row 3
  '#....#.......#..........#', // row 4
  '##..####..#####..########', // row 5
  '#.................#.....#', // row 6
  '#..................######', // row 7
  '#..................######', // row 8
  '#E......#.....#....######', // row 9
  '#EP.....#.....#....######', // row 10
  '#E......#.....#....######', // row 11
  '#..................######', // row 12
  '#....#####..####.########', // row 13
  '######.......#.....######', // row 14
  '######.......#.....######', // row 15
  '######.......#.....######', // row 16
  '######...F...#..F..######', // row 17
  '######.......#.....######', // row 18
  '#########################', // row 19
]

// MISSION 02 — MERIDIAN-9 BLACKSITE. Denser blacksite: laser-gated vault room
// (NE), an NW cache pocket, a full-height west extraction corridor with a
// patrolling guard lane, a two-pillar atrium with a long laser barrier, and
// south-east data racks behind a two-cell blink door. Verify with
// missions.test.ts (counts, floor placement, routes/lasers over floor).
export const MERIDIAN_9_MAP: string[] = [
  '#########################', // row 0
  '#.C#........F.....#.....#', // row 1
  '#..#..................V.#', // row 2
  '##.#....................#', // row 3
  '#...#.............#.....#', // row 4
  '#...#.............#######', // row 5
  '#...#.....#.....F.......#', // row 6
  '#...#...................#', // row 7
  '#...#.F.................#', // row 8
  '#E..#.........#.........#', // row 9
  '#E......................#', // row 10
  '#E......................#', // row 11
  '#...#...................#', // row 12
  '#...#.............#######', // row 13
  '#...#.............#.....#', // row 14
  '#......#####............#', // row 15
  '#...#...............F...#', // row 16
  '#...#..F..........#.....#', // row 17
  '#.P.#.............#######', // row 18
  '#########################', // row 19
]

export interface LevelData {
  walls: boolean[][]
  playerSpawn: Tile
  extractionTiles: Tile[]
  fragments: Tile[]
  vault: Tile
  cache: Tile
}

function requireSingle(rows: Tile[], what: string): Tile {
  if (rows.length !== 1) throw new Error(`level map must contain exactly one ${what}, found ${rows.length}`)
  return rows[0]
}

function requireCount(rows: Tile[], count: number, what: string): void {
  if (rows.length !== count) throw new Error(`level map must contain exactly ${count} ${what}, found ${rows.length}`)
}

export function buildLevelData(map: string[] = LEVEL_MAP): LevelData {
  if (map.length !== LEVEL_ROWS) {
    throw new Error(`level map must have ${LEVEL_ROWS} rows, found ${map.length}`)
  }

  const walls: boolean[][] = []
  map.forEach((line, row) => {
    if (line.length !== LEVEL_COLS) {
      throw new Error(`level map row ${row} must have ${LEVEL_COLS} chars, found ${line.length}`)
    }
    walls.push([...line].map((ch) => ch === '#'))
  })

  const fragments: Tile[] = []
  const extractionTiles: Tile[] = []
  const vaults: Tile[] = []
  const caches: Tile[] = []
  let playerSpawn: Tile | null = null

  map.forEach((line, row) => {
    [...line].forEach((ch, col) => {
      switch (ch) {
        case 'P':
          playerSpawn = { row, col }
          break
        case 'E':
          extractionTiles.push({ row, col })
          break
        case 'F':
          fragments.push({ row, col })
          break
        case 'V':
          vaults.push({ row, col })
          break
        case 'C':
          caches.push({ row, col })
          break
        default:
          break
      }
    })
  })

  const playerSpawnTile = playerSpawn

  requireCount(fragments, 5, 'fragments (F)')
  requireCount(extractionTiles, 3, 'extraction tiles (E)')
  if (!playerSpawnTile) throw new Error('level map must contain a player spawn (P)')

  return {
    walls,
    playerSpawn: playerSpawnTile,
    extractionTiles,
    fragments,
    vault: requireSingle(vaults, 'vault (V)'),
    cache: requireSingle(caches, 'cache (C)'),
  }
}

export function tileToPx(t: Tile): { x: number; y: number } {
  return { x: t.col * TILE + TILE / 2, y: t.row * TILE + TILE / 2 }
}
