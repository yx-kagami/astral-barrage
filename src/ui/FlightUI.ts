import type { Run } from '../systems/Run'

export class FlightUI {
  readonly stats: HTMLElement
  readonly panel: HTMLElement
  readonly controls: HTMLElement
  readonly start: HTMLButtonElement
  readonly focus: HTMLButtonElement

  constructor(private readonly root: HTMLElement) {
    root.innerHTML = `
      <header class="hud" hidden><span id="life"></span><span id="score"></span><span id="clock"></span><span id="bombs"></span></header>
      <div id="boss-status" hidden><span id="boss-name"></span><progress id="boss-health" max="1"></progress></div>
      <section class="panel">
        <h1>星幕计划<br>弹幕远征</h1>
        <p>ASTRAL BARRAGE</p>
        <button type="button" id="start">开始游戏</button>
        <button type="button" id="resume" hidden>继续</button>
      </section>
      <footer class="controls" hidden><button type="button" id="focus">低速</button><button type="button" id="pause">暂停</button><button type="button" id="bomb">炸弹</button></footer>
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

  hud(run: Run) {
    this.stats.querySelector('#life')!.textContent = `生命 ${run.player.lives}`
    this.stats.querySelector('#score')!.textContent = `分数 ${run.score}`
    this.stats.querySelector('#clock')!.textContent = `${Math.floor(run.time)} 秒`
    this.stats.querySelector('#bombs')!.textContent = `炸弹 ${run.bombs}`
    this.root.querySelector<HTMLElement>('#boss-status')!.hidden = !run.boss?.hp
    if (run.boss?.hp) {
      this.root.querySelector('#boss-name')!.textContent = run.boss.intro ? '警告 · 机械星舰接近'
        : run.boss.transition ? '阶段转换 · 星舰核心过载' : `晦星方舟 · 阶段 ${run.boss.phase}`
      this.root.querySelector<HTMLProgressElement>('#boss-health')!.value = run.boss.hp / run.boss.maxHp
    }
  }

  pause() {
    this.panel.querySelector('h1')!.textContent = '远征暂停'
    this.panel.querySelector('p')!.textContent = '按 Esc 继续'
    this.start.textContent = '重新开始'
    this.root.querySelector<HTMLButtonElement>('#resume')!.hidden = false
    this.panel.hidden = false
    this.controls.hidden = true
  }

  result(run: Run) {
    this.controls.hidden = true
    this.root.querySelector<HTMLButtonElement>('#resume')!.hidden = true
    this.panel.querySelector('h1')!.textContent = run.state === 'won' ? '远征胜利' : '远征失败'
    this.panel.querySelector('p')!.textContent =
      `最终分数 ${run.score} · 存活 ${Math.floor(run.time)} 秒 · 击毁 ${run.kills} · 擦弹 ${run.grazes}`
    this.start.textContent = '重新开始'
    this.panel.hidden = false
    this.start.focus({ preventScroll: true })
  }
}
