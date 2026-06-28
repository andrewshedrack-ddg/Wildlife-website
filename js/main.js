document.addEventListener('DOMContentLoaded', () => {
  // Update year in footer
  const yearNode = document.querySelector('[data-current-year]');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  // Header scroll effect
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const desktopNav = document.querySelector('.desktop-nav');
  if (mobileToggle && desktopNav) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      desktopNav.classList.toggle('open');
      mobileToggle.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.className = desktopNav.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
      }
    });
    // Close mobile menu when clicking outside (but not inside the nav)
    document.addEventListener('click', (e) => {
      if (!desktopNav.classList.contains('open')) return;
      // Don't close if clicking inside desktop-nav or on mobile-toggle
      if (e.target.closest('.desktop-nav') || e.target.closest('.mobile-toggle')) return;
      desktopNav.classList.remove('open');
      mobileToggle.classList.remove('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    });
  }

  // User menu dropdown toggle
  const userMenuToggle = document.querySelector('.user-menu-toggle');
  const userDropdown = document.querySelector('.user-dropdown');
  if (userMenuToggle && userDropdown) {
    userMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (userDropdown.classList.contains('open') && !e.target.closest('.user-menu')) {
        userDropdown.classList.remove('open');
      }
    });
  }

  // Slideshow auto-cycle
  const slides = document.querySelectorAll('.page-slide');
  if (slides.length > 1) {
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5000);
  }

  // Inter reveal animations
  const revealTargets = document.querySelectorAll('.card, .feature-card');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealTargets.forEach((target) => {
      target.style.opacity = '0';
      target.style.transform = 'translateY(20px)';
      target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(target);
    });
  }
});
