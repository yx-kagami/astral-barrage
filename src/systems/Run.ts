import { HEIGHT } from '../config/field'
import { BOMB_CHARGE, BOSS, GRAZE_MARGIN, MAX_BOMBS, WAVE_LANES, WAVE_SECTORS } from '../config/mission'
import { Boss } from '../entities/Boss'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import type { FlightInput } from '../entities/Player'
import { BulletManager, overlaps, Shape } from './BulletManager'
import type { Bullet } from './BulletManager'
import { Effects } from './Effects'
import { aim, ring, spread } from './patterns'

export type RunState = 'playing' | 'paused' | 'won' | 'lost'

export function graze(bullet: Bullet, player: Player) {
  if (bullet.friendly || bullet.grazed || overlaps(bullet, player) || !overlaps(bullet, player, GRAZE_MARGIN)) return false
  bullet.grazed = true
  return true
}

export class Run {
  readonly player = new Player()
  readonly bullets = new BulletManager()
  readonly enemies: Enemy[] = []
  readonly effects: Effects
  boss: Boss | null = null
  state: RunState = 'playing'
  time = 0
  score = 0
  kills = 0
  grazes = 0
  bombs = 2
  charge = 0
  private spawnIn = 0.55
  private wave = 0
  private sector = 0
  private clearHostile = false

  constructor(enhanced = true) {
    this.effects = new Effects(enhanced)
  }

  step(dt: number, input: FlightInput) {
    if (this.state !== 'playing') return
    this.time += dt
    this.effects.update(dt)
    this.player.move(dt, input)
    this.player.fireCooldown -= dt
    if (this.player.fireCooldown <= 0) {
      this.player.fireCooldown += 0.15
      this.bullets.spawn(this.player.x, this.player.y - 15, -Math.PI / 2, 680, 2.5, 0x82efff, Shape.Needle, true, 8)
    }

    if (this.time >= BOSS.arrival && !this.boss) {
      this.enemies.length = 0
      this.bullets.clear(true)
      this.boss = new Boss()
    }
    if (this.boss) this.boss.update(dt, this.bullets, this.player)
    else this.updateEnemies(dt)
    this.bullets.update(dt, this.collide)
    if (this.clearHostile || this.state !== 'playing') {
      this.bullets.clear(true)
      this.clearHostile = false
    }
  }

  bomb() {
    if (this.state !== 'playing' || this.bombs === 0) return false
    this.bombs--
    this.bullets.clear(true)
    this.player.invulnerable = Math.max(this.player.invulnerable, 1)
    this.effects.bombFlash = 0.52
    for (let index = this.enemies.length - 1; index >= 0; index--) this.damageEnemy(index, 105)
    this.damageBoss(BOSS.bombDamage)
    return true
  }

  private updateEnemies(dt: number) {
    this.spawnIn -= dt
    if (this.spawnIn <= 0) {
      if (this.time >= (WAVE_SECTORS[this.sector + 1]?.start ?? Infinity)) this.sector++
      const sector = WAVE_SECTORS[this.sector]
      const kind = this.wave % sector.eliteEvery === sector.eliteEvery - 1
        ? 'elite'
        : this.wave % sector.scatterEvery === sector.scatterEvery - 1 ? 'scatter' : 'scout'
      this.enemies.push(new Enemy(kind, WAVE_LANES[this.wave % WAVE_LANES.length]))
      this.wave++
      this.spawnIn += Math.max(sector.minimum, sector.interval - (this.time - sector.start) * sector.decay)
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
        const heading = aim(enemy, this.player)
        if (enemy.kind === 'scout') {
          spread(this.bullets, enemy, heading, this.sector > 1 ? 2 : 1, 0.13, 184, enemy.stats.color, Shape.Orb)
        } else if (enemy.kind === 'scatter') {
          spread(this.bullets, enemy, heading, 5 + this.sector * 2, 0.16, 146, enemy.stats.color)
        } else {
          ring(this.bullets, enemy, enemy.age * 0.53, 10 + this.sector * 3, 125, enemy.stats.color)
        }
      }
    }
  }

  private damageEnemy(index: number, damage: number) {
    const enemy = this.enemies[index]
    enemy.hp -= damage
    if (enemy.hp > 0) return
    this.kills++
    this.score += enemy.stats.score
    this.effects.burst(enemy.x, enemy.y, enemy.stats.color, 20)
    this.enemies.splice(index, 1)
  }

  private damageBoss(damage: number) {
    const boss = this.boss
    if (!boss) return
    const previousPhase = boss.phase
    boss.damage(damage)
    if (boss.phase !== previousPhase) this.clearHostile = true
    if (boss.hp > 0) return
    this.kills++
    this.score += 10000
    this.effects.burst(boss.x, boss.y, 0xf490ff, 100)
    this.state = 'won'
  }

  private readonly collide = (bullet: Bullet) => {
    if (this.state !== 'playing' || (this.clearHostile && !bullet.friendly)) return false
    if (bullet.friendly) {
      if (this.boss && overlaps(bullet, this.boss)) {
        this.damageBoss(bullet.damage)
        return true
      }
      for (let index = this.enemies.length - 1; index >= 0; index--) {
        if (!overlaps(bullet, this.enemies[index])) continue
        this.damageEnemy(index, bullet.damage)
        return true
      }
    } else if (overlaps(bullet, this.player)) {
      if (!this.player.hit()) return false
      this.effects.burst(this.player.x, this.player.y, 0x85edff, 23)
      if (!this.player.lives) this.state = 'lost'
      return true
    } else if (graze(bullet, this.player)) {
      this.grazes++
      this.score += 15
      if (this.bombs < MAX_BOMBS) {
        this.charge++
        if (this.charge >= BOMB_CHARGE) {
          this.charge -= BOMB_CHARGE
          this.bombs++
        }
      }
    }
    return false
  }
}
