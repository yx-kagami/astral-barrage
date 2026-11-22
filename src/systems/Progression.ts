import { AIRCRAFT, DEFAULT_AIRCRAFT } from '../config/aircraft'
import type { AircraftStats } from '../config/aircraft'
import { UPGRADES, UPGRADE_IDS } from '../config/upgrades'
import type { Upgrade } from '../config/upgrades'
import type { Player } from '../entities/Player'

const LEVEL_LIMIT = 16

export class Progression {
  readonly ranks = Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as Record<Upgrade, number>
  level = 1
  xp = 0
  choices: Upgrade[] = []
  private missileTime = 0

  constructor(private readonly random = Math.random,
    private readonly stats: AircraftStats = AIRCRAFT[DEFAULT_AIRCRAFT].stats) {}

  get threshold() { return 9 + (this.level - 1) * 4 }
  get capped() { return this.level >= LEVEL_LIMIT }
  get mainDamage() { return this.stats.damage + this.ranks.damage * UPGRADES.damage.value }
  get interval() { return this.stats.interval - this.ranks.rate * UPGRADES.rate.value }
  get twinFactor() { return this.ranks.twin ? UPGRADES.twin.value : 1 }
  get piercing() { return this.ranks.pierce * UPGRADES.pierce.value }
  get wingDamage() { return 3 + this.ranks.wing * UPGRADES.wing.value }
  get missileDamage() { return 19 + this.ranks.missile * UPGRADES.missile.value }
  get grazeEnergy() { return 1 + this.ranks.graze * UPGRADES.graze.value }

  ready() {
    if (this.capped || this.xp < this.threshold) return false
    if (this.choices.length) return true
    const pool = UPGRADE_IDS.filter((id) => this.ranks[id] < UPGRADES[id].max)
    while (this.choices.length < 3 && pool.length) {
      this.choices.push(pool.splice(Math.floor(this.random() * pool.length), 1)[0])
    }
    return this.choices.length > 0
  }

  choose(id: Upgrade, player: Player) {
    if (!this.choices.includes(id) || this.ranks[id] >= UPGRADES[id].max) return false
    this.xp -= this.threshold
    this.level++
    this.choices = []
    this.ranks[id]++
    if (id === 'hull') {
      player.maxLives += UPGRADES.hull.value
      player.lives += UPGRADES.hull.value
    }
    if (id === 'speed') player.increaseSpeed(1 + this.ranks.speed * UPGRADES.speed.value)
    return true
  }

  missileDue(dt: number) {
    if (!this.ranks.missile) return false
    this.missileTime -= dt
    if (this.missileTime > 0) return false
    this.missileTime += 1.92 - this.ranks.missile * 0.16
    return true
  }
}
