const CACHE_NAME = 'ppa-cache-v2'
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/assets/images/logo.svg',
  '/assets/images/landing_hero.png'
]

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    return
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
