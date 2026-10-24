import Phaser from 'phaser'
import { buildLevelData, tileToPx } from '../config/level'
import { TILE, LEVEL_COLS, LEVEL_ROWS, COLORS, HEAT, DRONE_ROUTES, PLAYER_SPEED, type Tile } from '../config/GameConfig'
import { Player } from '../entities/Player'
import { HeatSystem } from '../systems/heat-system'
import { DroneSystem } from '../systems/drone-system'
import { LaserSystem } from '../systems/laser-system'
import { MissionSystem, type RunResult } from '../systems/mission-system'
import { Hud } from '../ui/Hud'

export class HeistScene extends Phaser.Scene {
  private player!: Player
  private heat!: HeatSystem
  private mission!: MissionSystem
  private hud!: Hud
  private drones!: DroneSystem
  private lasers!: LaserSystem
  private paused = false
  private extractionHintLimit = 0
  private lastLaserTouchMs = 0
  private resultShown = false

  constructor() {
    super('Heist')
  }

  create(): void {
    const lvl = buildLevelData()
    this.cameras.main.setBackgroundColor(COLORS.pageBg)

    this.heat = new HeatSystem()
    this.mission = new MissionSystem(
      lvl.fragments,
      lvl.vault,
      lvl.cache,
      lvl.extractionTiles,
    )
    // Per-run state resets here: scene.restart() re-runs create() only.
    this.paused = false
    this.extractionHintLimit = 0

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

    // Data pickups: fragments + vault + cache.
    const pickupGroup = this.physics.add.staticGroup()
    for (const tile of lvl.fragments) {
      const px = tileToPx(tile)
      pickupGroup.create(px.x, px.y, 'fragment').setData('tile', tile)
    }
    for (const [tile, tex] of [
      [lvl.vault, 'vault'],
      [lvl.cache, 'cache'],
    ] as const) {
      const px = tileToPx(tile)
      pickupGroup.create(px.x, px.y, tex).setData('tile', tile)
    }

    // Extraction door on the entry edge.
    const extractionGroup = this.physics.add.staticGroup()
    for (const tile of lvl.extractionTiles) {
      const px = tileToPx(tile)
      extractionGroup.create(px.x, px.y, 'extract-pad').setData('tile', tile)
    }

    this.player = new Player(this, tileToPx(lvl.playerSpawn), wallLayer)

    // Security AI: patrol drones with vision cones; wave two at heat ≥ WAVE2_AT.
    this.drones = new DroneSystem(this, DRONE_ROUTES, wallLayer, this.heat, {
      onSpot: () => this.heat.addHeat(HEAT.SPOTTED),
      onCaught: () => this.events.emit('mission:caught'),
    })

    // Security AI: blinking laser grids — touching an ON strip burns heat.
    this.lasers = new LaserSystem(this, wallLayer)

    this.physics.add.overlap(this.player, pickupGroup, (_player, obj) =>
      this.onPickup(obj as Phaser.Physics.Arcade.Sprite),
    )
    this.physics.add.overlap(this.player, extractionGroup, (_player, obj) =>
      this.onExtraction(obj as Phaser.Physics.Arcade.Sprite),
    )

    this.cameras.main.setBounds(0, 0, LEVEL_COLS * TILE, LEVEL_ROWS * TILE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)

    this.hud = new Hud(this, this.heat, this.mission, {
      fragsTotal: lvl.fragments.length,
      vaultTile: lvl.vault,
      cacheTile: lvl.cache,
    })

    // Outcome routing — win/lose/lockdown.
    this.events.on('mission:win', (heatPct: number) => this.endRun(this.mission.win(heatPct)))
    this.events.on('mission:caught', () => this.endRun(this.mission.lose('caught')))
    this.events.on('laser:burn', () => this.endRun(this.mission.lose('caught'))) // burned by lockdown = run over

    // M → main menu from anywhere.
    const keyboard = this.input.keyboard
    if (keyboard) {
      keyboard.on('keydown-ESC', () => this.togglePause())
      keyboard.on('keydown-M', () => {
        if (!this.resultShown) {
          this.resultShown = true
          this.tweens.killAll()
          this.scene.stop('Heist')
          this.scene.start('Menu')
        }
      })
    }
  }

  update(_time: number, delta: number): void {
    // Tab focus guard (plan Review Focus #1): nothing accrues while hidden.
    if (document.hidden || this.paused || this.resultShown) return
    const dt = delta / 1000
    this.player.update()
    this.heat.tick(dt)
    this.drones.update(delta, { x: this.player.x, y: this.player.y })
    this.drones.spawnWave2IfDue()
    this.lasers.update()
    this.checkLaserContact()
    this.checkLockdownExpiry()
    this.hud.update()
  }

  private checkLockdownExpiry(): void {
    if (this.heat.isLockdown() && this.heat.lockdownGraceS <= 0) {
      this.endRun(this.mission.lose('lockdown'))
    }
  }

  private endRun(result: RunResult): void {
    this.resultShown = true
    this.paused = true
    this.physics.pause()
    this.hud.showResult(result)
    const keyboard = this.input.keyboard
    if (keyboard) {
      keyboard.once('keydown-R', () => this.retryRun())
      keyboard.once('keydown-SPACE', () => this.retryRun())
    }
  }

  private retryRun(): void {
    this.tweens.killAll()
    this.scene.restart()
  }

  private onPickup(obj: Phaser.Physics.Arcade.Sprite): void {
    const tile = obj.getData('tile') as Tile | undefined
    if (!tile) return
    const res = this.mission.collect(tile)
    if (!res) return
    this.heat.addHeat(res.heatCost)
    this.hud.showToast(`+${res.credits}`, obj.x, obj.y - 14)
    obj.destroy()
  }

  private onExtraction(obj: Phaser.Physics.Arcade.Sprite): void {
    const tile = obj.getData('tile') as Tile | undefined
    if (!tile || !this.mission.isExtraction(tile)) return
    if (this.mission.canExtract()) {
      // B6 routes this to the result overlay; win() is idempotent.
      this.events.emit('mission:win', this.heat.pct)
      return
    }
    if (this.time.now > this.extractionHintLimit) {
      this.hud.showHint('NO DATA — GRAB A FRAGMENT')
      this.extractionHintLimit = this.time.now + 1500
    }
  }

  private togglePause(): void {
    this.paused = !this.paused
    if (this.paused) this.physics.pause()
    else this.physics.resume()
    this.hud.setPaused(this.paused)
  }

  private checkLaserContact(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const spec = this.lasers.touches(body.x, body.y)
    if (!spec) return
    const now = this.time.now
    if (now - this.lastLaserTouchMs < 800) return
    this.lastLaserTouchMs = now
    this.heat.addHeat(HEAT.LASER)
    this.events.emit('laser:burn')
    // Knock back 1 tile away from the strip.
    const sign = body.x > spec.col * TILE ? 1 : -1
    body.setVelocity(sign * PLAYER_SPEED, 0)
  }
}
