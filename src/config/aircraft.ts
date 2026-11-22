export interface AircraftStats {
  lives: number
  bombs: number
  speed: number
  damage: number
  interval: number
}

type Skill = {
  name: string
  cooldown: number
} & ({
  kind: 'pulse'
  radius: number
  damage: number
  invulnerability: number
} | {
  kind: 'barrage'
  duration: number
  rate: number
  pierce: number
})

interface Aircraft {
  name: string
  role: string
  stats: AircraftStats
  skill?: Skill
}

export type AircraftId = 'vector' | 'zhelan' | 'wenxing'
export const DEFAULT_AIRCRAFT = 'vector'
export const AIRCRAFT: Record<AircraftId, Aircraft> = {
  vector: {
    name: '巡星号',
    role: '均衡型',
    stats: { lives: 3, bombs: 2, speed: 266, damage: 8, interval: 0.15 },
  },
  zhelan: {
    name: '折岚',
    role: '念动力拦截',
    stats: { lives: 2, bombs: 2, speed: 252, damage: 10, interval: 0.18 },
    skill: { name: '引力折叠', kind: 'pulse', cooldown: 15, radius: 122, damage: 115, invulnerability: 0.45 },
  },
  wenxing: {
    name: '闻星',
    role: '符阵突击',
    stats: { lives: 3, bombs: 1, speed: 292, damage: 7, interval: 0.145 },
    skill: { name: '列星符阵', kind: 'barrage', cooldown: 18, duration: 3, rate: 0.55, pierce: 2 },
  },
}

export function aircraftId(value: unknown): AircraftId {
  return typeof value === 'string' && Object.hasOwn(AIRCRAFT, value) ? value as AircraftId : DEFAULT_AIRCRAFT
}

export function describeSkill(skill?: Skill) {
  if (!skill) return '标准武装：自动射击，炸弹可清理敌弹。'
  const cooldown = `冷却 ${skill.cooldown} 秒。`
  if (skill.kind === 'pulse') return `清除身边敌弹，伤害范围内的敌方目标并短暂无敌。${cooldown}`
  return `${skill.duration} 秒内加快主炮，且每发额外穿透 ${skill.pierce} 个目标。${cooldown}`
}
