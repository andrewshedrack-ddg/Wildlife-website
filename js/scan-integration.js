// scan-integration.js - Admin approval workflow + Library rendering
(function() {
  var STORAGE_KEY = "wildlife_scans";
  var PENDING_ADMIN_KEY = "wildlife_pending_admin";

  function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString(); } catch(e) { return iso; }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Only allow data:image or https: image URLs in <img src>.
  function safeImage(src) {
    if (!src) return "";
    if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src)) return src;
    if (/^https:\/\//i.test(src)) return src;
    return "";
  }

  // ====== Library Renderer ======
  function renderLibrary(container) {
    if (!container) return;
    var items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!items.length) {
      container.innerHTML =
        '<div class="scanned-empty" role="status">' +
          '<i class="fas fa-paw scanned-empty-icon"></i>' +
          '<h3>No scanned species yet</h3>' +
          '<p>Use the AI scanner to identify wildlife and grow your personal collection.</p>' +
          '<a href="../scan.html" class="btn btn-primary"><i class="fas fa-barcode"></i> Start Scanning</a>' +
        '</div>';
      return;
    }
    var html = '<div class="scanned-grid">';
    items.forEach(function(scan) {
      var s = scan.species || {};
      var img = safeImage(scan.imageData);
      html += '<div class="card scanned-card">';
      if (img) html += '<img src="' + img + '" alt="' + esc(s.name) + '" class="scanned-img">';
      html += '<div class="scanned-body">';
      html += '<span class="scanned-category">' + esc(s.domain) + ' &bull; ' + esc(s.kingdom) + '</span>';
      html += '<h3>' + esc(s.name) + '</h3>';
      html += '<p class="scanned-desc">' + esc(s.desc) + '</p>';
      html += '<p class="scanned-meta">' + esc(scan.confidence || "92") + '% match &bull; ' + esc(formatDate(scan.timestamp)) + '</p>';
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
      var s = scan.species || {};
      var img = safeImage(scan.imageData);
      html += '<div class="card pending-card" data-id="' + esc(scan.id) + '">';
      html += '<div class="pending-img-wrap">';
      if (img) html += '<img src="' + img + '" alt="' + esc(s.name) + '" class="pending-img">';
      else html += '<div class="pending-placeholder"><i class="fas fa-image"></i></div>';
      html += '</div>';
      html += '<div class="pending-body">';
      html += '<span class="pending-category">' + esc(s.category) + '</span>';
      html += '<h3>' + esc(s.name) + '</h3>';
      html += '<p class="pending-scientific">' + esc(s.scientificName) + '</p>';
      html += '<div class="pending-meta">';
      html += '<span class="pending-status ' + esc(scan.status || 'pending') + '">' + esc(scan.status || 'Pending') + '</span>';
      html += '<span class="pending-confidence">' + esc(scan.confidence || "92") + '% match</span>';
      html += '</div>';
      html += '<p class="pending-date"><i class="fas fa-clock"></i> Submitted ' + esc(formatDate(scan.timestamp)) + '</p>';
      html += '<div class="pending-actions">';
      html += '<button class="approve-btn" data-id="' + esc(scan.id) + '" onclick="AdminScans.approve(this)"><i class="fas fa-check"></i> Approve</button>';
      html += '<button class="reject-btn" data-id="' + esc(scan.id) + '" onclick="AdminScans.reject(this)"><i class="fas fa-times"></i> Reject</button>';
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
        if (item.user && typeof window.sendUserNotification === "function") {
          window.sendUserNotification(item.user, {
            type: "scan_approved",
            title: "Scan Approved",
            message: "Your scan of " + (item.species && item.species.name || "wildlife") + " was approved and added to the library."
          });
        }
      }
    },
    reject: function(btn) {
      var id = btn.getAttribute("data-id");
      var pending = JSON.parse(localStorage.getItem(PENDING_ADMIN_KEY) || "[]");
      var idx = pending.findIndex(function(s) { return s.id === id; });
      if (idx !== -1) {
        var item = pending[idx];
        pending.splice(idx, 1);
        localStorage.setItem(PENDING_ADMIN_KEY, JSON.stringify(pending));
        renderAdminPending(document.getElementById("pendingAdminContainer"));
        if (item.user && typeof window.sendUserNotification === "function") {
          window.sendUserNotification(item.user, {
            type: "scan_rejected",
            title: "Scan Rejected",
            message: "Your scan of " + (item.species && item.species.name || "wildlife") + " was not approved. You can resubmit it or ask for details."
          });
        }
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
