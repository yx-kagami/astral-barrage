type Cue = 'start' | 'skill' | 'blast' | 'hit' | 'destroy' | 'level' | 'won' | 'lost'
const pitches: Record<Cue, number[]> = {
  start: [220, 329.63, 440], skill: [246.94, 369.99, 554.37], blast: [154, 92, 55], hit: [185, 83], destroy: [240, 128],
  level: [329.63, 493.88, 659.25], won: [261.63, 392, 523.25, 659.25], lost: [293.66, 220, 146.83],
}
const harmony = [[110, 164.81, 261.63], [82.41, 123.47, 196], [98, 146.83, 220], [73.42, 110, 174.61]]

export class Audio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private musicAt = 0
  private note = 0
  private destroyAt = 0

  constructor(public enabled: boolean) {}

  unlock() {
    if (!this.enabled) return
    try {
      const compatibility = window as Window & { webkitAudioContext?: typeof AudioContext }
      const Engine = window.AudioContext ?? compatibility.webkitAudioContext
      if (!this.context && Engine) {
        this.context = new Engine()
        this.master = this.context.createGain()
        this.master.connect(this.context.destination)
      }
      void this.context?.resume().catch(() => {})
    } catch {
      // Audio may be unavailable until a later user gesture.
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (enabled) this.unlock()
    this.master?.gain.setTargetAtTime(enabled ? 1 : 0, this.context!.currentTime, 0.02)
  }

  cue(cue: Cue) {
    if (!this.enabled || this.context?.state !== 'running') return
    const now = this.context.currentTime
    if (cue === 'destroy' && now < this.destroyAt) return
    if (cue === 'destroy') this.destroyAt = now + 0.10
    pitches[cue].forEach((frequency, index) => this.tone(frequency, now + index * 0.076,
      cue === 'destroy' ? 0.12 : 0.2, cue === 'blast' ? 0.13 : 0.045, cue === 'hit' ? 'triangle' : 'sine'))
  }

  tick() {
    if (!this.enabled || this.context?.state !== 'running' || this.context.currentTime < this.musicAt) return
    const now = this.context.currentTime
    const chord = harmony[Math.floor(this.note / 8) % harmony.length]
    this.tone(chord[this.note % 3] * (this.note % 4 === 3 ? 4 : 2), now, 0.50, 0.022, 'sine')
    if (this.note % 4 === 0) this.tone(chord[0], now, 0.64, 0.028, 'triangle')
    this.musicAt = now + 0.44
    this.note++
  }

  close() {
    void this.context?.close().catch(() => {})
  }

  private tone(frequency: number, at: number, length: number, volume: number, type: OscillatorType) {
    const oscillator = this.context!.createOscillator()
    const envelope = this.context!.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    envelope.gain.setValueAtTime(0.0001, at)
    envelope.gain.exponentialRampToValueAtTime(volume, at + 0.025)
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length)
    oscillator.connect(envelope).connect(this.master!)
    oscillator.start(at)
    oscillator.stop(at + length)
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
  }
}
