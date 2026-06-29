/**
 * admin.js - Admin Dashboard Controller
 * Reads real data from localStorage and renders admin view
 * VERSION 2.0 - Full localStorage integration, real-time stats, notifications
 */
(function() {
  const API_BASE = window.location.origin.includes('localhost') && !window.location.origin.includes(':5000')
    ? 'http://localhost:5000'
    : '';

  // --- Data Sources ---
  function getPendingScans() {
    try { return JSON.parse(localStorage.getItem('wildlife_pending_admin') || '[]'); } catch (e) { return []; }
  }
  function getCompleteScans() {
    try { return JSON.parse(localStorage.getItem('wildlife_scans') || '[]'); } catch (e) { return []; }
  }
  function getAdminNotifications() {
    try { return JSON.parse(localStorage.getItem('wildguard_admin_notifications') || '[]'); } catch (e) { return []; }
  }
  function getUserList() {
    try { return JSON.parse(localStorage.getItem('wildguard_user_list') || '[]'); } catch (e) { return []; }
  }
  function getSecurityLog() {
    try { return JSON.parse(localStorage.getItem('wildguard_security_log') || '[]'); } catch (e) { return []; }
  }
  function getDemoUsers() {
    try { return JSON.parse(localStorage.getItem('wildguard_demo_users') || '{}'); } catch (e) { return {}; }
  }

  // --- Stats Update ---
  function updateStats() {
    const pending = getPendingScans();
    const scans = getCompleteScans();
    const users = getUserList();
    const notifications = getAdminNotifications();
    const today = new Date().toDateString();
    const scansToday = scans.filter(s => new Date(s.timestamp).toDateString() === today).length;

    // Update stat cards
    const elPending = document.getElementById('statPending');
    const elTotal = document.getElementById('statTotal');
    const elToday = document.getElementById('statToday');
    const elUsers = document.getElementById('statUsers');
    const elNotif = document.getElementById('statNotifications');

    if (elPending) elPending.textContent = pending.length;
    if (elTotal) elTotal.textContent = scans.length;
    if (elToday) elToday.textContent = scansToday;
    if (elUsers) elUsers.textContent = users.length;
    if (elNotif) elNotif.textContent = notifications.filter(n => !n.read).length;
  }

  // --- Pending Scans List ---
  function renderPendingScans() {
    const container = document.getElementById('pendingAdminContainer');
    if (!container) return;
    const pending = getPendingScans();
    if (pending.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.4);"><i class="fas fa-check-circle" style="font-size:2rem; margin-bottom:0.5rem; display:block;"></i>No pending scans to review.</div>';
      return;
    }
    let html = '<div class="pending-grid">';
    pending.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      const species = item.species || {};
      html += '<div class="pending-card">';
      html += '<div class="pending-img-wrap">';
      if (item.imageData) {
        html += '<img src="' + item.imageData + '" alt="Scan" class="pending-img">';
      } else {
        html += '<i class="fas fa-image pending-placeholder"></i>';
      }
      html += '</div>';
      html += '<div class="pending-body">';
      html += '<span class="pending-category">' + (species.category || 'Unknown') + '</span>';
      html += '<h3>' + (species.name || 'Unknown Species') + '</h3>';
      html += '<p class="pending-scientific">' + (species.scientificName || '') + '</p>';
      html += '<div class="pending-meta">';
      html += '<span class="pending-status pending">Pending</span>';
      html += '<span class="pending-confidence"><i class="fas fa-bolt"></i> ' + (item.confidence || 0) + '%</span>';
      html += '</div>';
      html += '<p class="pending-date"><i class="fas fa-clock"></i> ' + date + '</p>';
      html += '<div class="pending-actions">';
      html += '<button class="approve-btn" data-id="' + item.id + '" onclick="window.approveScan(this.dataset.id)"><i class="fas fa-check"></i> Approve</button>';
      html += '<button class="reject-btn" data-id="' + item.id + '" onclick="window.rejectScan(this.dataset.id)"><i class="fas fa-times"></i> Reject</button>';
      html += '</div>';
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // --- Notifications Panel ---
  function renderNotifications() {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    const notifications = getAdminNotifications();
    if (notifications.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:1.5rem; color:rgba(255,255,255,0.4);"><i class="fas fa-bell" style="font-size:1.5rem; margin-bottom:0.5rem; display:block;"></i>No notifications.</div>';
      return;
    }
    let html = '<div class="notification-list">';
    notifications.slice(0, 10).forEach(n => {
      const date = new Date(n.timestamp).toLocaleDateString();
      const iconClass = n.type === 'new_user' ? 'fas fa-user-plus' : 'fas fa-bell';
      const unreadClass = n.read ? '' : ' style="background:rgba(201,162,39,0.08); border-left:3px solid var(--accent);"';
      html += '<div class="notification-item"' + unreadClass + '>';
      html += '<div class="notification-icon"><i class="' + iconClass + '"></i></div>';
      html += '<div class="notification-content">';
      html += '<strong>' + (n.title || 'Notification') + '</strong>';
      html += '<p>' + (n.message || '') + '</p>';
      html += '<span class="notification-date">' + date + '</span>';
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
    // Mark as read after viewing
    const notifs = getAdminNotifications();
    notifs.forEach(n => { n.read = true; });
    localStorage.setItem('wildguard_admin_notifications', JSON.stringify(notifs));
  }

  // --- Recent Activity ---
  function renderActivity() {
    const container = document.getElementById('activityContainer');
    if (!container) return;
    const securityLog = getSecurityLog().slice(-10).reverse();
    const userList = getUserList().slice(-10).reverse();
    const notifications = getAdminNotifications().slice(-10).reverse();
    const allActivity = [
      ...notifications.map(n => ({ ...n, source: 'notification', displayDate: new Date(n.timestamp).toLocaleString() })),
      ...securityLog.map(l => ({ ...l, source: 'security', displayDate: new Date(l.timestamp).toLocaleString() }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);

    if (allActivity.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:1.5rem; color:rgba(255,255,255,0.4);">No recent activity.</div>';
      return;
    }

    let html = '<div class="activity-list">';
    allActivity.forEach(item => {
      const icon = item.type === 'new_user' ? 'fas fa-user-plus' :
                    item.type === 'login_success' ? 'fas fa-sign-in-alt' :
                    item.type === 'bot_detected' ? 'fas fa-robot' :
                    'fas fa-info-circle';
      html += '<div class="activity-item">';
      html += '<i class="' + icon + '"></i>';
      html += '<div><strong>' + (item.title || item.action || 'Event') + '</strong>';
      html += '<span>' + (item.message || item.details || '') + '</span>';
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // --- Action Handlers ---
  window.approveScan = function(id) {
    const pending = getPendingScans();
    const item = pending.find(p => p.id === id);
    if (item) {
      item.status = 'approved';
      item.approvedAt = new Date().toISOString();
      // Move to complete scans
      const scans = getCompleteScans();
      scans.unshift(item);
      localStorage.setItem('wildlife_scans', JSON.stringify(scans));
      // Remove from pending
      const newPending = pending.filter(p => p.id !== id);
      localStorage.setItem('wildlife_pending_admin', JSON.stringify(newPending));
      // Update UI
      updateStats();
      renderPendingScans();
      alert('Species approved successfully!');
    }
  };

  window.rejectScan = function(id) {
    if (!confirm('Are you sure you want to reject this scan?')) return;
    const pending = getPendingScans();
    const newPending = pending.filter(p => p.id !== id);
    localStorage.setItem('wildlife_pending_admin', JSON.stringify(newPending));
    updateStats();
    renderPendingScans();
  };

  // --- Init ---
  function init() {
    updateStats();
    renderPendingScans();
    renderNotifications();
    renderActivity();
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
