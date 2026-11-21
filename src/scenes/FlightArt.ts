import type Phaser from 'phaser'
import { HEIGHT, WIDTH } from '../config/field'
import type { Player } from '../entities/Player'
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

  constructor(private readonly graphics: Graphics) {}

  draw(delta: number, run: Run | null) {
    const g = this.graphics
    if (!run || run.state === 'playing') this.skyTime += delta
    g.clear().fillStyle(0x080b19).fillRect(0, 0, WIDTH, HEIGHT)
    for (const star of this.stars) {
      g.fillStyle(star.layer === 2 ? 0xb7bfff : 0x6b91c9, 0.2 + star.layer * 0.16)
      g.fillCircle(star.x, (star.y + this.skyTime * (7 + 15 * star.layer)) % HEIGHT, 0.56 + star.layer * 0.32)
    }

    if (!run) return
    for (const enemy of run.enemies) {
      const { x, y, radius: r } = enemy
      g.fillStyle(0x21132c).lineStyle(1.5, enemy.stats.color, 0.9)
      polygon(g, x - r, y - 5, x - r * 0.54, y - r * 0.63, x, y - 5,
        x + r * 0.54, y - r * 0.63, x + r, y - 5, x + r * 0.65, y + 7, x, y + r * 0.65, x - r * 0.65, y + 7)
      g.fillStyle(enemy.stats.color).fillCircle(x, y + 2, 3.5)
    }

    this.ship(run.player)
    for (const bullet of run.bullets.active) {
      const { x, y, radius: r } = bullet
      g.fillStyle(bullet.color)
      if (bullet.shape === Shape.Needle) {
        g.fillRect(x - 1.25, y - 6, 2.5, 13)
      } else if (bullet.shape === Shape.Diamond) {
        g.lineStyle(1, 0xfff6ff, 0.7)
        polygon(g, x, y - r - 1, x + r, y, x, y + r + 1, x - r, y)
      } else {
        g.fillCircle(x, y, r)
        g.fillStyle(0xfff6ff, 0.85).fillCircle(x, y, r * 0.45)
      }
    }
  }

  private ship(player: Player) {
    if (player.invulnerable && Math.floor(player.invulnerable * 15) % 2) return
    const g = this.graphics
    g.save().translateCanvas(player.x, player.y).rotateCanvas(player.tilt)
    const jet = 22 + Math.sin(this.skyTime * 49) * 5
    g.lineStyle(0, 0).fillStyle(0x724cff, 0.65)
    polygon(g, -6, 7, 6, 7, 2, jet - 2, 0, jet + 6, -3, jet - 5)
    g.fillStyle(0x86f5ff)
    polygon(g, -3.5, 8, 3.5, 8, 0, jet - 3)
    g.fillStyle(0x242855).lineStyle(1.3, 0x7ed6ff)
    polygon(g, 0, -19, 6, -4, 17, 9, 17, 13, 5, 9, 0, 12, -5, 9, -17, 13, -17, 9, -6, -4)
    g.fillStyle(0xc7edff).lineStyle(0, 0)
    polygon(g, 0, -16, 4, -4, 0, 5, -4, -4)
    g.fillStyle(0x735dff).fillCircle(0, -4, 2.5)
    g.restore()
    if (player.focus) {
      g.lineStyle(1, 0x9eefff, 0.6).strokeCircle(player.x, player.y, 11)
      g.fillStyle(0xffffff).fillCircle(player.x, player.y, player.radius)
    }
  }
}

export function polygon(g: Graphics, x: number, y: number, ...points: number[]) {
  g.beginPath().moveTo(x, y)
  for (let index = 0; index < points.length; index += 2) g.lineTo(points[index], points[index + 1])
  g.closePath().fillPath().strokePath()
}
