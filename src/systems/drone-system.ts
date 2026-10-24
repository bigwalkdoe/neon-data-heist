import Phaser from 'phaser'
import { isPlayerSeen, type XY } from './vision'
import {
  DRONE_ROUTES,
  DRONE_SPEED,
  HEAT,
  VISION,
  COLORS,
  type DroneRoute,
} from '../config/GameConfig'
import { tileToPx } from '../config/level'
import { HeatSystem } from './heat-system'

export { isPlayerSeen } from './vision'

export interface DroneHooks {
  onSpot: () => void
  onCaught: () => void
}

export class Drone {
  readonly sprite: Phaser.Physics.Arcade.Sprite
  readonly wave2: boolean
  private routePts: Phaser.Math.Vector2[]
  private idx = 0
  private alerted = false
  private alertUntilMs = 0
  private hooks: DroneHooks

  constructor(
    scene: Phaser.Scene,
    pts: { row: number; col: number }[],
    wave2: boolean,
    wallLayer: Phaser.Physics.Arcade.StaticGroup,
    hooks: DroneHooks,
  ) {
    this.wave2 = wave2
    this.hooks = hooks
    this.routePts = pts.map((p) => {
      const px = tileToPx(p)
      return new Phaser.Math.Vector2(px.x, px.y)
    })
    const start = this.routePts[0]
    this.sprite = scene.physics.add.sprite(start.x, start.y, 'drone')
    this.sprite.setDepth(20)
    ;(this.sprite.body as Phaser.Physics.Arcade.Body).setSize(18, 16)
    scene.physics.add.collider(this.sprite, wallLayer)
  }

  get xy(): XY {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  get isAlerted(): boolean {
    return this.alerted
  }

  private speed(): number {
    if (this.alerted) return this.wave2 ? DRONE_SPEED.WAVE2_ALERT : DRONE_SPEED.ALERT
    return this.wave2 ? DRONE_SPEED.WAVE2_PATROL : DRONE_SPEED.PATROL
  }

  update(playerXY: XY, radiusPx: number): void {
    const now = (this.sprite.scene as Phaser.Scene).time.now
    const body = this.sprite.body as Phaser.Physics.Arcade.Body

    // Alert expiry: ALERT_PURSUIT_MS since the last sighting ends the pursuit.
    if (this.alerted && now > this.alertUntilMs) {
      this.alerted = false
      this.idx = this.nearestWaypointIndex()
    }

    const target = this.alerted
      ? new Phaser.Math.Vector2(playerXY.x, playerXY.y)
      : this.routePts[this.idx]

    const delta = target.clone().subtract(new Phaser.Math.Vector2(this.sprite.x, this.sprite.y))
    const dist = delta.length()
    if (this.alerted) {
      body.velocity.copy(delta.normalize().scale(this.speed()))
    } else if (dist <= 3) {
      this.idx = (this.idx + 1) % this.routePts.length
      body.velocity.reset()
    } else {
      body.velocity.copy(delta.normalize().scale(Math.min(this.speed(), dist)))
    }

    if (body.velocity.length() > 1) {
      this.sprite.rotation = body.velocity.angle()
    }

    // Detection: patrol → alert raises the spot hook exactly once.
    const seen = isPlayerSeen(
      this.xy,
      this.sprite.rotation,
      playerXY,
      radiusPx,
      VISION.HALF_ANGLE_DEG,
    )
    if (seen) {
      if (!this.alerted) {
        this.alerted = true
        this.hooks.onSpot()
      }
      this.alertUntilMs = now + VISION.ALERT_PURSUIT_MS
    }

    // Contact while alerted means the run is over.
    if (
      this.alerted &&
      Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        playerXY.x,
        playerXY.y,
      ) <= VISION.CONTACT_PX
    ) {
      this.hooks.onCaught()
    }
  }

  drawCone(g: Phaser.GameObjects.Graphics, radiusPx: number): void {
    const half = Phaser.Math.DegToRad(VISION.HALF_ANGLE_DEG)
    const tint = this.alerted
      ? Phaser.Display.Color.HexStringToColor(COLORS.warningRed).color
      : Phaser.Display.Color.HexStringToColor(COLORS.magenta).color
    g.fillStyle(tint, this.alerted ? 0.22 : 0.12)
    g.slice(
      this.sprite.x,
      this.sprite.y,
      radiusPx,
      this.sprite.rotation - half,
      this.sprite.rotation + half,
      false,
    )
    g.closePath()
    g.fillPath()
  }

  private nearestWaypointIndex(): number {
    let best = 0
    let bestDist = Number.POSITIVE_INFINITY
    for (let i = 0; i < this.routePts.length; i++) {
      const d = this.routePts[i].distance(this.sprite)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    return best
  }
}

export class DroneSystem {
  private drones: Drone[] = []
  private coneGfx: Phaser.GameObjects.Graphics
  private wave2Spawned = false
  private scene: Phaser.Scene
  private wallLayer: Phaser.Physics.Arcade.StaticGroup
  private heat: HeatSystem
  private callbacks: DroneHooks

  constructor(
    scene: Phaser.Scene,
    routes: DroneRoute[],
    wallLayer: Phaser.Physics.Arcade.StaticGroup,
    heat: HeatSystem,
    callbacks: DroneHooks,
  ) {
    this.scene = scene
    this.wallLayer = wallLayer
    this.heat = heat
    this.callbacks = callbacks
    this.coneGfx = scene.add.graphics()
    this.coneGfx.setDepth(15)
    for (const route of routes) {
      if (route.wave2) continue
      this.drones.push(new Drone(scene, route.pts, false, wallLayer, callbacks))
    }
  }

  // Wave two activates once, at HEAT.WAVE2_AT — the facility escalates.
  spawnWave2IfDue(): void {
    if (this.wave2Spawned || this.heat.pct < HEAT.WAVE2_AT) return
    this.wave2Spawned = true
    for (const route of DRONE_ROUTES.filter((r) => r.wave2)) {
      this.drones.push(
        new Drone(this.scene, route.pts, true, this.wallLayer, this.callbacks),
      )
    }
  }

  update(_dtMs: number, playerXY: XY): void {
    const radius = this.visionRadius()
    this.coneGfx.clear()
    for (const d of this.drones) {
      d.update(playerXY, radius)
      d.drawCone(this.coneGfx, radius)
    }
  }

  get dronesCount(): number {
    return this.drones.length
  }

  private visionRadius(): number {
    const base = VISION.RADIUS_PX
    return this.heat.pct >= HEAT.LASER_FRENZY_AT ? base * VISION.FRENZY_RADIUS_MULT : base
  }
}
