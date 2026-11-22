const version = '__BUILD_VERSION__'
const files = /* PRECACHE_FILES */ []
const scope = self.registration.scope
const prefix = `astral-barrage:${scope}:`
const current = prefix + version
const root = new URL(scope)
const shell = new URL('index.html', scope)
const assets = new Set(files.map((path) => new URL(path, scope).href))

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(current)
    try {
      await cache.addAll([...assets].map((url) => new Request(url, { cache: 'reload' })))
    } catch (error) {
      await caches.delete(current)
      throw error
    }
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith(prefix) && name !== current)
      .map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const navigation = request.mode === 'navigate' && (url.pathname === root.pathname || url.pathname === shell.pathname) && url.origin === self.location.origin
  if (!navigation && !assets.has(request.url)) return
  event.respondWith((async () => {
    const response = await caches.match(navigation ? shell.href : request.url, { cacheName: current })
    return response ?? fetch(request)
  })())
})
