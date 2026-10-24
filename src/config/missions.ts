import type { DroneRoute, LaserSpec } from './GameConfig'
import { LEVEL_MAP, MERIDIAN_9_MAP } from './level'

// Per-mission content registry: every mission is a (map, lasers, routes)
// triple over the shared ruleset. Shared tunables (speeds, heat, vision)
// stay in GameConfig.ts; only mission content lives here.
export interface MissionDef {
  /** Stable id, doubles as the profile best-score key. */
  id: string
  /** Facility name, shown on the mission select and result overlays. */
  name: string
  map: string[]
  lasers: LaserSpec[]
  routes: DroneRoute[]
}

// MISSION 01 — KYOSHI-DELTA VAULT: the original authored facility, data
// moved verbatim from GameConfig when the registry landed.
export const KYOSHI_DELTA_VAULT: MissionDef = {
  id: 'kyoshi-delta-vault',
  name: 'KYOSHI-DELTA VAULT',
  map: LEVEL_MAP,
  lasers: [
    // Hall mid barrier.
    { col: 11, rowStart: 7, rowEnd: 12, ON_MS: 1600, OFF_MS: 2400, PHASE: 0 },
    // Vault doorway.
    { col: 18, rowStart: 3, rowEnd: 4, ON_MS: 1200, OFF_MS: 2800, PHASE: 800 },
  ],
  routes: [
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
  ],
}

// MISSION 02 — MERIDIAN-9 BLACKSITE: same ruleset, denser security
// (4 wave-1 routes, 3 wave-2, 3 faster laser strips).
export const MERIDIAN_9_BLACKSITE: MissionDef = {
  id: 'meridian-9-blacksite',
  name: 'MERIDIAN-9 BLACKSITE',
  map: MERIDIAN_9_MAP,
  lasers: [
    // Vault gate, NE room doorway (west approach lane patrolled by R4).
    { col: 18, rowStart: 2, rowEnd: 3, ON_MS: 1100, OFF_MS: 2600, PHASE: 500 },
    // Atrium mid barrier, six cells tall; R6 sweep runs parallel at col 12.
    { col: 11, rowStart: 6, rowEnd: 11, ON_MS: 1400, OFF_MS: 2200, PHASE: 0 },
    // Racks door, two-cell blink — tight window into the south-east cache.
    { col: 18, rowStart: 15, rowEnd: 16, ON_MS: 900, OFF_MS: 2000, PHASE: 1200 },
  ],
  routes: [
    // R1: atrium rectangle (rows 5/11 lanes; pillars at (6,10) and (9,14) sit clear of legs).
    { pts: [{ row: 5, col: 6 }, { row: 5, col: 15 }, { row: 11, col: 15 }, { row: 11, col: 6 }], loop: true },
    // R2: north corridor sweeper, over fragments and the vault gate approach.
    { pts: [{ row: 1, col: 5 }, { row: 1, col: 16 }], loop: true },
    // R3: extraction corridor guard, col-2 lane; spawn ({row:18,col:2}) keeps
    // ≥140px from every waypoint and every southward-facing segment (lane ends at row 12).
    { pts: [{ row: 8, col: 2 }, { row: 12, col: 2 }], loop: true },
    // R4: vault door guard — full north-south lane along the room's west wall.
    { pts: [{ row: 2, col: 17 }, { row: 9, col: 17 }], loop: true },
    // R5: racks perimeter sweep inside the south-east data yard (wave 2).
    { pts: [{ row: 14, col: 19 }, { row: 14, col: 23 }, { row: 17, col: 23 }, { row: 17, col: 19 }], loop: true, wave2: true },
    // R6: central vertical sweep parallel to the atrium laser barrier (wave 2).
    { pts: [{ row: 5, col: 12 }, { row: 11, col: 12 }], loop: true, wave2: true },
    // R7: south atrium lane sweeper, cuts the shelf-run approach (wave 2).
    { pts: [{ row: 12, col: 9 }, { row: 12, col: 16 }], loop: true, wave2: true },
  ],
}

export const MISSIONS: MissionDef[] = [KYOSHI_DELTA_VAULT, MERIDIAN_9_BLACKSITE]

// Wave-2 escalation source: the routes flagged wave2 for a facility. DroneSystem
// must derive wave-2 spawns from the routes given to it, never a global.
export function wave2Routes(routes: DroneRoute[]): DroneRoute[] {
  return routes.filter((r) => r.wave2)
}

export function getMission(id: string): MissionDef {
  const m = MISSIONS.find((mission) => mission.id === id)
  if (!m) throw new Error(`unknown mission id: ${id}`)
  return m
}
