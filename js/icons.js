/* WildGuard custom icon loader.
   Swaps Font Awesome <i class="fas fa-*"> glyphs for the hand-drawn SVG sprite
   (assets/icons.svg). Works for static markup AND JS-generated content via MutationObserver.
   Preserves fa-spin, inline styles (size/color), and brand/solid weights. */
(function () {
  'use strict';
  if (window.WildguardIcons) return;
  window.WildguardIcons = true;

  var MODIFIERS = /^fa-(spin|pulse|fw|lg|2x|3x|4x|5x|rotate-90|rotate-180|rotate-270|flip-horizontal|flip-vertical|stack|stack-1x|stack-2x|li|border|inverse)$/;
  var spritePath = null;

  function scriptDir() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('icons.js') !== -1) {
        return src.replace(/js\/icons\.js$/, '');
      }
    }
    return '';
  }

  function iconNameOf(el) {
    var cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').split(/\s+/);
    for (var i = 0; i < cls.length; i++) {
      var c = cls[i];
      if (c.indexOf('fa-') === 0 && !MODIFIERS.test(c)) return c;
    }
    return null;
  }

  function injectSprite(text) {
    if (document.getElementById('wg-icons-sprite')) return;
    var div = document.createElement('div');
    div.id = 'wg-icons-sprite';
    div.style.display = 'none';
    div.innerHTML = text;
    document.body.appendChild(div);
  }

  var hasSymbol = null;

  function spriteReady() {
    return !!document.getElementById('wg-icons-sprite');
  }

  function symbolExists(name) {
    if (!hasSymbol) hasSymbol = {};
    if (hasSymbol[name] !== undefined) return hasSymbol[name];
    var sprite = document.getElementById('wg-icons-sprite');
    hasSymbol[name] = !!(sprite && sprite.querySelector('symbol#' + name));
    return hasSymbol[name];
  }

  function swap(el) {
    var name = iconNameOf(el);
    if (!name) return;
    if (spriteReady() && !symbolExists(name)) return;
    var extra = [];
    var cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').split(/\s+/);
    for (var i = 0; i < cls.length; i++) {
      if (cls[i] && cls[i].indexOf('fa') !== 0) extra.push(cls[i]);
    }
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', ('wg-icon wg-icon-' + name + ' ' + name + (el.classList.contains('fa-spin') ? ' wg-icon-spin' : '') + ' ' + extra.join(' ')).replace(/\s+$/, ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('role', 'img');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    if (el.id) svg.id = el.id;
    if (el.getAttribute('style')) svg.setAttribute('style', el.getAttribute('style'));
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (a.name.indexOf('data-') === 0) svg.setAttribute(a.name, a.value);
    }
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + name);
    svg.appendChild(use);
    el.setAttribute('data-wg-swapped', '1');
    el.parentNode.replaceChild(svg, el);
  }

  function processScope(root) {
    var list = root.querySelectorAll ? root.querySelectorAll('i[class*="fa-"]') : [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.getAttribute('data-wg-swapped') === '1') continue;
      if (iconNameOf(el)) swap(el);
    }
  }

  function init() {
    spritePath = scriptDir() + 'assets/icons.svg';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', spritePath, true);
    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 0) {
        injectSprite(xhr.responseText);
        processScope(document);
      }
    };
    xhr.onerror = function () { processScope(document); };
    xhr.send();

    if (typeof MutationObserver !== 'undefined') {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          if (!added) continue;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType !== 1) continue;
            if (n.tagName === 'I' && /fa-/.test(n.className)) swap(n);
            else if (n.querySelectorAll) processScope(n);
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
