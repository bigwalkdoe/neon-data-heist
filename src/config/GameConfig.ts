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
