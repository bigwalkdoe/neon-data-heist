import Phaser from 'phaser'
import { COLORS } from '../config/GameConfig'
import { MISSIONS } from '../config/missions'
import { loadProfile, type Profile } from '../systems/profile'

// Mission select. Reads the persistent profile (unlocks + bests), lets the
// player pick any unlocked mission, and starts Heist with a missionId.
export class MenuScene extends Phaser.Scene {
  private profile: Profile = { unlockedThrough: 0, best: {} }
  private selected = 0
  private rowsLayer: Phaser.GameObjects.Container | null = null

  constructor() {
    super('Menu')
  }

  create(): void {
    this.profile = loadProfile(window.localStorage)
    this.selected = Math.min(this.profile.unlockedThrough, MISSIONS.length - 1)

    this.cameras.main.setBackgroundColor(COLORS.pageBg)
    const cx = this.scale.width / 2

    this.add
      .text(cx, 74, 'NEON DATA HEIST', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: COLORS.cyan,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, COLORS.magenta, 12, false, true)

    this.add
      .text(cx, 116, 'DATA WORTH TAKING. SECURITY WORTH DODGING.', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: COLORS.hudText,
      })
      .setOrigin(0.5)
      .setAlpha(0.8)

    this.renderRows()
    this.renderFooter()

    const keyboard = this.input.keyboard
    if (keyboard) {
      const prev = () => this.moveSelection(-1)
      const next = () => this.moveSelection(1)
      keyboard.on('keydown-W', prev)
      keyboard.on('keydown-S', next)
      keyboard.on('keydown-UP', prev)
      keyboard.on('keydown-DOWN', next)
      keyboard.on('keydown-SPACE', () => this.confirm())
      keyboard.on('keydown-ENTER', () => this.confirm())
    }
  }

  private unlockedCount(): number {
    return Math.min(this.profile.unlockedThrough + 1, MISSIONS.length)
  }

  private moveSelection(dir: 1 | -1): void {
    const unlocked = this.unlockedCount()
    this.selected = (this.selected + dir + unlocked) % unlocked
    this.renderRows()
  }

  private confirm(): void {
    if (!this.isUnlocked(this.selected)) {
      this.shakeLocked()
      return
    }
    const mission = MISSIONS[this.selected]
    this.rowsLayer?.destroy()
    this.rowsLayer = null
    this.scene.start('Heist', { missionId: mission.id })
  }

  private isUnlocked(index: number): boolean {
    return index <= this.profile.unlockedThrough
  }

  private startMission(index: number): void {
    if (!this.isUnlocked(index)) {
      this.shakeLocked()
      return
    }
    this.selected = index
    this.confirm()
  }

  private shakeLocked(): void {
    this.rowsLayer?.setX(6)
    this.tweens.add({
      targets: this.rowsLayer,
      x: 0,
      duration: 60,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 2,
    })
  }

  private renderRows(): void {
    this.rowsLayer?.destroy()
    const items: Phaser.GameObjects.GameObject[] = []
    const selectedRows: Phaser.GameObjects.Text[] = []
    const cx = this.scale.width / 2
    const top = this.scale.height / 2 - 60
    const rowH = 78

    MISSIONS.forEach((mission, index) => {
      const selected = index === this.selected
      const unlocked = this.isUnlocked(index)
      const y = top + index * rowH
      const fontSize = unlocked ? 20 : 16

      const label = unlocked
        ? `${selected ? '▸ ' : '  '}MISSION 0${index + 1} — ${mission.name}`
        : `  MISSION 0${index + 1} — ${mission.name}`
      const row = this.add
        .text(cx, y, label, {
          fontFamily: 'monospace',
          fontSize: `${fontSize}px`,
          color: unlocked
            ? selected
              ? COLORS.magenta
              : COLORS.cyan
            : '#3a4560',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: unlocked })
        .on('pointerup', () => this.startMission(index))
        .on('pointerover', () => {
          if (unlocked && !selected) {
            this.selected = index
            this.renderRows()
          }
        })
      items.push(row)
      if (selected && unlocked) selectedRows.push(row)

      const detail = unlocked
        ? this.profile.best[mission.id] !== undefined
          ? `BEST ▸ ${this.profile.best[mission.id]}`
          : '— NO PULLS YET —'
        : `LOCKED — CLEAR MISSION 0${index}`
      items.push(
        this.add
          .text(cx, y + 26, detail, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: unlocked ? COLORS.hudText : COLORS.warningRed,
          })
          .setOrigin(0.5)
          .setAlpha(unlocked ? (selected ? 0.9 : 0.6) : 0.7),
      )
    })

    this.rowsLayer = this.add.container(0, 0, items)

    for (const row of selectedRows) {
      this.tweens.add({
        targets: row,
        alpha: { from: 1, to: 0.7 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  private renderFooter(): void {
    const cx = this.scale.width / 2
    const cy = this.scale.height
    this.add
      .text(cx, cy - 66, 'W/S OR ↑/↓ — SELECT      ENTER — RUN      CLICK — START', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: COLORS.hudText,
      })
      .setOrigin(0.5)
      .setAlpha(0.8)
    this.add
      .text(cx, cy - 34, 'PULL AND EXTRACT. ESCAPE WITH LOW HEAT FOR THE BONUS.', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: COLORS.hudText,
      })
      .setOrigin(0.5)
      .setAlpha(0.55)
  }
}
