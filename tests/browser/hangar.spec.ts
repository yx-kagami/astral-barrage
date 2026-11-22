import { devices, expect, test } from '@playwright/test'

test('previews and remembers a cosmetic independently of the equipped pilot', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'], baseURL })
  try {
    const page = await context.newPage()
    await page.goto('./')
    await page.getByRole('button', { name: '机库', exact: true }).tap()
    const hangar = page.getByRole('dialog', { name: '机库' })
    await hangar.getByRole('button', { name: '折岚', exact: true }).tap()
    await expect(hangar.locator('#aircraft-lives')).toHaveText('2')
    await expect(hangar.locator('#aircraft-skill')).toHaveText('引力折叠')
    await expect.poll(() => hangar.locator('.hangar-portrait')
      .evaluate((portrait) => (portrait as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)

    await hangar.getByRole('button', { name: '皮肤', exact: true }).tap()
    await hangar.getByRole('button', { name: '暮金', exact: true }).tap()
    await expect(hangar.locator('#aircraft-lives')).toHaveText('2')
    await expect(hangar.locator('#aircraft-skill')).toHaveText('引力折叠')
    await page.reload()
    await page.getByRole('button', { name: '机库', exact: true }).tap()
    await expect(hangar.getByRole('button', { name: '折岚', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await hangar.getByRole('button', { name: '皮肤', exact: true }).tap()
    await expect(hangar.getByRole('button', { name: '暮金', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await hangar.getByRole('button', { name: '返回菜单', exact: true }).tap()
    await expect(page.locator('.cover-portrait')).toBeVisible()
    await page.getByRole('button', { name: '开始游戏' }).tap()
    await expect(page.locator('#life')).toHaveText('2 / 2')

    const skill = page.getByRole('button', { name: '技能：引力折叠' })
    await skill.tap()
    await expect(skill).toBeDisabled()
    await expect(page.locator('#bombs')).toHaveText('2')
  } finally {
    await context.close()
  }
})
