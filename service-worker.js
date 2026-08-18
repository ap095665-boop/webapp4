// Simple Shop Manager — Service Worker
// Bump CACHE_VERSION whenever you update index.html so returning users
// get the new version instead of a stale cached copy.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'simple-shop-manager-' + CACHE_VERSION;

// Files that make up the installable app shell. If you renamed your HTML
// file, update './index.html' below to match (see the setup instructions).
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('simple-shop-manager-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests. This deliberately leaves
  // cross-origin calls (e.g. a future Supabase/API integration, or
  // wa.me links) completely untouched by the cache.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached);

      // Serve instantly from cache when available (and refresh it quietly
      // in the background); otherwise wait for the network. This is what
      // makes the app open immediately even with no signal.
      return cached || networkFetch;
    })
  );
});
