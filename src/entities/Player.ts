import { BOTTOM, clamp, TOP, WIDTH } from '../config/field'

export interface FlightInput {
  x: number
  y: number
  dragX: number
  dragY: number
  focus: boolean
}

export class Player {
  x = WIDTH / 2
  y = 661
  radius = 3.4
  maxLives = 3
  lives = this.maxLives
  invulnerable = 0
  fireCooldown = 0
  focus = false
  tilt = 0
  speed = 266

  move(dt: number, input: FlightInput) {
    const speed = this.speed * (input.focus ? 0.43 : 1)
    const dx = input.x * speed * dt + input.dragX * (input.focus ? 0.5 : 1)
    const dy = input.y * speed * dt + input.dragY * (input.focus ? 0.5 : 1)
    this.x = clamp(this.x + dx, 12, WIDTH - 12)
    this.y = clamp(this.y + dy, TOP, BOTTOM)
    this.focus = input.focus
    this.tilt += (clamp(dx * 0.085, -0.55, 0.55) - this.tilt) * Math.min(dt * 16, 1)
    this.invulnerable = Math.max(0, this.invulnerable - dt)
  }

  hit() {
    if (this.invulnerable > 0 || this.lives === 0) return false
    this.lives--
    this.invulnerable = 1.6
    return true
  }
}
