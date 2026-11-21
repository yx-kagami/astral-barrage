import Phaser from 'phaser'
import { HEIGHT, STEP, WIDTH } from '../config/field'
import type { Upgrade } from '../config/upgrades'
import { Run } from '../systems/Run'
import { Controls } from '../ui/Controls'
import { FlightUI } from '../ui/FlightUI'
import { Audio } from '../utils/Audio'
import { loadProfile, recordRun, saveProfile } from '../utils/records'
import { FlightArt } from './FlightArt'
import { paintSky } from './SkyArtwork'

export class FlightScene extends Phaser.Scene {
  private run: Run | null = null
  private accumulator = 0
  private hudIn = 0
  private controls!: Controls
  private ui!: FlightUI
  private art!: FlightArt
  private cover!: Phaser.GameObjects.Image
  private listeners!: AbortController
  private readonly profile = loadProfile()
  private readonly soundtrack = new Audio(this.profile.sound)

  constructor() {
    super('flight')
  }

  create() {
    this.background('mission-sky', false)
    this.cover = this.background('mission-cover', true)
    this.art = new FlightArt(this.add.graphics())
    this.controls = new Controls(document.querySelector('#screen')!)
    this.ui = new FlightUI(document.querySelector('#interface')!)
    this.controls.bindFocus(this.ui.focus)
    this.controls.onPause = () => this.togglePause()
    this.controls.onBomb = () => this.bomb()
    this.ui.bind({
      start: () => this.start(),
      pause: this.controls.onPause,
      bomb: this.controls.onBomb,
      menu: () => this.menu(),
      choose: (id) => this.choose(id),
      settings: () => this.ui.settings(this.profile),
      sound: (sound) => {
        this.profile.sound = sound
        saveProfile(this.profile)
        this.soundtrack.setEnabled(sound)
        this.soundtrack.cue('start')
      },
      quality: (quality) => {
        this.profile.quality = quality
        saveProfile(this.profile)
      },
    })
    this.ui.menu(this.profile, false)
    this.listeners = new AbortController()
    const options = { signal: this.listeners.signal }
    const landscape = window.matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 620px)')
    landscape.addEventListener('change', () => {
      if (landscape.matches && this.run?.state === 'playing') this.togglePause()
    }, options)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.run?.state === 'playing') this.togglePause()
    }, options)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.listeners.abort()
      this.ui.destroy()
      this.controls.destroy()
      this.soundtrack.close()
      this.run?.bullets.clear()
      this.run = null
      this.textures.remove('mission-sky')
      this.textures.remove('mission-cover')
    })
  }

  private background(key: string, cover: boolean) {
    const texture = this.textures.createCanvas(key, WIDTH, HEIGHT)!
    paintSky(texture.getContext(), cover)
    texture.refresh()
    return this.add.image(0, 0, key).setOrigin(0)
  }

  private menu() {
    this.run?.bullets.clear()
    this.run = null
    this.controls.reset()
    this.cover.setVisible(true)
    this.ui.menu(this.profile)
  }

  private start() {
    this.run = new Run(this.profile.quality === 'high')
    this.cover.setVisible(false)
    this.accumulator = 0
    this.hudIn = 0
    this.controls.reset()
    this.ui.begin()
    this.ui.hud(this.run)
    this.soundtrack.unlock()
    this.soundtrack.cue('start')
  }

  private choose(id: Upgrade) {
    if (this.run?.state !== 'upgrade') return
    this.run.choose(id)
    this.controls.reset()
    this.accumulator = 0
    this.ui.hud(this.run)
    if (this.run.progression.choices.length) this.ui.upgrade(this.run)
    else this.ui.begin()
  }

  private togglePause() {
    if (!this.run) {
      if (!document.querySelector<HTMLElement>('#settings-panel')?.hidden) this.menu()
      return
    }
    if (this.run.state !== 'playing' && this.run.state !== 'paused') return
    this.accumulator = 0
    this.controls.reset()
    if (this.run.state === 'playing') {
      this.run.state = 'paused'
      this.ui.pause()
    } else {
      this.run.state = 'playing'
      this.ui.begin()
      this.soundtrack.unlock()
    }
  }

  private bomb() {
    if (!this.run?.bomb()) return
    this.soundtrack.cue('blast')
    this.ui.hud(this.run)
    if (this.run.state === 'won') this.finish(this.run)
  }

  private finish(run: Run) {
    this.controls.reset()
    recordRun(this.profile, run)
    this.ui.result(run, this.profile)
    this.soundtrack.cue(run.state === 'won' ? 'won' : 'lost')
  }

  update(_time: number, ms: number) {
    const dt = Math.min(ms / 1000, 0.05)
    const run = this.run
    if (run?.state === 'playing') {
      this.accumulator += dt
      const lives = run.player.lives
      const kills = run.kills
      while (this.accumulator >= STEP && run.state === 'playing') {
        run.step(STEP, this.controls.read())
        this.accumulator -= STEP
      }
      if (run.player.lives < lives) this.soundtrack.cue('hit')
      if (run.kills > kills) this.soundtrack.cue('destroy')
      this.soundtrack.tick()
      this.hudIn -= dt
      if (this.hudIn <= 0 || run.state !== 'playing') {
        this.ui.hud(run)
        this.hudIn = 0.1
      }
      this.handleRunState(run)
    } else if (run?.state === 'won' || run?.state === 'lost') {
      run.effects.update(dt)
    }
    this.art.draw(dt, run)
  }

  private handleRunState(run: Run) {
    if (run.state === 'upgrade') {
      this.controls.reset()
      this.ui.upgrade(run)
      this.soundtrack.cue('level')
    } else if (run.state === 'won' || run.state === 'lost') this.finish(run)
  }
}
