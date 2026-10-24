import { HEAT } from '../config/GameConfig'

export type HeatState = 'CALM' | 'SUSPICIOUS' | 'ALERT' | 'LOCKDOWN'

type HeatCfg = typeof HEAT

// The mission clock. Heat rises passively and with every risky action;
// thresholds gate security escalation; LOCKDOWN starts the escape countdown.
export class HeatSystem {
  private cfg: HeatCfg
  private heatPct: number
  private graceS: number

  constructor(cfg: HeatCfg = HEAT) {
    this.cfg = cfg
    this.heatPct = 0
    this.graceS = cfg.LOCKDOWN_GRACE_S
  }

  get pct(): number {
    return this.heatPct
  }

  get state(): HeatState {
    if (this.heatPct >= this.cfg.LOCKDOWN_AT) return 'LOCKDOWN'
    if (this.heatPct >= this.cfg.LASER_FRENZY_AT) return 'ALERT'
    if (this.heatPct >= this.cfg.WAVE2_AT) return 'SUSPICIOUS'
    return 'CALM'
  }

  get lockdownGraceS(): number {
    return this.graceS
  }

  addHeat(amount: number): void {
    this.heatPct = Math.min(
      Math.max(0, this.heatPct + amount),
      this.cfg.LOCKDOWN_AT,
    )
  }

  tick(dtSeconds: number): void {
    if (this.heatPct >= this.cfg.LOCKDOWN_AT) {
      this.graceS = Math.max(0, this.graceS - dtSeconds)
      return
    }
    this.heatPct = Math.min(
      this.cfg.LOCKDOWN_AT,
      this.heatPct + this.cfg.PASSIVE_PER_S * dtSeconds,
    )
  }

  isLockdown(): boolean {
    return this.heatPct >= this.cfg.LOCKDOWN_AT
  }
}
