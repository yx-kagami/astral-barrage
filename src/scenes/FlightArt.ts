import type Phaser from 'phaser'
import { HEIGHT, WIDTH } from '../config/field'
import { DEFAULT_AIRCRAFT } from '../config/aircraft'
import type { Skin } from '../config/appearance'
import type { Boss } from '../entities/Boss'
import { Shape } from '../systems/BulletManager'
import type { Run } from '../systems/Run'

type Graphics = Phaser.GameObjects.Graphics

export class FlightArt {
  private readonly stars = Array.from({ length: 104 }, (_, index) => ({
    x: (index * 197 + index * index * 73) % WIDTH,
    y: (index * 107 + index * index * 39) % HEIGHT,
    layer: index % 3,
  }))
  private skyTime = 0
  private lastRun: Run | null | undefined
  private lastState: Run['state'] | undefined

  constructor(private readonly graphics: Graphics, private readonly foreground: Graphics,
    private readonly body: Phaser.GameObjects.Image) {}

  setAvatar(key: string, size: number) {
    this.body.setTexture(key)
    const height = size * this.body.height / this.body.width
    this.body.setDisplaySize(size, height)
  }

  draw(delta: number, run: Run | null, skin: Skin) {
    const state = run?.state
    if (this.lastRun === run && this.lastState === state &&
        (!run || state === 'paused' || state === 'upgrade')) return
    this.lastRun = run
    this.lastState = state
    const g = this.graphics
    const front = this.foreground
    if (state === 'playing') this.skyTime += delta
    g.clear()
    front.clear()
    if (!run) {
      this.body.setVisible(false)
      return
    }
    for (let index = 0; index < (run.enhanced ? this.stars.length : 59); index++) {
      const star = this.stars[index]
      g.fillStyle(star.layer === 2 ? 0xb7bfff : 0x6b91c9, 0.2 + star.layer * 0.16)
      g.fillCircle(star.x, (star.y + this.skyTime * (7 + 15 * star.layer)) % HEIGHT, 0.56 + star.layer * 0.32)
    }

    for (const item of run.drops.items) {
      g.lineStyle(1, 0xcaffec, 0.85).fillStyle(0x51e7ac, 0.9)
      diamond(g, item.x, item.y, 4, 5)
    }
    for (const enemy of run.enemies) {
      const { x, y, radius: r } = enemy
      g.fillStyle(0x21132c).lineStyle(1.5, enemy.stats.color, 0.9)
      polygon(g, x - r, y - 5, x - r * 0.54, y - r * 0.63, x, y - 5,
        x + r * 0.54, y - r * 0.63, x + r, y - 5, x + r * 0.65, y + 7, x, y + r * 0.65, x - r * 0.65, y + 7)
      g.fillStyle(enemy.stats.color).fillCircle(x, y + 2, 3.5)
    }

    if (run.boss && run.boss.hp) this.boss(run.boss)
    for (const ring of run.effects.rings) {
      if (ring.life <= 0) continue
      const growth = 1 - ring.life / 0.36
      g.lineStyle(1, ring.color, ring.life * 1.4).strokeCircle(ring.x, ring.y, ring.radius * growth + 3)
    }
    for (const spark of run.effects.sparks) {
      if (spark.life <= 0) continue
      const size = spark.life * 3.2 + 0.8
      g.fillStyle(spark.color, Math.min(0.9, spark.life * 2.3)).fillRect(spark.x, spark.y, size, size)
    }
    if (run.effects.bombFlash > 0) {
      const progress = 1 - run.effects.bombFlash / 0.52
      g.lineStyle(skin.burst.width * (1 - progress) + 1, skin.burst.color, 0.8 * (1 - progress))
      g.strokeCircle(run.player.x, run.player.y, 20 + progress * 630)
    }
    this.avatar(run, skin)
    for (const bullet of run.bullets.active) {
      const { x, y, radius: r } = bullet
      front.fillStyle(bullet.friendly ? skin.weapon[bullet.weapon ?? 'main'] : bullet.color)
      if (bullet.shape === Shape.Needle) {
        if (run.enhanced) {
          front.fillStyle(skin.weapon[bullet.weapon ?? 'main'], 0.18).fillRect(x - 3.2, y - 7, 6.4, 15)
          front.fillStyle(skin.weapon[bullet.weapon ?? 'main'])
        }
        const width = run.skillActive > 0 && bullet.weapon === 'main' ? 3.8 : 2.5
        front.fillRect(x - width / 2, y - 6, width, 13)
      } else if (bullet.shape === Shape.Missile) {
        front.save().translateCanvas(x, y).rotateCanvas(Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2)
        front.lineStyle(0, 0)
        polygon(front, 0, -8, 3, 4, 0, 8, -3, 4)
        front.restore()
      } else if (bullet.shape === Shape.Diamond) {
        front.lineStyle(1, 0xfff6ff, 0.7)
        diamond(front, x, y, r, r + 1)
      } else {
        front.fillCircle(x, y, r)
        front.fillStyle(0xfff6ff, 0.85).fillCircle(x, y, r * 0.45)
      }
    }
  }

