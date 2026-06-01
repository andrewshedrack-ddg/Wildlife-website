document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.folder').forEach((folder) => {
    folder.setAttribute('tabindex', '0');

    const toggle = () => {
      folder.classList.toggle('expanded');
    };

    folder.addEventListener('mouseenter', toggle);
    folder.addEventListener('mouseleave', toggle);
    folder.addEventListener('click', toggle);
    folder.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
});
