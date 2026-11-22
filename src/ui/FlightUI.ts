import { BOMB_CHARGE } from '../config/mission'
import { UPGRADES } from '../config/upgrades'
import type { Upgrade } from '../config/upgrades'
import type { Run } from '../systems/Run'
import { formatTime } from '../utils/records'
import type { Profile } from '../utils/records'

export class FlightUI {
  private readonly listeners = new AbortController()
  private readonly hudBar: HTMLElement
  private readonly bossBar: HTMLElement
  private readonly bossName: HTMLElement
  private readonly bossHealth: HTMLProgressElement
  private readonly life: HTMLElement
  private readonly score: HTMLElement
  private readonly timer: HTMLElement
  private readonly bombs: HTMLElement
  private readonly charge: HTMLProgressElement
  private readonly xp: HTMLProgressElement
  private readonly level: HTMLElement
  private readonly controls: HTMLElement
  private readonly panels: HTMLElement[]
  readonly focus: HTMLButtonElement

  constructor(private readonly root: HTMLElement) {
    root.innerHTML = `
      <header class="hud" hidden>
        <div class="hud-row">
          <div><span class="section-label">生命</span><strong id="life">3 / 3</strong></div>
          <div><span class="section-label">分数</span><strong id="score">000000</strong></div>
          <div><span class="section-label">时间</span><strong id="clock">00:00</strong></div>
          <button type="button" id="pause" aria-label="暂停" title="暂停">Ⅱ</button>
        </div>
        <div class="xp-row"><span id="level">Lv. 1</span><progress id="xp" max="1" value="0" aria-label="经验"></progress></div>
      </header>
      <div id="boss-status" hidden>
        <span id="boss-name"></span><progress id="boss-health" max="1" aria-label="晦星方舟生命"></progress>
      </div>
      <section id="menu" class="cover" aria-labelledby="menu-title">
        <div class="cover-heading">
          <p class="cover-kicker"><i></i> 单人弹幕射击 <i></i></p>
          <h1 id="menu-title">星幕计划<span>弹幕远征</span></h1>
          <p class="subtitle" lang="en">ASTRAL BARRAGE</p>
        </div>
        <div class="cover-actions">
          <div class="records">
            <div><span>最高分</span><strong id="menu-score">000000</strong></div>
            <div><span>最快通关</span><strong id="menu-clear">—</strong></div>
          </div>
          <button type="button" id="start" class="primary"><span>开始游戏</span><b aria-hidden="true">→</b></button>
          <button type="button" id="settings-button" class="ghost"><span aria-hidden="true">⚙</span> 游戏设置</button>
          <p class="touch-guide">单指拖动｜按住低速键精确移动</p>
        </div>
      </section>
      <section id="pause-panel" class="overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" hidden>
        <div class="card">
          <h2 id="pause-title">远征暂停</h2>
          <button type="button" id="resume" class="primary">继续</button>
          <button type="button" data-restart>重新开始</button>
          <button type="button" data-menu class="ghost">返回菜单</button>
        </div>
      </section>
      <section id="upgrade-panel" class="overlay" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" hidden>
        <div class="card">
          <p class="section-label" id="new-level"></p>
          <h2 id="upgrade-title">选择强化</h2>
          <div id="upgrade-options"></div>
        </div>
      </section>
      <section id="result-panel" class="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title" hidden>
        <div class="card">
          <h2 id="result-title"></h2>
          <dl class="results">
            <div><dt>最终分数</dt><dd id="final-score"></dd></div>
            <div><dt>存活时间</dt><dd id="final-time"></dd></div>
            <div><dt>击毁敌机</dt><dd id="final-kills"></dd></div>
            <div><dt>擦弹次数</dt><dd id="final-grazes"></dd></div>
          </dl>
          <button type="button" data-restart class="primary">重新开始</button>
          <button type="button" data-menu class="ghost">返回菜单</button>
        </div>
      </section>
      <section id="settings-panel" class="overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden>
        <div class="card">
          <h2 id="settings-title">游戏设置</h2>
          <label class="setting"><span>音效与音乐</span><input type="checkbox" id="sound"></label>
          <label class="setting"><span>画面质量</span><select id="quality"><option value="high">高</option><option value="low">低</option></select></label>
          <button type="button" data-menu class="primary">返回菜单</button>
        </div>
      </section>
      <footer class="controls" hidden>
        <button type="button" id="focus"><span aria-hidden="true">⊙</span> 低速</button>
        <div class="bomb-meter"><span>擦弹充能</span><progress id="charge" max="${BOMB_CHARGE}" value="0" aria-label="炸弹能量"></progress></div>
        <button type="button" id="bomb"><span aria-hidden="true">✦</span> 炸弹 <strong id="bombs">2</strong></button>
      </footer>
    `
    this.hudBar = this.get('.hud')
    this.bossBar = this.get('#boss-status')
    this.bossName = this.get('#boss-name')
    this.bossHealth = this.get('#boss-health')
    this.life = this.get('#life')
    this.score = this.get('#score')
    this.timer = this.get('#clock')
    this.bombs = this.get('#bombs')
    this.charge = this.get('#charge')
    this.xp = this.get('#xp')
    this.level = this.get('#level')
    this.controls = this.get('.controls')
    this.focus = this.get('#focus')
    this.panels = [...root.querySelectorAll('section')]
  }

