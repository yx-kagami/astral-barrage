import { WIDTH } from '../config/field'
import type { FlightInput } from '../entities/Player'

const flightKeys = new Set(['KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ShiftLeft', 'ShiftRight', 'KeyX', 'Escape'])

export class Controls {
  private readonly keys = new Set<string>()
  private readonly listeners = new AbortController()
  private pointer: number | null = null
  private lastX = 0
  private lastY = 0
  private focusPointer: number | null = null
  private focusButton: HTMLButtonElement | null = null
  private dragX = 0
  private dragY = 0
  private readonly input: FlightInput = { x: 0, y: 0, dragX: 0, dragY: 0, focus: false }
  onPause = () => {}
  onBomb = () => {}

  constructor(private readonly surface: HTMLElement) {
    const options = { signal: this.listeners.signal }
    window.addEventListener('keydown', (event) => {
      if (!flightKeys.has(event.code) || event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) return
      event.preventDefault()
      this.keys.add(event.code)
      if (!event.repeat && event.code === 'Escape') this.onPause()
      if (!event.repeat && event.code === 'KeyX') this.onBomb()
    }, options)
    window.addEventListener('keyup', (event) => this.keys.delete(event.code), options)
    window.addEventListener('blur', () => this.reset(), options)
    surface.addEventListener('pointerdown', (event) => {
      if (this.pointer !== null || event.button !== 0) return
      this.pointer = event.pointerId
      this.lastX = event.clientX
      this.lastY = event.clientY
      surface.setPointerCapture(event.pointerId)
    }, options)
    surface.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.pointer) return
      const scale = WIDTH / surface.getBoundingClientRect().width
      this.dragX += (event.clientX - this.lastX) * scale
      this.dragY += (event.clientY - this.lastY) * scale
      this.lastX = event.clientX
      this.lastY = event.clientY
    }, options)
    const release = (event: PointerEvent) => {
      if (event.pointerId === this.pointer) this.pointer = null
    }
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      surface.addEventListener(type, release, options)
    }
  }

  bindFocus(button: HTMLButtonElement) {
    const options = { signal: this.listeners.signal }
    this.focusButton = button
    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || this.focusPointer !== null) return
      this.focusPointer = event.pointerId
      button.setPointerCapture(event.pointerId)
      button.dataset.held = 'true'
    }, options)
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      button.addEventListener(type, (event) => {
        if (this.focusPointer !== event.pointerId) return
        this.focusPointer = null
        delete button.dataset.held
      }, options)
    }
  }

  read() {
    const x = Number(this.has('ArrowRight', 'KeyD')) - Number(this.has('ArrowLeft', 'KeyA'))
    const y = Number(this.has('ArrowDown', 'KeyS')) - Number(this.has('ArrowUp', 'KeyW'))
    const length = x && y ? Math.SQRT2 : 1
    this.input.x = x / length
    this.input.y = y / length
    this.input.focus = this.focusPointer !== null || this.has('ShiftLeft', 'ShiftRight')
    const dragScale = Math.max(1, Math.hypot(this.dragX, this.dragY) / 5.5)
    this.input.dragX = this.dragX / dragScale
    this.input.dragY = this.dragY / dragScale
    this.dragX -= this.input.dragX
    this.dragY -= this.input.dragY
    return this.input
  }

  reset() {
    this.keys.clear()
    if (this.pointer !== null && this.surface.hasPointerCapture(this.pointer)) this.surface.releasePointerCapture(this.pointer)
    if (this.focusButton) {
      if (this.focusPointer !== null && this.focusButton.hasPointerCapture(this.focusPointer)) {
        this.focusButton.releasePointerCapture(this.focusPointer)
      }
      delete this.focusButton.dataset.held
    }
    this.pointer = null
    this.focusPointer = null
    this.dragX = 0
    this.dragY = 0
  }

  destroy() {
    this.reset()
    this.listeners.abort()
  }

  private has(first: string, second: string) {
    return this.keys.has(first) || this.keys.has(second)
  }
}
