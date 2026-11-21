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

  constructor() {
    super('flight')
  }

  create() {
    this.art = new FlightArt(this.add.graphics())
    this.controls = new Controls(document.querySelector('#screen')!)
    this.ui = new FlightUI(document.querySelector('#interface')!)
    this.controls.bindFocus(this.ui.focus)
    this.ui.start.onclick = () => this.start()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
      if (this.hudIn <= 0 || !run.player.lives) {
        this.ui.hud(run.player.lives, run.score, run.time)
        this.hudIn = 0.1
      }
      if (!run.player.lives) this.ui.lost(run.score)
    }
    this.art.draw(dt, run)
  }
}
