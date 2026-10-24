import Phaser from 'phaser'
import { HeatSystem, type HeatState } from '../systems/heat-system'
import { MissionSystem, type RunResult } from '../systems/mission-system'
import { COLORS, type Tile } from '../config/GameConfig'

export interface HudInfo {
  fragsTotal: number
  vaultTile: Tile
  cacheTile: Tile
}

const BAR_W = 260
const BAR_H = 14

// In-scene HUD: heat bar + cargo readouts + overlays. Never touches game rules.
export class Hud {
  private scene: Phaser.Scene
  private heat: HeatSystem
  private mission: MissionSystem
  private info: HudInfo
  onPauseRequest?: () => void

  private barFill: Phaser.GameObjects.Rectangle
  private heatLabel: Phaser.GameObjects.Text
  private stateLabel: Phaser.GameObjects.Text
  private creditsLabel: Phaser.GameObjects.Text
  private fragsLabel: Phaser.GameObjects.Text
  private vaultLabel: Phaser.GameObjects.Text
  private cacheLabel: Phaser.GameObjects.Text
  private lockdownText: Phaser.GameObjects.Text
  private lockVignette: Phaser.GameObjects.Rectangle
  private pauseLayer: Phaser.GameObjects.Container
  private resultLayer: Phaser.GameObjects.Container | null = null
  private hintText: Phaser.GameObjects.Text | null = null
  private hintTween: Phaser.Tweens.Tween | null = null

