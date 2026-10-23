import Phaser from 'phaser'
import { COLORS } from '../config/GameConfig'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu')
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.pageBg)
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    this.add
      .text(cx, cy - 92, 'NEON DATA HEIST', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: COLORS.cyan,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, COLORS.magenta, 12, false, true)

    this.add
      .text(cx, cy - 36, 'MISSION 01 — KYOSHI-DELTA VAULT', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: COLORS.hudText,
      })
      .setOrigin(0.5)

    this.add
      .text(cx, cy + 16, 'WASD / ARROWS TO MOVE', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: COLORS.hudText,
      })
      .setOrigin(0.5)
      .setAlpha(0.8)

    const start = this.add
      .text(cx, cy + 88, 'START HEIST', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: COLORS.magenta,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    start.on('pointerup', () => this.tryStartHeist())

    const keyboard = this.input.keyboard
    if (keyboard) {
      keyboard.on('keydown-SPACE', () => this.tryStartHeist())
      keyboard.on('keydown-ENTER', () => this.tryStartHeist())
    }

    // Blink the start call to action.
    this.tweens.add({
      targets: start,
      alpha: { from: 1, to: 0.35 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    })
  }

  // Guard: inert until HeistScene is registered (wired for real when it lands).
  private tryStartHeist(): void {
    if (this.scene.manager.getScene('Heist')) {
      this.tweens.killAll()
      this.scene.start('Heist')
    }
  }
}
