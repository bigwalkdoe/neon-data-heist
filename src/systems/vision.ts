// Pure drone vision math — no Phaser imports so Vitest can run it in Node.

export interface XY {
  x: number
  y: number
}

// True when the player stands inside the drone's vision wedge:
// within `radius` px AND within `halfAngleDeg` of the drone's facing direction.
export function isPlayerSeen(
  droneXY: XY,
  facingRad: number,
  playerXY: XY,
  radius: number,
  halfAngleDeg: number,
): boolean {
  const dx = playerXY.x - droneXY.x
  const dy = playerXY.y - droneXY.y
  const dist = Math.hypot(dx, dy)
  if (dist > radius) return false
  if (halfAngleDeg >= 180) return true
  const angleToPlayer = Math.atan2(dy, dx)
  // Normalize the signed difference into (−π, π]. atan2(sin, cos) is exact
  // trig identity — no modulo edge cases.
  const diff = Math.atan2(
    Math.sin(angleToPlayer - facingRad),
    Math.cos(angleToPlayer - facingRad),
  )
  return Math.abs(diff) <= toRad(halfAngleDeg) + 1e-9
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
