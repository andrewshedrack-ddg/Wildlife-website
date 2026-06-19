document.addEventListener('DOMContentLoaded', () => {
  // Update year in footer
  const yearNode = document.querySelector('[data-current-year]');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  // Contact form handler (demo mode)
  const forms = document.querySelectorAll('form.contact-form, form.admin-form');
  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = 'Sent';
      }

      const existingNotice = form.querySelector('.form-note');
      if (existingNotice) {
        existingNotice.remove();
      }

      const notice = document.createElement('div');
      notice.className = 'form-note';
      notice.textContent = 'Your message is ready for review. Connect this form to a backend when you are ready to publish.';
      form.appendChild(notice);

      event.preventDefault();
    });
  });

  // Intersection Observer for reveal animations
  const revealTargets = document.querySelectorAll('.feature-card, .species-card, .info-card, .stat-card, .contact-panel, .scan-panel, .form-shell, .table-shell, .spotlight-panel');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transform = 'translateY(0)';
          entry.target.style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach((target) => {
      target.style.opacity = '0';
      target.style.transform = 'translateY(14px)';
      target.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      observer.observe(target);
    });
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navbarNav = document.querySelector('.navbar nav');
  if (mobileMenuToggle && navbarNav) {
    mobileMenuToggle.addEventListener('click', () => {
      navbarNav.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
    });
  }

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navbarNav && navbarNav.classList.contains('active') && !e.target.closest('.navbar')) {
      navbarNav.classList.remove('active');
      if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
    }
  });
});
