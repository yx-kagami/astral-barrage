import { devices, expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function start(page: Page) {
  await page.goto('./')
  await page.getByRole('button', { name: '开始游戏' }).click()
  await expect(page.locator('#life')).toHaveText('3 / 3')
}

async function playerX(page: Page) {
  return page.locator('#screen canvas').evaluate((element: HTMLCanvasElement) => {
    const row = element.getContext('2d')!.getImageData(0, 655, 390, 19).data
    let sum = 0
    let count = 0
    for (let offset = 0; offset < row.length; offset += 4) {
      if (row[offset + 1] < 185 || row[offset + 2] < 225) continue
      sum += (offset / 4) % 390
      count++
    }
    return count ? sum / count : -1
  })
}

test('starts a run, destroys an enemy with autofire and moves by keyboard', async ({ page }) => {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  await start(page)
  await expect.poll(async () => Number(await page.locator('#score').textContent()), { timeout: 12_000 }).toBeGreaterThan(0)
  const initial = await playerX(page)
  expect(initial).toBeGreaterThan(180)
  await page.keyboard.down('ArrowRight')
  await expect.poll(() => playerX(page)).toBeGreaterThan(initial + 35)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.press('x')
  await expect(page.locator('#bombs')).toHaveText('1')
  expect(errors).toEqual([])
})

test('pauses with Escape and when hidden, then resumes without advancing paused time', async ({ page }) => {
  await page.clock.install()
  await start(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: '远征暂停' })).toBeVisible()
  const pausedAt = await page.locator('#clock').textContent()
  await page.clock.runFor(3000)
  await expect(page.locator('#clock')).toHaveText(pausedAt!)
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await page.clock.runFor(1200)
  await expect(page.locator('#clock')).not.toHaveText(pausedAt!)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByRole('heading', { name: '远征暂停' })).toBeVisible()
})

test('shows failure results, restarts, and preserves the record across reload', async ({ page }) => {
  await page.clock.install()
  await start(page)
  for (let batch = 0; batch < 13; batch++) {
    if (await page.locator('#result-panel').isVisible()) break
    await page.clock.runFor(5000)
    const upgrades = page.locator('#upgrade-options button')
    if (await upgrades.first().isVisible()) await upgrades.first().click()
  }
  await expect(page.getByRole('heading', { name: '远征失败' })).toBeVisible()
  const score = (await page.locator('#final-score').textContent())!
  expect(Number(score)).toBeGreaterThan(0)
  await expect.poll(async () => Number(await page.locator('#final-kills').textContent())).toBeGreaterThan(0)
  await page.getByRole('button', { name: '重新开始' }).click()
  await expect(page.locator('#life')).toHaveText('3 / 3')
  await page.reload()
  await expect(page.locator('#menu-score')).toHaveText(score)
})

test('offers three distinct upgrade cards and continues after selection', async ({ page }) => {
  await page.clock.install()
  await start(page)
  await page.clock.runFor(5000)
  await page.keyboard.press('x')
  await page.clock.runFor(5500)
  const dialog = page.getByRole('dialog', { name: '选择强化' })
  await expect(dialog).toBeVisible()
  const cards = dialog.getByRole('button')
  await expect(cards).toHaveCount(3)
  const titles = await cards.allTextContents()
  expect(new Set(titles).size).toBe(3)
  const pausedAt = await page.locator('#clock').textContent()
  await page.clock.runFor(2200)
  await expect(page.locator('#clock')).toHaveText(pausedAt!)
  await cards.first().click()
  await expect(page.locator('#level')).toHaveText('Lv. 2')
  await expect(dialog).toBeHidden()
})

test('restores settings on reload', async ({ page }) => {
  await page.goto('./')
  await page.locator('#settings-button').click()
  await page.getByRole('checkbox', { name: '音效与音乐' }).uncheck()
  await page.getByLabel('画面质量').selectOption('low')
  await page.reload()
  await page.locator('#settings-button').click()
  await expect(page.getByRole('checkbox', { name: '音效与音乐' })).not.toBeChecked()
  await expect(page.getByLabel('画面质量')).toHaveValue('low')
})

for (const device of ['iPhone 13', 'Pixel 7'] as const) {
  test(`fits the ${device} viewport and keeps touch controls reachable`, async ({ browser }, testInfo) => {
    const { defaultBrowserType, ...phone } = devices[device]
    const baseURL = testInfo.project.use.baseURL
    const context = await browser.newContext({ ...phone, baseURL })
    try {
      const page = await context.newPage()
      await page.goto('./')
      const startButton = page.getByRole('button', { name: '开始游戏' })
      await expect(startButton).toBeInViewport()
      await startButton.tap()
      const viewport = page.viewportSize()!
      for (const id of ['#frame', '#focus', '#bomb', '#pause']) {
        const bounds = (await page.locator(id).boundingBox())!
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.y).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1)
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1)
        if (id !== '#frame') expect(bounds.height).toBeGreaterThanOrEqual(44)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width)
      await page.locator('#pause').tap()
      await expect(page.getByRole('heading', { name: '远征暂停' })).toBeVisible()
      await page.setViewportSize({ width: 320, height: 568 })
      await expect(page.getByRole('button', { name: '继续', exact: true })).toBeInViewport()
      await page.getByRole('button', { name: '返回菜单' }).tap()
      await expect(startButton).toBeInViewport()
      await expect(page.locator('#settings-button')).toBeInViewport()
    } finally {
      await context.close()
    }
  })
}

test('supports relative drag while a second finger holds focus', async ({ browser, browserName, baseURL }) => {
  test.skip(browserName !== 'chromium', 'Chromium DevTools provides native multi-touch injection')
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL })
  try {
    const page = await context.newPage()
    await start(page)
    const first = await playerX(page)
    const cdp = await context.newCDPSession(page)
    const bounds = (await page.locator('#frame').boundingBox())!
    const low = (await page.locator('#focus').boundingBox())!
    const move = { x: Math.round(bounds.x + 46), y: Math.round(bounds.y + bounds.height / 2), id: 1 }
    const focus = { x: Math.round(low.x + low.width / 2), y: Math.round(low.y + low.height / 2), id: 2 }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move, focus] })
    await expect(page.locator('#focus')).toHaveAttribute('data-held', 'true')
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...move, x: move.x + 66 }, focus] })
    await expect.poll(() => playerX(page)).toBeGreaterThan(first + 25)
    expect(await playerX(page)).toBeLessThan(first + 53)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(page.locator('#focus')).not.toHaveAttribute('data-held', 'true')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await page.setViewportSize({ width: 800, height: 400 })
    await expect(page.getByRole('status')).toContainText('请旋转手机')
    await page.setViewportSize({ width: 393, height: 780 })
    await expect(page.getByRole('heading', { name: '远征暂停' })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('loads the production game under a repository path and starts offline', async ({ context, page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Offline network emulation is verified in Chromium')
  await page.goto('./')
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible()
  const manifest = await page.request.get('./manifest.webmanifest')
  expect(manifest.ok()).toBeTruthy()
  const data = await manifest.json()
  expect(data.start_url).toBe('./')
  for (const icon of data.icons) expect((await page.request.get(`./${icon.src}`)).ok()).toBeTruthy()
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/astral-barrage/sw.js'))
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: '开始游戏' }).click()
  await expect(page.locator('#life')).toHaveText('3 / 3')
  await expect.poll(async () => Number(await page.locator('#score').textContent()), { timeout: 12_000 }).toBeGreaterThan(0)
})
