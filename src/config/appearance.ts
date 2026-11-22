export type SkinId = 'aurora' | 'ember'
export const DEFAULT_SKIN = 'aurora'
export const SKINS = {
  aurora: {
    name: '极光',
    accent: '#9ef5ff',
    hull: { plate: '#242855', edge: '#7ed6ff', blade: '#c7edff', core: '#735dff' },
    tail: { outer: 0x7958ff, inner: 0x86f5ff, length: 22, width: 6 },
    weapon: { main: 0x82efff, wing: 0xbbadff, missile: 0x7effc2 },
    burst: { color: 0x9de8ff, width: 2.4 },
    portraitTone: 'none',
  },
  ember: {
    name: '暮金',
    accent: '#ffd18e',
    hull: { plate: '#603345', edge: '#ffc68a', blade: '#fff0be', core: '#fb8c62' },
    tail: { outer: 0xe0466d, inner: 0xffd090, length: 25, width: 7 },
    weapon: { main: 0xffbd83, wing: 0xff94b6, missile: 0xffdca4 },
    burst: { color: 0xffa274, width: 3.25 },
    portraitTone: 'sepia(0.14) saturate(1.12)',
  },
} satisfies Record<SkinId, {
  name: string
  accent: string
  hull: Record<'plate' | 'edge' | 'blade' | 'core', string>
  tail: { outer: number; inner: number; length: number; width: number }
  weapon: { main: number; wing: number; missile: number }
  burst: { color: number; width: number }
  portraitTone: string
}>

export type Skin = (typeof SKINS)[SkinId]

export function skinId(value: unknown): SkinId {
  return typeof value === 'string' && Object.hasOwn(SKINS, value) ? value as SkinId : DEFAULT_SKIN
}
