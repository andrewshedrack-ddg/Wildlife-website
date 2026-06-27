// scan-integration.js - Reads localStorage scan data for Library and Admin
(function() {
  function render(container, key, isAdmin) {
    if (!container) return;
    var items = JSON.parse(localStorage.getItem(key) || '[]');
    if (!items.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:2rem;">No scans yet.</p>';
      return;
    }
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:2rem;">';
    items.forEach(function(scan) {
      var s = scan.species;
      html += '<div class="card" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;padding:1.5rem;">';
      if (scan.imageData) html += '<img src="' + scan.imageData + '" style="width:100%;height:190px;object-fit:cover;border-radius:8px;margin-bottom:1rem;" alt="' + s.name + '">';
      html += '<span style="display:inline-block;padding:0.25rem 0.75rem;background:rgba(201,162,39,0.15);border:1px solid rgba(201,162,39,0.25);border-radius:100px;color:var(--accent);font-size:0.75rem;font-weight:600;text-transform: uppercase;letter-spacing:0.5px;margin-bottom:0.75rem;">' + s.domain + ' &bull; ' + s.kingdom + '</span>';
      html += '<h3 style="color:var(--lighter);margin-bottom:0.5rem;font-size:1.15rem;">' + s.name + '</h3>';
      html += '<p style="color:rgba(255,255,255,0.68);font-size:0.92rem;line-height:1.6;">' + s.desc + '</p>';
      html += '<p style="color:var(--accent);font-size:0.85rem;font-weight:500;margin-top:0.5rem;">' + (scan.confidence || '92') + '% match</p>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', function() {
    var lib = document.getElementById('scannedLibraryContainer');
    if (lib) render(lib, 'wildlife_scans', false);
    var adm = document.getElementById('pendingAdminContainer');
    if (adm) render(adm, 'wildlife_pending_admin', true);
  });
})();
