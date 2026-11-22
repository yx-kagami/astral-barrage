import { expect, it } from 'vitest'
import { STEP, clamp } from '../src/config/field'
import { Run } from '../src/systems/Run'
import type { Upgrade } from '../src/config/upgrades'

it('can finish a complete expedition using movement, collected upgrades and normal fire', () => {
  let seed = 38285
  const run = new Run(false, () => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0
    return (seed >>> 0) / 4294967296
  })
  const preferred: Upgrade[] = ['damage', 'twin', 'rate', 'missile', 'hull', 'wing', 'graze', 'speed', 'pierce']
  const input = { x: 0, y: 0, dragX: 0, dragY: 0, focus: false }
  let destination = run.player.x
  for (let tick = 0; tick < 360 / STEP; tick++) {
    if (run.state === 'won' || run.state === 'lost') break
    if (run.state === 'upgrade') {
      run.choose(preferred.find((id) => run.progression.choices.includes(id))!)
      continue
    }
    if (tick % 8 === 0) destination = navigate(run)
    input.x = clamp((destination - run.player.x) / (run.player.speed * STEP), -1, 1)
    run.step(STEP, input)
  }
  expect(run.state, `t=${Math.round(run.time)}, kills=${run.kills}, level=${run.progression.level}`).toBe('won')
  expect(run.boss?.phase).toBe(2)
  expect(run.progression.level).toBeGreaterThan(1)
  expect(run.time).toBeGreaterThan(220)
  expect(run.time).toBeLessThan(360)
})

function navigate(run: Run) {
  const { x, y, speed } = run.player
  const enemy = run.enemies.filter((target) => target.y < y - 110).sort((a, b) => b.y - a.y)[0]
  const boss = run.boss
  const lead = boss ? (y - boss.y) / 690 : 0
  const predictedBoss = boss ? 195 + Math.sin((boss.age - 3 + lead) * (boss.phase === 1 ? 0.72 : 1.03))
    * (boss.phase === 1 ? 82 : 100) : null
  const aim = predictedBoss ?? enemy?.x ?? 195
  const hostile = run.bullets.active.filter((bullet) => !bullet.friendly &&
    Math.abs(bullet.x - x) < 280 && Math.abs(bullet.y - y) < 145)
  let best = x
  let bestCost = Infinity
  let bestClearance = 0
  for (const delta of [0, -12, 12, -27, 27, -49, 49, -85, 85, -125, 125]) {
    const next = clamp(x + delta, 18, 372)
    let clearance = Infinity
    for (const bullet of hostile) {
      for (let future = 0.025; future <= 0.48; future += 0.025) {
        const projected = x + clamp(next - x, -future * speed, future * speed)
        const dx = bullet.x + future * bullet.vx - projected
        const dy = bullet.y + future * bullet.vy - y
        clearance = Math.min(clearance, Math.hypot(dx, dy) - bullet.radius)
      }
    }
    const cost = Math.abs(next - aim) + Math.abs(next - x) * 0.36 + Math.max(0, 20 - clearance) ** 2 * 17
    if (cost < bestCost) {
      bestCost = cost
      best = next
      bestClearance = clearance
    }
  }
  if (bestClearance < 6 && run.player.invulnerable === 0) run.bomb()
  return best
}
