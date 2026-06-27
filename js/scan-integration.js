// scan-integration.js - Admin approval workflow + Library rendering
(function() {
  var STORAGE_KEY = "wildlife_scans";
  var PENDING_ADMIN_KEY = "wildlife_pending_admin";

  function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString(); } catch(e) { return iso; }
  }

  // ====== Library Renderer ======
  function renderLibrary(container) {
    if (!container) return;
    var items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!items.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:2rem 0;">No scanned species yet. Head to <a href="../scan.html" style="color:var(--accent);">Scan</a> to identify wildlife.</p>';
      return;
    }
    var html = '<div class="scanned-grid">';
    items.forEach(function(scan) {
      var s = scan.species;
      html += '<div class="card scanned-card">';
      if (scan.imageData) html += '<img src="' + scan.imageData + '" alt="' + s.name + '" class="scanned-img">';
      html += '<div class="scanned-body">';
      html += '<span class="scanned-category">' + s.domain + ' &bull; ' + s.kingdom + '</span>';
      html += '<h3>' + s.name + '</h3>';
      html += '<p class="scanned-desc">' + s.desc + '</p>';
      html += '<p class="scanned-meta">' + (scan.confidence || "92") + '% match &bull; ' + formatDate(scan.timestamp) + '</p>';
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // ====== Admin Renderer ======
  function renderAdminPending(container) {
    if (!container) return;
    var pending = JSON.parse(localStorage.getItem(PENDING_ADMIN_KEY) || "[]");
    if (!pending.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:2rem 0;">No pending scan approvals at this time.</p>';
      updateStats(0);
      return;
    }
    updateStats(pending.length);
    var html = '<div class="pending-grid">';
    pending.forEach(function(scan) {
      var s = scan.species;
      html += '<div class="card pending-card" data-id="' + scan.id + '">';
      html += '<div class="pending-img-wrap">';
      if (scan.imageData) html += '<img src="' + scan.imageData + '" alt="' + s.name + '" class="pending-img">';
      else html += '<div class="pending-placeholder"><i class="fas fa-image"></i></div>';
      html += '</div>';
      html += '<div class="pending-body">';
      html += '<span class="pending-category">' + s.category + '</span>';
      html += '<h3>' + s.name + '</h3>';
      html += '<p class="pending-scientific">' + s.scientificName + '</p>';
      html += '<div class="pending-meta">';
      html += '<span class="pending-status ' + (scan.status || 'pending') + '">' + (scan.status || 'Pending') + '</span>';
      html += '<span class="pending-confidence">' + (scan.confidence || "92") + '% match</span>';
      html += '</div>';
      html += '<p class="pending-date"><i class="fas fa-clock"></i> Submitted ' + formatDate(scan.timestamp) + '</p>';
      html += '<div class="pending-actions">';
      html += '<button class="approve-btn" data-id="' + scan.id + '" onclick="AdminScans.approve(this)"><i class="fas fa-check"></i> Approve</button>';
      html += '<button class="reject-btn" data-id="' + scan.id + '" onclick="AdminScans.reject(this)"><i class="fas fa-times"></i> Reject</button>';
      html += '</div>';
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function updateStats(pendingCount) {
    var elPending = document.getElementById("statPending");
    var elTotal = document.getElementById("statTotal");
    var scans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (elPending) elPending.textContent = pendingCount;
    if (elTotal) elTotal.textContent = scans.length;
  }

  // ====== Admin Actions ======
  window.AdminScans = {
    approve: function(btn) {
      var id = btn.getAttribute("data-id");
      var pending = JSON.parse(localStorage.getItem(PENDING_ADMIN_KEY) || "[]");
      var scans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      var idx = pending.findIndex(function(s) { return s.id === id; });
      if (idx !== -1) {
        var item = pending[idx];
        item.approved = true;
        item.status = "approved";
        item.approvedAt = new Date().toISOString();
        scans.unshift(item);
        pending.splice(idx, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
        localStorage.setItem(PENDING_ADMIN_KEY, JSON.stringify(pending));
        renderAdminPending(document.getElementById("pendingAdminContainer"));
      }
    },
    reject: function(btn) {
      var id = btn.getAttribute("data-id");
      var pending = JSON.parse(localStorage.getItem(PENDING_ADMIN_KEY) || "[]");
      var idx = pending.findIndex(function(s) { return s.id === id; });
      if (idx !== -1) {
        pending.splice(idx, 1);
        localStorage.setItem(PENDING_ADMIN_KEY, JSON.stringify(pending));
        renderAdminPending(document.getElementById("pendingAdminContainer"));
      }
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    var lib = document.getElementById("scannedLibraryContainer");
    if (lib) renderLibrary(lib);
    var adm = document.getElementById("pendingAdminContainer");
    if (adm) renderAdminPending(adm);
  });
})();
