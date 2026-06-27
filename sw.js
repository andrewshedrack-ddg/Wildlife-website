// Service Worker for WildGuard Society - Offline support
const CACHE_NAME = 'wildguard-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/scan.html',
  '/library/library.html',
  '/about.html',
  '/contact.html',
  '/login.html',
  '/register.html',
  '/css/style.css',
  '/css/scan.css',
  '/js/main.js',
  '/js/scan.js',
  '/js/auth.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) { return response; }
      return fetch(event.request);
    })
  );
});
