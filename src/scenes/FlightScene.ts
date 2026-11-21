import Phaser from 'phaser'
import { STEP } from '../config/field'
import { Run } from '../systems/Run'
import { Controls } from '../ui/Controls'
import { FlightUI } from '../ui/FlightUI'
import { FlightArt } from './FlightArt'

export class FlightScene extends Phaser.Scene {
  private run: Run | null = null
  private accumulator = 0
  private hudIn = 0
  private controls!: Controls
  private ui!: FlightUI
  private art!: FlightArt
  private listeners!: AbortController

  constructor() {
    super('flight')
  }

  create() {
    this.art = new FlightArt(this.add.graphics())
    this.controls = new Controls(document.querySelector('#screen')!)
    this.ui = new FlightUI(document.querySelector('#interface')!)
    this.controls.bindFocus(this.ui.focus)
    this.ui.start.onclick = () => this.start()
    this.controls.onPause = () => this.togglePause()
    this.controls.onBomb = () => this.run?.bomb()
    this.listeners = new AbortController()
    const options = { signal: this.listeners.signal }
    document.querySelector('#bomb')!.addEventListener('click', this.controls.onBomb, options)
    document.querySelector('#pause')!.addEventListener('click', this.controls.onPause, options)
    document.querySelector('#resume')!.addEventListener('click', this.controls.onPause, options)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.run?.state === 'playing') this.togglePause()
    }, options)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.listeners.abort()
      this.controls.destroy()
      this.run?.bullets.clear()
      this.run = null
      this.ui.start.onclick = null
    })
    this.art.draw(0, null)
  }

  private start() {
    this.run = new Run()
    this.accumulator = 0
    this.hudIn = 0
    this.controls.reset()
    this.ui.begin()
    this.ui.hud(this.run)
  }

  private togglePause() {
    if (!this.run) return
    if (this.run.state !== 'playing' && this.run.state !== 'paused') return
    this.accumulator = 0
    this.controls.reset()
    if (this.run.state === 'playing') {
      this.run.state = 'paused'
      this.ui.pause()
    } else {
      this.run.state = 'playing'
      this.ui.begin()
    }
  }

  update(_time: number, ms: number) {
    const dt = Math.min(ms / 1000, 0.05)
    const run = this.run
    if (run?.state === 'playing') {
      this.accumulator += dt
      const input = this.controls.read()
      while (this.accumulator >= STEP && run.state === 'playing') {
        run.step(STEP, input)
        this.controls.consumeDrag()
        this.accumulator -= STEP
      }
      this.hudIn -= dt
      if (this.hudIn <= 0 || run.state !== 'playing') {
        this.ui.hud(run)
        this.hudIn = 0.1
      }
    }
    if (run && (run.state === 'lost' || run.state === 'won') && this.ui.panel.hidden) this.ui.result(run)
    this.art.draw(dt, run)
  }
}
