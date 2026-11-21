import { WIDTH } from '../config/field'
import { BOSS } from '../config/mission'
import type { BulletManager, Target } from '../systems/BulletManager'
import { Shape } from '../systems/BulletManager'
import { aim, ring, spread } from '../systems/patterns'

export class Boss {
  x = WIDTH / 2
  y = -70
  readonly radius = BOSS.radius
  readonly maxHp = BOSS.hp
  hp = this.maxHp
  phase: 1 | 2 = 1
  age = 0
  intro = 3
  transition = 0
  private shotIn = 2.9
  private attack = 0
  private spin = 0

  get vulnerable() {
    return this.intro === 0 && this.transition === 0
  }

  damage(amount: number) {
    if (!this.vulnerable || this.hp <= 0) return
    this.hp = Math.max(0, this.hp - amount)
    if (this.hp > 0 && this.phase === 1 && this.hp <= this.maxHp * BOSS.transition) {
      this.phase = 2
      this.transition = BOSS.phaseDelay
      this.shotIn = 0.4
      this.attack = 0
    }
  }

  update(dt: number, pool: BulletManager, target: Target) {
    this.age += dt
    this.intro = Math.max(0, this.intro - dt)
    this.transition = Math.max(0, this.transition - dt)
    this.y = Math.min(204, this.y + 112 * dt)
    if (this.intro || this.transition) return

    this.x = WIDTH / 2 + Math.sin((this.age - 3) * (this.phase === 1 ? 0.72 : 1.03)) * (this.phase === 1 ? 82 : 100)
    this.shotIn -= dt
    if (this.shotIn > 0) return
    const heading = aim(this, target)

    if (this.phase === 1) {
      const { fan, ring: circle, interval } = BOSS.first
      if (this.attack % 2 === 0) spread(pool, this, heading, fan.count, fan.spread, fan.speed, fan.color)
      else ring(pool, this, this.attack * circle.rotation, circle.count, circle.speed, circle.color)
      this.shotIn = interval
    } else if (this.attack % BOSS.second.shotsPerCycle === BOSS.second.shotsPerCycle - 1) {
      const { aimed } = BOSS.second
      spread(pool, this, heading, aimed.count, aimed.spread, aimed.speed, aimed.color)
      this.shotIn = aimed.interval
    } else {
      const { spiral } = BOSS.second
      this.spin += spiral.rotation
      spread(pool, this, this.spin, spiral.count, 2 * Math.PI / spiral.count, spiral.speed, spiral.color)
      this.shotIn = spiral.interval
    }
    this.attack++
  }
}
