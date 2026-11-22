import type { Run } from '../systems/Run'

export interface Profile {
  highScore: number
  bestClear: { time: number; score: number } | null
  sound: boolean
  quality: 'high' | 'low'
}

const KEY = 'astral-barrage.profile.v1'
const defaults: Profile = { highScore: 0, bestClear: null, sound: true, quality: 'high' }

export function loadProfile(): Profile {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Profile> | null
    const best = saved?.bestClear
    return {
      highScore: safeNumber(saved?.highScore),
      bestClear: best && safeNumber(best.time) > 0
        ? { time: safeNumber(best.time), score: safeNumber(best.score) } : null,
      sound: typeof saved?.sound === 'boolean' ? saved.sound : defaults.sound,
      quality: saved?.quality === 'low' ? 'low' : 'high',
    }
  } catch {
    return { ...defaults }
  }
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // Storage can be disabled in private browsing or embedded previews.
  }
}

export function recordRun(profile: Profile, run: Run) {
  profile.highScore = Math.max(profile.highScore, run.score)
  if (run.state === 'won' && (!profile.bestClear || run.time < profile.bestClear.time)) {
    profile.bestClear = { time: run.time, score: run.score }
  }
  saveProfile(profile)
}

export function formatTime(value: number) {
  const seconds = Math.floor(value)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
