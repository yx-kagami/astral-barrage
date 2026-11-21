import { expect, it } from 'vitest'
import { UPGRADES } from '../src/config/upgrades'
import { Player } from '../src/entities/Player'
import { Progression } from '../src/systems/Progression'
import { Run } from '../src/systems/Run'
import { STEP } from '../src/config/field'

it('awards three distinct upgrades and applies only offered ranks up to the configured cap', () => {
  const profile = new Progression(() => 0)
  const player = new Player()
  for (let index = 0; index < UPGRADES.damage.max; index++) {
    profile.xp = profile.threshold
    expect(profile.ready()).toBe(true)
    expect(new Set(profile.choices).size).toBe(3)
    expect(profile.choose('hull', player)).toBe(false)
    expect(profile.choose('damage', player)).toBe(true)
    expect(profile.mainDamage).toBe(8 + (index + 1) * UPGRADES.damage.value)
  }
  profile.xp = profile.threshold
  expect(profile.ready()).toBe(true)
  expect(profile.choices).not.toContain('damage')
  expect(profile.choose('damage', player)).toBe(false)
})

it('collects an experience drop, stops battle, and resumes after choosing a card', () => {
  const run = new Run()
  const idle = { x: 0, y: 0, dragX: 0, dragY: 0, focus: false }
  run.drops.add(run.player.x + 70, run.player.y, run.progression.threshold)
  for (let tick = 0; tick < 30; tick++) run.step(STEP, idle)
  expect(run.state).toBe('upgrade')
  const pausedAt = run.time
  run.step(STEP, idle)
  expect(run.time).toBe(pausedAt)
  run.choose(run.progression.choices[0])
  expect(run.progression.level).toBe(2)
  expect(run.state).toBe('playing')
})

it('raises hull capacity and restores one life', () => {
  const player = new Player()
  player.hit()
  const progression = new Progression(() => 0.8)
  progression.xp = progression.threshold
  progression.ready()
  expect(progression.choose('hull', player)).toBe(true)
  expect(player.maxLives).toBe(4)
  expect(player.lives).toBe(3)
})
