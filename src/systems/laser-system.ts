import Phaser from 'phaser'
import { type LaserSpec, LASERS, TILE } from '../config/GameConfig'

// Blinking laser grids: vertical strips across one tile column, cycling ON/OFF.
// Timing is wall-clock phase per strip — frames drift, the pattern doesn't.
export class LaserSystem {
  private strips: { image: Phaser.GameObjects.Image; spec: LaserSpec }[] = []
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene, _wallLayer: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene
    for (const spec of LASERS) {
      for (let row = spec.rowStart; row <= spec.rowEnd; row++) {
        const img = this.scene.add.image(
          spec.col * TILE,
          row * TILE,
          'laser-strip',
        )
        img.setOrigin(0, 0)
        img.setDepth(25)
        const body = this.scene.physics.add
          .existing(img, false)
          .body as Phaser.Physics.Arcade.Body
        body.setSize(4, TILE - 4).setOffset(1, 2)
        this.strips.push({ image: img, spec })
      }
    }
  }

  // Wall-clock blink; strips render at low alpha when OFF so players can read timing.
  update(): void {
    const now = this.scene.time.now
    for (const s of this.strips) {
      const phase = (now + s.spec.PHASE) % (s.spec.ON_MS + s.spec.OFF_MS)
      const on = phase < s.spec.ON_MS
      s.image.setAlpha(on ? 0.95 : 0.18)
      s.image.setVisible(on)
    }
  }

  // True right now while the player body overlaps an ON strip; returns the spec for heat.
  touches(playerX: number, playerY: number): LaserSpec | null {
    const px = playerX
    const py = playerY
    for (const s of this.strips) {
      const colPx = s.spec.col * TILE
      const nearCol = Math.abs(px - colPx) <= 10
      const inRows =
        py >= s.spec.rowStart * TILE && py <= (s.spec.rowEnd + 1) * TILE
      if (!nearCol || !inRows) continue
      const phase = (this.scene.time.now + s.spec.PHASE) % (s.spec.ON_MS + s.spec.OFF_MS)
      const on = phase < s.spec.ON_MS
      if (on) return s.spec
    }
    return null
  }
}
