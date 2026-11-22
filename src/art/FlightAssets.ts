import type Phaser from 'phaser'
import { DEFAULT_AIRCRAFT } from '../config/aircraft'
import type { AircraftId } from '../config/aircraft'
import { SKINS } from '../config/appearance'
import type { Skin, SkinId } from '../config/appearance'

const CHARACTERS = {
  zhelan: {
    sprite: new URL('../assets/hangar/zhelan-sprite.webp', import.meta.url).href,
    portrait: new URL('../assets/hangar/zhelan-portrait.webp', import.meta.url).href,
    size: 48,
  },
  wenxing: {
    sprite: new URL('../assets/hangar/wenxing-sprite.webp', import.meta.url).href,
    portrait: new URL('../assets/hangar/wenxing-portrait.webp', import.meta.url).href,
    size: 49,
  },
}

export class FlightAssets {
  private readonly thumbnails = new Map<SkinId, string>()

  preload(scene: Phaser.Scene) {
    for (const [id, art] of Object.entries(CHARACTERS)) scene.load.image(id, art.sprite)
  }

  install(scene: Phaser.Scene) {
    for (const id of Object.keys(SKINS) as SkinId[]) {
      const key = shipKey(id)
      const texture = scene.textures.createCanvas(key, 100, 100)!
      drawShip(texture.getContext(), SKINS[id])
      texture.refresh()
      this.thumbnails.set(id, texture.getCanvas().toDataURL())
    }
  }

  sprite(scene: Phaser.Scene, aircraft: AircraftId, skin: SkinId) {
    if (aircraft !== DEFAULT_AIRCRAFT && scene.textures.exists(aircraft)) {
      return { key: aircraft, size: CHARACTERS[aircraft].size }
    }
    return { key: shipKey(skin), size: 43 }
  }

  preview(aircraft: AircraftId, skin: SkinId) {
    if (aircraft !== DEFAULT_AIRCRAFT) return CHARACTERS[aircraft]
    const ship = this.thumbnails.get(skin)!
    return { sprite: ship, portrait: ship }
  }

  destroy(scene: Phaser.Scene) {
    for (const id of Object.keys(SKINS) as SkinId[]) scene.textures.remove(shipKey(id))
    for (const id of Object.keys(CHARACTERS)) if (scene.textures.exists(id)) scene.textures.remove(id)
    this.thumbnails.clear()
  }
}

function shipKey(id: SkinId) { return `ship-${id}` }

function drawShip(ctx: CanvasRenderingContext2D, skin: Skin) {
  const { hull } = skin
  ctx.translate(50, 50)
  ctx.scale(2.3, 2.3)
  ctx.lineWidth = 1.05
  ctx.lineJoin = 'round'
  const plate = ctx.createLinearGradient(0, -18, 0, 14)
  plate.addColorStop(0, hull.edge)
  plate.addColorStop(0.4, hull.plate)
  plate.addColorStop(1, '#151b34')
  path(ctx, plate, hull.edge, 0, -19, 6, -4, 17, 9, 17, 13, 5, 9, 0, 12, -5, 9, -17, 13, -17, 9, -6, -4)
  path(ctx, hull.blade, null, 0, -16, 4, -4, 0, 5, -4, -4)
  for (const side of [-1, 1]) path(ctx, hull.edge, null, side * 6, 1, side * 14, 10, side * 9, 7)
  ctx.fillStyle = hull.core
  ctx.beginPath()
  ctx.ellipse(0, -4, 2.3, 3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function path(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, stroke: string | null, ...points: number[]) {
  ctx.beginPath()
  ctx.moveTo(points[0], points[1])
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (!stroke) return
  ctx.strokeStyle = stroke
  ctx.stroke()
}
