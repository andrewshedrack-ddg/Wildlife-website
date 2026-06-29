/**
 * WildGuard Society - Admin Portal
 * Full-featured admin dashboard
 */
(function() {
  'use strict';

  // ============ DATA & HELPERS ============
  var SK = {
    USERS: 'wg_users', MESSAGES: 'wg_messages', SCANS: 'wg_scans_pending',
    APPROVED: 'wg_scans_approved', REQUESTS: 'wg_role_requests',
    ADMINS: 'wg_admin_list', LOG: 'wg_activity_log', CREDITS: 'wg_credits'
  };
  function get(key) { try { return JSON.parse(localStorage.getItem(SK[key]) || '[]'); } catch(e) { return []; } }
  function set(key, val) { localStorage.setItem(SK[key], JSON.stringify(val)); }
  function logAct(action, detail) { var l = get('LOG'); l.unshift({ action: action, detail: detail, time: new Date().toISOString() }); if (l.length > 200) l.length = 200; set('LOG', l); }
  function esc(str) { var d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
  function fmt(d) { try { return new Date(d).toLocaleString(); } catch(e) { return d; } }
  function currentUser() { try { return JSON.parse(localStorage.getItem('wildguard_user') || 'null'); } catch(e) { return null; } }
  function isSuper() { var u = currentUser(); return u && (u.role === 'super_admin' || u.email === 'info@wildguardsociety.org'); }

  // Init store
  if (!localStorage.getItem(SK.ADMINS)) set('ADMINS', [{ email: 'info@wildguardsociety.org', name: 'Administrator', role: 'super_admin', approved: true, date: new Date().toISOString() }]);
  ['USERS','MESSAGES','SCANS','APPROVED','REQUESTS','LOG'].forEach(function(k){ if(!localStorage.getItem(SK[k])) set(k,[]); });
  if (!localStorage.getItem(SK.CREDITS)) set('CREDITS', {});

  // ============ NAV & SECTIONS ============
  var sections = {};
  function reg(id, fn) { sections[id] = fn; }
  function show(id) {
    var el = document.getElementById('portal-content');
    if (!el || !sections[id]) return;
    el.innerHTML = '<div style="text-align:center;padding:3rem;color:rgba(255,255,255,0.4)"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:0.5rem"></i><p>Loading...</p></div>';
    setTimeout(function(){ el.innerHTML = sections[id](); attach(id); }, 100);
    document.querySelectorAll('.portal-nav-item').forEach(function(n){ n.classList.toggle('active', n.dataset.section === id); });
    window.location.hash = id;
  }
  function attach(id) {}

  // ============ NOTIFICATIONS ============
  function notify(msg, type) {
    var c = document.getElementById('portal-toasts');
    if (!c) { c = document.createElement('div'); c.id = 'portal-toasts'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:100000;display:flex;flex-direction:column;gap:10px;'; document.body.appendChild(c); }
    var t = document.createElement('div');
    t.style.cssText = 'background:rgba(10,21,16,0.95);border:1px solid rgba(201,162,39,0.3);color:#fff;padding:14px 20px;border-radius:10px;font-size:0.9rem;display:flex;align-items:center;gap:10px;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
    var ic = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    var co = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#c9a227';
    t.innerHTML = '<i class="fas ' + ic + '" style="color:' + co + '"></i><span>' + esc(msg) + '</span>';
    c.appendChild(t);
    setTimeout(function(){ t.remove(); }, 4000);
  }

  // ============ STAT CARD HELPER ============
  function statCard(label, val, icon, color) {
    return '<div class="portal-stat-card"><div class="portal-stat-icon" style="color:' + color + '"><i class="fas ' + icon + '"></i></div><div class="portal-stat-value">' + val + '</div><div class="portal-stat-label">' + label + '</div></div>';
  }

  // ============ DASHBOARD ============
  reg('dashboard', function() {
    var users = get('USERS'), msgs = get('MESSAGES'), scans = get('SCANS'), reqs = get('REQUESTS');
    var pMsg = msgs.filter(function(m){ return !m.read; }).length;
    return '<div>' +
      '<div class="portal-stats">' +
        statCard('Users', 1 + users.length, 'fa-users', '#3b82f6') +
        statCard('Unread Messages', pMsg, 'fa-envelope', '#ef4444') +
        statCard('Pending Scans', scans.length, 'fa-image', '#f59e0b') +
        statCard('Role Requests', reqs.filter(function(r){ return r.status === 'pending'; }).length, 'fa-id-badge', '#c9a227') +
      '</div>' +
      '<div class="portal-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">' +
        card('Recent Messages', 'fa-inbox', pMsg + ' new', 'rgba(239,68,68,0.15)', '#ef4444', recentMsgs()) +
        card('Pending Scans', 'fa-list-check', scans.length + ' pending', 'rgba(245,158,11,0.15)', '#f59e0b', pendingScans()) +
        card('Role Requests', 'fa-user-plus', reqs.filter(function(r){ return r.status === 'pending'; }).length + ' pending', 'rgba(201,162,39,0.15)', 'var(--accent)', roleReqsShort()) +
        card('Activity Log', 'fa-clipboard-list', '', 'transparent', 'var(--accent)', activityShort()) +
      '</div></div>';
  });

  function card(title, icon, badge, badgeBg, badgeColor, content) {
    return '<div class="portal-card">' +
      '<div class="portal-card-header">' +
        '<h3><i class="fas ' + icon + '" style="color:var(--accent)"></i> ' + title + '</h3>' +
        (badge ? '<span class="portal-badge" style="background:' + badgeBg + ';color:' + badgeColor + '">' + badge + '</span>' : '') +
      '</div>' + content + '</div>';
  }

  function recentMsgs() {
    var m = get('MESSAGES').slice(0, 4);
    if (!m.length) return empty('No messages yet');
    return m.map(function(msg){ return '<div class="portal-list-item" style="border-left:3px solid ' + (msg.read ? 'rgba(255,255,255,0.1)' : 'var(--accent)') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span style="font-weight:500;font-size:0.85rem">' + esc(msg.name || 'Unknown') + '</span>' +
      '<span style="font-size:0.75rem;opacity:0.5">' + fmt(msg.createdAt) + '</span></div>' +
      '<p style="margin:4px 0 0;font-size:0.82rem;opacity:0.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc((msg.subject || msg.body || '').substring(0, 60)) + '</p></div>'; }).join('');
  }
  function pendingScans() {
    var s = get('SCANS').slice(0, 3);
    if (!s.length) return empty('No pending scans');
    return s.map(function(scan){ return '<div class="portal-list-item" style="display:flex;align-items:center;gap:0.75rem">' +
      '<div style="width:40px;height:40px;background:linear-gradient(135deg,#1b5e40,#143d2a);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:1.1rem">🐾</div>' +
      '<div style="flex:1;min-width:0"><div class="portal-list-title">' + esc(scan.animalName || 'Unknown Animal') + '</div>' +
      '<div class="portal-list-meta">From: ' + esc(scan.submittedBy || 'Unknown') + '</div></div></div>'; }).join('');
  }
  function roleReqsShort() {
    var r = get('REQUESTS').filter(function(x){ return x.status === 'pending'; }).slice(0, 3);
    if (!r.length) return empty('No pending requests');
    return r.map(function(req){ return '<div class="portal-list-item"><div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span style="font-weight:500;font-size:0.85rem">' + esc(req.userName || req.userEmail) + '</span>' +
      '<span style="background:rgba(201,162,39,0.15);color:var(--accent);padding:1px 8px;border-radius:20px;font-size:0.75rem">' + esc(req.requestedRole) + '</span></div>' +
      '<div class="portal-list-meta">Credits: ' + (req.credits || 0) + '</div></div>'; }).join('');
  }
  function activityShort() {
    var l = get('LOG').slice(0, 5);
    if (!l.length) return empty('No recent activity');
    return l.map(function(a){ return '<div style="padding:0.5rem 0.75rem;font-size:0.8rem;border-bottom:1px solid rgba(255,255,255,0.03)">' +
      '<span style="opacity:0.6">[' + fmt(a.time) + ']</span> ' + esc(a.action) + '</div>'; }).join('');
  }
  function empty(text) { return '<p class="portal-empty">' + text + '</p>'; }

  // ============ MESSAGES SECTION ============
  reg('messages', function() {
    var msgs = get('MESSAGES');
    return '<div><h2>Message Center</h2><div class="portal-grid" style="grid-template-columns:1fr">' + msgs.map(function(m, i){ return msgRow(m, i); }).join('') + '</div></div>';
  });

  function msgRow(m, idx) {
    return '<div class="portal-card" style="cursor:pointer" onclick="window._openMsg(' + idx + ')">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div><div style="font-weight:600;font-size:0.95rem">' + esc(m.name || 'Unknown') + ' <span style="font-size:0.8rem;opacity:0.5">&lt;' + esc(m.email) + '&gt;</span></div>' +
      '<div style="font-size:0.82rem;opacity:0.6;margin-top:2px">' + esc(m.subject || 'No subject') + '</div></div>' +
      '<div style="text-align:right"><span style="font-size:0.75rem;opacity:0.4">' + fmt(m.createdAt) + '</span></div></div>' +
      '<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.04);font-size:0.85rem;opacity:0.8;line-height:1.6">' + esc(m.body || '').substring(0, 200) + (m.body && m.body.length > 200 ? '...' : '') + '</div>' +
      '</div>';
  }
  window._openMsg = function(idx) {
    var m = get('MESSAGES')[idx]; if (!m) return;
    // mark read
    var all = get('MESSAGES'); all[idx].read = true; set('MESSAGES', all);
    // Show in modal or alert for now
    var html = '<div style="padding:2rem"><h3 style="margin:0 0 1rem;font-family:var(--font-heading)">' + esc(m.subject || 'Message') + '</h3>' +
      '<p style="opacity:0.6;margin-bottom:1rem">From: ' + esc(m.name) + ' &lt;' + esc(m.email) + '&gt;<br>Date: ' + fmt(m.createdAt) + '</p>' +
      '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:1.5rem;line-height:1.7">' + esc(m.body || '').replace(/\\n/g, '<br>') + '</div>' +
      '<div style="margin-top:1.5rem"><div class="portal-field"><label>Reply</时间的</label><textarea id="reply-body" rows="4" style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter);font-size:0.9rem"></textarea></div>' +
      '<button class="portal-btn portal-btn-primary" onclick="window._sendReply(' + idx + ')"><i class="fas fa-paper-plane"></i> Send Reply</button></div>' +
      '<button onclick="this.closest(\'.portal-modal-overlay\').classList.remove(\'open\')" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--lighter);font-size:1.5rem;cursor:pointer;opacity:0.5">&times;</button></div>';
    showModal(html);
  };
  window._sendReply = function(idx) {
    var body = document.getElementById('reply-body');
    if (!body || !body.value.trim()) { notify('Please enter a reply', 'error'); return; }
    var msgs = get('MESSAGES');
    if (!msgs[idx].replies) msgs[idx].replies = [];
    msgs[idx].replies.push({ from: 'Admin', body: body.value.trim(), time: new Date().toISOString() });
    set('MESSAGES', msgs);
    logAct('reply_sent', { to: msgs[idx].email });
    notify('Reply sent successfully', 'success');
    document.querySelector('.portal-modal-overlay').classList.remove('open');
    show('messages');
  };

  // ============ SCANS SECTION ============
  reg('scans', function() {
    var scans = get('SCANS');
    return '<div><h2>Scan Submissions</h2>' + (scans.length ? scans.map(function(s, i){ return scanRow(s, i); }).join('') : empty('No pending scans')) + '</div>';
  });
  function scanRow(s, i) {
    return '<div class="portal-card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">' +
      '<div style="display:flex;align-items:center;gap:1rem"><div style="width:50px;height:50px;background:linear-gradient(135deg,#1b5e40,#143d2a);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:1.3rem">🐾</div>' +
      '<div><div style="font-weight:600">' + esc(s.animalName || 'Unknown Animal') + '</div><div style="font-size:0.82rem;opacity:0.6">By: ' + esc(s.submittedBy || 'Unknown') + '</div></div></div>' +
      '<div style="display:flex;gap:0.5rem"><button class="portal-btn portal-btn-approve" onclick="window._approveScan(' + i + ')"><i class="fas fa-check"></i> Approve</button>' +
      '<button class="portal-btn portal-btn-reject" onclick="window._rejectScan(' + i + ')"><i class="fas fa-xmark"></i> Reject</button></div></div></div>';
  }
  window._approveScan = function(idx) {
    var scans = get('SCANS'), approved = get('APPROVED');
    if (scans[idx]) { var s = scans.splice(idx, 1)[0]; s.approvedAt = new Date().toISOString(); approved.push(s); set('SCANS', scans); set('APPROVED', approved); logAct('scan_approved', { animal: s.animalName }); notify('Scan approved', 'success'); show('scans'); }
  };
  window._rejectScan = function(idx) {
    var scans = get('SCANS');
    if (scans[idx]) { var s = scans.splice(idx, 1)[0]; set('SCANS', scans); logAct('scan_rejected', { animal: s.animalName }); notify('Scan rejected', 'success'); show('scans'); }
  };

  // ============ USERS & ROLES ============
  reg('users', function() {
    var users = get('USERS'), reqs = get('REQUESTS');
    return '<div><h2>User Management</h2>' +
      '<div class="portal-card" style="margin-bottom:2rem"><h3 style="margin:0 0 1rem">Role Requests</h3>' +
      (reqs.filter(function(r){ return r.status === 'pending'; }).length ? reqs.filter(function(r){ return r.status === 'pending'; }).map(function(r, i){ return reqRow(r, i); }).join('') : empty('No pending role requests')) + '</div>' +
      '<div class="portal-card"><h3 style="margin:0 0 1rem">All Users</h3>' +
      '<table class="portal-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Credits</th><th>Actions</th></tr></thead><tbody>' + users.map(function(u){ return '<tr><td>' + esc(u.name || 'Unknown') + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.role || 'User') + '</td><td>' + (get('CREDITS')[u.email] || 0) + '</td><td><button class="portal-btn" style="padding:0.3rem 0.7rem;font-size:0.75rem;background:rgba(255,255,255,0.05)" onclick="window._editUser(\'' + esc(u.email) + '\')">">Edit</button></td></tr>'; }).join('') + '</tbody></table></div></div>';
  });
  function reqRow(r, i) {
    return '<div class="portal-list-item"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">' +
      '<div><div style="font-weight:500">' + esc(r.userName || r.userEmail) + ' requests <span style="color:var(--accent)">' + esc(r.requestedRole) + '</span></div>' +
      '<div style="font-size:0.78rem;opacity:0.5">Credits earned: ' + (r.credits || 0) + '</div></div>' +
      '<div style="display:flex;gap:0.5rem">' +
      '<button class="portal-btn portal-btn-approve" style="padding:0.4rem 0.9rem;font-size:0.8rem" onclick="window._approveReq(' + i + ')"><i class="fas fa-check"></i> Approve</button>' +
      '<button class="portal-btn portal-btn-reject" style="padding:0.4rem 0.9rem;font-size:0.8rem" onclick="window._rejectReq(' + i + ')"><i class="fas fa-xmark"></i> Reject</button></div></div></div>';
  }
  window._approveReq = function(idx) {
    var reqs = get('REQUESTS');
    if (reqs[idx] && reqs[idx].status === 'pending') { reqs[idx].status = 'approved'; reqs[idx].approvedAt = new Date().toISOString(); set('REQUESTS', reqs); logAct('role_approved', { user: reqs[idx].userEmail, role: reqs[idx].requestedRole }); notify('Role request approved', 'success'); show('users'); }
  };
  window._rejectReq = function(idx) {
    var reqs = get('REQUESTS');
    if (reqs[idx]) { reqs.splice(idx, 1); set('REQUESTS', reqs); notify('Role request rejected', 'success'); show('users'); }
  };
  window._editUser = function(email) { notify('User editing coming soon', 'info'); };

  // ============ ADMINS SECTION ============
  reg('admins', function() {
    var admins = get('ADMINS');
    var html = '<div><h2>Admin Management</h2>';
    if (isSuper()) {
      html += '<div class="portal-card" style="margin-bottom:2rem"><h3 style="margin:0 0 1rem">Add New Admin</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:1rem;align-items:end">' +
        '<div class="portal-field"><"label">Name</label><input type="text" id="new-admin-name" placeholder="Full name"></div>' +
        '<div class="portal-field"><label>Email</label><input type="email" id="new-admin-email" placeholder="admin@example.com"></div>' +
        '<div class="portal-field"><label>Role</label><select id="new-admin-role" style="width:100%;padding:0.7rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter)"><option value="admin">Admin</option><option value="moderator">Moderator</option></select></div>' +
        '<button class="portal-btn portal-btn-primary" onclick="window._addAdmin()"><i class="fas fa-plus"></i> Add</button></div></div>';
     }
    html += '<div class="portal-card"><h3 style="margin:0 0 1rem">Approved Admins</h3>' +
      '<table class="portal-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Added</th><th>Status</th></tr></thead><tbody>' +
      admins.map(function(a){ return '<tr><td>' + esc(a.name || 'Unknown') + '</td><td>' + esc(a.email) + '</td><td>' + esc(a.role) + '</td><td>' + fmt(a.date) + '</td><td>' + (a.approved ? '<span style="color:#22c55e">● Approved</span>' : '<span style="color:#f59e0b">○ Pending</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
    return html;
  });
  window._addAdmin = function() {
    var name = document.getElementById('new-admin-name').value.trim();
    var email = document.getElementById('new-admin-email').value.trim();
    var role = document.getElementById('new-admin-role').value;
    if (!name || !email) { notify('Please fill in all fields', 'error'); return; }
    var admins = get('ADMINS');
    if (admins.some(function(a){ return a.email === email; })) { notify('Admin already exists', 'error'); return; }
    admins.push({ name: name, email: email, role: role, approved: true, date: new Date().toISOString() });
    set('ADMINS', admins); logAct('admin_added', { email: email, role: role }); notify('Admin added successfully', 'success'); show('admins');
  };

  // ============ ACTIVITY LOG ============
  reg('logs', function() {
    var logs = get('LOG');
    return '<div><h2>Activity Log</h2><div class="portal-card">' +
      '<table class="portal-table"><thead><tr><th>Time</th><th>Action</th><th>Details</th><th>Admin</th></tr></thead><tbody>' +
      logs.map(function(l){ return '<tr><td>' + fmt(l.time) + '</td><td>' + esc(l.action) + '</td><td>' + esc(l.detail || '') + '</td><td>' + esc(l.admin || 'Unknown') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  });

  // ============ MODAL HELPER ============
  function showModal(html) {
    var overlay = document.getElementById('portal-modal');
    if (!overlay) { overlay = document.createElement('div'); overlay.id = 'portal-modal'; overlay.className = 'portal-modal-overlay'; overlay.innerHTML = '<div class="portal-modal" id="portal-modal-inner"></div>'; document.body.appendChild(overlay); }
    var inner = overlay.querySelector('.portal-modal');
    inner.innerHTML = html;
    overlay.classList.add('open');
    overlay.onclick = function(e) { if (e.target === overlay) overlay.classList.remove('open'); };
  }

  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', function() {
    var nav = document.querySelector('.portal-sidebar');
    if (nav) {
      nav.querySelectorAll('.portal-nav-item').forEach(function(el){
        el.addEventListener('click', function(){ show(el.dataset.section); });
      });
    }
    // Show default or hash
    show(window.location.hash.replace('#', '') || 'dashboard');
  });

  // Expose for inline handlers
  window.portalNotify = notify;
  window.portalShow = show;
})();
