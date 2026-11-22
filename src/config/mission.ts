export const BOSS = {
  arrival: 180,
  hp: 12800,
  radius: 53,
  transition: 0.5,
  phaseDelay: 2.6,
  bombDamage: 210,
  first: {
    interval: 1.42,
    fan: { count: 9, spread: 0.166, speed: 169, color: 0xff7eab },
    ring: { count: 18, rotation: 0.186, speed: 129, color: 0xc895ff },
  },
  second: {
    shotsPerCycle: 14,
    aimed: { interval: 0.91, count: 7, spread: 0.22, speed: 224, color: 0xff8e9b },
    spiral: { interval: 0.135, count: 4, rotation: 0.21, speed: 158, color: 0xd893ff },
  },
}

export const WAVE_LANES = [195, 101, 282, 144, 241, 63, 327]
export const WAVE_SECTORS = [
  { start: 0, interval: 2.07, minimum: 1.85, decay: 0.003, eliteEvery: 11, scatterEvery: 4 },
  { start: 48, interval: 1.9, minimum: 1.61, decay: 0.005, eliteEvery: 8, scatterEvery: 3 },
  { start: 104, interval: 1.63, minimum: 1.21, decay: 0.006, eliteEvery: 6, scatterEvery: 3 },
  { start: 154, interval: 1.34, minimum: 1.12, decay: 0.008, eliteEvery: 5, scatterEvery: 3 },
]

export const GRAZE_MARGIN = 15
export const BOMB_CHARGE = 26
export const MAX_BOMBS = 4
