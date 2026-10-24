import { HEAT, CREDITS, SCORE, type Tile } from '../config/GameConfig'

export interface RunResult {
  outcome: 'WON' | 'LOST'
  credits: number
  bonus: number
  total: number
  reason?: 'caught' | 'lockdown'
}

export type PickupKind = 'fragment' | 'vault' | 'cache' | 'upgrade'

export interface CollectResult {
  kind: PickupKind
  credits: number
  heatCost: number
}

// Score = credits kept + cold-escape bonus for escaping with heat headroom.
export function computeRunScore(
  credits: number,
  heatPctAtEscape: number,
): { credits: number; bonus: number; total: number } {
  const cappedHeat = Math.min(100, Math.max(0, heatPctAtEscape))
  const bonus = Math.round((100 - cappedHeat) * SCORE.COLD_ESCAPE_PER_PCT)
  return { credits, bonus, total: credits + bonus }
}

// Pure run rules: pickups on the map, the haul, win/lose resolution.
export class MissionSystem {
  private readonly pickups: Map<string, { kind: PickupKind; credits: number; heatCost: number }>
  private carriedCredits = 0
  private frags = 0
  private readonly extractionTiles: Tile[]
  private terminal: RunResult | null = null

  constructor(
    fragments: Tile[],
    vault: Tile,
    cache: Tile,
    extractionTiles: Tile[],
    upgrades: Tile[] = [],
  ) {
    this.pickups = new Map()
    for (const f of fragments) {
      this.pickups.set(key(f), { kind: 'fragment', credits: CREDITS.FRAGMENT, heatCost: HEAT.FRAGMENT })
    }
    this.pickups.set(key(vault), { kind: 'vault', credits: CREDITS.VAULT, heatCost: HEAT.VAULT })
    this.pickups.set(key(cache), { kind: 'cache', credits: CREDITS.CACHE, heatCost: HEAT.CACHE })
    for (const u of upgrades) {
      this.pickups.set(key(u), { kind: 'upgrade', credits: 0, heatCost: 0 })
    }
    this.extractionTiles = extractionTiles
  }

  collect(tile: Tile): CollectResult | null {
    if (this.terminal) return null
    const k = key(tile)
    const pickup = this.pickups.get(k)
    if (!pickup) return null
    this.pickups.delete(k)
    this.carriedCredits += pickup.credits
    if (pickup.kind === 'fragment') this.frags += 1
    return { kind: pickup.kind, credits: pickup.credits, heatCost: pickup.heatCost }
  }

  get creditsStolen(): number {
    return this.carriedCredits
  }

  get fragmentCount(): number {
    return this.frags
  }

  canExtract(): boolean {
    return this.carriedCredits > 0
  }

  isExtraction(tile: Tile): boolean {
    return this.extractionTiles.some(
      (t) => t.row === tile.row && t.col === tile.col,
    )
  }

  hasCollected(tile: Tile): boolean {
    return !this.pickups.has(key(tile))
  }

  get remainingPickups(): number {
    return this.pickups.size
  }

  // Precedence pinned by the plan's Review Focus #5: lockdown beats contact.
  resolveOutcome(input: {
    caughtNow: boolean
    lockdownExpired: boolean
  }): 'lockdown' | 'caught' | null {
    if (this.terminal) return null
    if (input.lockdownExpired) return 'lockdown'
    if (input.caughtNow) return 'caught'
    return null
  }

  win(heatPctAtEscape: number): RunResult {
    if (this.terminal) return this.terminal
    const score = computeRunScore(this.carriedCredits, heatPctAtEscape)
    this.terminal = { outcome: 'WON', ...score }
    return this.terminal
  }

  lose(reason: 'caught' | 'lockdown'): RunResult {
    if (this.terminal) return this.terminal
    this.terminal = { outcome: 'LOST', credits: 0, bonus: 0, total: 0, reason }
    return this.terminal
  }
}

function key(t: Tile): string {
  return `${t.row}:${t.col}`
}
