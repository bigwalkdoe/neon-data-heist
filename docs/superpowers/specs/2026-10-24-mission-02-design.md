# MISSION 02 — MERIDIAN-9 BLACKSITE (milestone design)

The plan referenced by code comments was never committed and is not recoverable.
Its trajectory lives in the code: the menu names "MISSION 01", the config is
built data-driven for a sequence of jobs, and every planned run item
(Review Focus #1/#5, B6 result overlay) is implemented. Continuing that plan
means the next milestone: **a second, harder mission plus the progression
meta that gets players to it.**

## Intent and why

NEON DATA HEIST is an arcade score-chaser: a single run is a quick,
optimized loop (haul + cold-escape bonus). The game currently ends after one
facility. A numbered "MISSION 01" with nothing behind it reads as an
unfinished sequence. This milestone delivers the second job and the meta layer
that makes finishing Mission 01 mean something.

## Goals

- MISSION 02 — "MERIDIAN-9 BLACKSITE": same ruleset, denser security.
  4 wave-1 + 3 wave-2 drone routes (prior: 3 + 2), 3 laser strips with faster
  timing windows (prior: 2). Difficulty escalates through geometry, density
  and timing — never through new rules.
- Mission progression: Mission 02 unlocks by winning Mission 01. Win on
  Mission 02 shows "ALL DATA SECURED" (no next mission yet).
- Per-mission best score persists across sessions (localStorage).
- Menu mission select: locked rows inert, unlocked rows selectable by click
  and by W/S or arrows + ENTER/SPACE. Options are: start, select, read bests.

## Non-goals

- No new mechanics, tiles, enemy types, or audio this milestone.
- No difficulty tuning of shared constants (HEAT, VISION, DRONE_SPEED stay global).
- No changes to the score formula or mission 01's authored content.

## Anti-goals

- Regressing Mission 01: its map, routes, lasers, and pinned tests must remain
  byte-identical in behavior. level.test.ts keeps passing unmodified.
- Magic numbers outside config: mission 02's security data lives in
  `src/config/missions.ts` (per-mission content), shared tunables stay in
  `GameConfig.ts` (explicitly commented as designed by prior session).

## Decided parts (as decided in this session)

- `MissionDef { id, name, map, lasers, routes }` registry (`MISSIONS`) in
  `src/config/missions.ts`; maps (authored data) live in `level.ts`;
  `buildLevelData(map = LEVEL_MAP)` gains a map parameter.
- `LaserSystem` takes its `LaserSpec[]` as a parameter (it currently imports
  the global `LASERS`).
- Bug fix while generalizing: `DroneSystem.spawnWave2IfDue()` reads the global
  `DRONE_ROUTES`; it must spawn wave 2 from the routes given to its
  constructor. Global import removed.
- `HeistScene.init(data.missionId)` selects the mission; `Item` tracking:
  win calls `recordWin(profile, missionId, total, missionIndex)` then overlays
  "NEW BEST ▸ ..." / "NEXT: MISSION 02 — <name>" and binds N to next.
- Profile storage contract: `{ getItem, setItem }` injected (localStorage in
  the app, mock in tests), JSON under `neon-data-heist:profile:v1`,
  shape `{ unlocked: number, best: Record<missionId, number> }`; corrupted
  payloads fall back to defaults. `profile.ts` is pure and does not import
  Phaser or config.

## Left to the builder

- Exact blacksite geometry (20×25, same '# . P E F V C' vocabulary), route
  waypoints, laser strip placement/phase. Constraints: counts per map remain
  1 P, 3 E, 5 F, 1 V, 1 C; specials on floor; every route point on floor;
  every laser strip runs over floor cells; vault/cache pockets gated by
  lasers or guard routes.
- Result/menu micro-copy and palette accents (reuse COLORS).
