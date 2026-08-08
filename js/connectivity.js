/* WildGuard Society - Global Connectivity Module
 * Detects online/offline state site-wide, shows an offline banner,
 * queues offline actions and replays them when back online.
 */
(function () {
  'use strict';

  var QUEUE_KEY = 'wildguard_offline_queue';
  var online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  var handlers = {};      // queue type -> fn(action)
  var statusListeners = []; // fn(isOnline)

  function isOnline() { return online; }

  function setOnline(state) {
    if (online === state) return;
    online = state;
    renderBanner();
    statusListeners.forEach(function (fn) { try { fn(online); } catch (e) {} });
    var evt = new CustomEvent('connectivitychange', { detail: { online: online } });
    window.dispatchEvent(evt);
    if (online) {
      flushOfflineQueue();
      try {
        if (typeof window.logActivity === 'function') {
          window.logActivity('connection_restored', 'guest', 'Device is back online');
        }
      } catch (e) {}
    }
  }

  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; }
  }

  function saveQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {}
  }

  // Queue an action to be replayed when back online.
  // action: { type, payload, queuedAt }
  function queueOfflineAction(action) {
    var q = getQueue();
    q.push({
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      type: action.type || 'unknown',
      payload: action.payload || {},
      queuedAt: action.queuedAt || new Date().toISOString()
    });
    saveQueue(q);
    renderBanner(true);
  }

  // Register a handler for a queued action type. Returns true if claimed.
  function registerHandler(type, fn) {
    handlers[type] = fn;
  }

  // Replay all queued actions that have a handler.
  function flushOfflineQueue() {
    if (!online) return;
    var q = getQueue();
    if (!q.length) return;
    var remaining = [];
    var flushed = 0;
    q.forEach(function (action) {
      var fn = handlers[action.type];
      if (fn) {
        try {
          fn(action.payload, action);
          flushed++;
        } catch (e) {
          remaining.push(action);
        }
      } else {
        remaining.push(action);
      }
    });
    if (flushed > 0) {
      try {
        if (typeof window.logActivity === 'function') {
          window.logActivity('offline_queue_flushed', 'guest', flushed + ' queued action(s) sent');
        }
      } catch (e) {}
      notifyFlush(flushed);
    }
    saveQueue(remaining);
    renderBanner(false);
  }

  function notifyFlush(count) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1b5e40,#143d2a);color:#fff;padding:12px 24px;border-radius:8px;z-index:4000;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease;';
    toast.textContent = 'Back online - ' + count + ' queued action' + (count > 1 ? 's' : '') + ' synced.';
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3500);
  }

  // Render the offline banner. If explicitlyQueued, show it immediately.
  function renderBanner(explicitlyQueued) {
    var banner = document.getElementById('connectivity-banner');
    var show = !online || (explicitlyQueued && getQueue().length > 0);
    if (!banner) return;
    if (show) {
      var queueCount = getQueue().length;
      var msg = !online
        ? 'You are offline. Changes you make will be queued and synced automatically when you reconnect.'
        : queueCount > 0
          ? queueCount + ' offline action' + (queueCount > 1 ? 's' : '') + ' waiting to sync...'
          : '';
      var textEl = banner.querySelector('.connectivity-banner-text');
      if (textEl) textEl.textContent = msg;
      banner.classList.add('visible');
    } else {
      banner.classList.remove('visible');
    }
  }

  function onStatusChange(fn) {
    if (typeof fn === 'function') statusListeners.push(fn);
  }

  // Expose API
  var Connectivity = {
    isOnline: isOnline,
    queueOfflineAction: queueOfflineAction,
    flushOfflineQueue: flushOfflineQueue,
    registerHandler: registerHandler,
    onStatusChange: onStatusChange
  };
  window.Connectivity = Connectivity;

  // Inject the offline banner into every page that includes this script.
  function injectBanner() {
    var banner = document.getElementById('connectivity-banner');
    if (banner || document.body === null) return;
    banner = document.createElement('div');
    banner.id = 'connectivity-banner';
    banner.className = 'connectivity-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = '<span class="connectivity-banner-icon"><i class="fas fa-wifi"></i></span><span class="connectivity-banner-text"></span>';
    document.body.insertBefore(banner, document.body.firstChild);
    renderBanner();
  }

  // Bind events
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('online', function () { setOnline(true); });
    window.addEventListener('offline', function () { setOnline(false); });
    // Cross-tab queue sync
    window.addEventListener('storage', function (e) {
      if (e.key === QUEUE_KEY || e.key === null) renderBanner(false);
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectBanner);
    } else {
      injectBanner();
    }
  }
})();
