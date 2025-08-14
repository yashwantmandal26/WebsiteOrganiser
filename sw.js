const CACHE_NAME = 'ws-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js?v=2',
  '/manifest.json',
  '/media/logo.PNG',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        OFFLINE_URLS.map(async (url) => {
          try { await cache.add(url); } catch (e) { /* ignore missing */ }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first for HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put('/', copy)).catch(() => {});
        return resp;
      }).catch(async () => {
        const cached = await caches.match('/', { ignoreSearch: true });
        return cached || caches.match('/index.html');
      })
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        return cached || fetch(request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
          return resp;
        }).catch(() => cached);
      })
    );
  }
});


