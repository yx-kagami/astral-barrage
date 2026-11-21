import type { Player } from '../entities/Player'

export class Drops {
  readonly items: { x: number; y: number; value: number; pulled: boolean }[] = []

  add(x: number, y: number, value: number) {
    this.items.push({ x, y, value, pulled: false })
  }

  update(player: Player, dt: number) {
    let collected = 0
    for (let index = this.items.length - 1; index >= 0; index--) {
      const item = this.items[index]
      const dx = player.x - item.x
      const dy = player.y - item.y
      const distance = Math.hypot(dx, dy)
      if (distance < 15) {
        collected += item.value
        this.items.splice(index, 1)
      } else if (item.pulled || distance < 112) {
        item.pulled = true
        item.x += dx / distance * 405 * dt
        item.y += dy / distance * 405 * dt
      } else {
        item.y += dt * (item.y < 570 ? 143 : 52)
        if (item.y > 786) this.items.splice(index, 1)
      }
    }
    return collected
  }
}
