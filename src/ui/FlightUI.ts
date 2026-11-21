export class FlightUI {
  readonly stats: HTMLElement
  readonly panel: HTMLElement
  readonly controls: HTMLElement
  readonly start: HTMLButtonElement
  readonly focus: HTMLButtonElement

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <header class="hud" hidden><span id="life"></span><span id="score"></span><span id="clock"></span></header>
      <section class="panel">
        <h1>星幕计划<br>弹幕远征</h1>
        <p>ASTRAL BARRAGE</p>
        <button type="button" id="start">开始游戏</button>
      </section>
      <footer class="controls" hidden><button type="button" id="focus">低速</button></footer>
    `
    this.stats = root.querySelector('.hud')!
    this.panel = root.querySelector('.panel')!
    this.controls = root.querySelector('.controls')!
    this.start = root.querySelector('#start')!
    this.focus = root.querySelector('#focus')!
  }

  begin() {
    this.stats.hidden = false
    this.controls.hidden = false
    this.panel.hidden = true
  }

  hud(lives: number, score: number, time: number) {
    this.stats.querySelector('#life')!.textContent = `生命 ${lives}`
    this.stats.querySelector('#score')!.textContent = `分数 ${score}`
    this.stats.querySelector('#clock')!.textContent = `${Math.floor(time)} 秒`
  }

  lost(score: number) {
    this.controls.hidden = true
    this.panel.querySelector('h1')!.textContent = '远征失败'
    this.panel.querySelector('p')!.textContent = `最终分数 ${score}`
    this.start.textContent = '重新开始'
    this.panel.hidden = false
    this.start.focus({ preventScroll: true })
  }
}
