export class Effects {
  readonly sparks = Array.from({ length: 180 }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, color: 0,
  }))
  private next = 0
  bombFlash = 0

  constructor(private readonly enhanced: boolean) {}

  burst(x: number, y: number, color: number, count: number) {
    for (let index = 0; index < (this.enhanced ? count : Math.ceil(count / 3)); index++) {
      const spark = this.sparks[this.next++ % this.sparks.length]
      const angle = index * 2.4 + this.next * 0.13
      const speed = 25 + this.next * 31 % 143
      Object.assign(spark, { x, y, color, life: 0.28 + (this.next % 10) * 0.041,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed })
    }
  }

  update(dt: number) {
    this.bombFlash = Math.max(0, this.bombFlash - dt)
    for (const spark of this.sparks) {
      if (spark.life <= 0) continue
      spark.life -= dt
      spark.x += spark.vx * dt
      spark.y += spark.vy * dt
    }
  }
}
