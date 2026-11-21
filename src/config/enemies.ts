type Pattern =
  | { kind: 'aimed'; count: number; spread: number; speed: number; doubleFrom: number }
  | { kind: 'fan'; count: number; perSector: number; spread: number; speed: number }
  | { kind: 'ring'; count: number; perSector: number; rotation: number; speed: number }

interface EnemyStats {
  hp: number
  speed: number
  radius: number
  interval: number
  firstShot: number
  xp: number
  score: number
  color: number
  pattern: Pattern
}

export type EnemyKind = 'scout' | 'scatter' | 'elite'

export const ENEMIES: Record<EnemyKind, EnemyStats> = {
  scout: {
    hp: 16, speed: 69, radius: 14, interval: 1.65, firstShot: 1.55, xp: 3, score: 120, color: 0xff779f,
    pattern: { kind: 'aimed', count: 1, spread: 0.13, speed: 184, doubleFrom: 2 },
  },
  scatter: {
    hp: 49, speed: 36, radius: 20, interval: 2.25, firstShot: 2.35, xp: 6, score: 300, color: 0xc59bff,
    pattern: { kind: 'fan', count: 5, perSector: 2, spread: 0.16, speed: 146 },
  },
  elite: {
    hp: 112, speed: 39, radius: 26, interval: 2.45, firstShot: 2.35, xp: 10, score: 650, color: 0xffb46e,
    pattern: { kind: 'ring', count: 10, perSector: 3, rotation: 0.53, speed: 125 },
  },
}
