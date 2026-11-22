export class Effects {
  readonly sparks = Array.from({ length: 180 }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, color: 0,
  }))
  readonly rings = Array.from({ length: 12 }, () => ({ x: 0, y: 0, life: 0, color: 0, radius: 0 }))
  private next = 0
  private nextRing = 0
  bombFlash = 0
  pulse = 0

  constructor(private readonly enhanced: boolean) {}

  burst(x: number, y: number, color: number, count: number) {
    if (this.enhanced) {
      const ring = this.rings[this.nextRing++ % this.rings.length]
      ring.x = x
      ring.y = y
      ring.life = 0.36
      ring.color = color
      ring.radius = Math.min(count * 0.9, 62)
    }
    for (let index = 0; index < (this.enhanced ? count : Math.ceil(count / 3)); index++) {
      const spark = this.sparks[this.next++ % this.sparks.length]
      const angle = index * 2.4 + this.next * 0.13
      const speed = 25 + this.next * 31 % 143
      spark.x = x
      spark.y = y
      spark.color = color
      spark.life = 0.28 + (this.next % 10) * 0.041
      spark.vx = Math.cos(angle) * speed
      spark.vy = Math.sin(angle) * speed
    }
  }

  update(dt: number) {
    this.bombFlash = Math.max(0, this.bombFlash - dt)
    this.pulse = Math.max(0, this.pulse - dt)
    for (const ring of this.rings) ring.life = Math.max(0, ring.life - dt)
    for (const spark of this.sparks) {
      if (spark.life <= 0) continue
      spark.life -= dt
      spark.x += spark.vx * dt
      spark.y += spark.vy * dt
    }
  }
}
