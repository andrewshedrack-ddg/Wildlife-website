/* WildGuard PWA bootstrap - service worker registration */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  var base = document.querySelector('meta[name="wg-base"]');
  var root = '/Wildlife-website/';
  if (base && base.content) root = base.content;
  /* Fall back to a relative path so local preview and sub-path hosting
     resolve the service worker instead of 404ing. */
  try {
    var here = new URL('sw.js', location.href);
    var rel = here.pathname.slice(0, here.pathname.lastIndexOf('/'));
    root = rel + '/';
  } catch (e) { /* keep configured root */ }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(root + 'sw.js').catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
})();