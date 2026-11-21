import { HEIGHT, WIDTH } from '../config/field'

export const enum Shape { Orb, Diamond, Needle }
export interface Target {
  x: number
  y: number
  radius: number
}
export interface Bullet extends Target {
  vx: number
  vy: number
  friendly: boolean
  damage: number
  shape: Shape
  color: number
  grazed: boolean
}

export function overlaps(a: Target, b: Target, margin = 0) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy <= (a.radius + b.radius + margin) ** 2
}

export class BulletManager {
  readonly active: Bullet[] = []
  private readonly free: Bullet[] = []

  spawn(x: number, y: number, angle: number, speed: number, radius: number, color: number,
    shape: Shape, friendly = false, damage = 0) {
    if (this.active.length >= (friendly ? 1190 : 1080)) return
    const bullet = this.free.pop() ?? {} as Bullet
    bullet.x = x
    bullet.y = y
    bullet.vx = Math.cos(angle) * speed
    bullet.vy = Math.sin(angle) * speed
    bullet.radius = radius
    bullet.color = color
    bullet.shape = shape
    bullet.friendly = friendly
    bullet.damage = damage
    bullet.grazed = false
    this.active.push(bullet)
    return bullet
  }

  update(dt: number, collide: (bullet: Bullet) => boolean) {
    for (let index = this.active.length - 1; index >= 0; index--) {
      const bullet = this.active[index]
      bullet.x += bullet.vx * dt
      bullet.y += bullet.vy * dt
      if (bullet.x < -32 || bullet.x > WIDTH + 32 || bullet.y < -50 ||
          bullet.y > HEIGHT + 24 || collide(bullet)) this.recycle(index)
    }
  }

  private recycle(index: number) {
    const bullet = this.active[index]
    const last = this.active.pop()!
    if (index < this.active.length) this.active[index] = last
    this.free.push(bullet)
  }

  clear(hostileOnly = false) {
    for (let index = this.active.length - 1; index >= 0; index--) {
      if (!hostileOnly || !this.active[index].friendly) this.recycle(index)
    }
  }
}
