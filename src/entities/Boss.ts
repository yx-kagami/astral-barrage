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
      if (this.attack % 2 === 0) spread(pool, this, heading, 9, 0.166, 169, 0xff7eab)
      else ring(pool, this, this.attack * 0.186, 18, 129, 0xc895ff)
      this.shotIn = 1.42
    } else if (this.attack % 14 === 13) {
      spread(pool, this, heading, 7, 0.22, 224, 0xff8e9b)
      this.shotIn = 0.91
    } else {
      this.spin += 0.21
      spread(pool, this, this.spin, 4, Math.PI / 2, 158, 0xd893ff)
      this.shotIn = 0.135
    }
    this.attack++
  }
}