  private boss(boss: Boss) {
    const g = this.graphics
    const color = boss.phase === 1 ? 0x9f9cff : 0xff85df
    g.save().translateCanvas(boss.x, boss.y)
    g.lineStyle(2, color, 0.84).fillStyle(0x241b45)
    polygon(g, -86, 14, -74, -37, -47, -20, -21, -35, 0, -52, 21, -35,
      47, -20, 74, -37, 86, 14, 62, 5, 35, 30, 0, 48, -35, 30, -62, 5)
    g.fillStyle(0x382e63).lineStyle(1, color, 0.64)
    for (const side of [-1, 1]) {
      polygon(g, side * 74, -28, side * 60, -10, side * 32, 26, side * 43, -15)
      g.fillStyle(color, 0.72).fillRect(side * 58 - 3, -5, 6, 13)
      g.fillStyle(0x382e63)
    }
    g.fillStyle(color, 0.24).fillCircle(0, 1, 16 + Math.sin(this.skyTime * 7) * 2)
    g.fillStyle(color).fillCircle(0, 1, 9)
    g.fillStyle(0xffefff).fillCircle(0, 1, 4)
    g.restore()
  }

  private avatar(run: Run, skin: Skin) {
    const { player } = run
    const { x, y } = player
    const g = this.graphics
    const front = this.foreground
    const visible = !player.invulnerable || Math.floor(player.invulnerable * 15) % 2 === 0
    const character = run.aircraftId !== DEFAULT_AIRCRAFT
    this.body.setPosition(x, y).setRotation(player.tilt * (character ? 0.55 : 1)).setVisible(visible)
    if (visible) {
      const jet = skin.tail.length + Math.sin(this.skyTime * 49) * 5
      const width = skin.tail.width
      g.save().translateCanvas(x, y).rotateCanvas(player.tilt)
      g.lineStyle(0, 0).fillStyle(skin.tail.outer, 0.65)
      polygon(g, -width, 7, width, 7, 2, jet - 2, 0, jet + 6, -3, jet - 5)
      g.fillStyle(skin.tail.inner)
      polygon(g, -3.5, 8, 3.5, 8, 0, jet - 3)
      g.restore()
    }
    const skill = run.aircraft.skill
    if (skill?.kind === 'pulse' && run.effects.pulse > 0) {
      const remaining = run.effects.pulse / skill.invulnerability
      g.lineStyle(skin.burst.width, skin.burst.color, remaining * 0.8).strokeCircle(x, y, 16 + (skill.radius - 16) * (1 - remaining))
    }
    if (skill?.kind === 'barrage' && run.skillActive > 0) {
      g.lineStyle(1.4, skin.burst.color, 0.65).strokeCircle(x, y, 26 + Math.sin(this.skyTime * 8) * 2)
      g.strokeCircle(x, y, 34)
    }
    if (player.focus) {
      front.lineStyle(1, 0x9eefff, 0.6).strokeCircle(x, y, 11)
      front.fillStyle(0xffffff).fillCircle(x, y, player.radius)
    }
  }
}

function diamond(g: Graphics, x: number, y: number, radiusX: number, radiusY: number) {
  g.beginPath().moveTo(x, y - radiusY).lineTo(x + radiusX, y).lineTo(x, y + radiusY)
    .lineTo(x - radiusX, y).closePath().fillPath().strokePath()
}

function polygon(g: Graphics, x: number, y: number, ...points: number[]) {
  g.beginPath().moveTo(x, y)
  for (let index = 0; index < points.length; index += 2) g.lineTo(points[index], points[index + 1])
  g.closePath().fillPath().strokePath()
}
