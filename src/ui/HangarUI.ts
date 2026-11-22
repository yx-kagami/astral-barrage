import { AIRCRAFT, DEFAULT_AIRCRAFT, describeSkill } from '../config/aircraft'
import type { AircraftId } from '../config/aircraft'
import { SKINS } from '../config/appearance'
import type { SkinId } from '../config/appearance'
import type { FlightAssets } from '../art/FlightAssets'
import type { Profile } from '../utils/records'

const aircraft = Object.keys(AIRCRAFT) as AircraftId[]
const skins = Object.keys(SKINS) as SkinId[]

export class HangarUI {
  private readonly pilotChoices: HTMLButtonElement[]
  private readonly skinChoices: HTMLButtonElement[]
  private readonly modes: HTMLButtonElement[]
  private readonly stage: HTMLElement
  private readonly portrait: HTMLImageElement
  private readonly badge: HTMLImageElement

  constructor(private readonly root: HTMLElement, private readonly assets: FlightAssets) {
    root.innerHTML = `
      <header class="hangar-heading">
        <h2 id="hangar-title">机库</h2>
        <button type="button" data-menu class="ghost">返回菜单</button>
      </header>
      <div class="hangar-stage">
        <div class="hangar-orbit" aria-hidden="true"></div>
        <img class="hangar-portrait" alt="">
        <img class="hangar-sprite" alt="" aria-hidden="true">
        <div class="hangar-caption"><span id="aircraft-role" class="section-label"></span><h3 id="aircraft-name"></h3></div>
      </div>
      <dl class="hangar-stats">
        <div><dt>生命</dt><dd id="aircraft-lives"></dd></div>
        <div><dt>炸弹</dt><dd id="aircraft-bombs"></dd></div>
        <div><dt>移速</dt><dd id="aircraft-speed"></dd></div>
        <div><dt>单发</dt><dd id="aircraft-damage"></dd></div>
        <div><dt>发 / 秒</dt><dd id="aircraft-rate"></dd></div>
      </dl>
      <div class="hangar-skill"><strong id="aircraft-skill"></strong><p id="aircraft-detail"></p></div>
      <div class="hangar-tabs" role="group" aria-label="配置分类">
        <button type="button" data-mode="aircraft" aria-pressed="true">机体</button>
        <button type="button" data-mode="skin" aria-pressed="false">皮肤</button>
      </div>
      <div class="hangar-options" data-choices="aircraft" role="group" aria-label="选择机体">
        ${aircraft.map((id) => `<button type="button" data-aircraft="${id}" aria-pressed="false"><img alt=""><span>${AIRCRAFT[id].name}</span></button>`).join('')}
      </div>
      <div class="hangar-options hangar-skins" data-choices="skin" role="group" aria-label="选择皮肤" hidden>
        ${skins.map((id) => `<button type="button" data-skin="${id}" aria-pressed="false"><i style="--swatch: ${SKINS[id].accent}"></i><span>${SKINS[id].name}</span></button>`).join('')}
      </div>
      <p class="hangar-note">配置自动保存<span data-skin-note hidden>。皮肤仅改变外观。</span></p>
    `
    this.pilotChoices = [...root.querySelectorAll<HTMLButtonElement>('[data-aircraft]')]
    this.skinChoices = [...root.querySelectorAll<HTMLButtonElement>('[data-skin]')]
    this.modes = [...root.querySelectorAll<HTMLButtonElement>('[data-mode]')]
    this.stage = root.querySelector('.hangar-stage')!
    this.portrait = root.querySelector('.hangar-portrait')!
    this.badge = root.querySelector('.hangar-sprite')!
  }

  bind(onAircraft: (id: AircraftId) => void, onSkin: (id: SkinId) => void, options: AddEventListenerOptions) {
    for (const button of this.pilotChoices) button.addEventListener('click', () => onAircraft(button.dataset.aircraft as AircraftId), options)
    for (const button of this.skinChoices) button.addEventListener('click', () => onSkin(button.dataset.skin as SkinId), options)
    for (const button of this.modes) button.addEventListener('click', () => this.mode(button.dataset.mode === 'skin' ? 'skin' : 'aircraft'), options)
  }

  update(profile: Profile) {
    const { aircraft, skin } = profile
    const { name, role, stats, skill } = AIRCRAFT[aircraft]
    const visuals = SKINS[skin]
    const { portrait, sprite } = this.assets.preview(aircraft, skin)
    this.root.style.setProperty('--hangar-accent', visuals.accent)
    this.stage.dataset.pilot = aircraft
    this.portrait.src = portrait
    this.portrait.style.filter = visuals.portraitTone
    this.badge.src = sprite
    this.badge.hidden = aircraft === DEFAULT_AIRCRAFT
    const labels = {
      'aircraft-name': name, 'aircraft-role': role,
      'aircraft-lives': stats.lives, 'aircraft-bombs': stats.bombs,
      'aircraft-speed': stats.speed, 'aircraft-damage': stats.damage,
      'aircraft-rate': (1 / stats.interval).toFixed(1),
      'aircraft-skill': skill?.name ?? '标准武装',
      'aircraft-detail': describeSkill(skill),
    }
    for (const [id, value] of Object.entries(labels)) this.root.querySelector(`#${id}`)!.textContent = String(value)
    for (const button of this.pilotChoices) {
      const id = button.dataset.aircraft as AircraftId
      button.querySelector('img')!.src = this.assets.preview(id, skin).sprite
      button.setAttribute('aria-pressed', String(id === aircraft))
    }
    for (const button of this.skinChoices) button.setAttribute('aria-pressed', String(button.dataset.skin === skin))
  }

  private mode(mode: 'aircraft' | 'skin') {
    for (const button of this.modes) button.setAttribute('aria-pressed', String(button.dataset.mode === mode))
    for (const content of this.root.querySelectorAll<HTMLElement>('[data-choices]')) content.hidden = content.dataset.choices !== mode
    this.root.querySelector<HTMLElement>('[data-skin-note]')!.hidden = mode !== 'skin'
  }
}
