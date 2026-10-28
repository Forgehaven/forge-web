// Service worker template. The build prepends PRECACHE and VERSION (see vite.config.ts).
// Pages: network first, cached app shell offline. Hashed assets: cache first.
// Cross-origin requests (API, fonts) are never touched.
const CACHE = `forge-${VERSION}`

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('forge-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  if (request.mode === 'navigate') {
    // Weak signal: after 3s use the cached shell, or keep waiting if there is none.
    const net = fetch(request)
    const slow = new Promise((_, reject) => setTimeout(reject, 3000))
    const cached = () => caches.match('/index.html', { cacheName: CACHE, ignoreVary: true }).then(hit => hit ?? net)
    e.respondWith(Promise.race([net, slow]).catch(cached))
    return
  }
  e.respondWith(caches.match(request, { cacheName: CACHE, ignoreVary: true }).then(hit => hit ?? fetch(request)))
})
