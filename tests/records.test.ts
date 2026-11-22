import { expect, it, vi } from 'vitest'
import { Run } from '../src/systems/Run'
import { loadProfile, recordRun } from '../src/utils/records'

it('retains the fastest victory and the independent high score when the profile is loaded again', () => {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  })
  try {
    const run = new Run(false)
    run.state = 'won'
    run.score = 18_000
    run.time = 276
    recordRun(loadProfile(), run)
    expect(loadProfile().bestClear).toEqual({ time: 276, score: 18_000 })

    run.score = 15_000
    run.time = 231
    recordRun(loadProfile(), run)
    run.score = 20_000
    run.time = 298
    recordRun(loadProfile(), run)

    run.state = 'lost'
    run.score = 19_000
    run.time = 205
    recordRun(loadProfile(), run)
    expect(loadProfile()).toMatchObject({
      highScore: 20_000,
      bestClear: { time: 231, score: 15_000 },
    })
  } finally {
    vi.unstubAllGlobals()
  }
})

it('preserves existing records while defaulting missing or unknown appearance selections', () => {
  let stored = JSON.stringify({ highScore: 730, bestClear: { time: 250, score: 710 }, aircraft: '__proto__' })
  vi.stubGlobal('localStorage', {
    getItem: () => stored,
    setItem: (_key: string, value: string) => { stored = value },
  })
  try {
    const profile = loadProfile()
    expect(profile).toMatchObject({ aircraft: 'vector', skin: 'aurora', highScore: 730 })
    profile.aircraft = 'wenxing'
    profile.skin = 'ember'
    recordRun(profile, new Run(false))
    expect(loadProfile()).toMatchObject({ aircraft: 'wenxing', skin: 'ember', highScore: 730,
      bestClear: { time: 250, score: 710 } })
  } finally {
    vi.unstubAllGlobals()
  }
})
