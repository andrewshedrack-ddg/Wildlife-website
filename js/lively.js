/**
 * WildGuard Society — Lively Effects (js/lively.js)
 * Injects the animated aurora background, scroll progress bar,
 * hero fireflies, card tilt and the LIVE pill on the field feed.
 * Fully reduced-motion aware and dependency-free.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qs(sel) { return document.querySelector(sel); }

  /* ── Aurora background layer ── */
  function addAurora() {
    if (qs('.wg-aurora')) return;
    var layer = document.createElement('div');
    layer.className = 'wg-aurora';
    layer.setAttribute('aria-hidden', 'true');
    for (var i = 1; i <= 4; i++) {
      var blob = document.createElement('span');
      blob.className = 'wg-aurora-blob wg-a' + i;
      layer.appendChild(blob);
    }
    document.body.insertBefore(layer, document.body.firstChild);
  }

  /* ── Scroll progress bar ── */
  function addScrollProgress() {
    var bar = qs('.wg-scroll-progress');
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'wg-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = p.toFixed(2) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── Fireflies drifting up the hero ── */
  function addFireflies() {
    var hero = qs('.hero');
    if (!hero || reduce) return;
    for (var i = 0; i < 7; i++) {
      var fly = document.createElement('span');
      fly.className = 'wg-fly';
      fly.style.left = (8 + Math.random() * 84) + '%';
      fly.style.top = (22 + Math.random() * 68) + '%';
      fly.style.animationDelay = (Math.random() * 8) + 's';
      fly.style.animationDuration = (9 + Math.random() * 8) + 's';
      fly.style.setProperty('--s', (Math.round(4 + Math.random() * 5)) + 'px');
      hero.appendChild(fly);
    }
  }

  /* ── Subtle 3D tilt on cards (fine pointers only) ── */
  function addCardTilt() {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return;
    var cards = document.querySelectorAll('.card, .feature-card');
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'translateY(-4px) perspective(760px) rotateX(' + (-y * 4).toFixed(2) + 'deg) rotateY(' + (x * 4).toFixed(2) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ── LIVE pill on the field-notes feed ── */
  function addLivePill() {
    var notes = qs('.field-notes');
    if (!notes || qs('.wg-live-pill')) return;
    var pill = document.createElement('span');
    pill.className = 'wg-live-pill';
    pill.innerHTML = '<span class="wg-live-dot"></span> LIVE FIELD FEED';
    notes.appendChild(pill);
  }

  function init() {
    addAurora();
    addScrollProgress();
    addFireflies();
    addCardTilt();
    addLivePill();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
