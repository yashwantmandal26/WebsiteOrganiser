// Fast-loading service worker with precache + stale-while-revalidate
// Caches the app shell for instant loads and updates in background

const VERSION = 'v56';
const STATIC_CACHE = `wo-static-${VERSION}`;
const RUNTIME_CACHE = `wo-runtime-${VERSION}`;

// App shell files to precache (same-origin only)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css?v=94',
  '/script.js?v=77',
  '/add-keyword-modal.css?v=59',
  '/search-bar-update.css?v=69',
  '/manifest.json',
  '/media/logo.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

function isSameOrigin(url) {
  try {
    const u = new URL(url, self.location.href);
    return u.origin === self.location.origin;
  } catch (e) {
    return false;
  }
}

// Stale-while-revalidate for runtime requests (favicons, media)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => undefined);

  return cached || networkPromise || Promise.reject('network-failed');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Navigation requests: serve cached shell for instant load, update in background
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match('/index.html');
        const network = fetch(request).then((response) => {
          if (response && response.status === 200) {
            cache.put('/index.html', response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })()
    );
    return;
  }

  // Same-origin static assets: cache-first
  if (isSameOrigin(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (e) {
          // Fallback: return any cached shell if available
          const shell = await cache.match('/index.html');
          return shell || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // External resources (e.g., Google favicons): stale-while-revalidate
  if (/www\.google\.com\/s2\/favicons/.test(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: let the network handle it
});
