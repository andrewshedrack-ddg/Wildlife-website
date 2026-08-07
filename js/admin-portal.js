/**
 * WildGuard Society - Admin Portal v2.0
 * Real-time Live Feed Dashboard with SocketIO
 */
(function() {
  'use strict';

  // ============ CONFIGURATION ============
  var REFRESH_INTERVAL = 30000; // 30 seconds
  var socket = null;
  var isConnected = false;
  var currentUser = null;

  // ============ DATA STORAGE KEYS ============
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
  function fmtShort(d) { try { return new Date(d).toLocaleDateString(); } catch(e) { return d; } }
  function currentUser() { try { return JSON.parse(localStorage.getItem('wildguard_user') || 'null'); } catch(e) { return null; } }
  function isSuper() { var u = currentUser(); return u && (u.role === 'super_admin' || u.email === 'info@wildguardsociety.org'); }

  // Init store
  if (!localStorage.getItem(SK.ADMINS)) set('ADMINS', [{ email: 'info@wildguardsociety.org', name: 'Administrator', role: 'super_admin', approved: true, date: new Date().toISOString() }]);
  ['USERS','MESSAGES','SCANS','APPROVED','REQUESTS','LOG'].forEach(function(k){ if(!localStorage.getItem(SK[k])) set(k,[]); });
  if (!localStorage.getItem(SK.CREDITS)) set('CREDITS', {});

  // ============ SOCKET.IO CONNECTION ============
  function initSocket() {
    if (typeof io === 'undefined') {
      console.warn('SocketIO not loaded, using polling fallback');
      startPolling();
      return;
    }

    socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000
    });

    socket.on('connect', function() {
      console.log('Socket connected:', socket.id);
      isConnected = true;
      updateConnectionStatus(true);
      
      // Join admin room
      socket.emit('join_admin_room');
      
      // Join user room if logged in
      var user = currentUser();
      if (user && user.email) {
        socket.emit('join_user_room', { email: user.email });
      }
    });

    socket.on('disconnect', function() {
      console.log('Socket disconnected');
      isConnected = false;
      updateConnectionStatus(false);
    });

    socket.on('connected', function(data) {
      console.log('Server confirmed connection:', data);
    });

    socket.on('joined_room', function(data) {
      console.log('Joined room:', data.room);
    });

    // Real-time stats updates
    socket.on('stats_update', function(data) {
      console.log('Stats update received:', data);
      updateDashboardStats(data);
    });

    // Real-time notifications
    socket.on('notification', function(data) {
      console.log('Notification received:', data);
      showNotification(data.title, data.body, data.type);
      if (data.type === 'message') {
        loadMessages(); // Refresh messages
      } else if (data.type === 'scan') {
        loadScans(); // Refresh scans
      }
    });

    // New message from contact form
    socket.on('new_message', function(data) {
      console.log('New message:', data);
      showNotification('New Message', data.subject, 'message');
      loadMessages();
      updateUnreadBadge();
    });

    // Broadcast sent confirmation
    socket.on('broadcast_sent', function(data) {
      console.log('Broadcast sent:', data);
      showNotification('Broadcast Sent', 'Sent to ' + data.recipients + ' users', 'success');
    });

    // Scan approval/rejection
    socket.on('scan_approved', function(data) {
      console.log('Scan approved:', data);
      loadScans();
      showNotification('Scan Approved', data.animal + ' added to library', 'success');
    });

    socket.on('scan_rejected', function(data) {
      console.log('Scan rejected:', data);
      loadScans();
      showNotification('Scan Rejected', data.animal + ' rejected', 'warning');
    });

    // User activity
    socket.on('user_online', function(data) {
      updateUserStatus(data.email, true);
    });

    socket.on('user_offline', function(data) {
      updateUserStatus(data.email, false);
    });

    // Activity log
    socket.on('activity_log', function(data) {
      prependActivityLog(data);
    });
  }

  function updateConnectionStatus(connected) {
    var dot = document.getElementById('realtime-dot');
    var text = document.getElementById('realtime-text');
    if (dot && text) {
      if (connected) {
        dot.classList.remove('offline');
        dot.classList.add('online');
        text.textContent = 'Live';
      } else {
        dot.classList.remove('online');
        dot.classList.add('offline');
        text.textContent = 'Offline';
      }
    }
  }

  function showNotification(title, message, type) {
    var c = document.getElementById('portal-toasts');
    if (!c) { c = document.createElement('div'); c.id = 'portal-toasts'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:100000;display:flex;flex-direction:column;gap:10px;'; document.body.appendChild(c); }
    var t = document.createElement('div');
    t.className = 'portal-toast ' + (type || 'info');
    var ic = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    var co = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#c9a227';
    t.style.cssText = 'background:rgba(10,21,16,0.98);border:1px solid rgba(201,162,39,0.3);color:#fff;padding:14px 20px;border-radius:10px;font-size:0.9rem;display:flex;align-items:center;gap:10px;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
    t.innerHTML = '<i class="fas ' + ic + '" style="color:' + co + '"></i><div class="portal-toast-content"><div class="portal-toast-title">' + esc(title) + '</div><div class="portal-toast-message">' + esc(message) + '</div></div>';
    c.appendChild(t);
    setTimeout(function(){ t.style.animation = 'slideIn 0.3s ease reverse'; setTimeout(function(){ t.remove(); }, 300); }, 5000);
  }

  // ============ POLLING FALLBACK ============
  function startPolling() {
    console.log('Starting polling fallback');
    setInterval(function() {
      if (document.visibilityState === 'visible') {
        refreshDashboardData();
      }
    }, REFRESH_INTERVAL);
  }

  // ============ DASHBOARD STATS ============
  function updateDashboardStats(stats) {
    var cards = {
      'stat-users': stats.total_users || 0,
      'stat-messages': stats.total_messages || 0,
      'stat-scans': stats.pending_scans || 0,
      'stat-species': stats.total_species || 0
    };
    Object.keys(cards).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = cards[id];
    });
  }

  function refreshDashboardData() {
    if (socket && socket.connected) {
      socket.emit('request_stats_update');
    } else {
      // Fallback to localStorage
      var users = get('USERS'), msgs = get('MESSAGES'), scans = get('SCANS'), reqs = get('REQUESTS');
      updateDashboardStats({
        total_users: 1 + users.length,
        total_messages: msgs.filter(function(m){ return !m.read; }).length,
        pending_scans: scans.length,
        total_species: 0
      });
    }
  }

  // ============ NOTIFICATIONS ============
  function updateUnreadBadge() {
    var msgs = get('MESSAGES');
    var unread = msgs.filter(function(m){ return !m.read; }).length;
    var badge = document.getElementById('badge-messages');
    if (badge) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.style.display = unread > 0 ? 'inline-flex' : 'none';
    }
  }

  // ============ MESSAGES ============
  function loadMessages() {
    var container = document.getElementById('messages-container');
    if (!container) return;
    
    var msgs = get('MESSAGES');
    var tab = getActiveTab('messages');
    if (tab === 'unread') msgs = msgs.filter(function(m){ return !m.read; });
    else if (tab === 'replied') msgs = msgs.filter(function(m){ return m.replies && m.replies.length; });
    
    container.innerHTML = msgs.map(function(m, i) {
      return '<div class="portal-card" style="cursor:pointer;border-left:3px solid ' + (m.read ? 'rgba(255,255,255,0.1)' : 'var(--accent)') + '" onclick="window._openMsg(' + i + ')">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">' +
        '<div style="flex:1;min-width:0"><div class="portal-list-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m.name || 'Unknown') + ' <span style="font-weight:400;font-size:0.8rem;opacity:0.5"><' + esc(m.email) + '></span></div>' +
        '<div class="portal-list-meta"><span>' + fmtShort(m.createdAt) + '</span><span>' + esc(m.subject || 'No subject') + '</span></div></div>' +
        '<div style="text-align:right"><span style="font-size:0.75rem;opacity:0.4">' + fmt(m.createdAt).split(', ')[1] || '' + '</span></div></div>' +
        '<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.04);font-size:0.85rem;opacity:0.8;line-height:1.6">' + esc(m.body || m.content || '').substring(0, 250) + (m.body && m.body.length > 250 ? '...' : '') + '</div>' +
        (m.replies && m.replies.length ? '<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.04);font-size:0.8rem;opacity:0.6"><i class="fas fa-reply"></i> ' + m.replies.length + ' reply' + (m.replies.length > 1 ? 's' : '') + ' - Last: ' + fmt(m.replies[m.replies.length-1].time) + '</div>' : '') +
        '</div>';
    }).join('') + (msgs.length === 0 ? '<div class="portal-empty"><i class="fas fa-envelope-open"></i><p>No messages</p></div>' : '');
  }

  window._openMsg = function(idx) {
    var msgs = get('MESSAGES');
    var m = msgs[idx]; if (!m) return;
    var all = get('MESSAGES'); all[idx].read = true; set('MESSAGES', all);
    var html = '<div style="padding:2rem"><h3 style="margin:0 0 1rem;font-family:var(--font-heading)">' + esc(m.subject || 'Message') + '</h3>' +
      '<p style="opacity:0.6;margin-bottom:1rem">From: ' + esc(m.name) + ' <' + esc(m.email) + '><br>Date: ' + fmt(m.createdAt) + '</p>' +
      '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:1.5rem;line-height:1.7">' + esc(m.body || m.content || '').replace(/\n/g, '<br>') + '</div>' +
      (m.replies && m.replies.length ? '<div style="margin-top:1.5rem"><h4 style="font-size:0.9rem;margin:0 0 0.75rem;opacity:0.7">Replies</h4>' + m.replies.map(function(r){ return '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:8px;padding:1rem;margin-bottom:0.5rem"><div style="font-size:0.75rem;opacity:0.5;margin-bottom:0.25rem"><strong>' + esc(r.from) + '</strong> · ' + fmt(r.time) + '</div><div style="font-size:0.85rem;line-height:1.6">' + esc(r.body).replace(/\n/g, '<br>') + '</div></div>'; }).join('') + '</div>' : '') +
      '<div style="margin-top:1.5rem"><div class="portal-field"><label>Reply</label><textarea id="reply-body" rows="4" style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter);font-size:0.9rem"></textarea></div>' +
      '<button class="portal-btn portal-btn-primary" onclick="window._sendReply(' + idx + ')"><i class="fas fa-paper-plane"></i> Send Reply</button></div>';
    showModal(html);
  };

  window._sendReply = function(idx) {
    var body = document.getElementById('reply-body'); if (!body || !body.value.trim()) { notify('Please enter a reply', 'error'); return; }
    var msgs = get('MESSAGES');
    if (!msgs[idx].replies) msgs[idx].replies = [];
    msgs[idx].replies.push({ from: 'Admin', body: body.value.trim(), time: new Date().toISOString() });
    msgs[idx].read = true; set('MESSAGES', msgs);
    logAct('reply_sent', { to: msgs[idx].email });
    notify('Reply sent', 'success');
    document.querySelector('.portal-modal-overlay').classList.remove('open');
    loadMessages();
  };

  // ============ SCANS ============
  function loadScans() {
    var container = document.getElementById('scans-container');
    if (!container) return;
    
    var scans = get('SCANS');
    var tab = getActiveTab('scans');
    if (tab === 'approved') scans = get('APPROVED');
    
    container.innerHTML = (scans.length ? scans.map(function(s, i) {
      return '<div class="portal-card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">' +
        '<div style="display:flex;align-items:center;gap:1rem"><div style="width:60px;height:60px;background:linear-gradient(135deg,#1b5e40,#143d2a);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:1.5rem">🐾</div>' +
        '<div><div style="font-weight:600;font-size:1rem">' + esc(s.animalName || 'Unknown Animal') + '</div>' +
        '<div style="font-size:0.82rem;opacity:0.6">By: ' + esc(s.submittedBy || 'Unknown') + ' · ' + (s.confidence ? s.confidence + '% match' : '') + ' · ' + fmtShort(s.timestamp) + '</div></div></div>' +
        '<div class="portal-list-actions"><button class="portal-btn portal-btn-success portal-btn-sm" onclick="window._approveScan(' + i + ')"><i class="fas fa-check"></i> Approve</button><button class="portal-btn portal-btn-danger portal-btn-sm" onclick="window._rejectScan(' + i + ')"><i class="fas fa-xmark"></i> Reject</button></div></div>';
    }).join('') : '<div class="portal-empty"><i class="fas fa-image"></i><p>No pending scans</p></div>');
  }
  window._approveScan = function(idx) {
    var scans = get('SCANS'), approved = get('APPROVED');
    if (scans[idx]) { var s = scans.splice(idx, 1)[0]; s.approvedAt = new Date().toISOString(); approved.unshift(s); set('SCANS', scans); set('APPROVED', approved); logAct('scan_approved', { animal: s.animalName }); notify('Scan approved and added to library', 'success'); loadScans();
      if (s.user && typeof window.sendUserNotification === 'function') { window.sendUserNotification(s.user, { type: 'scan_approved', title: 'Scan Approved', message: 'Your scan of ' + (s.animalName || 'wildlife') + ' was approved and added to the library.' }); }
    }
  };
  window._rejectScan = function(idx) {
    var scans = get('SCANS');
    if (scans[idx]) { var s = scans.splice(idx, 1)[0]; set('SCANS', scans); logAct('scan_rejected', { animal: s.animalName }); notify('Scan rejected', 'success'); loadScans();
      if (s.user && typeof window.sendUserNotification === 'function') { window.sendUserNotification(s.user, { type: 'scan_rejected', title: 'Scan Rejected', message: 'Your scan of ' + (s.animalName || 'wildlife') + ' was not approved.' }); }
    }
  };

  // ============ USERS & ROLES ============
  function loadUsers() {
    var users = get('USERS'), reqs = get('REQUESTS');
    var pendingReqs = reqs.filter(function(r){ return r.status === 'pending'; });
    var container = document.getElementById('users-container');
    if (!container) return;
    
    container.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">' +
      '<h2>User Management</h2>' +
      '<button class="portal-btn portal-btn-secondary" onclick="refreshAllData()"><i class="fas fa-sync-alt"></i> Refresh</button>' +
    '</div>' +
    '<div class="portal-tabs">' +
      '<button class="portal-tab active" data-tab="all">All Users <span class="badge badge-primary">' + users.length + '</span></button>' +
      '<button class="portal-tab" data-tab="requests">Role Requests <span class="badge badge-warning">' + pendingReqs.length + '</span></button>' +
    '</div>' +
    '<div id="users-container-inner">' + renderUsersTable(users) + '</div>';
    
    // Tab switching
    document.querySelectorAll('#users-container .portal-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        document.querySelectorAll('#users-container .portal-tab').forEach(function(x){ x.classList.remove('active'); });
        this.classList.add('active');
        var inner = document.getElementById('users-container-inner');
        if (this.dataset.tab === 'requests') {
          inner.innerHTML = pendingReqs.map(function(r, i){ return reqRow(r, get('REQUESTS').indexOf(r)); }).join('');
        } else {
          inner.innerHTML = renderUsersTable(get('USERS'));
        }
      });
    });
  }

  function renderUsersTable(users) {
    return '<table class="portal-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Credits</th><th>Joined</th><th>Actions</th></tr></thead><tbody>' +
      users.map(function(u){ return '<tr><td><div style="display:flex;align-items:center;gap:0.75rem"><div class="user-avatar">' + (u.name ? u.name.charAt(0).toUpperCase() : '?') + '</div><span>' + esc(u.name || 'Unknown') + '</span></td><td>' + esc(u.email) + '</td><td><span class="role-badge role-' + (u.role || 'user') + '">' + esc(u.role || 'user') + '</span></td><td>' + (get('CREDITS')[u.email] || 0) + '</td><td>' + fmtShort(u.createdAt || u.date) + '</td><td><button class="portal-btn portal-btn-sm portal-btn-secondary" onclick="window._editUser(\'' + esc(u.email) + '\')"><i class="fas fa-edit"></i> Edit</button></td></tr>'; }).join('') +
    '</tbody></table>';
  }

  function reqRow(r, i) {
    return '<div class="portal-list-item"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">' +
      '<div><div style="font-weight:500">' + esc(r.userName || r.userEmail) + ' requests <span style="background:rgba(201,162,39,0.15);color:var(--accent);padding:1px 8px;border-radius:20px;font-size:0.7rem;font-weight:700">' + esc(r.requestedRole) + '</span></div>' +
      '<div style="font-size:0.78rem;opacity:0.5">Credits: ' + (r.credits || 0) + '</div></div>' +
      '<div style="display:flex;gap:0.5rem"><button class="portal-btn portal-btn-success portal-btn-sm" onclick="window._approveReq(' + i + ')"><i class="fas fa-check"></i> Approve</button><button class="portal-btn portal-btn-danger portal-btn-sm" onclick="window._rejectReq(' + i + ')"><i class="fas fa-xmark"></i> Reject</button></div></div></div>';
  }
  window._approveReq = function(idx) {
    var reqs = get('REQUESTS');
    if (reqs[idx] && reqs[idx].status === 'pending') { reqs[idx].status = 'approved'; reqs[idx].approvedAt = new Date().toISOString(); set('REQUESTS', reqs); 
      var users = get('USERS');
      var userIdx = users.findIndex(function(u){ return u.email === reqs[idx].userEmail; });
      if (userIdx !== -1) { users[userIdx].role = reqs[idx].requestedRole; set('USERS', users); }
      var credits = get('CREDITS');
      credits[reqs[idx].userEmail] = (credits[reqs[idx].userEmail] || 0) + (reqs[idx].credits || 10);
      set('CREDITS', credits);
      logAct('role_approved', { user: reqs[idx].userEmail, role: reqs[idx].requestedRole }); 
      notify('Role request approved', 'success'); loadUsers(); }
  };
  window._rejectReq = function(idx) {
    var reqs = get('REQUESTS');
    if (reqs[idx]) { reqs.splice(idx, 1); set('REQUESTS', reqs); notify('Role request rejected', 'success'); loadUsers(); }
  };
  window._editUser = function(email) { notify('User editing coming soon - ' + email, 'info'); };

  // ============ ADMINS ============
  function loadAdmins() {
    var admins = get('ADMINS');
    var isSuperUser = isSuper();
    return '<div><h2>Admin Management</h2>' +
      (isSuperUser ? '<div class="portal-card" style="margin-bottom:2rem"><h3 style="margin:0 0 1rem">Add New Admin</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:1rem;align-items:end">' +
        '<div class="portal-field"><label>Name</label><input type="text" id="new-admin-name" placeholder="Full name"></div>' +
        '<div class="portal-field"><label>Email</label><input type="email" id="new-admin-email" placeholder="admin@example.com"></div>' +
        '<div class="portal-field"><label>Role</label><select id="new-admin-role" style="width:100%"><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="super_admin">Super Admin</option></select></div>' +
        '<button class="portal-btn portal-btn-primary" onclick="window._addAdmin()"><i class="fas fa-plus"></i> Add</button></div></div>' : '') +
      '<div class="portal-card"><h3 style="margin:0 0 1rem">Approved Admins</h3>' +
      '<table class="portal-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Added</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
      get('ADMINS').map(function(a){ return '<tr><td>' + esc(a.name || 'Unknown') + '</td><td>' + esc(a.email) + '</td><td><span class="role-badge role-' + (a.role || 'admin') + '">' + esc(a.role || 'admin') + '</span></td><td>' + fmtShort(a.date) + '</td><td>' + (a.approved ? '<span style="color:#22c55e">● Active</span>' : '<span style="color:#f59e0b">○ Pending</span>') + '</td><td>' + (isSuperUser() && a.email !== currentUser()?.email ? '<button class="portal-btn portal-btn-sm portal-btn-danger" onclick="window._removeAdmin(\'' + esc(a.email) + '\')"><i class="fas fa-trash"></i> Remove</button>' : '') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }
  window._addAdmin = function() {
    var name = document.getElementById('new-admin-name')?.value.trim();
    var email = document.getElementById('new-admin-email')?.value.trim();
    var role = document.getElementById('new-admin-role')?.value;
    if (!name || !email) { notify('Please fill in all fields', 'error'); return; }
    var admins = get('ADMINS');
    if (admins.some(function(a){ return a.email === email; })) { notify('Admin already exists', 'error'); return; }
    admins.push({ name: name, email: email, role: role, approved: true, date: new Date().toISOString() });
    set('ADMINS', admins); logAct('admin_added', { email: email, role: role }); notify('Admin added successfully', 'success'); show('admins');
  };
  window._removeAdmin = function(email) {
    if (!confirm('Remove admin ' + email + '?')) return;
    var admins = get('ADMINS');
    admins = admins.filter(function(a){ return a.email !== email; });
    set('ADMINS', admins); logAct('admin_removed', { email: email }); notify('Admin removed', 'success'); show('admins');
  };

  // ============ ACTIVITY LOG ============
  function loadLogs() {
    var logs = get('LOG');
    return '<div><h2>Activity Log</h2>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">' +
      '<h2 style="margin:0">Activity Log</h2>' +
      '<button class="portal-btn portal-btn-danger" onclick="clearActivityLog()"><i class="fas fa-trash"></i> Clear Log</button>' +
      '</div>' +
      '<div class="portal-card">' +
      (get('LOG').length ? '<table class="portal-table"><thead><tr><th>Time</th><th>Action</th><th>Details</th><th>Admin</th></tr></thead><tbody>' +
      get('LOG').map(function(l){ return '<tr><td>' + fmt(l.time) + '</td><td><strong>' + esc(l.action) + '</strong></td><td>' + esc(l.detail ? (typeof l.detail === 'object' ? JSON.stringify(l.detail) : l.detail) : '') + '</td><td>' + esc(l.admin || 'System') + '</td></tr>'; }).join('') +
      '</tbody></table>' : '<p class="portal-empty">No activity logged</p>') + '</div></div>';
  }
  function clearActivityLog() { if (confirm('Clear all activity logs?')) { set('LOG', []); notify('Activity log cleared', 'success'); show('logs'); } }

  // ============ SETTINGS ============
  function loadSettings() {
    return '<div><h2>Settings</h2>' +
      '<div class="portal-grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));">' +
        '<div class="portal-card"><h3 style="margin:0 0 1.5rem"><i class="fas fa-envelope" style="color:var(--accent)"></i> Email Configuration</h3>' +
        '<div class="portal-field"><label>Gmail SMTP Host</label><input type="text" value="smtp.gmail.com" readonly></div>' +
        '<div class="portal-field"><label>Gmail SMTP Port</label><input type="number" value="587" readonly></div>' +
        '<div class="portal-field"><label>Sender Email</label><input type="email" id="smtp-email" placeholder="your@gmail.com" value="wildguardsociety@gmail.com"></div>' +
        '<div class="portal-field"><label>App Password</label><input type="password" id="smtp-password" placeholder="Gmail App Password"></div>' +
        '<div class="portal-field"><small>Configure in Gmail: Security > 2-Step Verification > App Passwords</small></div>' +
        '<button class="portal-btn portal-btn-primary" style="margin-top:1rem" onclick="testEmailConfig()"><i class="fas fa-paper-plane"></i> Test Email</button></div>' +
        '<div class="portal-card"><h3 style="margin:0 0 1.5rem"><i class="fas fa-database" style="color:var(--accent)"></i> Data Management</h3>' +
        '<div class="portal-field"><label>Auto-refresh Interval</label><select id="refresh-interval"><option value="15000">15 seconds</option><option value="30000" selected>30 seconds</option><option value="60000">1 minute</option><option value="300000">5 minutes</option></select></div>' +
        '<button class="portal-btn portal-btn-danger" style="margin-top:1rem" onclick="clearAllData()"><i class="fas fa-trash"></i> Clear All Local Data</button></div>' +
      '</div></div>';
  }
  window.testEmailConfig = function() { notify('Email test sent to configured address', 'info'); };
  window.clearAllData = function() { if (confirm('Clear ALL local data? This cannot be undone.')) { Object.keys(localStorage).filter(function(k){ return k.startsWith('wg_') || k.startsWith('wildguard_') || k.startsWith('wildlife_'); }).forEach(function(key){ localStorage.removeItem(key); }); notify('All local data cleared', 'success'); setTimeout(function(){ location.reload(); }, 1000); } };

  // ============ MODAL HELPER ============
  function showModal(html) {
    var overlay = document.getElementById('portal-modal-overlay');
    if (!overlay) { overlay = document.createElement('div'); overlay.id = 'portal-modal-overlay'; overlay.className = 'portal-modal-overlay'; overlay.innerHTML = '<div class="portal-modal" id="portal-modal-inner"></div>'; document.body.appendChild(overlay); }
    var inner = overlay.querySelector('.portal-modal');
    inner.innerHTML = html;
    overlay.classList.add('open');
    overlay.onclick = function(e) { if (e.target === overlay) overlay.classList.remove('open'); };
  }

  // ============ NOTIFY HELPER ============
  function notify(msg, type) {
    showNotification(msg, type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info');
  }

  // ============ MAIN NAV & SECTIONS ============
  var sections = {};
  function reg(id, fn) { sections[id] = fn; }
  function show(id) {
    var el = document.getElementById('portal-content');
    if (!el || !sections[id]) return;
    el.innerHTML = '<div class="portal-loading"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:0.5rem"></i><p>Loading...</p></div>';
    setTimeout(function(){ 
      try { el.innerHTML = sections[id](); attach(id); } 
      catch(e) { console.error('Section render error:', e); el.innerHTML = '<div class="portal-empty"><i class="fas fa-exclamation-triangle"></i><p>Error loading section</p></div>'; }
    }, 50);
    document.querySelectorAll('.portal-nav-item').forEach(function(n){ n.classList.toggle('active', n.dataset.section === id); });
    window.location.hash = id;
  }
  function attach(id) {}

  // ============ NOTIFICATIONS ============
  function notify(msg, type) {
    showNotification(msg, type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info');
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
    
    // Start SocketIO
    initSocket();
    
    // Initial data load
    refreshAllData();
    
    // Start auto-refresh
    setInterval(function() {
      if (document.visibilityState === 'visible') refreshAllData();
    }, REFRESH_INTERVAL);
  });

  // ============ EXPORTS ============
  window.portalNotify = notify;
  window.portalShow = show;
  window.portalRefresh = refreshAllData;
  window.loadMessages = loadMessages;
  window.loadScans = loadScans;
  window.loadUsers = loadUsers;
  window.loadAdmins = loadAdmins;
  window.loadLogs = loadLogs;
  window.loadSettings = loadSettings;
  window.showModal = showModal;
  window.notify = notify;
  window.logAct = logAct;

  // Helper functions
  function getActiveTab(section) {
    var tab = document.querySelector('#' + section + '-container .portal-tab.active') || 
              document.querySelector('.portal-tabs .portal-tab.active');
    return tab ? tab.dataset.tab : 'all';
  }

  function refreshAllData() {
    if (socket && socket.connected) {
      socket.emit('request_stats_update');
    }
    var currentSection = window.location.hash.replace('#', '') || 'dashboard';
    if (sections[currentSection]) {
      var el = document.getElementById('portal-content');
      if (el) {
        el.innerHTML = '<div class="portal-loading"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:0.5rem"></i><p>Refreshing...</p></div>';
        setTimeout(function(){ 
          try { el.innerHTML = sections[currentSection](); attach(currentSection); } 
          catch(e) { console.error('Section render error:', e); }
        }, 50);
      }
    }
    updateUnreadBadge();
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(iso) {
    try { return new Date(iso).toLocaleString(); } catch(e) { return iso; }
  }

  function formatShort(iso) {
    try { return new Date(iso).toLocaleDateString(); } catch(e) { return iso; }
  }

})();