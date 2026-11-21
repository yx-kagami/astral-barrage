import { HEIGHT } from '../config/field'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import type { FlightInput } from '../entities/Player'
import { BulletManager, overlaps, Shape } from './BulletManager'
import type { Bullet } from './BulletManager'

export type RunState = 'playing' | 'lost'
const lanes = [195, 101, 282, 144, 241, 63, 327]

export class Run {
  readonly player = new Player()
  readonly bullets = new BulletManager()
  readonly enemies: Enemy[] = []
  state: RunState = 'playing'
  time = 0
  score = 0
  kills = 0
  private spawnIn = 0.55
  private wave = 0

  step(dt: number, input: FlightInput) {
    if (this.state !== 'playing') return
    this.time += dt
    this.player.move(dt, input)
    this.player.fireCooldown -= dt
    if (this.player.fireCooldown <= 0) {
      this.player.fireCooldown += 0.15
      this.bullets.spawn(this.player.x, this.player.y - 15, -Math.PI / 2, 680, 2.5, 0x82efff, Shape.Needle, true, 8)
    }

    this.spawnIn -= dt
    if (this.spawnIn <= 0) {
      const kind = this.wave % 8 === 6 ? 'elite' : this.wave % 3 === 2 ? 'scatter' : 'scout'
      this.enemies.push(new Enemy(kind, lanes[this.wave % lanes.length]))
      this.wave++
      this.spawnIn += Math.max(0.8, 1.78 - this.time * 0.005)
    }
    for (let index = this.enemies.length - 1; index >= 0; index--) {
      const enemy = this.enemies[index]
      enemy.move(dt)
      if (enemy.y > HEIGHT + 50) {
        this.enemies.splice(index, 1)
        continue
      }
      enemy.shotIn -= dt
      if (enemy.shotIn <= 0 && enemy.y < this.player.y - 35) {
        enemy.shotIn = enemy.stats.interval
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x)
        this.bullets.spawn(enemy.x, enemy.y, angle, 193, 4.3, enemy.stats.color, Shape.Orb)
      }
    }
    this.bullets.update(dt, this.collide)
  }

  private readonly collide = (bullet: Bullet) => {
    if (this.state !== 'playing') return false
    if (bullet.friendly) {
      for (let index = this.enemies.length - 1; index >= 0; index--) {
        const enemy = this.enemies[index]
        if (!overlaps(bullet, enemy)) continue
        enemy.hp -= bullet.damage
        if (enemy.hp <= 0) {
          this.kills++
          this.score += enemy.stats.score
          this.enemies.splice(index, 1)
        }
        return true
      }
    } else if (overlaps(bullet, this.player) && this.player.hit()) {
      if (!this.player.lives) this.state = 'lost'
      return true
    }
    return false
  }
}
