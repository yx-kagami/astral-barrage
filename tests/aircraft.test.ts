import { expect, it } from 'vitest'
import { AIRCRAFT } from '../src/config/aircraft'
import { STEP } from '../src/config/field'
import { Enemy } from '../src/entities/Enemy'
import { Shape } from '../src/systems/BulletManager'
import { Run } from '../src/systems/Run'

const idle = { x: 0, y: 0, dragX: 0, dragY: 0, focus: false }

it('uses each aircraft baseline for movement and upgrades', () => {
  const run = new Run(false, Math.random, 'wenxing')
  const stats = AIRCRAFT.wenxing.stats
  expect(run.player.lives).toBe(stats.lives)
  expect(run.bombs).toBe(stats.bombs)
  expect(run.progression.mainDamage).toBe(stats.damage)
  expect(run.progression.interval).toBe(stats.interval)

  run.progression.xp = run.progression.threshold
  run.progression.choices = ['speed']
  run.state = 'upgrade'
  run.choose('speed')
  expect(run.player.speed).toBeCloseTo(stats.speed * 1.08)

  const start = run.player.x
  run.player.move(STEP, { ...idle, dragX: 4 })
  expect(run.player.x - start).toBeGreaterThan(4)
  expect(new Run(false).activateSkill()).toBe(false)
})

it('clears only nearby hostile bullets and starts a pause-safe cooldown for the gravity pulse', () => {
  const run = new Run(false, Math.random, 'zhelan')
  const { x, y } = run.player
  const near = run.bullets.spawn(x + 60, y, 0, 0, 3, 0, Shape.Orb)
  const far = run.bullets.spawn(x + 150, y, 0, 0, 3, 0, Shape.Orb)
  const friendly = run.bullets.spawn(x + 45, y, 0, 0, 3, 0, Shape.Needle, true)
  const enemy = new Enemy('scout', x + 64)
  enemy.y = y - 25
  run.enemies.push(enemy)

  expect(run.activateSkill()).toBe(true)
  expect(run.bullets.active).not.toContain(near)
  expect(run.bullets.active).toEqual(expect.arrayContaining([far, friendly]))
  expect(run.kills).toBe(1)
  expect(run.player.invulnerable).toBeGreaterThan(0)
  expect(run.bombs).toBe(AIRCRAFT.zhelan.stats.bombs)
  expect(run.activateSkill()).toBe(false)

  run.state = 'paused'
  run.step(STEP, idle)
  expect(run.skillCooldown).toBe(15)
  run.state = 'playing'
  run.step(STEP, idle)
  expect(run.skillCooldown).toBeLessThan(15)
})

it('uses the bonus penetration and firing speed only during the seal barrage', () => {
  const run = new Run(false, Math.random, 'wenxing')
  expect(run.activateSkill()).toBe(true)
  run.step(STEP, idle)
  expect(run.bullets.active[0]?.pierce).toBe(2)
  expect(run.player.fireCooldown).toBeLessThan(AIRCRAFT.wenxing.stats.interval)
  for (let step = 0; step < 400; step++) run.step(STEP, idle)
  expect(run.skillActive).toBe(0)
  run.bullets.clear()
  run.player.fireCooldown = 0
  run.step(STEP, idle)
  expect(run.bullets.active.find((bullet) => bullet.friendly)?.pierce).toBe(0)
  expect(run.skillCooldown).toBeGreaterThan(0)
})
