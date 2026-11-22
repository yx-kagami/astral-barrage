import { HEIGHT, WIDTH } from '../config/field'

export function paintSky(ctx: CanvasRenderingContext2D, cover: boolean, ship = true) {
  ctx.fillStyle = '#080a17'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  glow(ctx, 290, 340, 362, cover ? 'rgba(61,36,125,.69)' : 'rgba(36,25,71,.27)')
  glow(ctx, 62, 475, 284, cover ? 'rgba(24,66,111,.61)' : 'rgba(15,46,85,.32)')
  glow(ctx, 190, 175, 270, 'rgba(40,31,94,.43)')

  let seed = 16027
  const random = () => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0
    return (seed >>> 0) / 4294967296
  }
  for (let i = 0; i < (cover ? 980 : 240); i++) {
    const x = random() * WIDTH
    const y = random() * HEIGHT
    const strength = random() ** 2
    const inCloud = Math.max(0, 1 - Math.abs(y - (480 - x * 0.46)) / 200)
    ctx.fillStyle = `rgba(${i % 3 === 0 ? '152,128,255' : '170,207,255'},${strength * (0.12 + inCloud * 0.55) * (cover ? 1 : 0.43)})`
    const size = strength > 0.92 && cover ? 1.45 : 0.7
    ctx.fillRect(x, y, size, size)
  }
  if (cover) {
    planet(ctx)
    orbit(ctx)
    if (ship) heroShip(ctx)
  }
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

function orbit(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.translate(195, 409)
  ctx.rotate(-0.29)
  for (const [rx, ry, alpha] of [[182, 83, 0.36], [167, 71, 0.17], [146, 59, 0.21], [211, 97, 0.12]]) {
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0.12, Math.PI * 2 - 0.34)
    ctx.strokeStyle = `rgba(145,189,255,${alpha})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
  for (let index = 0; index < 66; index++) {
    const angle = index * Math.PI / 33
    const outer = index % 6 === 0 ? 1.06 : 1.021
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * 182, Math.sin(angle) * 83)
    ctx.lineTo(Math.cos(angle) * 182 * outer, Math.sin(angle) * 83 * outer)
    ctx.strokeStyle = '#91aaf05c'
    ctx.stroke()
  }
  ctx.restore()
  for (const [x, y, radius] of [[76, 340, 2], [318, 314, 3], [50, 470, 2.2], [339, 456, 2.8], [289, 517, 1.6], [121, 539, 2]]) {
    glow(ctx, x, y, 18, 'rgba(84,153,255,.54)')
    ctx.fillStyle = '#e0f3ff'
    ctx.fillRect(x - radius, y - 0.5, radius * 2, 1)
    ctx.fillRect(x - 0.5, y - radius, 1, radius * 2)
  }
}

function planet(ctx: CanvasRenderingContext2D) {
  const x = 190
  const y = 395
  const r = 114
  glow(ctx, x, y + 3, r + 56, 'rgba(101,99,255,.47)')
  const body = ctx.createRadialGradient(x + 53, y - 74, 6, x + 52, y - 68, 234)
  body.addColorStop(0, '#4b609b')
  body.addColorStop(0.34, '#252953')
  body.addColorStop(0.68, '#131430')
  body.addColorStop(0.94, '#090a1f')
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = body
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  for (let i = 0; i < 33; i++) {
    ctx.beginPath()
    const line = y - r + i * 7
    ctx.moveTo(x - r, line + 31)
    ctx.bezierCurveTo(x - 65, line - 18, x + 80, line - 7, x + r, line - 48)
    ctx.lineWidth = 1 + i % 4
    ctx.strokeStyle = i % 3 ? '#6587bd14' : '#bd91ff28'
    ctx.stroke()
  }
  ctx.restore()
  const rim = ctx.createLinearGradient(x - r, y + r, x + r, y - r)
  rim.addColorStop(0.15, '#5f39bc34')
  rim.addColorStop(0.58, '#5779eb99')
  rim.addColorStop(0.81, '#a5d7ff')
  rim.addColorStop(1, '#b98cff')
  ctx.strokeStyle = rim
  ctx.lineWidth = 1.8
  ctx.stroke()
  glow(ctx, 264, 309, 55, 'rgba(143,177,255,.48)')
}

function heroShip(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.translate(194, 410)
  ctx.rotate(-0.105)
  glow(ctx, 0, 35, 80, 'rgba(69,126,255,.64)')
  const trail = ctx.createLinearGradient(0, 25, 0, 158)
  trail.addColorStop(0, '#d8fbff')
  trail.addColorStop(0.16, '#77d5ff')
  trail.addColorStop(0.52, '#6358ff78')
  trail.addColorStop(1, '#6757ed00')
  for (const x of [-24, 0, 24]) {
    const length = x === 0 ? 154 : 119
    paint(ctx, trail, null, x - 5, 18, x + 5, 18, x + 2, length - 12, x, length, x - 2, length - 12)
  }
  const alloy = ctx.createLinearGradient(-84, 32, 62, -54)
  alloy.addColorStop(0, '#8883d9')
  alloy.addColorStop(0.26, '#303763')
  alloy.addColorStop(0.68, '#475883')
  alloy.addColorStop(1, '#b6dfff')
  paint(ctx, '#171d3c', '#8cb4f8', 0, -75, 14, -27, 35, -18, 77, 25, 80, 43, 40, 27, 27, 44,
    13, 36, 0, 43, -13, 36, -27, 44, -40, 27, -80, 43, -77, 25, -35, -18, -14, -27)
  paint(ctx, alloy, '#adcbfd', 0, -71, 12, -27, 13, 16, 0, 33, -13, 16, -12, -27)
  for (const side of [-1, 1]) {
    paint(ctx, alloy, '#7e92d3', side * 13, -14, side * 29, -22, side * 67, 19, side * 75, 36,
      side * 42, 23, side * 27, 34, side * 20, 19)
    paint(ctx, '#8ae0ff', null, side * 30, -12, side * 52, 11, side * 39, 5, side * 27, -5)
    paint(ctx, '#879df0', '#c2ddff', side * 40, 22, side * 49, 28, side * 27, 38, side * 22, 29)
    paint(ctx, '#1d2b52', '#768acd', side * 16, 8, side * 24, 3, side * 35, 15, side * 25, 25)
  }
  paint(ctx, '#19365e', '#a9efff', 0, -41, 6, -22, 4, -10, 0, -4, -4, -10, -6, -22)
  paint(ctx, '#cff8ff', null, 0, -35, 3, -22, 0, -15, -3, -22)
  ctx.restore()
}

function paint(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, stroke: string | null, ...points: number[]) {
  ctx.beginPath()
  ctx.moveTo(points[0], points[1])
  for (let index = 2; index < points.length; index += 2) ctx.lineTo(points[index], points[index + 1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
