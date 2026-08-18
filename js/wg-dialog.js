/**
 * WildGuard Society — Branded Dialog System
 * Replaces the native browser confirm()/alert() popups with a
 * branded, theme-consistent modal that matches the design system.
 *
 * Exposes:
 *   window.WGConfirm(options) => Promise<boolean>   (confirm-style dialog)
 *   window.WGAlert(options)   => Promise<void>      (info/error dialog)
 *
 * Options for both:
 *   { title, message, confirmText, cancelText, danger, icon, hideCancel }
 *
 * Security: all dynamic text is inserted via textContent, never innerHTML.
 */
(function () {
  'use strict';

  var ROOT_ID = 'wg-dialog-root';
  var activeResolver = null;
  var lastFocused = null;

  function basePath() {
    var parts = (window.location.pathname || '').split('/').filter(Boolean);
    return parts.length > 1 ? '../' : '';
  }

  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;

    root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('aria-hidden', 'true');

    var overlay = document.createElement('div');
    overlay.className = 'wg-dialog-overlay';
    overlay.addEventListener('click', function () { dismiss(false); });

    var card = document.createElement('div');
    card.className = 'wg-dialog-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'wg-dialog-title');

    var logoWrap = document.createElement('div');
    logoWrap.className = 'wg-dialog-logo';
    var logoImg = document.createElement('img');
    logoImg.src = basePath() + 'assets/images/logo.png';
    logoImg.alt = 'WildGuard Society';
    logoWrap.appendChild(logoImg);

    var icon = document.createElement('div');
    icon.className = 'wg-dialog-icon';
    var iconI = document.createElement('i');
    iconI.className = 'fas fa-paw';
    icon.appendChild(iconI);

    var title = document.createElement('h3');
    title.className = 'wg-dialog-title';
    title.id = 'wg-dialog-title';

    var message = document.createElement('p');
    message.className = 'wg-dialog-message';

    var actions = document.createElement('div');
    actions.className = 'wg-dialog-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'wg-dialog-btn wg-dialog-btn-cancel';
    cancelBtn.addEventListener('click', function () { dismiss(false); });

    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'wg-dialog-btn wg-dialog-btn-confirm';
    confirmBtn.addEventListener('click', function () { dismiss(true); });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    var sub = document.createElement('div');
    sub.className = 'wg-dialog-sub';
    var subI = document.createElement('i');
    subI.className = 'fas fa-leaf';
    sub.appendChild(subI);
    sub.appendChild(document.createTextNode('WildGuard Society'));

    card.appendChild(logoWrap);
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(actions);
    card.appendChild(sub);

    root.appendChild(overlay);
    root.appendChild(card);
    document.body.appendChild(root);
    return root;
  }

  function show(opts) {
    opts = opts || {};
    var root = ensureRoot();
    var card = root.querySelector('.wg-dialog-card');
    var titleEl = root.querySelector('.wg-dialog-title');
    var msgEl = root.querySelector('.wg-dialog-message');
    var iconEl = root.querySelector('.wg-dialog-icon i');
    var cancelBtn = root.querySelector('.wg-dialog-btn-cancel');
    var confirmBtn = root.querySelector('.wg-dialog-btn-confirm');

    // State
    card.classList.toggle('danger', !!opts.danger);

    // Content via textContent (XSS-safe)
    titleEl.textContent = opts.title || 'Are you sure?';
    msgEl.textContent = opts.message || '';

    // Icon
    var iconName = opts.icon || (opts.danger ? 'fa-triangle-exclamation' : 'fa-paw');
    iconEl.className = 'fas ' + iconName;

    // Buttons
    confirmBtn.textContent = opts.confirmText || (opts.danger ? 'Delete' : 'OK');
    if (opts.hideCancel) {
      cancelBtn.style.display = 'none';
      confirmBtn.style.minWidth = '180px';
    } else {
      cancelBtn.style.display = '';
      confirmBtn.style.minWidth = '';
      cancelBtn.textContent = opts.cancelText || 'Cancel';
    }

    root.setAttribute('aria-hidden', 'false');
    root.classList.add('open');

    lastFocused = document.activeElement;
    setTimeout(function () { confirmBtn.focus(); }, 50);

    return new Promise(function (resolve) {
      activeResolver = resolve;
    });
  }

  function dismiss(result) {
    var root = document.getElementById(ROOT_ID);
    if (root) {
      root.classList.remove('open');
      root.setAttribute('aria-hidden', 'true');
    }
    var resolver = activeResolver;
    activeResolver = null;
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus(); } catch (e) {}
    }
    if (resolver) resolver(result);
  }

  // Keyboard: Escape closes, Enter confirms
  document.addEventListener('keydown', function (e) {
    var root = document.getElementById(ROOT_ID);
    if (!root || !root.classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      dismiss(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      dismiss(true);
    }
  });

  window.WGConfirm = function (options) {
    if (typeof options === 'string') options = { message: options };
    return show(options);
  };

  window.WGAlert = function (options) {
    if (typeof options === 'string') options = { message: options };
    options = Object.assign({}, options, {
      hideCancel: true,
      confirmText: options.confirmText || 'OK',
      icon: options.icon || (options.danger ? 'fa-triangle-exclamation' : 'fa-circle-info')
    });
    return show(options);
  };
})();
