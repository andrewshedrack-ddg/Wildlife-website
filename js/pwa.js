/* WildGuard PWA bootstrap - service worker registration */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;

  var base = document.querySelector('meta[name="wg-base"]');
  var root = '/Wildlife-website/';
  if (base && base.content) root = base.content;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register(root + 'sw.js').catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
})();