// Pure mapping for the virtual joystick (touch deferred pass): screen-space
// stick vector → walk direction. Lives pure so direction math is unit-tested.
export interface Vec2 {
  x: number
  y: number
}

// Zero stick → zero direction; nonzero stick → unit direction.
export function directionFromStick(stick: Vec2): Vec2 {
  const len = Math.hypot(stick.x, stick.y)
  if (len <= 1e-6) return { x: 0, y: 0 }
  return { x: stick.x / len, y: stick.y / len }
}
