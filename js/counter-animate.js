/**
 * WildGuard Society — Counter Animation
 * Animates stat-value numbers counting up when visible
 * Used with [data-count] elements inside .stat-card
 */
(function () {
  'use strict';

  function animateCounter(el, final, duration) {
    var start = 0;
    var increment = Math.ceil(final / (duration / 16));

    var step = function () {
      start += increment;
      if (start >= final) {
        el.textContent = final;
        return;
      }
      el.textContent = start;
      requestAnimationFrame(step);
    };

    step();
  }

  function initCounters() {
    var counters = document.querySelectorAll('.stat-value[data-count]');
    if (!counters.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var final = Number(el.getAttribute('data-count'));
            if (final > 0) {
              animateCounter(el, final, 1500);
            }
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.3 });

      counters.forEach(function (c) { observer.observe(c); });
    } else {
      counters.forEach(function (c) {
        var final = Number(c.getAttribute('data-count'));
        if (final > 0) animateCounter(c, final, 1500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }
})();