  bind(actions: {
    start: () => void; pause: () => void; bomb: () => void; menu: () => void;
    choose: (id: Upgrade) => void; settings: () => void;
    sound: (enabled: boolean) => void; quality: (quality: Profile['quality']) => void;
  }) {
    this.click('#start, [data-restart]', actions.start)
    this.click('#pause, #resume', actions.pause)
    this.click('#bomb', actions.bomb)
    this.click('[data-menu]', actions.menu)
    this.click('#settings-button', actions.settings)
    const options = { signal: this.listeners.signal }
    document.querySelector('#desktop-settings')?.addEventListener('click', actions.settings, options)
    this.get('#upgrade-options').addEventListener('click', (event) => {
      const option = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-upgrade]')
      if (option) actions.choose(option.dataset.upgrade as Upgrade)
    }, options)
    this.get<HTMLInputElement>('#sound').addEventListener('change', (event) => {
      actions.sound((event.target as HTMLInputElement).checked)
    }, options)
    this.get<HTMLSelectElement>('#quality').addEventListener('change', (event) => {
      actions.quality((event.target as HTMLSelectElement).value === 'low' ? 'low' : 'high')
    }, options)
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return
      const dialog = this.panels.find((panel) => !panel.hidden && panel.classList.contains('overlay'))
      if (!dialog) return
      const fields = [...dialog.querySelectorAll<HTMLElement>('button, input, select')]
      const first = fields[0]
      const last = fields.at(-1)
      const active = document.activeElement
      if (event.shiftKey ? active !== first && dialog.contains(active) : active !== last && dialog.contains(active)) return
      event.preventDefault()
      ;(event.shiftKey ? last : first)?.focus()
    }, options)
  }

  menu(profile: Profile, focus = true) {
    this.get('#menu-score').textContent = displayScore(profile.highScore)
    this.get('#menu-clear').textContent = profile.bestClear ? formatTime(profile.bestClear.time) : '—'
    this.updateRecord(profile)
    this.show('menu', focus ? '#start' : undefined)
  }

  settings(profile: Profile) {
    this.get<HTMLInputElement>('#sound').checked = profile.sound
    this.get<HTMLSelectElement>('#quality').value = profile.quality
    this.show('settings-panel', '#sound')
  }

  begin() {
    this.show()
    if (this.root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
  }

  hud(run: Run) {
    this.life.textContent = `${run.player.lives} / ${run.player.maxLives}`
    this.score.textContent = displayScore(run.score)
    this.timer.textContent = formatTime(run.time)
    this.bombs.textContent = String(run.bombs)
    this.get<HTMLButtonElement>('#bomb').disabled = run.bombs === 0
    this.charge.value = run.charge
    this.level.textContent = `Lv. ${run.progression.level}`
    this.xp.max = run.progression.threshold
    this.xp.value = run.progression.capped ? this.xp.max : run.progression.xp
    this.bossBar.hidden = !run.boss?.hp
    if (run.boss?.hp) {
      this.bossName.textContent = run.boss.intro ? '警告 · 机械星舰接近'
        : run.boss.transition ? '阶段转换 · 星舰核心过载' : `晦星方舟 · 阶段 ${run.boss.phase}`
      this.bossHealth.value = run.boss.hp / run.boss.maxHp
    }
  }

  pause() { this.show('pause-panel', '#resume') }

  upgrade(run: Run) {
    this.get('#new-level').textContent = `升级至 Lv. ${run.progression.level + 1}`
    this.get('#upgrade-options').innerHTML = run.progression.choices.map((id) => {
      const item = UPGRADES[id]
      return `<button type="button" class="upgrade" data-upgrade="${id}">
        <i aria-hidden="true">${item.icon}</i>
        <span><strong>${item.name} <small>${run.progression.ranks[id] + 1}/${item.max}</small></strong><span>${item.detail}</span></span>
      </button>`
    }).join('')
    this.show('upgrade-panel', '.upgrade')
  }

  result(run: Run, profile: Profile) {
    this.get('#result-title').textContent = run.state === 'won' ? '远征胜利' : '远征失败'
    this.get('#final-score').textContent = displayScore(run.score)
    this.get('#final-time').textContent = formatTime(run.time)
    this.get('#final-kills').textContent = String(run.kills)
    this.get('#final-grazes').textContent = String(run.grazes)
    this.updateRecord(profile)
    this.show('result-panel', '#result-panel [data-restart]')
  }

  destroy() { this.listeners.abort() }

  private show(id?: string, focus?: string) {
    for (const panel of this.panels) panel.hidden = panel.id !== id
    this.hudBar.hidden = id === 'menu' || id === 'settings-panel'
    if (this.hudBar.hidden) this.bossBar.hidden = true
    this.controls.hidden = Boolean(id)
    this.get<HTMLButtonElement>('#pause').disabled = Boolean(id)
    const desktopSettings = document.querySelector<HTMLButtonElement>('#desktop-settings')
    if (desktopSettings) desktopSettings.disabled = id !== 'menu'
    if (focus) this.get(focus).focus({ preventScroll: true })
  }

  private updateRecord(profile: Profile) {
    const record = document.querySelector('#side-record')
    if (record) record.textContent = displayScore(profile.highScore)
  }

  private get<T extends HTMLElement = HTMLElement>(selector: string) {
    return this.root.querySelector<T>(selector)!
  }

  private click(selector: string, callback: () => void) {
    for (const item of this.root.querySelectorAll(selector)) {
      item.addEventListener('click', callback, { signal: this.listeners.signal })
    }
  }
}

function displayScore(score: number) { return String(score).padStart(6, '0') }
