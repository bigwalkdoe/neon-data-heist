import Phaser from 'phaser'
import { PLAYER_SPEED } from '../config/GameConfig'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys: Record<
    'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
    Phaser.Input.Keyboard.Key
  >
  /** Last nonzero movement direction in radians; 0 when idle. */
  facing = 0

  constructor(
    scene: Phaser.Scene,
    spawnPx: { x: number; y: number },
    wallLayer: Phaser.Physics.Arcade.StaticGroup,
  ) {
    super(scene, spawnPx.x, spawnPx.y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    scene.physics.add.collider(this, wallLayer)
    this.setDamping(false)
    this.setCollideWorldBounds(true)

    const keyboard = scene.input.keyboard
    if (!keyboard) throw new Error('no keyboard input available')
    this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT',
    ) as Record<
      'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
      Phaser.Input.Keyboard.Key
    >
  }

  update(): void {
    const { W, A, S, D, UP, DOWN, LEFT, RIGHT } = this.keys
    let dx = 0
    let dy = 0
    if (A.isDown || LEFT.isDown) dx = -1
    else if (D.isDown || RIGHT.isDown) dx = 1
    if (W.isDown || UP.isDown) dy = -1
    else if (S.isDown || DOWN.isDown) dy = 1

    if (dx === 0 && dy === 0) {
      this.setVelocity(0, 0)
      return
    }

    const len = Math.hypot(dx, dy)
    dx /= len
    dy /= len
    this.setVelocity(dx * PLAYER_SPEED, dy * PLAYER_SPEED)
    this.facing = Math.atan2(dy, dx)
  }
}
