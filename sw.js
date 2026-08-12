// Service Worker for WildGuard Society - Offline support
// Served under /Wildlife-website/ project path on GitHub Pages.
const CACHE_NAME = 'wildguard-v2';
const URLS_TO_CACHE = [
  '/Wildlife-website/',
  '/Wildlife-website/index.html',
  '/Wildlife-website/scan.html',
  '/Wildlife-website/library/library.html',
  '/Wildlife-website/about.html',
  '/Wildlife-website/contact.html',
  '/Wildlife-website/login.html',
  '/Wildlife-website/register.html',
  '/Wildlife-website/css/style.css',
  '/Wildlife-website/css/scan.css',
  '/Wildlife-website/js/main.js',
  '/Wildlife-website/js/scan.js',
  '/Wildlife-website/js/auth.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) { return response; }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      }).catch(() => caches.match('/Wildlife-website/index.html'));
    })
  );
});