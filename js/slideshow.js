let slideIndex = 0;

function showSlides() {
  const slides = document.querySelectorAll('.bg-slide');
  if (!slides.length) {
    return;
  }

  slides.forEach((slide) => {
    slide.style.display = 'none';
  });

  slideIndex += 1;
  if (slideIndex > slides.length) {
    slideIndex = 1;
  }

  slides[slideIndex - 1].style.display = 'block';
  window.setTimeout(showSlides, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  showSlides();
});
