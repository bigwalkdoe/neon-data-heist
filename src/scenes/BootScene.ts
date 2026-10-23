import Phaser from 'phaser'
import { TILE, COLORS } from '../config/GameConfig'

// Generates every sprite texture procedurally at boot; no asset files this session.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  create(): void {
    this.generateTextures()
    this.scene.start('Menu')
  }

  private generateTextures(): void {
    this.makeFloor()
    this.makeWall()
    this.makePlayer()
    this.makeDrone()
    this.makeFragment()
    this.makeVault()
    this.makeCache()
    this.makeExtractPad()
    this.makeLaserStrip()
  }

  private tex(g: Phaser.GameObjects.Graphics, key: string, w: number, h: number): void {
    g.generateTexture(key, w, h)
    g.destroy()
  }

  private makeFloor(): void {
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.floor).color, 1)
    g.fillRect(0, 0, TILE, TILE)
    g.lineStyle(1, Phaser.Display.Color.HexStringToColor('#121a30').color, 1)
    g.strokeRect(0.5, 0.5, TILE - 1, TILE - 1)
    this.tex(g, 'tile-floor', TILE, TILE)
  }

  private makeWall(): void {
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.wallInk).color, 1)
    g.fillRect(0, 0, TILE, TILE)
    g.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.wallEdge).color, 0.85)
    g.strokeRect(1, 1, TILE - 2, TILE - 2)
    this.tex(g, 'tile-wall', TILE, TILE)
  }

  private makePlayer(): void {
    // Cyan hexagon runner, 22×24.
    const g = this.add.graphics()
    const cx = 11
    const cy = 12
    const r = 10
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.cyan).color, 1)
    g.beginPath()
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 3) * i - Math.PI / 6
      const x = cx + r * Math.cos(ang)
      const y = cy + r * Math.sin(ang)
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.closePath()
    g.fillPath()
    this.tex(g, 'player', 22, 24)
  }

  private makeDrone(): void {
    // Magenta triangle pointing right (facing 0 rad); rotates with movement.
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.magenta).color, 1)
    g.fillTriangle(22, 11, 2, 2, 2, 20)
    g.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color, 1)
    g.fillCircle(10, 11, 2)
    this.tex(g, 'drone', 24, 22)
  }

  private makeFragment(): void {
    // Cyan diamond, 18×22.
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.cyan).color, 1)
    g.beginPath()
    g.moveTo(9, 0)
    g.lineTo(18, 11)
    g.lineTo(9, 22)
    g.lineTo(0, 11)
    g.closePath()
    g.fillPath()
    g.fillStyle(0xffffff, 0.6)
    g.fillRect(4, 10, 10, 2)
    this.tex(g, 'fragment', 18, 22)
  }

  private makeVault(): void {
    // Tile-sized vault crate with cyan glow outline.
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor('#0d1b33').color, 1)
    g.fillRect(0, 0, TILE, TILE)
    g.lineStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.cyan).color, 1)
    g.strokeRect(3, 3, TILE - 6, TILE - 6)
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.cyan).color, 1)
    g.fillRect(TILE / 2 - 2, 8, 4, 16)
    g.fillRect(10, TILE / 2 - 2, 12, 4)
    this.tex(g, 'vault', TILE, TILE)
  }

  private makeCache(): void {
    // Bonus cache crate with magenta outline, 28×28.
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor('#2a0d27').color, 1)
    g.fillRect(0, 0, 28, 28)
    g.lineStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.magenta).color, 1)
    g.strokeRect(3, 3, 22, 22)
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.magenta).color, 1)
    g.fillRect(12, 8, 4, 12)
    this.tex(g, 'cache', 28, 28)
  }

  private makeExtractPad(): void {
    // Extraction pad: dark tile with cyan corner brackets.
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor('#08222b').color, 1)
    g.fillRect(0, 0, TILE, TILE)
    g.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.cyan).color, 1)
    const b = 9
    // top-left
    g.beginPath(); g.moveTo(1, 1 + b); g.lineTo(1, 1); g.lineTo(1 + b, 1); g.strokePath()
    // top-right
    g.beginPath(); g.moveTo(TILE - 1 - b, 1); g.lineTo(TILE - 1, 1); g.lineTo(TILE - 1, 1 + b); g.strokePath()
    // bottom-left
    g.beginPath(); g.moveTo(1, TILE - 1 - b); g.lineTo(1, TILE - 1); g.lineTo(1 + b, TILE - 1); g.strokePath()
    // bottom-right
    g.beginPath(); g.moveTo(TILE - 1 - b, TILE - 1); g.lineTo(TILE - 1, TILE - 1); g.lineTo(TILE - 1, TILE - 1 - b); g.strokePath()
    this.tex(g, 'extract-pad', TILE, TILE)
  }

  private makeLaserStrip(): void {
    // Vertical laser beam segment, 32 tall × 6 wide: red body, white-hot core.
    const g = this.add.graphics()
    g.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.warningRed).color, 0.85)
    g.fillRect(0, 0, 6, TILE)
    g.fillStyle(0xffffff, 0.9)
    g.fillRect(2, 0, 2, TILE)
    this.tex(g, 'laser-strip', 6, TILE)
  }
}
