/**
 * admin.js v3 - Admin Dashboard Controller
 * Reads real data from localStorage and renders admin dashboard
 * VERSION 3.0 - Tabbed layout, messages, notifications
 */
(function() {
  'use strict';

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function safeImgSrc(v) { v = String(v == null ? '' : v); return (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(v) || /^https:\/\//i.test(v)) ? v : ''; }

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
  async function updateStats() {
    const stats = (window.AdminAPI ? await window.AdminAPI.getStats() : null) || {};
    const pending = getPendingScans();
    const scans = getCompleteScans();
    const users = getItem('wildguard_user_list', []);
    const messages = getMessages();
    const today = new Date().toDateString();
    const scansToday = scans.filter(s => new Date(s.timestamp).toDateString() === today).length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statPending', stats.pending_scans !== undefined ? stats.pending_scans : pending.length);
    set('statTotal', stats.total_species !== undefined ? stats.total_species : scans.length);
    set('statToday', scansToday);
    set('statUsers', stats.total_users !== undefined ? stats.total_users : users.length);
    set('statMessages', stats.total_messages !== undefined ? stats.total_messages : messages.filter(m => m.status === 'unread').length);
    set('statEmails', (typeof getAllEmails === 'function' ? getAllEmails() : []).length);
    set('statActivity', (typeof getActivityLog === 'function' ? getActivityLog() : []).length);

    // Badges
    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (count > 0) { el.textContent = count; el.style.display = 'inline-block'; }
      else { el.style.display = 'none'; }
    };
    setBadge('navBadgeScans', stats.pending_scans !== undefined ? stats.pending_scans : pending.length);
    setBadge('navBadgeMessages', stats.total_messages !== undefined ? stats.total_messages : messages.filter(m => m.status === 'unread').length);
    setBadge('navBadgeNotifs', getAdminNotifications().filter(n => !n.read).length);
    setBadge('headerNotifBadge', getAdminNotifications().filter(n => !n.read).length + (stats.total_messages !== undefined ? stats.total_messages : messages.filter(m => m.status === 'unread').length));
  }

  // --- Scan Cards ---
  async function renderPendingScans() {
    const container = document.getElementById('pendingScansList');
    if (!container) return;
    const pending = (window.AdminAPI ? await window.AdminAPI.getPendingScans() : null) || getPendingScans();
    if (pending.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>All Caught Up</h3><p>No pending scans to review right now.</p></div>';
      return;
    }
    let html = '';
    pending.forEach(item => {
      const species = item.species || {};
      const name = species.name || item.speciesName || 'Unknown Species';
      const sci = species.scientificName || '';
      const category = species.category || '';
      const image = safeImgSrc(item.imageData || item.image_data);
      const date = new Date(item.timestamp || item.createdAt || Date.now()).toLocaleString();
      html += '<div class="scan-card">';
      html += image ? '<img src="' + image + '" class="scan-img" onerror="this.style.display=\'none\'">' : '<div class="scan-img" style="display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);"><i class="fas fa-image" style="color:rgba(255,255,255,0.3);"></i></div>';
      html += '<div class="scan-info">';
      html += '<h4>' + esc(name) + '</h4>';
      html += '<p><em>' + esc(sci) + '</em>' + (category ? ' &middot; ' + esc(category) : '') + '</p>';
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
  async function renderMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    const messages = ((window.AdminAPI ? await window.AdminAPI.getMessages() : null) || getMessages())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (messages.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope-open"></i><h3>No Messages</h3><p>When users send messages from the contact page, they will appear here.</p></div>';
      return;
    }
    let html = '';
    messages.forEach(msg => {
      const isUnread = msg.status === 'unread';
      html += '<div class="message-card ' + (isUnread ? 'unread' : '') + '">';
      html += '<div class="message-header">';
      html += '<div><strong>' + esc(msg.name || 'Anonymous') + '</strong> &lt;' + esc(msg.email || 'no-email') + '&gt; <span class="badge badge-new">' + esc(msg.subject || 'Contact') + '</span></div>';
      html += '<span>' + new Date(msg.createdAt).toLocaleString() + '</span>';
      html += '</div>';
      var msgBody = msg.body || msg.message || '';
      html += '<div class="message-body">' + esc(msgBody.substring(0, 250)) + (msgBody.length > 250 ? '...' : '') + '</div>';
      html += '<div class="message-actions">';
      if (isUnread) html += '<button class="btn-sm btn-mark-read" onclick="markMessageRead(this.dataset.id)" data-id="' + msg.id + '"><i class="fas fa-check"></i> Mark Read</button>';
      html += '<a href="mailto:' + esc(msg.email || '') + '" class="btn-sm btn-view"><i class="fas fa-reply"></i> Reply</a>';
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
      html += '<div><i class="' + icon + '" style="color:var(--accent);margin-right:0.5rem;"></i><strong>' + esc(n.title || 'Notification') + '</strong></div>';
      html += '<span>' + new Date(n.timestamp).toLocaleString() + '</span>';
      html += '</div>';
      html += '<div class="message-body">' + esc(n.message || '') + '</div>';
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
  async function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    const users = ((window.AdminAPI ? await window.AdminAPI.getUsers() : null) || getUserList()).sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));
    const demoUsers = Object.entries(getDemoUsers()).map(([email, data]) => ({ email, ...data, registeredAt: data.registeredAt || new Date().toISOString() }));
    const allUsers = [...users, ...demoUsers].filter((v, i, a) => a.findIndex(t => t.email === v.email) === i); // dedupe

    if (allUsers.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No Users Registered</h3><p>Users who register will appear here.</p></div>';
      return;
    }
    const canModerate = window.AdminAPI && window.AdminAPI.backendAvailable();
    let html = '<table class="data-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Registered</th><th>Status</th>' + (canModerate ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
    allUsers.forEach(u => {
      const name = u.name || (u.email ? u.email.split('@')[0] : 'Unknown');
      const status = u.is_online !== undefined ? (u.is_online ? 'online' : 'offline') : (u.status || 'active');
      const active = u.is_active !== undefined ? u.is_active : true;
      const isAdmin = u.role === 'admin';
      const isSelf = u.email && window.localStorage.getItem('wildguard_user') && JSON.parse(window.localStorage.getItem('wildguard_user') || '{}').email === u.email;
      html += '<tr>';
      html += '<td><strong>' + esc(name) + '</strong></td>';
      html += '<td>' + esc(u.email) + '</td>';
      html += '<td><span class="badge ' + (isAdmin ? 'badge-approved' : 'badge-new') + '">' + esc(u.role || 'user') + '</span></td>';
      html += '<td>' + new Date(u.registeredAt || new Date()).toLocaleDateString() + '</td>';
      html += '<td>' + esc(status) + (active ? '' : ' <span class="badge badge-rejected" style="color:#ef4444;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);">banned</span>') + '</td>';
      if (canModerate && u.id !== undefined && !isSelf) {
        html += '<td style="white-space:nowrap;">';
        html += '<button class="btn-sm ' + (isAdmin ? 'btn-reject' : 'btn-approve') + '" onclick="toggleUserRole(this.dataset.id, this.dataset.role)" data-id="' + u.id + '" data-role="' + (isAdmin ? 'user' : 'admin') + '"><i class="fas fa-user-shield"></i> ' + (isAdmin ? 'Demote' : 'Promote') + '</button> ';
        html += '<button class="btn-sm ' + (active ? 'btn-reject' : 'btn-approve') + '" onclick="toggleUserBan(this.dataset.id, this.dataset.active)" data-id="' + u.id + '" data-active="' + (active ? 'false' : 'true') + '"><i class="fas fa-ban"></i> ' + (active ? 'Ban' : 'Unban') + '</button>';
        html += '</td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  window.toggleUserRole = async function(id, newRole) {
    if (!(await WGConfirm({ title: newRole === 'admin' ? 'Promote to Admin?' : 'Demote to User?', message: 'This will change the account role immediately.', confirmText: newRole === 'admin' ? 'Promote' : 'Demote' }))) return;
    if (window.AdminAPI) {
      const res = await window.AdminAPI.updateUser(id, { role: newRole });
      if (!res.success) { WGAlert({ title: 'Update Failed', message: res.message, danger: true }); return; }
      showAdminToast(newRole === 'admin' ? 'User promoted to admin.' : 'Admin demoted to user.');
    }
    renderUsers(); updateStats();
  };

  window.toggleUserBan = async function(id, active) {
    const banning = active === 'false';
    if (!(await WGConfirm({ title: banning ? 'Ban this user?' : 'Restore this user?', message: banning ? 'The user will be unable to log in or use the API.' : 'The user will regain access to their account.', confirmText: banning ? 'Ban' : 'Restore', danger: banning }))) return;
    if (window.AdminAPI) {
      const res = await window.AdminAPI.updateUser(id, { is_active: active === 'true' });
      if (!res.success) { WGAlert({ title: 'Update Failed', message: res.message, danger: true }); return; }
      showAdminToast(banning ? 'User banned.' : 'User restored.');
    }
    renderUsers(); updateStats();
  };

  // --- Activity Log (Traffic) ---
  function getActivityLog() { return getItem('wildguard_activity_log', []); }
  async function renderActivityLog() {
    var container = document.getElementById('activityLogList');
    if (!container) return;
    var logs = (window.AdminAPI ? await window.AdminAPI.getActivity() : null) || getActivityLog();
    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><h3>No Activity Yet</h3><p>User registrations, logins, and other events will appear here.</p></div>';
      return;
    }
    var html = '<table class="data-table"><thead><tr><th>Timestamp</th><th>Event</th><th>User</th><th>Details</th><th>Page</th></tr></thead><tbody>';
    logs.forEach(function(log) {
      var eventIcon = log.event === 'login' ? 'fas fa-sign-in-alt' : log.event === 'register' ? 'fas fa-user-plus' : log.event === 'logout' ? 'fas fa-sign-out-alt' : log.event === 'email_sent' ? 'fas fa-envelope' : 'fas fa-circle';
      var eventColor = log.event === 'login' ? '#22c55e' : log.event === 'register' ? '#3b82f6' : log.event === 'logout' ? '#f59e0b' : log.event === 'login_failed' ? '#ef4444' : '#a855f7';
      html += '<tr>';
      html += '<td style="white-space:nowrap;font-size:0.82rem;">' + new Date(log.timestamp).toLocaleString() + '</td>';
      html += '<td><span style="color:' + eventColor + ';font-weight:600;font-size:0.85rem;"><i class="' + eventIcon + '" style="margin-right:0.3rem;"></i>' + esc(log.event) + '</span></td>';
      html += '<td style="font-size:0.85rem;">' + esc(log.user || 'guest') + '</td>';
      html += '<td style="font-size:0.85rem;">' + esc(log.details || '') + '</td>';
      html += '<td style="font-size:0.78rem;opacity:0.6;max-width:200px;overflow:hidden;text-overflow:ellipsis;">' + esc(log.page || '') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // --- Email Campaign ---
  function getAllEmails() { return getItem('wildguard_emails', []); }
  function renderSentEmails() {
    var container = document.getElementById('sentEmailsList');
    if (!container) return;
    var emails = getAllEmails().sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    if (emails.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope"></i><h3>No Emails Sent</h3><p>Emails sent by the system or admin will appear here.</p></div>';
      return;
    }
    var html = '<table class="data-table"><thead><tr><th>To</th><th>Subject</th><th>Type</th><th>Sent</th><th>Status</th></tr></thead><tbody>';
    emails.forEach(function(e) {
      html += '<tr>';
      html += '<td style="font-size:0.85rem;">' + e.to + '</td>';
      html += '<td style="font-size:0.85rem;">' + e.subject + '</td>';
      html += '<td><span class="badge ' + (e.type === 'welcome' ? 'badge-approved' : e.type === 'verification' ? 'badge-pending' : 'badge-new') + '">' + (e.type || 'general') + '</span></td>';
      html += '<td style="font-size:0.82rem;">' + new Date(e.timestamp).toLocaleString() + '</td>';
      html += '<td style="font-size:0.82rem;">' + (e.read ? '<span style="color:#22c55e;">Read</span>' : '<span style="color:#f59e0b;">Unread</span>') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // --- Action Handlers ---
  window.approveScan = async function(id) {
    if (window.AdminAPI && window.AdminAPI.backendAvailable()) {
      const res = await window.AdminAPI.reviewScan(id, 'approved');
      if (!res.success) { WGAlert({ title: 'Approval Failed', message: res.message, danger: true }); return; }
      updateStats(); renderPendingScans();
      showAdminToast('Scan approved.');
      return;
    }
    const pending = getPendingScans();
    const item = pending.find(p => p.id === id);
    if (item) {
      item.status = 'approved'; item.approvedAt = new Date().toISOString();
      const scans = getCompleteScans();
      scans.unshift(item);
      localStorage.setItem('wildlife_scans', JSON.stringify(scans));
      localStorage.setItem('wildlife_pending_admin', JSON.stringify(pending.filter(p => p.id !== id)));
      updateStats(); renderPendingScans();
      // Notify the scan's owner
      if (item.user && typeof window.sendUserNotification === 'function') {
        window.sendUserNotification(item.user, {
          type: 'scan_approved',
          title: 'Scan Approved',
          message: 'Your scan of ' + (item.animalName || item.animal || 'wildlife') + ' was approved and added to the library.'
        });
      }
      // Show toast
      showAdminToast('Scan approved and moved to catalog.');
    }
  };

  window.rejectScan = async function(id) {
    if (!(await WGConfirm({ title: 'Reject this scan?', message: 'The submitted scan will be removed from the review queue and the scout will be notified.', confirmText: 'Reject', danger: true }))) return;
    if (window.AdminAPI && window.AdminAPI.backendAvailable()) {
      const res = await window.AdminAPI.reviewScan(id, 'rejected');
      if (!res.success) { WGAlert({ title: 'Reject Failed', message: res.message, danger: true }); return; }
      updateStats(); renderPendingScans();
      showAdminToast('Scan rejected.');
      return;
    }
    const pending = getPendingScans();
    const item = pending.find(p => p.id === id);
    localStorage.setItem('wildlife_pending_admin', JSON.stringify(pending.filter(p => p.id !== id)));
    updateStats(); renderPendingScans();
    if (item && item.user && typeof window.sendUserNotification === 'function') {
      window.sendUserNotification(item.user, {
        type: 'scan_rejected',
        title: 'Scan Rejected',
        message: 'Your scan of ' + (item.animalName || item.animal || 'wildlife') + ' was not approved. You can resubmit it or ask for more details.'
      });
    }
  };

  window.markMessageRead = function(id) {
    const msgs = getMessages();
    const msg = msgs.find(m => m.id === id);
    if (msg) { msg.status = 'read'; localStorage.setItem('wildguard_admin_messages', JSON.stringify(msgs)); }
    updateStats(); renderMessages();
  };

  window.deleteMessage = async function(id) {
    if (!(await WGConfirm({ title: 'Delete this message?', message: 'This message will be permanently removed from the inbox.', confirmText: 'Delete', danger: true }))) return;
    if (window.AdminAPI) {
      const res = await window.AdminAPI.deleteMessage(id);
      if (!res.success && res.message) { WGAlert({ title: 'Delete Failed', message: res.message, danger: true }); return; }
    } else {
      const msgs = getMessages().filter(m => m.id !== id);
      localStorage.setItem('wildguard_admin_messages', JSON.stringify(msgs));
    }
    updateStats(); renderMessages();
  };

  window.markNotifRead = function(id) {
    const notifs = getAdminNotifications();
    const n = notifs.find(x => x.id === id);
    if (n) { n.read = true; localStorage.setItem('wildguard_admin_notifications', JSON.stringify(notifs)); }
    updateStats(); renderNotifications();
  };

  window.deleteNotif = async function(id) {
    if (!(await WGConfirm({ title: 'Delete this notification?', message: 'This notification will be permanently removed.', confirmText: 'Delete', danger: true }))) return;
    const notifs = getAdminNotifications().filter(n => n.id !== id);
    localStorage.setItem('wildguard_admin_notifications', JSON.stringify(notifs));
    updateStats(); renderNotifications();
  };

  function showAdminToast(text) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#2d6a4f,#1e3a2b);color:#fff;padding:12px 20px;border-radius:8px;z-index:6000;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeIn 0.3s ease; font-size:0.9rem;';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i>' + text;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2500);
  }

  // --- Admin Email Campaign ---
  window.sendAdminEmailCampaign = async function() {
    var subject = document.getElementById('emailSubject')?.value.trim();
    var body = document.getElementById('emailBody')?.value.trim();
    var type = document.getElementById('emailType')?.value || 'update';
    if (!subject || !body) {
      WGAlert({ title: 'Missing Details', message: 'Please fill in both subject and body.', danger: true });
      return;
    }
    var users = getUserList();

    // Prefer the backend broadcast endpoint (persists to user inboxes).
    if (window.AdminAPI && window.AdminAPI.backendAvailable()) {
      const recipients = users.map(function(u) { return u.email; }).filter(Boolean);
      const res = await window.AdminAPI.broadcast(recipients, subject, body);
      if (res.success) {
        showAdminToast('Broadcast sent to ' + res.recipients + ' recipient(s).');
      } else {
        WGAlert({ title: 'Broadcast Failed', message: res.message || 'Could not send broadcast.', danger: true });
        return;
      }
    } else {
      var sentCount = 0;
      if (typeof window.sendEmail === 'function') {
        users.forEach(function(u) {
          window.sendEmail(u.email, subject, body, type);
          sentCount++;
        });
      } else {
        // Fallback: use localStorage directly
        var emails = getAllEmails();
        users.forEach(function(u) {
          emails.unshift({
            id: 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            from: 'info@wildguard.org',
            to: u.email,
            subject: subject,
            body: body,
            timestamp: new Date().toISOString(),
            read: false,
            type: type
          });
          sentCount++;
        });
        localStorage.setItem('wildguard_emails', JSON.stringify(emails));
      }
      // Log activity
      if (typeof window.logActivity === 'function') {
        window.logActivity('email_campaign', 'admin', 'Admin sent email campaign to ' + sentCount + ' users');
      }
      WGAlert({ title: 'Campaign Sent', message: 'Email campaign sent to ' + sentCount + ' users!' });
    }
    document.getElementById('emailSubject').value = '';
    document.getElementById('emailBody').value = '';
    renderSentEmails();
    updateStats();
  };

  // --- Admin Settings ---
  const DEFAULT_SETTINGS = {
    site_name: 'WildGuard Society',
    announcement: '',
    contact_email: 'info@wildguard.org',
    max_scan_size_mb: '5',
    scans_per_day_limit: '50'
  };

  async function renderSettings() {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    const settings = Object.assign({}, DEFAULT_SETTINGS, (window.AdminAPI ? await window.AdminAPI.getSettings() : {}) || {});
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('settingSiteName', settings.site_name);
    set('settingAnnouncement', settings.announcement);
    set('settingContactEmail', settings.contact_email);
    set('settingMaxScan', settings.max_scan_size_mb);
    set('settingScansPerDay', settings.scans_per_day_limit);
  }

  window.saveAdminSettings = async function() {
    if (!window.AdminAPI) { WGAlert({ title: 'Backend Required', message: 'Settings are managed by the backend.', danger: true }); return; }
    const data = {
      site_name: document.getElementById('settingSiteName').value.trim(),
      announcement: document.getElementById('settingAnnouncement').value.trim(),
      contact_email: document.getElementById('settingContactEmail').value.trim(),
      max_scan_size_mb: document.getElementById('settingMaxScan').value.trim(),
      scans_per_day_limit: document.getElementById('settingScansPerDay').value.trim()
    };
    const res = await window.AdminAPI.updateSettings(data);
    if (res.success) {
      showAdminToast('Settings saved.');
      localStorage.setItem('wildguard_settings', JSON.stringify(data));
    } else {
      WGAlert({ title: 'Save Failed', message: res.message || 'Could not save settings.', danger: true });
    }
  };

  // --- Init ---
  async function init() {
    await updateStats();
    await renderPendingScans();
    await renderMessages();
    renderNotifications();
    await renderUsers();
    await renderActivityLog();
    renderSentEmails();
    await renderSettings();
    // Show admin email
    try {
      const user = getItem('wildguard_user', null);
      if (user && user.email) {
        const el = document.getElementById('adminEmail');
        if (el) el.textContent = user.email;
      }
    } catch(e){}

    // Poll every 5 seconds to refresh data from localStorage
    setInterval(() => {
      updateStats();
      // Only re-render visible sections to avoid flicker
      renderPendingScans();
      renderMessages();
      renderNotifications();
      renderUsers();
      // These two are less frequent, update every other poll (10s)
      if (Math.random() > 0.5) {
        renderActivityLog();
        renderSentEmails();
      }
    }, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Expose renderers for tab switching
  window.renderActivityLog = renderActivityLog;
  window.renderSentEmails = renderSentEmails;
  window.getAllEmails = getAllEmails;
  window.renderSettings = renderSettings;
})();