  constructor(
    scene: Phaser.Scene,
    heat: HeatSystem,
    mission: MissionSystem,
    info: HudInfo,
    onPauseRequest?: () => void,
  ) {
    this.scene = scene
    this.heat = heat
    this.mission = mission
    this.info = info
    this.onPauseRequest = onPauseRequest

    this.scene.add.rectangle(BAR_W / 2 + 18, 20, BAR_W + 4, BAR_H + 4, 0x000000, 0.5)
      .setDepth(900)
    this.scene.add.rectangle(18, 20, 2, BAR_H, 0x666666)
      .setDepth(901)
    this.barFill = this.scene.add
      .rectangle(19, 20, 0, BAR_H, zeroAlphaColor(COLORS.cyan))
      .setOrigin(0, 0.5)
      .setDepth(902)

    const mono = (size: number, color: string) => ({
      fontFamily: 'monospace',
      fontSize: `${size}px`,
      color,
    })

    this.heatLabel = this.scene.add
      .text(18, 36, '', mono(12, COLORS.hudText))
      .setDepth(901)
    this.stateLabel = this.scene.add
      .text(BAR_W + 34, 20, '', mono(14, COLORS.cyan))
      .setDepth(901)
    this.creditsLabel = this.scene.add
      .text(this.scene.scale.width - 18, 18, '', mono(14, COLORS.cyan))
      .setOrigin(1, 0)
      .setDepth(901)
    this.fragsLabel = this.scene.add
      .text(this.scene.scale.width - 18, 38, '', mono(12, COLORS.hudText))
      .setOrigin(1, 0)
      .setDepth(901)
    this.vaultLabel = this.scene.add
      .text(this.scene.scale.width - 18, 58, 'VAULT', mono(12, COLORS.cyan))
      .setOrigin(1, 0)
      .setDepth(901)
    this.cacheLabel = this.scene.add
      .text(this.scene.scale.width - 80, 58, 'CACHE', mono(12, COLORS.magenta))
      .setOrigin(1, 0)
      .setDepth(901)

    this.lockVignette = this.scene.add
      .rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height,
        zeroAlphaColor(COLORS.warningRed),
      )
      .setDepth(890)
      .setScrollFactor(0)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)

    this.lockdownText = this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height - 92, '', {
        ...mono(18, COLORS.warningRed),
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(903)
      .setScrollFactor(0)

    // Pause + hint infrastructure.
    const dim = this.scene.add
      .rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height,
        0x000000,
        0.66,
      )
      .setScrollFactor(0)
    const paused = this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height / 2, 'PAUSED', {
        ...mono(42, COLORS.cyan),
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
    const resume = this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height / 2 + 40, 'ESC TO RESUME', mono(13, COLORS.hudText))
      .setOrigin(0.5)
      .setScrollFactor(0)
    this.pauseLayer = this.scene.add
      .container(0, 0, [dim, paused, resume])
      .setDepth(910)
      .setScrollFactor(0)
      .setVisible(false)

    // Touch deferred pass: virtual pause button (bottom-right).
    this.scene.add
      .rectangle(764, 576, 36, 36, 0x000000, 0.7)
      .setDepth(905)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.onPauseRequest?.())
  }

  update(): void {
    const pct = this.heat.pct
    const state = this.heat.state

    this.barFill.width = (pct / 100) * BAR_W
    this.barFill.setFillStyle(stateFill(state))
    if (state === 'LOCKDOWN') {
      const pulse = 0.25 + 0.25 * Math.sin(this.scene.time.now % 1000)
      this.lockVignette.setAlpha(pulse)
      this.barFill.setFillStyle(color(COLORS.warningRed))
    } else {
      this.lockVignette.setAlpha(0)
    }

    this.heatLabel.setText(`HEAT ▸ ${Math.round(pct)}%`)
    this.stateLabel.setText(state)
    this.stateLabel.setColor(stateColor(state))
    this.creditsLabel.setText(`CREDITS ▸ ${this.mission.creditsStolen}`)
    this.fragsLabel.setText(`FRAGMENTS ▸ ${this.mission.fragmentCount}/${this.info.fragsTotal}`)

    this.stateLabel.setColor(stateColor(state))

    this.vaultLabel.setAlpha(this.mission.hasCollected(this.info.vaultTile) ? 0.25 : 1)
    this.cacheLabel.setAlpha(this.mission.hasCollected(this.info.cacheTile) ? 0.25 : 1)

    this.lockdownText.setText(
      this.heat.isLockdown()
        ? `LOCKDOWN ESCAPE WINDOW ${this.heat.lockdownGraceS.toFixed(1)}s`
        : '',
    )
  }

  showToast(text: string, x: number, y: number): void {
    const toast = this.scene.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: COLORS.cyan,
      })
      .setOrigin(0.5)
      .setDepth(905)
    this.scene.tweens.add({
      targets: toast,
      y: y - 26,
      alpha: 0,
      duration: 900,
      onComplete: () => toast.destroy(),
    })
  }

  showHint(text: string): void {
    if (this.hintText) {
      this.hintText.destroy()
      this.hintText = null
    }
    if (this.hintTween) this.hintTween.stop()
    this.hintText = this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height - 40, text, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: COLORS.warningRed,
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(905)
      .setAlpha(1)
      .setScrollFactor(0)
    this.hintTween = this.scene.tweens.add({
      targets: this.hintText,
      alpha: 0,
      delay: 1300,
      duration: 220,
      onComplete: () => {
        this.hintText?.destroy()
        this.hintText = null
      },
    })
  }

  setPaused(paused: boolean): void {
    this.pauseLayer.setVisible(paused)
  }

  showResult(
    r: RunResult,
    meta?: { bestLabel?: string; nextLabel?: string; closingLabel?: string },
  ): void {
    this.destroyResult()
    const layer: Phaser.GameObjects.GameObject[] = []
    layer.push(
      this.scene.add
        .rectangle(
          this.scene.scale.width / 2,
          this.scene.scale.height / 2,
          this.scene.scale.width,
          this.scene.scale.height,
          0x000000,
          0.78,
        )
        .setScrollFactor(0),
    )
    const cx = this.scene.scale.width / 2
    const cy = this.scene.scale.height / 2
    const mono = (size: number, colorStr: string) => ({
      fontFamily: 'monospace',
      fontSize: `${size}px`,
      color: colorStr,
    })
    if (r.outcome === 'WON') {
      layer.push(
        this.scene.add
          .text(cx, cy - 92, 'EXFILTRATED', { ...mono(44, COLORS.cyan), fontStyle: 'bold' })
          .setOrigin(0.5)
          .setScrollFactor(0),
      )
      layer.push(
        this.scene.add.text(cx, cy - 34, `CREDITS ▸ ${r.credits}`, mono(20, COLORS.hudText)).setOrigin(0.5).setScrollFactor(0),
        this.scene.add.text(cx, cy - 6, `COLD ESCAPE ▸ +${r.bonus}`, mono(20, COLORS.hudText)).setOrigin(0.5).setScrollFactor(0),
        this.scene.add.text(cx, cy + 30, `SCORE ▸ ${r.total}`, { ...mono(26, COLORS.magenta), fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0),
      )
      if (meta?.bestLabel) {
        layer.push(
          this.scene.add
            .text(cx, cy + 66, meta.bestLabel, mono(15, COLORS.hudText))
            .setOrigin(0.5)
            .setScrollFactor(0),
        )
      }
    } else {
      const reasonText = r.reason === 'lockdown' ? 'LOCKDOWN' : 'CAUGHT'
      layer.push(
        this.scene.add
          .text(cx, cy - 92, 'MISSION BLOWN', { ...mono(44, COLORS.warningRed), fontStyle: 'bold' })
          .setOrigin(0.5)
          .setScrollFactor(0),
      )
      layer.push(
        this.scene.add.text(cx, cy - 38, `— ${reasonText} —`, mono(20, COLORS.warningRed)).setOrigin(0.5).setScrollFactor(0),
        this.scene.add.text(cx, cy - 6, `HAUL LOST ▸ ${this.mission.creditsStolen}`, mono(18, COLORS.hudText)).setOrigin(0.5).setScrollFactor(0),
      )
    }
    if (meta?.closingLabel) {
      layer.push(
        this.scene.add
          .text(cx, cy + 96, meta.closingLabel, mono(15, COLORS.magenta))
          .setOrigin(0.5)
          .setScrollFactor(0),
      )
    } else if (meta?.nextLabel) {
      layer.push(
        this.scene.add
          .text(cx, cy + 96, meta.nextLabel, mono(15, COLORS.magenta))
          .setOrigin(0.5)
          .setScrollFactor(0),
      )
    }
    layer.push(
      this.scene.add
        .text(cx, cy + 118, 'R / SPACE — RETRY      M — MENU', mono(14, COLORS.hudText))
        .setOrigin(0.5)
        .setScrollFactor(0),
    )
    this.resultLayer = this.scene.add
      .container(0, 0, layer)
      .setDepth(920)
      .setScrollFactor(0)
  }

  destroyResult(): void {
    this.resultLayer?.destroy()
    this.resultLayer = null
  }
}

function stateFill(state: HeatState): number {
  return color(
    state === 'CALM'
      ? COLORS.cyan
      : state === 'SUSPICIOUS'
        ? COLORS.magenta
        : COLORS.warningRed,
  )
}

function stateColor(state: HeatState): string {
  return state === 'CALM'
    ? COLORS.cyan
    : state === 'SUSPICIOUS'
      ? COLORS.magenta
      : COLORS.warningRed
}

function zeroAlphaColor(hex: string): number {
  return color(hex)
}

function color(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color
}
