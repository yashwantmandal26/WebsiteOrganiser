// =====================================================
// WebsiteOrganiser — Smart Caching Service Worker
// =====================================================
//
// HOW UPDATES WORK (DEVELOPER GUIDE):
//   When you push a code update:
//   1. Bump the ?v=XX version on script.js / CSS in index.html
//   2. index.html is always served fresh (network-first) so the
//      browser discovers the new version numbers immediately.
//   3. New ?v= URL = cache miss = fresh file fetched automatically.
//   4. NO manual cache clearing needed by the user.
//
//   If you make big structural changes and want ALL users to get
//   a completely fresh start, bump CACHE_VERSION below (e.g. 'wo-v2').
//   The activate event will wipe all old caches automatically.
// =====================================================

const CACHE_VERSION = 'wo-v1041';
const CACHE_NAME = `websiteorganiser-${CACHE_VERSION}`;
const FAVICON_CACHE_NAME = 'websiteorganiser-favicons-v1';

// Files to pre-cache on install (app shell — enough to show something offline)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/fonts/inter-latin-400.woff2',
  '/fonts/inter-latin-500.woff2',
  '/fonts/inter-latin-700.woff2',
  '/bundle.min.css?v=1041',
  '/bundle.min.js?v=1041',
];

// ─── Install ──────────────────────────────────────────────────────────────────
// Pre-cache the app shell so the page can load instantly next time.
self.addEventListener('install', (event) => {
  // Take over immediately — don't wait for old SW to die
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Non-fatal: some pre-cache URLs may fail (e.g. offline during install)
        console.warn('[SW] Pre-cache failed (non-fatal):', err);
      });
    })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
// Delete ALL old caches from previous SW versions so stale files never linger.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.registration.navigationPreload ? self.registration.navigationPreload.enable() : Promise.resolve(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== FAVICON_CACHE_NAME) // keep current and favicon cache
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      )
    ]).then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // ── Favicon IM Cache (external favicons) ──────────────────────────────────
  if (url.hostname === 'favicon.im') {
    event.respondWith(staleWhileRevalidateFavicon(req));
    return;
  }

  // ── Skip other cross-origin requests (Firebase, Google APIs, fonts CDN, etc.) ──
  // These are live data / third-party — let them go straight to network.
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const search = url.search;

  // ── 1. HTML pages → Network-First with Navigation Preload ─────────────────
  if (req.headers.get('accept')?.includes('text/html') || path === '/' || path.endsWith('.html')) {
    event.respondWith(networkFirst(req, event.preloadResponse));
    return;
  }

  // ── 2. sw.js itself → Network-First ────────────────────────────────────────
  if (path === '/sw.js') {
    event.respondWith(networkFirst(req));
    return;
  }

  // ── 3. Versioned JS / CSS (has ?v= in URL) → Cache-First ──────────────────
  if (search.includes('v=') && (path.endsWith('.js') || path.endsWith('.css'))) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // ── 4. Images / Icons / Fonts → Cache-First (long-lived) ──────────────────
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(path)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // ── 5. Everything else → Network-First ────────────────────────────────────
  event.respondWith(networkFirst(req));
});

// ─── Strategy: Stale-While-Revalidate for Favicons ────────────────────────────
async function staleWhileRevalidateFavicon(request) {
  const cache = await caches.open(FAVICON_CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((res) => {
    if (res && res.status === 200) {
      cache.put(request, res.clone());
    }
    return res;
  }).catch(() => null);

  return cached || (await fetchPromise) || new Response('', { status: 404 });
}

// ─── Strategy: Cache-First ────────────────────────────────────────────────────
// Return cached response instantly if available; otherwise fetch, cache & return.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()); // store for next time
    }
    return response;
  } catch (err) {
    console.warn('[SW] Cache-first fetch failed:', request.url, err);
    throw err;
  }
}

// ─── Strategy: Network-First ──────────────────────────────────────────────────
// Try network first; if offline/failed, serve from cache as fallback.
async function networkFirst(request, preloadResponsePromise) {
  try {
    const preloaded = preloadResponsePromise ? await preloadResponsePromise : null;
    if (preloaded) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, preloaded.clone());
      return preloaded;
    }
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()); // keep cache warm
    }
    return response;
  } catch (err) {
    // Offline fallback
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Offline fallback served from cache:', request.url);
      return cached;
    }
    throw err;
  }
}
