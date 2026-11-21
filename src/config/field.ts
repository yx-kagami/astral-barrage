export const WIDTH = 390
export const HEIGHT = 844
export const TOP = 108
export const BOTTOM = 737
export const STEP = 1 / 120

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
