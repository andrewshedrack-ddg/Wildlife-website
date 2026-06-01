document.addEventListener('DOMContentLoaded', () => {
  const status = document.querySelector('.scan-status');
  const meter = document.querySelector('.progress-bar span');

  if (!status) {
    return;
  }

  let progress = 0;

  function simulateScan() {
    if (progress < 100) {
      progress += 5;
      status.textContent = `Scanning... ${progress}%`;

      if (meter) {
        meter.style.width = `${progress}%`;
      }

      window.setTimeout(simulateScan, 260);
    } else {
      status.textContent = 'Scan complete: giraffe detected near the waterline.';
    }
  }

  simulateScan();
});
