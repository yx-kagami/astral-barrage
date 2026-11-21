export const ENEMIES = {
  scout: { hp: 16, speed: 69, radius: 14, interval: 1.65, xp: 3, score: 120, color: 0xff779f },
  scatter: { hp: 49, speed: 36, radius: 20, interval: 2.25, xp: 6, score: 300, color: 0xc59bff },
  elite: { hp: 112, speed: 39, radius: 26, interval: 2.45, xp: 10, score: 650, color: 0xffb46e },
}

export type EnemyKind = keyof typeof ENEMIES
