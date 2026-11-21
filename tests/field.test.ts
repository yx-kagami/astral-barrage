import { expect, it } from 'vitest'
import { BOTTOM, clamp, HEIGHT, TOP } from '../src/config/field'

it('keeps the flight area inside the logical field', () => {
  expect(TOP).toBeGreaterThan(0)
  expect(BOTTOM).toBeLessThan(HEIGHT)
  expect(clamp(-20, TOP, BOTTOM)).toBe(TOP)
  expect(clamp(400, TOP, BOTTOM)).toBe(400)
  expect(clamp(1000, TOP, BOTTOM)).toBe(BOTTOM)
})
