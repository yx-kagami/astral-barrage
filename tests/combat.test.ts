import { expect, it } from 'vitest'
import { STEP } from '../src/config/field'
import { Player } from '../src/entities/Player'
import { BulletManager, overlaps, Shape } from '../src/systems/BulletManager'
import { Run } from '../src/systems/Run'

const idle = { x: 0, y: 0, dragX: 0, dragY: 0, focus: false }

it('starts with three lives and gives a damage cooldown', () => {
  const player = new Player()
  expect(player.hit()).toBe(true)
  expect(player.hit()).toBe(false)
  expect(player.lives).toBe(2)
  player.move(1.7, idle)
  expect(player.hit()).toBe(true)
  expect(player.lives).toBe(1)
})

it('uses a circular core and recycles out-of-bounds bullets', () => {
  const player = new Player()
  const pool = new BulletManager()
  const bullet = pool.spawn(player.x + 7, player.y + 7, 0, 100, 4, 0, Shape.Orb)!
  expect(overlaps(player, bullet)).toBe(false)
  bullet.y = player.y
  expect(overlaps(player, bullet)).toBe(true)
  pool.update(3, () => false)
  expect(pool.active).toHaveLength(0)
  expect(pool.spawn(0, 0, 0, 100, 4, 0, Shape.Orb)).toBe(bullet)
})

it('autofires, destroys enemies, and eventually loses when idle', () => {
  const run = new Run()
  for (let tick = 0; tick < 120 * 75 && run.state === 'playing'; tick++) run.step(STEP, idle)
  expect(run.kills).toBeGreaterThan(0)
  expect(run.state).toBe('lost')
  expect(run.player.lives).toBe(0)
})
