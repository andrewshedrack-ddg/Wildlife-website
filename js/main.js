document.addEventListener('DOMContentLoaded', () => {
  const yearNode = document.querySelector('[data-current-year]');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

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
});
