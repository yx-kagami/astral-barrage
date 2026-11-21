import type { Upgrade } from '../config/upgrades'
import { HEIGHT } from '../config/field'
import { BOMB_CHARGE, BOSS, GRAZE_MARGIN, MAX_BOMBS, WAVE_LANES, WAVE_SECTORS } from '../config/mission'
import { Boss } from '../entities/Boss'
import { Enemy } from '../entities/Enemy'
import { Player } from '../entities/Player'
import type { FlightInput } from '../entities/Player'
import { BulletManager, overlaps, Shape } from './BulletManager'
import type { Bullet, Target } from './BulletManager'
import { Drops } from './Drops'
import { Progression } from './Progression'
import { Effects } from './Effects'
import { aim, ring, spread } from './patterns'

export type RunState = 'playing' | 'upgrade' | 'paused' | 'won' | 'lost'

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
  readonly drops = new Drops()
  readonly progression = new Progression()
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
    this.fire(dt)

    if (this.time >= BOSS.arrival && !this.boss) {
      this.enemies.length = 0
      this.bullets.clear(true)
      this.boss = new Boss()
    }
    if (this.boss) this.boss.update(dt, this.bullets, this.player)
    else this.updateEnemies(dt)
    this.steerMissiles(dt)
    this.bullets.update(dt, this.collide)
    if (this.state === 'playing') {
      this.progression.xp += this.drops.update(this.player, dt)
      if (this.progression.ready()) this.state = 'upgrade'
    }
    if (this.clearHostile || !this.player.lives || this.boss?.hp === 0) {
      this.bullets.clear(true)
      this.clearHostile = false
    }
  }

  choose(id: Upgrade) {
    if (this.state !== 'upgrade' || !this.progression.choose(id, this.player)) return
    this.state = this.progression.ready() ? 'upgrade' : 'playing'
  }

  private fire(dt: number) {
    const { player, progression } = this
    player.fireCooldown -= dt
    if (player.fireCooldown <= 0) {
      player.fireCooldown += progression.interval
      const twin = progression.ranks.twin > 0
      const damage = progression.mainDamage * progression.twinFactor
      const heading = -Math.PI / 2
      this.bullets.spawn(player.x - (twin ? 7 : 0), player.y - 15, heading, 680, 2.5, 0x82efff,
        Shape.Needle, true, damage, progression.piercing)
      if (twin) this.bullets.spawn(player.x + 7, player.y - 15, heading, 680, 2.5, 0x82efff,
        Shape.Needle, true, damage, progression.piercing)
      if (progression.ranks.wing) {
        this.bullets.spawn(player.x - 15, player.y, heading - 0.24, 570, 2, 0xbbadff, Shape.Needle, true, progression.wingDamage)
        this.bullets.spawn(player.x + 15, player.y, heading + 0.24, 570, 2, 0xbbadff, Shape.Needle, true, progression.wingDamage)
      }
    }
    if (progression.missileDue(dt)) this.bullets.spawn(player.x, player.y - 14, -Math.PI / 2, 330, 3.5, 0x7effc2,
      Shape.Missile, true, progression.missileDamage)
  }

  private steerMissiles(dt: number) {
    for (const bullet of this.bullets.active) {
      if (bullet.shape !== Shape.Missile) continue
      let target: Target | null = this.boss
      if (!target) {
        let nearest = Infinity
        for (const enemy of this.enemies) {
          if (enemy.y < 0) continue
          const distance = (enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2
          if (distance >= nearest) continue
          target = enemy
          nearest = distance
        }
      }
      if (!target) continue
      const heading = Math.atan2(bullet.vy, bullet.vx)
      const difference = aim(bullet, target) - heading
      const offset = Math.atan2(Math.sin(difference), Math.cos(difference))
      const next = heading + Math.max(-4.7 * dt, Math.min(4.7 * dt, offset))
      bullet.vx = 330 * Math.cos(next)
      bullet.vy = 330 * Math.sin(next)
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
    this.drops.add(enemy.x, enemy.y, enemy.stats.xp)
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
        const enemy = this.enemies[index]
        if (bullet.hits.includes(enemy) || !overlaps(bullet, enemy)) continue
        this.damageEnemy(index, bullet.damage)
        if (bullet.pierce-- <= 0) return true
        bullet.hits.push(enemy)
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
        this.charge += this.progression.grazeEnergy
        if (this.charge >= BOMB_CHARGE) {
          this.charge -= BOMB_CHARGE
          this.bombs++
        }
      }
    }
    return false
  }
}
