// Single source of truth for every tunable value in Neon Data Heist.
// Scenes must read these — no magic numbers outside this file.

export const TILE = 32
export const LEVEL_ROWS = 20
export const LEVEL_COLS = 25
export const PLAYER_SPEED = 160

export const DRONE_SPEED = {
  PATROL: 70,
  ALERT: 130,
  WAVE2_PATROL: 80,
  WAVE2_ALERT: 140,
} as const

export const VISION = {
  RADIUS_PX: 140,
  HALF_ANGLE_DEG: 45,
  CONTACT_PX: 24,
  FRENZY_RADIUS_MULT: 1.15,
  ALERT_PURSUIT_MS: 4000,
} as const

export const HEAT = {
  PASSIVE_PER_S: 0.5,
  FRAGMENT: 12,
  VAULT: 20,
  CACHE: 20,
  SPOTTED: 25,
  LASER: 40,
  WAVE2_AT: 50,
  LASER_FRENZY_AT: 75,
  LOCKDOWN_AT: 100,
  LOCKDOWN_GRACE_S: 15,
} as const

export const CREDITS = {
  FRAGMENT: 80,
  VAULT: 500,
  CACHE: 600,
} as const

// Cold-escape bonus = round((100 − heatAtEscape) × per-pct), max 200.
export const SCORE = {
  COLD_ESCAPE_PER_PCT: 2,
} as const

export interface Tile {
  row: number
  col: number
}

export interface LaserSpec {
  col: number
  rowStart: number
  rowEnd: number
  ON_MS: number
  OFF_MS: number
  PHASE: number
}

export interface DroneRoute {
  pts: Tile[]
  loop: true
  wave2?: boolean
}

export const LASERS: LaserSpec[] = [
  // Hall mid barrier.
  { col: 11, rowStart: 7, rowEnd: 12, ON_MS: 1600, OFF_MS: 2400, PHASE: 0 },
  // Vault doorway.
  { col: 18, rowStart: 3, rowEnd: 4, ON_MS: 1200, OFF_MS: 2800, PHASE: 800 },
]

export const DRONE_ROUTES: DroneRoute[] = [
  // D1: hall rectangle (rows 8/12 lanes; pillars sit at rows 9–10, legs clear them).
  { pts: [{ row: 8, col: 6 }, { row: 8, col: 17 }, { row: 12, col: 17 }, { row: 12, col: 6 }], loop: true },
  // D2: north corridor sweeper.
  { pts: [{ row: 6, col: 5 }, { row: 6, col: 17 }], loop: true },
  // D3: entry guard, col-4 lane rows 10-13; spawn ({row:10,col:2}) stays outside
  // the 45° vision wedge at every waypoint-facing (lane faces vertically).
  { pts: [{ row: 10, col: 4 }, { row: 13, col: 4 }], loop: true },
  // D4: vault guard on the room's south strip (spawns at heat ≥ WAVE2_AT).
  { pts: [{ row: 6, col: 19 }, { row: 6, col: 23 }], loop: true, wave2: true },
  // D5: hall center vertical sweep (spawns at heat ≥ WAVE2_AT).
  { pts: [{ row: 8, col: 12 }, { row: 12, col: 12 }], loop: true, wave2: true },
]

// Neon palette shared by BootScene texture generation and HUD.
export const COLORS = {
  pageBg: '#05070f',
  cyan: '#00e5ff',
  magenta: '#ff2bd6',
  floor: '#0b0f1c',
  wallInk: '#1b2340',
  wallEdge: '#00e5ff',
  warningRed: '#ff3b3b',
  hudText: '#bfe9ff',
} as const
