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

  // Background slideshow with Ken Burns effect
  const backgroundImages = [
    'https://upload.wikimedia.org/wikipedia/commons/9/9e/Lion_%28Panthera_leo%29_male_6y.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/3/37/African_Bush_Elephant.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/3/36/Cheetah_%28Acinonyx_jubatus%29_female_2.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/0/0b/Leopard_in_Serengeti_National_Park.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/7/7b/Waterbuck_%28Kobus_ellipsiprymnus%29_male.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/f/fe/Giraffa_camelopardalis.jpg'
  ];

  let currentIndex = 0;
  let isZoomingIn = true;
  let zoomLevel = 1;
  const zoomSpeed = 0.0005; // Very slow zoom
  const maxZoom = 1.2;
  const minZoom = 1.0;

  function updateBackground() {
    // Apply Ken Burns effect (slow zoom)
    zoomLevel = isZoomingIn 
      ? Math.min(zoomLevel + zoomSpeed, maxZoom) 
      : Math.max(zoomLevel - zoomSpeed, minZoom);
    
    // Reverse direction at limits
    if (zoomLevel >= maxZoom) isZoomingIn = false;
    if (zoomLevel <= minZoom) isZoomingIn = true;
    
    // Apply background image with transform
    document.body.style.backgroundImage = `url('${backgroundImages[currentIndex]}')`;
    document.body.style.backgroundSize = `${zoomLevel * 100}%`;
    document.body.style.backgroundPosition = 'center';
  }

  function changeBackground() {
    currentIndex = (currentIndex + 1) % backgroundImages.length;
    // Reset zoom when changing image
    zoomLevel = minZoom;
    isZoomingIn = true;
  }

  // Change background every 5 seconds
  setInterval(changeBackground, 5000);
  
  // Update Ken Burns effect every 50ms for smooth animation
  setInterval(updateBackground, 50);
  
  // Set initial background
  updateBackground();
});
