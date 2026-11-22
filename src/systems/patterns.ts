import { Shape } from './BulletManager'
import type { BulletManager, Target } from './BulletManager'

export function aim(origin: Target, target: Target) {
  return Math.atan2(target.y - origin.y, target.x - origin.x)
}

export function spread(pool: BulletManager, origin: Target, heading: number, count: number,
  spacing: number, speed: number, color: number, shape = Shape.Diamond) {
  for (let index = 0; index < count; index++) {
    const angle = heading + (index - (count - 1) * 0.5) * spacing
    pool.spawn(origin.x, origin.y + 5, angle, speed, shape === Shape.Diamond ? 4.4 : 4.8, color, shape)
  }
}

export function ring(pool: BulletManager, origin: Target, heading: number, count: number, speed: number, color: number) {
  spread(pool, origin, heading, count, 2 * Math.PI / count, speed, color, Shape.Orb)
}
