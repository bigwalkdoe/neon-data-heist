import Phaser from 'phaser'
import { PLAYER_SPEED, SPRINT_SPEED } from '../config/GameConfig'
import { directionFromStick, type Vec2 } from '../systems/touch-control'
export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys: Record<
    'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SHIFT',
    Phaser.Input.Keyboard.Key
  >
  /** Last nonzero movement direction in radians; 0 when idle. */
  facing = 0
  /** Active virtual-joystick direction (touch deferred pass). Zero when released. */
  stick: Vec2 = { x: 0, y: 0 }

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
    this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT',
    ) as Record<
      'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SHIFT',
      Phaser.Input.Keyboard.Key
    >
  }

  /** Virtual stick activation (touch deferred pass). */
  setStick(x: number, y: number): void {
    this.stick = { x, y }
  }

  /** Virtual stick release (touch deferred pass). */
  clearStick(): void {
    this.stick = { x: 0, y: 0 }
  }

  update(): void {
    const { W, A, S, D, UP, DOWN, LEFT, RIGHT, SHIFT } = this.keys
    let dir: Vec2 = { x: 0, y: 0 }
    let keyboardHeld = false
    if (A.isDown || LEFT.isDown) { dir = { x: -1, y: 0 }; keyboardHeld = true }
    else if (D.isDown || RIGHT.isDown) { dir = { x: 1, y: 0 }; keyboardHeld = true }
    if (W.isDown || UP.isDown) { dir = { x: 0, y: -1 }; keyboardHeld = true }
    else if (S.isDown || DOWN.isDown) { dir = { x: 0, y: 1 }; keyboardHeld = true }

    if (!keyboardHeld) dir = directionFromStick(this.stick)

    if (dir.x === 0 && dir.y === 0) {
      this.setVelocity(0, 0)
      return
    }

    const len = Math.hypot(dir.x, dir.y)
    dir = { x: dir.x / len, y: dir.y / len }
    const speed = SHIFT.isDown ? SPRINT_SPEED : PLAYER_SPEED
    this.setVelocity(dir.x * speed, dir.y * speed)
    this.facing = Math.atan2(dir.y, dir.x)
  }
}
