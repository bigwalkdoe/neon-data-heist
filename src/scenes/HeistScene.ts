import Phaser from 'phaser'
import { buildLevelData, tileToPx } from '../config/level'
import { TILE, LEVEL_COLS, LEVEL_ROWS, COLORS } from '../config/GameConfig'
import { Player } from '../entities/Player'

export class HeistScene extends Phaser.Scene {
  private player!: Player

  constructor() {
    super('Heist')
  }

  create(): void {
    const lvl = buildLevelData()
    this.cameras.main.setBackgroundColor(COLORS.pageBg)

    // Facility: floor tiles first (render order), then static wall bodies.
    for (let row = 0; row < LEVEL_ROWS; row++) {
      for (let col = 0; col < LEVEL_COLS; col++) {
        const px = tileToPx({ row, col })
        if (lvl.walls[row][col]) continue
        this.add.image(px.x, px.y, 'tile-floor')
      }
    }

    const wallLayer = this.physics.add.staticGroup()
    for (let row = 0; row < LEVEL_ROWS; row++) {
      for (let col = 0; col < LEVEL_COLS; col++) {
        if (!lvl.walls[row][col]) continue
        const px = tileToPx({ row, col })
        wallLayer.create(px.x, px.y, 'tile-wall')
      }
    }

    // Extraction pad renders as a door on the entry edge (wired for extraction in Phase B).
    for (const t of lvl.extractionTiles) {
      const px = tileToPx(t)
      this.add.image(px.x, px.y, 'extract-pad')
    }

    const spawn = tileToPx(lvl.playerSpawn)
    this.player = new Player(this, spawn, wallLayer)

    this.cameras.main.setBounds(0, 0, LEVEL_COLS * TILE, LEVEL_ROWS * TILE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
  }

  update(): void {
    this.player.update()
  }
}
