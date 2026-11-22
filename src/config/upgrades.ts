export const UPGRADES = {
  damage: { name: '脉冲增幅', icon: '✦', detail: '主炮每发伤害 +3', max: 5, value: 3 },
  rate: { name: '超频回路', icon: '»', detail: '主炮射击间隔 −11 毫秒', max: 5, value: 0.011 },
  twin: { name: '双联炮架', icon: 'Ⅱ', detail: '主炮改为双发，各造成 72% 伤害', max: 1, value: 0.72 },
  wing: { name: '侧翼辅助炮', icon: '⋈', detail: '两侧发射斜向光弹，伤害随等级提高', max: 4, value: 1.8 },
  missile: { name: '追光导弹', icon: '⌁', detail: '周期性发射导弹，自动寻找目标', max: 4, value: 9 },
  pierce: { name: '相位穿透', icon: '↟', detail: '每发主炮可额外贯穿 1 个目标', max: 3, value: 1 },
  speed: { name: '离子推进', icon: '↗', detail: '移动速度 +8%', max: 4, value: 0.08 },
  hull: { name: '再生装甲', icon: '✚', detail: '生命上限 +1，恢复 1 格生命', max: 3, value: 1 },
  graze: { name: '余辉回收', icon: '◉', detail: '每次擦弹额外获得 1 点炸弹能量', max: 3, value: 1 },
} as const

export type Upgrade = keyof typeof UPGRADES
export const UPGRADE_IDS = Object.keys(UPGRADES) as Upgrade[]
