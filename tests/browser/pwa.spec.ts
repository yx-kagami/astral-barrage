import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'

test('activates a new production cache without interrupting the current run', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service Worker update events are verified in Chromium')
  const output = resolve('dist')
  const root = '/test-project/'
  const html = await readFile(resolve(output, 'index.html'), 'utf8')
  const worker = await readFile(resolve(output, 'sw.js'), 'utf8')
  const publicPaths = new Set(await readdir(output, { recursive: true }))
  const mime: Record<string, string> = { js: 'text/javascript', css: 'text/css', png: 'image/png',
    webmanifest: 'application/manifest+json' }
  let version = 'alpha'

  const server = createServer((request, response) => {
    const pathname = new URL(request.url!, 'http://localhost').pathname
    const path = pathname.startsWith(root) ? pathname.slice(root.length) : '..'
    response.setHeader('Cache-Control', 'no-store')
    if (path === 'sw.js') {
      response.setHeader('Content-Type', mime.js)
      response.end(worker.replace(/^const version = '[^']+'/m, `const version = '${version}'`))
    } else if (!path || path === 'index.html') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      response.end(html.replace('</title>', ` · ${version}</title>`))
    } else if (publicPaths.has(path)) {
      response.setHeader('Content-Type', mime[path.split('.').at(-1)!] ?? 'application/octet-stream')
      void readFile(resolve(output, path)).then((body) => response.end(body)).catch(() => response.writeHead(404).end())
    } else {
      response.writeHead(404).end()
    }
  })

  await new Promise<void>((done, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', done)
  })
  try {
    const port = (server.address() as AddressInfo).port
    await page.goto(`http://127.0.0.1:${port}${root}`)
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await expect(page).toHaveTitle(/alpha$/)
    await page.getByRole('button', { name: '开始游戏' }).click()
    version = 'beta'
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready
      const changed = new Promise<void>((done) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true })
      })
      await registration.update()
      await changed
    })
    await expect(page.locator('#life')).toBeVisible()
    await expect(page).toHaveTitle(/alpha$/)
    await expect.poll(async () => {
      const cacheNames = await page.evaluate(() => caches.keys())
      return cacheNames.filter((name) => name.startsWith('astral-barrage:')).map((name) => name.split(':').at(-1))
    }).toEqual(['beta'])
    await context.setOffline(true)
    await page.reload()
    await expect(page).toHaveTitle(/beta$/)
    await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible()
  } finally {
    server.closeAllConnections()
    await new Promise<void>((done) => server.close(() => done()))
  }
})
