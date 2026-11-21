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

it('awards each grazing bullet once and never on a direct hit', () => {
  const run = new Run()
  const bullet = run.bullets.spawn(run.player.x + 14, run.player.y, 0, 0, 4, 0, Shape.Orb)!
  for (let tick = 0; tick < 12; tick++) run.step(STEP, idle)
  expect(run.grazes).toBe(1)
  expect(run.charge).toBe(1)
  bullet.x = run.player.x
  run.step(STEP, idle)
  expect(run.player.lives).toBe(2)
  expect(run.grazes).toBe(1)
})

it('freezes simulation during pause and bombs recycle hostile projectiles', () => {
  const run = new Run()
  const hostile = run.bullets.spawn(20, 100, 0, 100, 4, 0, Shape.Orb)
  run.state = 'paused'
  run.step(STEP, idle)
  expect(run.time).toBe(0)
  expect(hostile?.x).toBe(20)
  expect(run.bomb()).toBe(false)
  run.state = 'playing'
  expect(run.bomb()).toBe(true)
  expect(run.bullets.active).toHaveLength(0)
  expect(run.bombs).toBe(1)
})

it('spawns the boss on schedule, changes phases, and completes the run on its defeat', () => {
  const run = new Run()
  run.time = 180 - STEP / 2
  run.step(STEP, idle)
  const boss = run.boss!
  expect(boss.phase).toBe(1)
  boss.damage(boss.maxHp)
  expect(boss.hp).toBe(boss.maxHp)
  boss.update(3, run.bullets, run.player)
  boss.damage(boss.maxHp * 0.51)
  expect(boss.phase).toBe(2)
  expect(boss.vulnerable).toBe(false)
  boss.update(3, run.bullets, run.player)
  run.bullets.spawn(boss.x, boss.y, 0, 0, 3, 0, Shape.Needle, true, boss.hp)
  run.step(STEP, idle)
  expect(run.state).toBe('won')
  expect(run.score).toBe(10000)
})
