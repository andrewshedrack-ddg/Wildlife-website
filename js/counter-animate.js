/**
 * WildGuard Society — Counter Animation
 * Animates stat-value numbers counting up when they scroll into view.
 * Supports [data-count] (target) and optional [data-start] (realistic base
 * value rendered immediately so counters never flash "0").
 */
(function () {
  'use strict';

  function animateCounter(el, start, final, duration) {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = String(final);
      return;
    }

    var startTime = null;
    var step = function (ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(start + (final - start) * eased);
      el.textContent = String(current);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = String(final);
    };

    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll('.stat-value[data-count]');
    if (!counters.length) return;

    // Pre-populate with realistic base values instead of static zeros.
    counters.forEach(function (c) {
      var base = Number(c.getAttribute('data-start') || 0);
      c.textContent = String(base);
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var final = Number(el.getAttribute('data-count'));
            var base = Number(el.getAttribute('data-start') || 0);
            if (final > 0) animateCounter(el, base, final, 1600);
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.3 });

      counters.forEach(function (c) { observer.observe(c); });
    } else {
      counters.forEach(function (c) {
        var final = Number(c.getAttribute('data-count'));
        var base = Number(c.getAttribute('data-start') || 0);
        if (final > 0) animateCounter(c, base, final, 1600);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }
})();