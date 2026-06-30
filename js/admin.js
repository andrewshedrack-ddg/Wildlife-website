/**
 * admin.js v3 - Admin Dashboard Controller
 * Reads real data from localStorage and renders admin dashboard
 * VERSION 3.0 - Tabbed layout, messages, notifications
 */
(function() {
  'use strict';

  // --- Data Sources ---
  function getItem(key, def) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch(e) { return def; } }
  function getPendingScans() { return getItem('wildlife_pending_admin', []); }
  function getCompleteScans() { return getItem('wildlife_scans', []); }
  function getAdminNotifications() { return getItem('wildguard_admin_notifications', []); }
  function getUserList() { return getItem('wildguard_user_list', []); }
  function getSecurityLog() { return getItem('wildguard_security_log', []); }
  function getMessages() { return getItem('wildguard_admin_messages', []); }
  function getDemoUsers() { return getItem('wildguard_demo_users', {}); }

  // --- Stats ---
  function updateStats() {
    const pending = getPendingScans();
    const scans = getCompleteScans();
    const users = getUserList();
    const messages = getMessages();
    const today = new Date().toDateString();
    const scansToday = scans.filter(s => new Date(s.timestamp).toDateString() === today).length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statPending', pending.length);
    set('statTotal', scans.length);
    set('statToday', scansToday);
    set('statUsers', users.length);
    set('statMessages', messages.filter(m => m.status === 'unread').length);

    // Badges
    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (count > 0) { el.textContent = count; el.style.display = 'inline-block'; }
      else { el.style.display = 'none'; }
    };
    setBadge('navBadgeScans', pending.length);
    setBadge('navBadgeMessages', messages.filter(m => m.status === 'unread').length);
    setBadge('navBadgeNotifs', getAdminNotifications().filter(n => !n.read).length);
    setBadge('headerNotifBadge', getAdminNotifications().filter(n => !n.read).length + messages.filter(m => m.status === 'unread').length);
  }

  // --- Scan Cards ---
  function renderPendingScans() {
    const container = document.getElementById('pendingScansList');
    if (!container) return;
    const pending = getPendingScans();
    if (pending.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>All Caught Up</h3><p>No pending scans to review right now.</p></div>';
      return;
    }
    let html = '';
    pending.forEach(item => {
      const species = item.species || {};
      const date = new Date(item.timestamp).toLocaleString();
      html += '<div class="scan-card">';
      html += item.imageData ? '<img src="' + item.imageData + '" class="scan-img" onerror="this.style.display=\'none\'">' : '<div class="scan-img" style="display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);"><i class="fas fa-image" style="color:rgba(255,255,255,0.3);"></i></div>';
      html += '<div class="scan-info">';
      html += '<h4>' + (species.name || 'Unknown Species') + '</h4>';
      html += '<p><em>' + (species.scientificName || '') + '</em> &middot; ' + (species.category || 'Unknown') + '</p>';
      html += '<div class="scan-meta">';
      html += '<span class="badge badge-pending">Pending</span>';
      html += '<span style="color:rgba(255,255,255,0.5);font-size:0.82rem;"><i class="fas fa-bolt"></i> ' + (item.confidence || 0) + '% confidence</span>';
      html += '<span style="color:rgba(255,255,255,0.5);font-size:0.82rem;"><i class="fas fa-clock"></i> ' + date + '</span>';
      html += '</div></div>';
      html += '<div style="display:flex;flex-direction:column;gap:0.5rem;flex-shrink:0;">';
      html += '<button class="btn-sm btn-approve" onclick="approveScan(this.dataset.id)" data-id="' + item.id + '"><i class="fas fa-check"></i> Approve</button>';
      html += '<button class="btn-sm btn-reject" onclick="rejectScan(this.dataset.id)" data-id="' + item.id + '"><i class="fas fa-times"></i> Reject</button>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  // --- Messages (from contact form) ---
  function renderMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    const messages = getMessages().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (messages.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope-open"></i><h3>No Messages</h3><p>When users send messages from the contact page, they will appear here.</p></div>';
      return;
    }
    let html = '';
    messages.forEach(msg => {
      const isUnread = msg.status === 'unread';
      html += '<div class="message-card ' + (isUnread ? 'unread' : '') + '">';
      html += '<div class="message-header">';
      html += '<div><strong>' + (msg.name || 'Anonymous') + '</strong> &lt;' + (msg.email || 'no-email') + '&gt; <span class="badge badge-new">' + (msg.subject || 'Contact') + '</span></div>';
      html += '<span>' + new Date(msg.createdAt).toLocaleString() + '</span>';
      html += '</div>';
      html += '<div class="message-body">' + (msg.body || msg.message || '').substring(0, 250) + (msg.body.length > 250 || msg.message.length > 250 ? '...' : '') + '</div>';
      html += '<div class="message-actions">';
      if (isUnread) html += '<button class="btn-sm btn-mark-read" onclick="markMessageRead(this.dataset.id)" data-id="' + msg.id + '"><i class="fas fa-check"></i> Mark Read</button>';
      html += '<a href="mailto:' + (msg.email || '') + '" class="btn-sm btn-view"><i class="fas fa-reply"></i> Reply</a>';
      html += '<button class="btn-sm btn-reject" onclick="deleteMessage(this.dataset.id)" data-id="' + msg.id + '"><i class="fas fa-trash"></i> Delete</button>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  // --- Notifications ---
  function renderNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    const notifications = getAdminNotifications().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (notifications.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><h3>No Notifications</h3><p>System notifications will appear here.</p></div>';
      return;
    }
    let html = '';
    notifications.forEach(n => {
      const icon = n.type === 'new_user' ? 'fas fa-user-plus' : n.type === 'bot_detected' ? 'fas fa-robot' : 'fas fa-info-circle';
      html += '<div class="message-card ' + (!n.read ? 'unread' : '') + '">';
      html += '<div class="message-header">';
      html += '<div><i class="' + icon + '" style="color:var(--accent);margin-right:0.5rem;"></i><strong>' + (n.title || 'Notification') + '</strong></div>';
      html += '<span>' + new Date(n.timestamp).toLocaleString() + '</span>';
      html += '</div>';
      html += '<div class="message-body">' + (n.message || '') + '</div>';
      html += '<div class="message-actions">';
      if (!n.read) html += '<button class="btn-sm btn-mark-read" onclick="markNotifRead(this.dataset.id)" data-id="' + n.id + '"><i class="fas fa-check"></i> Mark Read</button>';
      html += '<button class="btn-sm btn-reject" onclick="deleteNotif(this.dataset.id)" data-id="' + n.id + '"><i class="fas fa-trash"></i> Delete</button>';
      html += '</div></div>';
    });
    container.innerHTML = html;
    // Mark as read
    const notifs = getAdminNotifications();
    notifs.forEach(n => n.read = true);
    localStorage.setItem('wildguard_admin_notifications', JSON.stringify(notifs));
  }

  // --- Users ---
  function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    const users = getUserList().sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));
    const demoUsers = Object.entries(getDemoUsers()).map(([email, data]) => ({ email, ...data, registeredAt: data.registeredAt || new Date().toISOString() }));
    const allUsers = [...users, ...demoUsers].filter((v, i, a) => a.findIndex(t => t.email === v.email) === i); // dedupe

    if (allUsers.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No Users Registered</h3><p>Users who register will appear here.</p></div>';
      return;
    }
    let html = '<table class="data-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Registered</th><th>Status</th></tr></thead><tbody>';
    allUsers.forEach(u => {
      html += '<tr>';
      html += '<td><strong>' + (u.name || u.email.split('@')[0]) + '</strong></td>';
      html += '<td>' + u.email + '</td>';
      html += '<td><span class="badge ' + (u.role === 'admin' ? 'badge-approved' : 'badge-new') + '">' + (u.role || 'user') + '</span></td>';
      html += '<td>' + new Date(u.registeredAt || new Date()).toLocaleDateString() + '</td>';
      html += '<td>' + (u.status || 'active') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // --- Action Handlers ---
  window.approveScan = function(id) {
    const pending = getPendingScans();
    const item = pending.find(p => p.id === id);
    if (item) {
      item.status = 'approved'; item.approvedAt = new Date().toISOString();
      const scans = getCompleteScans();
      scans.unshift(item);
      localStorage.setItem('wildlife_scans', JSON.stringify(scans));
      localStorage.setItem('wildlife_pending_admin', JSON.stringify(pending.filter(p => p.id !== id)));
      updateStats(); renderPendingScans();
      // Show toast
      showAdminToast('Scan approved and moved to catalog.');
    }
  };

  window.rejectScan = function(id) {
    if (!confirm('Reject this scan?')) return;
    const pending = getPendingScans();
    localStorage.setItem('wildlife_pending_admin', JSON.stringify(pending.filter(p => p.id !== id)));
    updateStats(); renderPendingScans();
  };

  window.markMessageRead = function(id) {
    const msgs = getMessages();
    const msg = msgs.find(m => m.id === id);
    if (msg) { msg.status = 'read'; localStorage.setItem('wildguard_admin_messages', JSON.stringify(msgs)); }
    updateStats(); renderMessages();
  };

  window.deleteMessage = function(id) {
    if (!confirm('Delete this message?')) return;
    const msgs = getMessages().filter(m => m.id !== id);
    localStorage.setItem('wildguard_admin_messages', JSON.stringify(msgs));
    updateStats(); renderMessages();
  };

  window.markNotifRead = function(id) {
    const notifs = getAdminNotifications();
    const n = notifs.find(x => x.id === id);
    if (n) { n.read = true; localStorage.setItem('wildguard_admin_notifications', JSON.stringify(notifs)); }
    updateStats(); renderNotifications();
  };

  window.deleteNotif = function(id) {
    if (!confirm('Delete this notification?')) return;
    const notifs = getAdminNotifications().filter(n => n.id !== id);
    localStorage.setItem('wildguard_admin_notifications', JSON.stringify(notifs));
    updateStats(); renderNotifications();
  };

  function showAdminToast(text) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#1b5e40,#143d2a);color:#fff;padding:12px 20px;border-radius:8px;z-index:6000;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeIn 0.3s ease; font-size:0.9rem;';
    toast.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i>' + text;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2500);
  }

  // --- Init ---
  function init() {
    updateStats();
    renderPendingScans();
    renderMessages();
    renderNotifications();
    renderUsers();
    // Show admin email
    try {
      const user = getItem('wildguard_user', null);
      if (user && user.email) {
        const el = document.getElementById('adminEmail');
        if (el) el.textContent = user.email;
      }
    } catch(e){}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
