import { ENEMIES } from '../config/enemies'
import type { EnemyKind } from '../config/enemies'

export class Enemy {
  readonly stats
  readonly radius: number
  hp: number
  x: number
  y = -24
  age = 0
  shotIn: number

  constructor(readonly kind: EnemyKind, readonly lane: number) {
    this.radius = ENEMIES[kind].radius
    this.stats = ENEMIES[kind]
    this.hp = this.stats.hp
    this.x = lane
    this.shotIn = kind === 'scout' ? 1.55 : 2.35
  }

  move(dt: number) {
    this.age += dt
    this.y += this.stats.speed * dt
    if (this.kind === 'elite') this.x = this.lane + 52 * Math.sin(this.age * 1.3)
  }
}
