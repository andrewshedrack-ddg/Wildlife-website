/**
 * WildGuard Society — Main JavaScript
 * Shared UI: scrollFX, mobile menu, user dropdown, slideshow, reveal animations, theme toggle
 * Version 2.0 — Modular, accessible, reduced-motion aware
 */

(function () {
  'use strict';

  /* ============================================================
     HELPERS
     ============================================================ */

  function getBasePath() {
    var path = window.location.pathname;
    var parts = path.split('/').filter(Boolean);
    return parts.length > 1 ? '../' : '';
  }

  function query(selector) { return document.querySelector(selector); }
  function queryAll(selector) { return document.querySelectorAll(selector); }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    updateYear();
    initHeaderScroll();
    initMobileMenu();
    initUserDropdown();
    initSlideshow();
    initRevealAnimations();
    initThemeToggle();
    initStreamingCarousels();
  });

  /* ── Footer Year ── */
  function updateYear() {
    var el = query('[data-current-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ── Header scroll effect ── */
  function initHeaderScroll() {
    var header = query('.site-header');
    if (!header) return;

    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  /* ── Mobile Menu ── */
  function initMobileMenu() {
    var toggle = query('.mobile-toggle');
    var nav = query('.desktop-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      nav.classList.toggle('open');
      toggle.classList.toggle('active');
      var expanded = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(expanded));
      var icon = toggle.querySelector('i');
      if (icon) {
        icon.className = expanded ? 'fas fa-times' : 'fas fa-bars';
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (e.target.closest('.desktop-nav') || e.target.closest('.mobile-toggle')) return;
      nav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      var icon = toggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    });
  }

  /* ── User Dropdown ── */
  function initUserDropdown() {
    var toggle = query('.user-menu-toggle');
    var dropdown = query('.user-dropdown');
    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(dropdown.classList.contains('open')));
    });

    document.addEventListener('click', function (e) {
      if (dropdown.classList.contains('open') && !e.target.closest('.user-menu')) {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Slideshow ── */
  function initSlideshow() {
    var slides = queryAll('.page-slide');
    if (slides.length < 2) return;
    var current = 0;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    setInterval(function () {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5000);
  }

  /* ── Intersection Observer Reveal ── */
  function initRevealAnimations() {
    var cards = queryAll('.card, .feature-card, .stat-card');
    if (!cards.length) return;

    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(function (target) {
      target.style.opacity = '0';
      target.style.transform = 'translateY(20px)';
      target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(target);
    });

    // Stagger children
    var staggerContainers = queryAll('.stagger');
    staggerContainers.forEach(function (container) {
      var children = container.querySelectorAll('.card, .feature-card');
      if (!children.length) return;

      var staggerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            staggerObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      staggerObserver.observe(container);
    });
  }

  /* ── Dark / Light Theme ── */
  function initThemeToggle() {
    var toggle = query('#theme-toggle');
    if (!toggle) return;

    var savedTheme = localStorage.getItem('wildguard_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, toggle);

    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('wildguard_theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme, toggle) {
    var btn = toggle || query('#theme-toggle');
    if (!btn) return;
    var icon = btn.querySelector('i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  /* ── Streaming Carousel (Chester Zoo inspired) ── */
  function initStreamingCarousels() {
    var carousels = queryAll('.h-scroll');
    carousels.forEach(function (carousel) {
      if (carousel.scrollWidth <= carousel.clientWidth) {
        carousel.style.justifyContent = 'center';
      }
    });
  }

  /* ── Global Toast / Popup ── */
  function showToast(message, type) {
    var container = query('#toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.6rem;pointer-events:none;';
      document.body.appendChild(container);
    }
    var kind = type || 'success';
    var colors = {
      success: 'linear-gradient(135deg,#1b5e40,#143d2a)',
      error: 'linear-gradient(135deg,#7f1d1d,#450a0a)',
      info: 'linear-gradient(135deg,#1e3a5f,#0f2440)'
    };
    var icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    var toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.style.cssText = 'display:flex;align-items:center;gap:0.6rem;min-width:240px;max-width:360px;padding:0.85rem 1.1rem;border-radius:12px;background:' + (colors[kind] || colors.success) + ';color:#fff;font-size:0.88rem;font-weight:500;box-shadow:0 10px 30px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);opacity:0;transform:translateX(24px);transition:all 0.3s ease;';
    toast.innerHTML = '<i class="fas ' + (icons[kind] || icons.success) + '" style="font-size:1.05rem;"></i><span>' + message + '</span>';
    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(24px)';
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3200);
  }
  window.showToast = showToast;
})();