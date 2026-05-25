// LoD Campaign Companion — minimal runtime service worker.
//
// Goal: let the app shell load when the network is unavailable. The data API
// (everything under /api/) is never cached — the panels already keep a
// localStorage cache of each channel, and we don't want stale game state.
//
// Strategy by request kind:
//   navigation requests  → network first, cached index.html as fallback
//   same-origin assets   → stale-while-revalidate (instant + background refresh)
//   /api/*               → network only (bail out early)
//   cross-origin (fonts) → cache-first

const VERSION = 'v1';
const SHELL_CACHE = `lod-shell-${VERSION}`;
const ASSET_CACHE = `lod-assets-${VERSION}`;
const FONT_CACHE = `lod-fonts-${VERSION}`;

const SHELL_FILES = ['/', '/index.html', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, ASSET_CACHE, FONT_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

const isNavigation = (request) =>
  request.mode === 'navigate' ||
  (request.method === 'GET' &&
    request.headers.get('accept')?.includes('text/html'));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept the data API — the panels handle their own offline cache.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return;
  }
  // Same-origin socket.io traffic is also off-limits.
  if (url.pathname.startsWith('/socket.io/')) return;

  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() =>
          caches
            .match('/index.html', { ignoreSearch: true })
            .then((cached) =>
              cached || new Response('Offline', { status: 503, statusText: 'offline' })
            )
        )
    );
    return;
  }

  if (url.origin !== self.location.origin) {
    // Cross-origin font / CDN — cache once, then serve from cache forever.
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Same-origin static asset — stale-while-revalidate.
  event.respondWith(
    caches.open(ASSET_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetcher = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetcher;
      })
    )
  );
});
