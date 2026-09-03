/**
 * WildGuard Society - Admin Portal (Core Control Center)
 * Wired to the real wildguard_* / wildlife_* localStorage stores.
 * Sections: Dashboard, Messages, Compose, Scan Review, Users & Roles,
 * Admins, Rewards (Certificates), Tokens, Species Database, Activity Log, Settings.
 */
(function() {
  'use strict';

  // ============ CONFIGURATION ============
  var REFRESH_INTERVAL = 30000; // 30 seconds
  var socket = null;
  var isConnected = false;
  var currentSection = 'dashboard';

  // ============ REAL DATA STORE KEYS ============
  var K = {
    USERS: 'wildguard_demo_users',
    USER_LIST: 'wildguard_user_list',
    MESSAGES: 'wildguard_admin_messages',
    SCANS: 'wildlife_pending_admin',
    APPROVED: 'wildlife_scans',
    CERTS: 'wildguard_certificates',
    TOKENS: 'wildguard_token_ledger',
    LOG: 'wildguard_activity_log',
    EMAILS: 'wildguard_emails',
    ADMIN_NOTIFS: 'wildguard_admin_notifications'
  };

  function read(key, def) { try { var d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch (e) { return def; } }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function esc(str) { var d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
  function safeImgSrc(src) { src = String(src == null ? '' : src); return (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(src) || /^https:\/\//i.test(src) || /^(?:assets|images)\//.test(src)) ? src : ''; }
  function fmt(d) { try { return new Date(d).toLocaleString(); } catch (e) { return d; } }
  function fmtShort(d) { try { return new Date(d).toLocaleDateString(); } catch (e) { return d; } }

  function currentUser() { try { return JSON.parse(localStorage.getItem('wildguard_user') || 'null'); } catch (e) { return null; } }
  function isSuper() { var u = currentUser(); return u && (u.role === 'super_admin' || u.email === 'info@wildguardsociety.org'); }

  // --- Users (object keyed by email) ---
  function getUsersObj() { return read(K.USERS, {}); }
  function getUsers() {
    var obj = getUsersObj();
    return Object.keys(obj).map(function(email) {
      var u = obj[email];
      return {
        email: email,
        name: u.name || u.username || email.split('@')[0],
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        username: u.username || '',
        role: u.role || 'user',
        country: u.country || '',
        registeredAt: u.registeredAt || u.date || ''
      };
    });
  }
  function saveUserRecord(user) {
    var obj = getUsersObj();
    obj[user.email] = Object.assign({}, obj[user.email] || {}, user);
    write(K.USERS, obj);
  }

  // --- Tokens ledger ---
  function getLedger() { return read(K.TOKENS, []); }
  function tokenBalance(email) {
    return getLedger().filter(function(t) { return t.user === email; })
      .reduce(function(sum, t) { return sum + (t.amount || 0); }, 0);
  }

  // --- Certificates ---
  function getCerts() { return read(K.CERTS, []); }

  // --- Activity log (auth.js shape) ---
  function logAct(action, detail, adminEmail) {
    try {
      var log = read(K.LOG, []);
      log.unshift({
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        event: action,
        user: adminEmail || (currentUser() && currentUser().email) || 'admin',
        details: typeof detail === 'object' ? JSON.stringify(detail) : (detail || '')
      });
      if (log.length > 500) log.pop();
      write(K.LOG, log);
    } catch (e) {}
  }

  // ============ TOASTS / NOTIFICATIONS ============
  function notify(msg, type) {
    var c = document.getElementById('portal-toasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'portal-toasts';
      c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:100000;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(c);
    }
    var t = document.createElement('div');
    t.className = 'portal-toast ' + (type || 'info');
    var ic = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    var co = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#F4A261';
    t.style.cssText = 'background:rgba(10,21,16,0.98);border:1px solid rgba(244, 162, 97,0.3);color:#fff;padding:14px 20px;border-radius:10px;font-size:0.9rem;display:flex;align-items:center;gap:10px;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
    t.innerHTML = '<i class="fas ' + ic + '" style="color:' + co + '"></i><div class="portal-toast-content"><div class="portal-toast-title">' + esc(titleFor(msg)) + '</div><div class="portal-toast-message">' + esc(msg) + '</div></div>';
    c.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 5000);
  }
  function titleFor(msg) { return 'Admin Portal'; }

  // ============ SOCKET.IO (graceful fallback) ============
  function initSocket() {
    if (typeof io === 'undefined') { console.warn('SocketIO not loaded, using polling'); return; }
    socket = io({ transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 3000 });
    socket.on('connect', function() {
      isConnected = true;
      updateConnectionStatus(true);
      socket.emit('join_admin_room');
      var u = currentUser();
      if (u && u.email) socket.emit('join_user_room', { email: u.email });
    });
    socket.on('disconnect', function() { isConnected = false; updateConnectionStatus(false); });
    socket.on('new_message', function() { loadMessages(); updateUnreadBadge(); });
    socket.on('scan_pending', function() { loadScans(); updateScansBadge(); });
    socket.on('notification', function(data) { if (data && data.title) notify(data.title, data.type || 'info'); });
  }

  function updateConnectionStatus(connected) {
    var el = document.getElementById('realtime-status');
    if (!el) return;
    // Combine device connectivity (navigator.onLine) with socket status
    var deviceOnline = (typeof navigator !== 'undefined') ? navigator.onLine : true;
    var isLive = connected && deviceOnline;
    el.className = 'realtime-indicator ' + (isLive ? 'connected' : 'disconnected');
    el.innerHTML = '<span class="dot"></span>' + (isLive ? 'Live' : (deviceOnline ? 'Reconnecting' : 'Offline'));
    el.title = isLive ? 'Connected to the live network' : (deviceOnline ? 'Socket reconnecting...' : 'You are offline - changes will sync when back online');
  }

  // React to device going online/offline (browser-level, not just socket)
  function initConnectivity() {
    window.addEventListener('online', function() {
      updateConnectionStatus(isConnected);
      refreshAllData();
      notify('Back online - data refreshed', 'success');
    });
    window.addEventListener('offline', function() {
      updateConnectionStatus(isConnected);
      notify('You are offline - changes will sync when you reconnect', 'warning');
    });
    if (typeof window.Connectivity !== 'undefined' && typeof window.Connectivity.onStatusChange === 'function') {
      window.Connectivity.onStatusChange(function(state) {
        updateConnectionStatus(isConnected);
      });
    }
  }

  // ============ SECTION REGISTRY ============
  var sections = {};
  function reg(id, fn) { sections[id] = fn; }
  function show(id) {
    var el = document.getElementById('portal-content');
    if (!el || !sections[id]) { currentSection = id; return; }
    currentSection = id;
    el.innerHTML = '<div class="portal-loading"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem;margin-bottom:0.5rem"></i><p>Loading...</p></div>';
    setTimeout(function() {
      try {
        el.innerHTML = sections[id]();
        attach(id);
      } catch (e) {
        console.error('Section render error:', e);
        el.innerHTML = '<div class="portal-empty"><i class="fas fa-exclamation-triangle"></i><p>Error loading section</p></div>';
      }
    }, 50);
    document.querySelectorAll('.portal-nav-item').forEach(function(n) { n.classList.toggle('active', n.dataset.section === id); });
    try { window.location.hash = id; } catch (e) {}
  }
  function attach(id) {
    if (id === 'messages') { initMessagesTabs(); renderMessagesList(); }
    if (id === 'scans') { initScansTabs(); renderScansList(); }
    if (id === 'users') initUsersTabs();
    if (id === 'database') initDatabase();
  }

  // ============ BADGES ============
  function updateUnreadBadge() {
    var msgs = read(K.MESSAGES, []);
    var unread = msgs.filter(function(m) { return m.status === 'unread' || !m.read; }).length;
    var badge = document.getElementById('badge-messages');
    if (badge) { badge.textContent = unread > 99 ? '99+' : unread; badge.style.display = unread > 0 ? 'inline-flex' : 'none'; }
  }
  function updateScansBadge() {
    var pending = read(K.SCANS, []);
    var badge = document.getElementById('badge-scans');
    if (badge) { badge.textContent = pending.length > 99 ? '99+' : pending.length; badge.style.display = pending.length > 0 ? 'inline-flex' : 'none'; }
  }
  function updateUsersBadge() {
    var users = getUsers();
    var badge = document.getElementById('badge-users');
    if (badge) { badge.textContent = users.length > 99 ? '99+' : users.length; badge.style.display = 'inline-flex'; }
  }

  // ============ HEADER NOTIFICATION BELL ============
  function getNotifs() {
    return read(K.ADMIN_NOTIFS, []).map(function(n) {
      n._typeLabel = n.type === 'new_user' ? 'New User' : n.type === 'contact_message' ? 'Message' : n.type === 'scan_pending' ? 'Scan' : n.type === 'certificate' ? 'Certificate' : n.type === 'token' ? 'Tokens' : n.type === 'system' ? 'System' : 'Update';
      return n;
    });
  }
  function updateNotificationBadge() {
    var unread = getNotifs().filter(function(n) { return !n.read; }).length;
    var badge = document.getElementById('notification-badge');
    if (badge) { badge.textContent = unread > 99 ? '99+' : unread; badge.style.display = unread > 0 ? 'inline-flex' : 'none'; }
  }
  function renderNotifications() {
    var list = document.getElementById('notification-list');
    if (!list) return;
    var notifs = getNotifs();
    if (!notifs.length) {
      list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash"></i>No notifications yet</div>';
      updateNotificationBadge();
      return;
    }
    list.innerHTML = notifs.slice(0, 20).map(function(n) {
      return '<div class="notification-item' + (n.read ? '' : ' unread') + '" onclick="window._markNotifRead(\'' + esc(n.id) + '\')">' +
        '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:600;font-size:0.85rem;display:flex;align-items:center;gap:0.5rem"><span class="portal-badge" style="background:rgba(244, 162, 97,0.12);color:var(--accent);padding:2px 8px">' + esc(n._typeLabel) + '</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.title || 'Notification') + '</span></div>' +
        (n.message ? '<div style="font-size:0.78rem;opacity:0.65;margin-top:0.25rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.message) + '</div>' : '') +
        '<div style="font-size:0.7rem;opacity:0.4;margin-top:0.3rem">' + fmt(n.timestamp) + '</div>' +
        '</div></div>';
    }).join('');
    updateNotificationBadge();
  }
  window._markNotifRead = function(id) {
    var notifs = read(K.ADMIN_NOTIFS, []);
    var changed = false;
    notifs.forEach(function(n) { if (n.id === id && !n.read) { n.read = true; changed = true; } });
    if (changed) { write(K.ADMIN_NOTIFS, notifs); renderNotifications(); }
  };
  function markAllNotifsRead() {
    var notifs = read(K.ADMIN_NOTIFS, []);
    var any = false;
    notifs.forEach(function(n) { if (!n.read) { n.read = true; any = true; } });
    if (any) write(K.ADMIN_NOTIFS, notifs);
    renderNotifications();
    notify('All notifications marked as read', 'success');
  }
  function toggleNotificationDropdown() {
    var dd = document.getElementById('notification-dropdown');
    if (!dd) return;
    var isOpen = dd.classList.contains('open');
    document.querySelectorAll('.notification-dropdown').forEach(function(x) { x.classList.remove('open'); });
    if (!isOpen) { renderNotifications(); dd.classList.add('open'); }
  }
  function initNotificationBell() {
    var bell = document.getElementById('notification-bell');
    var markAll = document.getElementById('mark-all-read');
    var viewAll = document.getElementById('view-all-notifications');
    if (bell) bell.addEventListener('click', function(e) { e.stopPropagation(); toggleNotificationDropdown(); });
    if (markAll) markAll.addEventListener('click', function(e) { e.stopPropagation(); markAllNotifsRead(); });
    if (viewAll) viewAll.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); toggleNotificationDropdown(); show('logs'); });
    document.addEventListener('click', function(e) {
      if (e.target.closest && !e.target.closest('#notification-dropdown') && !e.target.closest('#notification-bell')) {
        document.querySelectorAll('.notification-dropdown').forEach(function(x) { x.classList.remove('open'); });
      }
    });
    updateNotificationBadge();
  }

  // ============ DASHBOARD ============
  reg('dashboard', function() {
    var users = getUsers();
    var msgs = read(K.MESSAGES, []);
    var pending = read(K.SCANS, []);
    var approved = read(K.APPROVED, []);
    var certs = getCerts();
    var ledger = getLedger();
    var tokensTotal = ledger.reduce(function(s, t) { return s + (t.amount || 0); }, 0);
    var speciesCount = (window.WildGuardSpeciesDB && window.WildGuardSpeciesDB.isReady()) ? window.WildGuardSpeciesDB.count() : 55;
    var unreadMsgs = msgs.filter(function(m) { return m.status === 'unread' || !m.read; }).length;

    var recentLogs = read(K.LOG, []).slice(0, 6);
    var emails = read(K.EMAILS, []);
    var recentUsers = getUsers().sort(function(a, b) { return (b.registeredAt || '').localeCompare(a.registeredAt || ''); }).slice(0, 4);
    var recentMsgs = msgs.slice().sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); }).slice(0, 4);
    var approvedCount = approved.length;
    var adminRole = currentUser() && (currentUser().role || 'admin');

    return '<div><h2 style="font-family:var(--font-heading);margin-bottom:0.25rem"><i class="fas fa-tachometer-alt"></i> Control Center</h2>' +
      '<p style="opacity:0.6;margin-bottom:2rem">Full command over WildGuard Society — live data from the public website, all in one place. Signed in as <strong style="color:var(--accent)">' + esc((currentUser() && currentUser().name) || '') + '</strong> (' + esc(adminRole) + ').</p>' +
      '<div class="portal-stats">' +
      statCard('fa-users', users.length, 'Registered Users', 'up') +
      statCard('fa-image', pending.length, 'Pending Scans', pending.length ? 'up' : '') +
      statCard('fa-check-circle', approvedCount, 'Approved Scans', approvedCount ? 'up' : '') +
      statCard('fa-envelope', unreadMsgs, 'Unread Messages', unreadMsgs ? 'up' : '') +
      statCard('fa-envelope-open-text', emails.length, 'Emails Sent', emails.length ? 'up' : '') +
      statCard('fa-paw', speciesCount, 'Species in Database', 'up') +
      statCard('fa-award', certs.length, 'Certificates Issued', certs.length ? 'up' : '') +
      statCard('fa-coins', tokensTotal, 'Tokens Distributed', tokensTotal ? 'up' : '') +
      '</div>' +
      '<div class="portal-grid">' +
        '<div class="portal-card"><div class="portal-card-header"><h3><i class="fas fa-globe"></i> Live Site Snapshot</h3><span style="font-size:0.7rem;opacity:0.5">Reflects the public website right now</span></div>' +
          '<div style="font-size:0.8rem;font-weight:600;margin:0.75rem 0 0.4rem;opacity:0.6"><i class="fas fa-user-plus"></i> Latest registrations</div>' +
          (recentUsers.length ? recentUsers.map(function(u) {
            return '<div class="portal-list-item"><div style="display:flex;justify-content:space-between;align-items:center;gap:1rem"><span>' + esc(u.name) + ' <span style="opacity:0.45;font-size:0.75rem">' + esc(u.email) + '</span></span><span class="portal-badge" style="background:rgba(255,255,255,0.08);color:var(--accent);text-transform:uppercase;font-size:0.62rem">' + esc(u.role) + '</span></div>' +
              '<div style="font-size:0.72rem;opacity:0.45;margin-top:0.2rem">Joined ' + fmt(u.registeredAt) + '</div></div>';
          }).join('') : '<div class="portal-empty"><i class="fas fa-user-plus"></i><p>No users registered yet</p></div>') +
          '<div style="font-size:0.8rem;font-weight:600;margin:1rem 0 0.4rem;opacity:0.6"><i class="fas fa-envelope"></i> Latest contact messages</div>' +
          (recentMsgs.length ? recentMsgs.map(function(m) {
            return '<div class="portal-list-item"><div style="font-size:0.85rem;font-weight:600">' + esc(m.subject || 'No subject') + '</div>' +
              '<div style="font-size:0.75rem;opacity:0.5;margin-top:0.15rem">' + esc(m.name || '') + ' <' + esc(m.email) + '> · ' + fmt(m.createdAt) + '</div></div>';
          }).join('') : '<div class="portal-empty"><i class="fas fa-envelope"></i><p>No contact messages yet</p></div>') +
        '</div>' +
        '<div class="portal-card"><div class="portal-card-header"><h3><i class="fas fa-clock-rotate-left"></i> Recent Activity</h3><button class="portal-btn portal-btn-sm portal-btn-secondary" onclick="window.portalShow(\'logs\')">View all</button></div>' +
        (recentLogs.length ? recentLogs.map(function(l) {
          return '<div class="portal-list-item"><div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap"><span style="font-weight:600">' + esc(l.event || 'activity') + '</span><span style="font-size:0.75rem;opacity:0.5">' + fmt(l.timestamp) + '</span></div>' +
            '<div style="font-size:0.8rem;opacity:0.6;margin-top:0.25rem">' + esc(typeof l.details === 'string' ? l.details : (l.details ? JSON.stringify(l.details) : '')) + ' · ' + esc(l.user || 'system') + '</div></div>';
        }).join('') : '<div class="portal-empty"><i class="fas fa-clock"></i><p>No activity yet</p></div>') +
        '</div>' +
      '</div>' +
      '<div class="portal-card" style="margin-top:1rem"><div class="portal-card-header"><h3><i class="fas fa-circle-exclamation"></i> Needs Attention</h3><button class="portal-btn portal-btn-sm portal-btn-secondary" onclick="window.portalShow(\'scans\')">Review all</button></div>' +
        (pending.length ? pending.map(function(s) {
          var sp = s.species || {};
          return '<div class="portal-list-item"><div style="display:flex;justify-content:space-between;align-items:center;gap:1rem"><span>' + esc(sp.name || s.animalName || 'Unknown species') + '</span><button class="portal-btn portal-btn-sm portal-btn-success" onclick="window._approveScanById(\'' + esc(s.id) + '\')"><i class="fas fa-check"></i> Approve</button></div></div>';
        }).join('') : '<div class="portal-empty"><i class="fas fa-check-double"></i><p>All caught up — no pending scans</p></div>') +
      '</div></div>';
  });

  function statCard(icon, value, label, trend) {
    return '<div class="portal-stat-card"><div class="portal-stat-icon"><i class="fas ' + icon + '"></i></div>' +
      '<div class="portal-stat-value">' + value + '</div><div class="portal-stat-label">' + esc(label) + '</div>' +
      (trend ? '<div class="portal-stat-trend ' + trend + '"><i class="fas ' + (trend === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down') + '"></i></div>' : '') + '</div>';
  }

  // ============ MESSAGES ============
  function getMessagesByTab() {
    var msgs = read(K.MESSAGES, []);
    var tab = (document.querySelector('#messages-container .portal-tab.active') || {}).dataset ? document.querySelector('#messages-container .portal-tab.active').dataset.tab : 'all';
    if (tab === 'unread') return msgs.filter(function(m) { return m.status === 'unread' || !m.read; });
    if (tab === 'replied') return msgs.filter(function(m) { return m.replies && m.replies.length; });
    return msgs;
  }
  function initMessagesTabs() {
    document.querySelectorAll('#messages-container .portal-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        document.querySelectorAll('#messages-container .portal-tab').forEach(function(x) { x.classList.remove('active'); });
        this.classList.add('active');
        renderMessagesList();
      });
    });
  }
  function renderMessagesList() {
    var container = document.getElementById('messages-container-inner');
    if (!container) return;
    var msgs = getMessagesByTab();
    container.innerHTML = (msgs.length ? msgs.map(function(m, i) {
      var unread = m.status === 'unread' || !m.read;
      return '<div class="portal-card" style="cursor:pointer;border-left:3px solid ' + (unread ? 'var(--accent)' : 'rgba(255,255,255,0.1)') + '" onclick="window._openMsg(' + i + ')">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">' +
        '<div style="flex:1;min-width:0"><div style="font-weight:600">' + esc(m.name || 'Unknown') + ' <span style="font-weight:400;font-size:0.8rem;opacity:0.5"><' + esc(m.email) + '></span></div>' +
        '<div style="font-size:0.82rem;opacity:0.6;margin-top:0.2rem"><span>' + fmtShort(m.createdAt) + '</span> · ' + esc(m.subject || 'No subject') + '</div></div>' +
        (unread ? '<span class="portal-badge" style="background:var(--accent);color:var(--dark)">New</span>' : '') + '</div>' +
        '<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.04);font-size:0.85rem;opacity:0.8;line-height:1.6">' + esc((m.body || m.content || '')).substring(0, 220) + ((m.body || '').length > 220 ? '...' : '') + '</div>' +
        (m.replies && m.replies.length ? '<div style="margin-top:0.6rem;font-size:0.78rem;opacity:0.5"><i class="fas fa-reply"></i> ' + m.replies.length + ' reply' + (m.replies.length > 1 ? 's' : '') + '</div>' : '') +
        '</div>';
    }).join('') : '<div class="portal-empty"><i class="fas fa-envelope-open"></i><p>No messages</p></div>');
  }
  reg('messages', function() {
    var msgs = read(K.MESSAGES, []);
    var unread = msgs.filter(function(m) { return m.status === 'unread' || !m.read; }).length;
    var replied = msgs.filter(function(m) { return m.replies && m.replies.length; }).length;
    return '<div id="messages-container"><h2 style="font-family:var(--font-heading)"><i class="fas fa-envelope"></i> Messages</h2>' +
      '<div class="portal-tabs">' +
        '<button class="portal-tab active" data-tab="all">All <span class="badge badge-primary">' + msgs.length + '</span></button>' +
        '<button class="portal-tab" data-tab="unread">Unread <span class="badge badge-warning">' + unread + '</span></button>' +
        '<button class="portal-tab" data-tab="replied">Replied <span class="badge badge-success">' + replied + '</span></button>' +
      '</div>' +
      '<div id="messages-container-inner"></div></div>';
  });

  window._openMsg = function(idx) {
    var msgs = read(K.MESSAGES, []);
    var m = msgs[idx]; if (!m) return;
    msgs[idx].status = 'read'; msgs[idx].read = true; write(K.MESSAGES, msgs);
    var html = '<div style="padding:2rem"><h3 style="margin:0 0 1rem;font-family:var(--font-heading)">' + esc(m.subject || 'Message') + '</h3>' +
      '<p style="opacity:0.6;margin-bottom:1rem">From: ' + esc(m.name) + ' <' + esc(m.email) + '><br>Date: ' + fmt(m.createdAt) + '</p>' +
      '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:1.5rem;line-height:1.7;white-space:pre-wrap">' + esc(m.body || m.content || '') + '</div>' +
      (m.replies && m.replies.length ? '<div style="margin-top:1.5rem"><h4 style="font-size:0.9rem;margin:0 0 0.75rem;opacity:0.7">Replies</h4>' + m.replies.map(function(r) { return '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:8px;padding:1rem;margin-bottom:0.5rem"><div style="font-size:0.75rem;opacity:0.5;margin-bottom:0.25rem"><strong>' + esc(r.from) + '</strong> · ' + fmt(r.time) + '</div><div style="font-size:0.85rem;line-height:1.6">' + esc(r.body) + '</div></div>'; }).join('') + '</div>' : '') +
      '<div style="margin-top:1.5rem"><div class="portal-field"><label>Reply</label><textarea id="reply-body" rows="4" style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter);font-size:0.9rem"></textarea></div>' +
      '<button class="portal-btn portal-btn-primary" onclick="window._sendReply(' + idx + ')"><i class="fas fa-paper-plane"></i> Send Reply</button></div></div>';
    showModal(html);
  };
  window._sendReply = function(idx) {
    var body = document.getElementById('reply-body'); if (!body || !body.value.trim()) { notify('Please enter a reply', 'error'); return; }
    var msgs = read(K.MESSAGES, []);
    if (!msgs[idx]) return;
    if (!msgs[idx].replies) msgs[idx].replies = [];
    msgs[idx].replies.push({ from: 'Admin', body: body.value.trim(), time: new Date().toISOString() });
    msgs[idx].read = true; msgs[idx].status = 'read';
    write(K.MESSAGES, msgs);
    logAct('reply_sent', 'Replied to ' + msgs[idx].email);
    // Deliver the reply as an email + notification so the user actually sees it
    var deviceOnline = (typeof navigator !== 'undefined') ? navigator.onLine : true;
    if (!deviceOnline && window.Connectivity) {
      window.Connectivity.registerHandler('contact_reply', function(payload) {
        if (typeof window.sendEmail === 'function') {
          try { window.sendEmail(payload.email, 'Re: ' + payload.subject, 'Dear ' + (payload.name || 'friend') + ',\n\n' + payload.reply + '\n\nBest regards,\nThe WildGuard Team', 'contact_reply'); } catch (e) {}
        }
        if (typeof window.sendUserNotification === 'function') {
          try { window.sendUserNotification(payload.email, { type: 'message', title: 'We replied to your message', message: 'The WildGuard team replied to your message: "' + payload.reply.slice(0, 120) + '"', from: 'info@wildguard.org' }); } catch (e) {}
        }
      });
      window.Connectivity.queueOfflineAction({ type: 'contact_reply', payload: { email: msgs[idx].email, name: msgs[idx].name, subject: (msgs[idx].subject || 'Your message'), reply: body.value.trim() } });
      notify('Offline - reply queued. It will be delivered when back online.', 'warning');
    } else {
      try {
        if (typeof window.sendEmail === 'function') {
          window.sendEmail(msgs[idx].email, 'Re: ' + (msgs[idx].subject || 'Your message'), 'Dear ' + (msgs[idx].name || 'friend') + ',\n\n' + body.value.trim() + '\n\nBest regards,\nThe WildGuard Team', 'contact_reply');
        }
      } catch (e) {}
      try {
        if (typeof window.sendUserNotification === 'function') {
          window.sendUserNotification(msgs[idx].email, { type: 'message', title: 'We replied to your message', message: 'The WildGuard team replied to your message: "' + body.value.trim().slice(0, 120) + '"', from: 'info@wildguard.org' });
        }
      } catch (e) {}
    }
    notify('Reply sent', 'success');
    var overlay = document.querySelector('.portal-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    renderMessagesList();
    updateUnreadBadge();
  };

  // ============ COMPOSE ============
  reg('compose', function() {
    var users = getUsers();
    return '<div><h2 style="font-family:var(--font-heading)"><i class="fas fa-pen"></i> Compose Broadcast</h2>' +
      '<div class="portal-card" style="max-width:760px"><div class="portal-field"><label>Recipients</label>' +
      '<select id="compose-to" style="width:100%"><option value="all">All registered users (' + users.length + ')</option><option value="admins">Admins & Moderators</option></select></div>' +
      '<div class="portal-field"><label>Subject</label><input type="text" id="compose-subject" placeholder="Announcement subject" style="width:100%"></div>' +
      '<div class="portal-field"><label>Message</label><textarea id="compose-body" rows="6" placeholder="Write your broadcast message..." style="width:100%"></textarea></div>' +
      '<div class="portal-field"><label>Type</label><select id="compose-type" style="width:100%"><option value="general">General</option><option value="news">Newsletter</option><option value="alert">Alert</option><option value="reward">Reward notice</option></select></div>' +
      '<button class="portal-btn portal-btn-primary" onclick="window._sendBroadcast()"><i class="fas fa-paper-plane"></i> Send Broadcast</button></div></div>';
  });
  window._sendBroadcast = function() {
    var subject = document.getElementById('compose-subject'); var body = document.getElementById('compose-body');
    if (!subject || !subject.value.trim() || !body || !body.value.trim()) { notify('Subject and message are required', 'error'); return; }
    var to = document.getElementById('compose-to').value;
    var type = document.getElementById('compose-type').value;
    var recipients = [];
    if (to === 'admins') {
      recipients = getUsers().filter(function(u) { return u.role === 'admin' || u.role === 'super_admin' || u.role === 'moderator'; }).map(function(u) { return u.email; });
    } else {
      recipients = getUsers().map(function(u) { return u.email; });
    }
    var count = 0;
    // Offline support: queue the broadcast so it delivers when back online
    var deviceOnline = (typeof navigator !== 'undefined') ? navigator.onLine : true;
    if (!deviceOnline && window.Connectivity) {
      window.Connectivity.registerHandler('broadcast', function(payload) {
        (payload.recipients || []).forEach(function(email) {
          if (typeof window.sendUserNotification === 'function') {
            try { window.sendUserNotification(email, { type: payload.type, title: payload.subject, message: payload.body, from: 'info@wildguard.org' }); } catch (e) {}
          }
          if (typeof window.sendEmail === 'function') {
            try { window.sendEmail(email, payload.subject, payload.body, payload.type); } catch (e) {}
          }
        });
      });
      window.Connectivity.queueOfflineAction({ type: 'broadcast', payload: { recipients: recipients, type: type, subject: subject.value.trim(), body: body.value.trim() } });
      logAct('broadcast_queued_offline', 'Broadcast to ' + recipients.length + ' users (offline): ' + subject.value.trim());
      notify('Offline - broadcast queued for ' + recipients.length + ' recipients. It will send when back online.', 'warning');
      show('compose');
      return;
    }
    recipients.forEach(function(email) {
      if (typeof window.sendUserNotification === 'function') {
        window.sendUserNotification(email, { type: type, title: subject.value.trim(), message: body.value.trim(), from: 'info@wildguard.org' });
        count++;
      }
    });
    if (typeof window.sendEmail === 'function') {
      recipients.forEach(function(email) { try { window.sendEmail(email, subject.value.trim(), body.value.trim(), type); } catch (e) {} });
    }
    logAct('broadcast_sent', 'Broadcast to ' + count + ' users: ' + subject.value.trim());
    notify('Broadcast queued for ' + count + ' recipients', 'success');
    show('compose');
  };

  // ============ SCANS ============
  function initScansTabs() {
    document.querySelectorAll('#scans-container .portal-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        document.querySelectorAll('#scans-container .portal-tab').forEach(function(x) { x.classList.remove('active'); });
        this.classList.add('active');
        renderScansList();
      });
    });
  }
  function renderScansList() {
    var container = document.getElementById('scans-container-inner');
    if (!container) return;
    var tab = (function() { var el = document.querySelector('#scans-container .portal-tab.active'); return el ? el.dataset.tab : 'pending'; })();
    var list = tab === 'approved' ? read(K.APPROVED, []) : read(K.SCANS, []);
    container.innerHTML = (list.length ? list.map(function(s, i) {
      var sp = s.species || {};
      var image = s.imageData || (sp.image ? window.WildGuardSpeciesDB && window.WildGuardSpeciesDB.image ? window.WildGuardSpeciesDB.image(sp.image) : sp.image : '');
      return '<div class="portal-card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">' +
        '<div style="display:flex;align-items:center;gap:1rem;min-width:0">' +
          (image ? '<div style="width:60px;height:60px;border-radius:10px;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,0.05)"><img src="' + image + '" alt="" style="width:100%;height:100%;object-fit:cover"></div>' : '<div style="width:60px;height:60px;background:linear-gradient(135deg,#2d6a4f,#1e3a2b);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:1.5rem">🐾</div>') +
          '<div style="min-width:0"><div style="font-weight:600;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(sp.name || s.animalName || 'Unknown Animal') + '</div>' +
          '<div style="font-size:0.82rem;opacity:0.6">By: ' + esc(s.user || s.submittedBy || 'Unknown') + ' · ' + (s.confidence ? s.confidence + '% match' : '') + ' · ' + fmtShort(s.timestamp || s.createdAt) + '</div>' +
          '<span class="portal-badge" style="background:rgba(244, 162, 97,0.15);color:var(--accent)">' + esc(sp.category || '') + '</span></div></div>' +
        (tab === 'pending' ? '<div style="display:flex;gap:0.5rem"><button class="portal-btn portal-btn-success portal-btn-sm" onclick="window._approveScanById(\'' + esc(s.id) + '\')"><i class="fas fa-check"></i> Approve</button><button class="portal-btn portal-btn-danger portal-btn-sm" onclick="window._rejectScanById(\'' + esc(s.id) + '\')"><i class="fas fa-xmark"></i> Reject</button></div>' : '<span class="portal-badge" style="background:rgba(34,197,94,0.15);color:#22c55e">Approved</span>') + '</div></div>';
    }).join('') : '<div class="portal-empty"><i class="fas fa-image"></i><p>No ' + (tab === 'approved' ? 'approved scans' : 'pending scans') + '</p></div>');
  }
  reg('scans', function() {
    var pending = read(K.SCANS, []);
    var approved = read(K.APPROVED, []);
    return '<div id="scans-container"><h2 style="font-family:var(--font-heading)"><i class="fas fa-image"></i> Scan Review</h2>' +
      '<div class="portal-tabs">' +
        '<button class="portal-tab active" data-tab="pending">Pending <span class="badge badge-warning">' + pending.length + '</span></button>' +
        '<button class="portal-tab" data-tab="approved">Approved <span class="badge badge-success">' + approved.length + '</span></button>' +
      '</div>' +
      '<div id="scans-container-inner"></div></div>';
  });

  window._approveScanById = function(id) {
    var pending = read(K.SCANS, []);
    var idx = pending.findIndex(function(s) { return s.id === id; });
    if (idx === -1) return;
    var s = pending.splice(idx, 1)[0];
    s.approved = true;
    s.approvedAt = new Date().toISOString();
    var approved = read(K.APPROVED, []);
    approved.unshift(s);
    write(K.SCANS, pending);
    write(K.APPROVED, approved);
    var name = (s.species && s.species.name) || s.animalName || 'wildlife';
    logAct('scan_approved', 'Approved scan: ' + name);
    // Offline support: deliver the approval email/notification when back online
    var deviceOnline = (typeof navigator !== 'undefined') ? navigator.onLine : true;
    if (!deviceOnline && s.user && window.Connectivity) {
      window.Connectivity.registerHandler('scan_decision', function(payload) {
        if (typeof window.sendUserNotification === 'function') {
          try { window.sendUserNotification(payload.user, { type: 'scan_approved', title: 'Scan Approved', message: 'Your scan of ' + payload.name + ' was approved and added to the library.' }); } catch (e) {}
        }
        if (typeof window.sendEmail === 'function') {
          try { window.sendEmail(payload.user, 'Your scan was approved: ' + payload.name, 'Dear guardian,\n\nGreat news! Your scan of ' + payload.name + ' was approved and added to the WildGuard library.\n\nKeep exploring,\nThe WildGuard Team', 'scan_approved'); } catch (e) {}
        }
      });
      window.Connectivity.queueOfflineAction({ type: 'scan_decision', payload: { user: s.user, name: name, decision: 'approved' } });
      notify('Offline - approval queued. ' + name + ' will be confirmed to the user when back online.', 'warning');
    } else {
      if (s.user && typeof window.sendUserNotification === 'function') {
        window.sendUserNotification(s.user, { type: 'scan_approved', title: 'Scan Approved', message: 'Your scan of ' + name + ' was approved and added to the library.' });
      }
      if (s.user && typeof window.sendEmail === 'function') {
        try { window.sendEmail(s.user, 'Your scan was approved: ' + name, 'Dear guardian,\n\nGreat news! Your scan of ' + name + ' was approved and added to the WildGuard library.\n\nKeep exploring,\nThe WildGuard Team', 'scan_approved'); } catch (e) {}
      }
    }
    notify('Scan approved', 'success');
    renderScansList();
    updateScansBadge();
  };
  window._rejectScanById = function(id) {
    var pending = read(K.SCANS, []);
    var idx = pending.findIndex(function(s) { return s.id === id; });
    if (idx === -1) return;
    var s = pending.splice(idx, 1)[0];
    write(K.SCANS, pending);
    var name = (s.species && s.species.name) || s.animalName || 'wildlife';
    logAct('scan_rejected', 'Rejected scan: ' + name);
    var deviceOnline = (typeof navigator !== 'undefined') ? navigator.onLine : true;
    if (!deviceOnline && s.user && window.Connectivity) {
      window.Connectivity.registerHandler('scan_decision', function(payload) {
        if (typeof window.sendUserNotification === 'function') {
          try { window.sendUserNotification(payload.user, { type: 'scan_rejected', title: 'Scan Rejected', message: 'Your scan of ' + payload.name + ' was not approved.' }); } catch (e) {}
        }
        if (typeof window.sendEmail === 'function') {
          try { window.sendEmail(payload.user, 'Update on your scan: ' + payload.name, 'Dear guardian,\n\nThank you for scanning ' + payload.name + '. Unfortunately this submission was not approved for the library.\n\nKeep exploring,\nThe WildGuard Team', 'scan_rejected'); } catch (e) {}
        }
      });
      window.Connectivity.queueOfflineAction({ type: 'scan_decision', payload: { user: s.user, name: name, decision: 'rejected' } });
      notify('Offline - rejection queued. The user will be notified when back online.', 'warning');
    } else {
      if (s.user && typeof window.sendUserNotification === 'function') {
        window.sendUserNotification(s.user, { type: 'scan_rejected', title: 'Scan Rejected', message: 'Your scan of ' + name + ' was not approved.' });
      }
      if (s.user && typeof window.sendEmail === 'function') {
        try { window.sendEmail(s.user, 'Update on your scan: ' + name, 'Dear guardian,\n\nThank you for scanning ' + name + '. Unfortunately this submission was not approved for the library.\n\nKeep exploring,\nThe WildGuard Team', 'scan_rejected'); } catch (e) {}
      }
    }
    notify('Scan rejected', 'info');
    renderScansList();
    updateScansBadge();
  };

  // ============ USERS & ROLES ============
  var usersTab = 'all';
  reg('users', function() {
    var users = getUsers();
    var superUser = isSuper();
    var rows = users.filter(function(u) {
      if (usersTab === 'admins') return u.role === 'admin' || u.role === 'super_admin' || u.role === 'moderator';
      if (usersTab === 'users') return u.role === 'user';
      return true;
    });
    var admins = users.filter(function(u) { return u.role === 'admin' || u.role === 'super_admin' || u.role === 'moderator'; }).length;
    return '<div id="users"><h2 style="font-family:var(--font-heading)"><i class="fas fa-users"></i> Users & Roles</h2>' +
      '<p style="opacity:0.6;margin-bottom:1.5rem">Change roles, manage access, and keep tabs on the community. Super admins can promote or demote anyone.</p>' +
      '<div class="portal-tabs">' +
        '<button class="portal-tab' + (usersTab === 'all' ? ' active' : '') + '" data-utab="all">All <span class="badge badge-primary">' + users.length + '</span></button>' +
        '<button class="portal-tab' + (usersTab === 'users' ? ' active' : '') + '" data-utab="users">Members</button>' +
        '<button class="portal-tab' + (usersTab === 'admins' ? ' active' : '') + '" data-utab="admins">Admins & Mods <span class="badge badge-success">' + admins + '</span></button>' +
      '</div>' +
      '<div class="portal-card" style="margin-top:1rem;padding:1rem"><input type="text" id="user-search" placeholder="Search by name or email..." style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter)"></div>' +
      '<div id="users-list" style="margin-top:1rem"></div></div>';
  });

  function renderUsersList() {
    var container = document.getElementById('users-list');
    if (!container) return;
    var users = getUsers();
    var q = (document.getElementById('user-search') || {}).value || '';
    q = q.toLowerCase().trim();
    var filtered = users.filter(function(u) {
      if (q && !u.email.toLowerCase().includes(q) && !(u.name || '').toLowerCase().includes(q) && !(u.username || '').toLowerCase().includes(q)) return false;
      if (usersTab === 'admins') return u.role === 'admin' || u.role === 'super_admin' || u.role === 'moderator';
      if (usersTab === 'users') return u.role === 'user';
      return true;
    });
    container.innerHTML = filtered.length ? '<div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>User</th><th>Role</th><th>Tokens</th><th>Certificates</th><th>Joined</th><th>Actions</th></tr></thead><tbody>' +
      filtered.map(function(u) {
        var isSelf = u.email === (currentUser() && currentUser().email);
        var roleOptions = ['user', 'moderator', 'admin', 'super_admin'];
        return '<tr>' +
          '<td><div style="display:flex;align-items:center;gap:0.75rem"><div class="user-avatar">' + esc((u.name || '?').charAt(0).toUpperCase()) + '</div><div><div style="font-weight:500">' + esc(u.name) + '</div><div style="font-size:0.75rem;opacity:0.5">' + esc(u.email) + '</div></div></div></td>' +
          '<td><select class="role-select" data-email="' + esc(u.email) + '" ' + (isSelf ? 'disabled' : '') + ' onchange="window._changeRole(this)">' +
            roleOptions.map(function(r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
          '</select>' + (isSelf ? ' <span style="font-size:0.7rem;opacity:0.4">(you)</span>' : '') + '</td>' +
          '<td><span style="font-weight:700;color:var(--accent)">' + tokenBalance(u.email) + '</span></td>' +
          '<td>' + getCerts().filter(function(c) { return c.user === u.email; }).length + '</td>' +
          '<td>' + fmtShort(u.registeredAt) + '</td>' +
          '<td><div style="display:flex;gap:0.4rem;flex-wrap:wrap"><button class="portal-btn portal-btn-sm portal-btn-secondary" onclick="window._giveTokens(\'' + esc(u.email) + '\')"><i class="fas fa-coins"></i> Tokens</button>' +
          '<button class="portal-btn portal-btn-sm portal-btn-secondary" onclick="window._awardCert(\'' + esc(u.email) + '\')"><i class="fas fa-award"></i> Certificate</button></div></td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' :
      '<div class="portal-empty"><i class="fas fa-user-slash"></i><p>No users match</p></div>';
    // wire search
    var search = document.getElementById('user-search');
    if (search && !search._wired) {
      search._wired = true;
      search.addEventListener('input', renderUsersList);
    }
  }
  function initUsersTabs() {
    document.querySelectorAll('#users .portal-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        document.querySelectorAll('#users .portal-tab').forEach(function(x) { x.classList.remove('active'); });
        this.classList.add('active');
        usersTab = this.dataset.utab || 'all';
        renderUsersList();
      });
    });
    renderUsersList();
  }

  window._changeRole = function(select) {
    var email = select.getAttribute('data-email');
    var role = select.value;
    if (email === (currentUser() && currentUser().email)) { notify('You cannot change your own role', 'error'); return; }
    saveUserRecord({ email: email, role: role });
    logAct('role_changed', 'Changed ' + email + ' to ' + role);
    if (typeof window.sendUserNotification === 'function') {
      window.sendUserNotification(email, { type: 'role', title: 'Role Updated', message: 'Your account role is now ' + role + '.' });
    }
    notify('Role updated to ' + role, 'success');
  };
  window._giveTokens = function(email) { showModal(tokenForm(email)); };
  window._awardCert = function(email) { showModal(certForm(email)); };

  // ============ ADMINS ============
  reg('admins', function() {
    var admins = getUsers().filter(function(u) { return u.role === 'admin' || u.role === 'super_admin'; });
    var superUser = isSuper();
    return '<div><h2 style="font-family:var(--font-heading)"><i class="fas fa-shield-halved"></i> Admins</h2>' +
      '<div class="portal-card" style="margin-bottom:1.5rem"><h3 style="margin:0 0 1rem">Administrators & Super Admins</h3>' +
      '<div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>' +
      (admins.length ? admins.map(function(a) {
        var isSelf = a.email === (currentUser() && currentUser().email);
        return '<tr><td><div style="display:flex;align-items:center;gap:0.75rem"><div class="user-avatar">' + esc(a.name.charAt(0).toUpperCase()) + '</div>' + esc(a.name) + '</div></td><td>' + esc(a.email) + '</td>' +
          '<td><span class="role-badge role-' + (a.role || 'admin') + '">' + esc(a.role || 'admin') + '</span></td>' +
          '<td>' + (superUser && !isSelf ? '<button class="portal-btn portal-btn-sm portal-btn-danger" onclick="window._demoteAdmin(\'' + esc(a.email) + '\')"><i class="fas fa-user-minus"></i> Demote</button>' : '<span style="font-size:0.75rem;opacity:0.4">—</span>') + '</td></tr>';
      }).join('') : '<tr><td colspan="4" class="portal-empty">No admins found</td></tr>') +
      '</tbody></table></div></div></div>';
  });
  window._demoteAdmin = async function(email) {
    if (!(await WGConfirm({ title: 'Demote ' + email + '?', message: 'This user will lose admin access and become a regular member.', confirmText: 'Demote', danger: true }))) return;
    saveUserRecord({ email: email, role: 'user' });
    logAct('admin_demoted', 'Demoted ' + email);
    notify('Admin demoted', 'success');
    show('admins');
  };

  // ============ REWARDS (CERTIFICATES) ============
  reg('rewards', function() {
    var certs = getCerts();
    var users = getUsers();
    return '<div><h2 style="font-family:var(--font-heading)"><i class="fas fa-award"></i> Rewards & Certificates</h2>' +
      '<p style="opacity:0.6;margin-bottom:1.5rem">Recognize members for scans, milestones, and contributions. Certificates appear instantly on the recipient\'s profile.</p>' +
      '<div class="portal-card" style="margin-bottom:1.5rem;max-width:760px"><h3 style="margin:0 0 1rem"><i class="fas fa-plus-circle" style="color:var(--accent)"></i> Issue a Certificate</h3>' +
        '<div class="portal-field"><label>Recipient</label><select id="cert-user" style="width:100%">' +
          users.map(function(u) { return '<option value="' + esc(u.email) + '">' + esc(u.name) + ' (' + esc(u.email) + ')</option>'; }).join('') +
        '</select></div>' +
        '<div class="portal-field"><label>Certificate Title</label><input type="text" id="cert-title" placeholder="e.g. Conservation Champion" style="width:100%"></div>' +
        '<div class="portal-field"><label>Message</label><textarea id="cert-message" rows="3" placeholder="Personal note..." style="width:100%"></textarea></div>' +
        '<button class="portal-btn portal-btn-primary" onclick="window._issueCert()"><i class="fas fa-award"></i> Issue Certificate</button>' +
      '</div>' +
      '<h3 style="margin:0 0 1rem;font-size:1rem;opacity:0.8">Issued Certificates (' + certs.length + ')</h3>' +
      (certs.length ? '<div class="portal-grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">' + certs.map(function(c) {
        return '<div class="portal-card" style="background:linear-gradient(145deg,rgba(244, 162, 97,0.06),rgba(27,94,64,0.06));border:1px solid rgba(244, 162, 97,0.25)">' +
          '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem"><i class="fas fa-medal" style="color:var(--accent);font-size:1.6rem"></i>' +
          '<div><div style="font-weight:700">' + esc(c.title) + '</div><div style="font-size:0.78rem;opacity:0.6">' + esc(c.name || c.user) + '</div></div></div>' +
          (c.message ? '<div style="font-size:0.85rem;opacity:0.8;line-height:1.5;margin-bottom:0.75rem">' + esc(c.message) + '</div>' : '') +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem"><span style="font-size:0.72rem;opacity:0.5">Issued ' + fmtShort(c.issuedAt) + '</span>' +
          '<button class="portal-btn portal-btn-sm portal-btn-danger" onclick="window._revokeCert(\'' + esc(c.id) + '\')"><i class="fas fa-trash"></i> Revoke</button></div></div>';
      }).join('') + '</div>' : '<div class="portal-empty"><i class="fas fa-award"></i><p>No certificates issued yet</p></div>') + '</div>';
  });

  function certForm(email) {
    var users = getUsers();
    return '<div style="padding:2rem;min-width:380px"><h3 style="margin:0 0 1rem;font-family:var(--font-heading)">Issue Certificate</h3>' +
      '<div class="portal-field"><label>Recipient</label><select id="cert-user" style="width:100%">' +
        users.map(function(u) { return '<option value="' + esc(u.email) + '"' + (u.email === email ? ' selected' : '') + '>' + esc(u.name) + ' (' + esc(u.email) + ')</option>'; }).join('') +
      '</select></div>' +
      '<div class="portal-field"><label>Certificate Title</label><input type="text" id="cert-title" placeholder="e.g. Conservation Champion" style="width:100%"></div>' +
      '<div class="portal-field"><label>Message</label><textarea id="cert-message" rows="3" placeholder="Personal note..." style="width:100%"></textarea></div>' +
      '<button class="portal-btn portal-btn-primary" onclick="window._issueCert()"><i class="fas fa-award"></i> Issue</button></div>';
  }
  window._issueCert = function() {
    var userSel = document.getElementById('cert-user');
    var titleEl = document.getElementById('cert-title');
    var msgEl = document.getElementById('cert-message');
    if (!userSel || !titleEl || !titleEl.value.trim()) { notify('Recipient and title are required', 'error'); return; }
    var users = getUsers();
    var user = users.find(function(u) { return u.email === userSel.value; });
    var cert = {
      id: 'cert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user: userSel.value,
      name: user ? user.name : userSel.value,
      title: titleEl.value.trim(),
      message: (msgEl && msgEl.value.trim()) || 'In recognition of your contribution to wildlife conservation.',
      issuedAt: new Date().toISOString(),
      code: 'WGS-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    };
    var certs = getCerts();
    certs.unshift(cert);
    write(K.CERTS, certs);
    logAct('cert_issued', 'Certificate "' + cert.title + '" to ' + cert.user);
    if (typeof window.sendUserNotification === 'function') {
      window.sendUserNotification(cert.user, { type: 'reward', title: 'Certificate Awarded 🏆', message: 'Congratulations! You received the "' + cert.title + '" certificate. Check your profile.' });
    }
    var overlay = document.querySelector('.portal-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    notify('Certificate issued to ' + (user ? user.name : userSel.value), 'success');
    if (currentSection === 'rewards') show('rewards');
    renderUsersList();
  };
  window._revokeCert = async function(id) {
    if (!(await WGConfirm({ title: 'Revoke this certificate?', message: 'The certificate will be permanently removed from the member\'s profile.', confirmText: 'Revoke', danger: true }))) return;
    var certs = getCerts().filter(function(c) { return c.id !== id; });
    write(K.CERTS, certs);
    logAct('cert_revoked', 'Revoked certificate ' + id);
    notify('Certificate revoked', 'info');
    show('rewards');
  };

  // ============ TOKENS ============
  reg('tokens', function() {
    var users = getUsers();
    var ledger = getLedger();
    return '<div><h2 style="font-family:var(--font-heading)"><i class="fas fa-coins"></i> Tokens</h2>' +
      '<p style="opacity:0.6;margin-bottom:1.5rem">Reward activity with tokens. Tokens are a fun currency members can use for perks and status.</p>' +
      '<div class="portal-card" style="margin-bottom:1.5rem;max-width:760px"><h3 style="margin:0 0 1rem"><i class="fas fa-hand-holding-dollar" style="color:var(--accent)"></i> Grant Tokens</h3>' +
        '<div class="portal-field"><label>Recipient</label><select id="token-user" style="width:100%">' +
          users.map(function(u) { return '<option value="' + esc(u.email) + '">' + esc(u.name) + ' (' + esc(u.email) + ')</option>'; }).join('') +
        '</select></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="portal-field"><label>Amount</label><input type="number" id="token-amount" min="1" value="10" style="width:100%"></div>' +
        '<div class="portal-field"><label>Reason</label><input type="text" id="token-reason" placeholder="e.g. 5 scans submitted" style="width:100%"></div></div>' +
        '<button class="portal-btn portal-btn-primary" onclick="window._grantTokens()"><i class="fas fa-coins"></i> Grant Tokens</button>' +
      '</div>' +
      '<h3 style="margin:0 0 1rem;font-size:1rem;opacity:0.8">Token Ledger (' + ledger.length + ' entries)</h3>' +
      '<div class="portal-card">' +
      (ledger.length ? '<div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>User</th><th>Amount</th><th>Reason</th><th>Time</th></tr></thead><tbody>' +
        ledger.map(function(t) {
          return '<tr><td>' + esc(t.user) + '</td><td style="color:' + (t.amount > 0 ? '#22c55e' : '#ef4444') + ';font-weight:700">' + (t.amount > 0 ? '+' : '') + t.amount + '</td><td>' + esc(t.reason || '') + '</td><td>' + fmt(t.time) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="portal-empty"><i class="fas fa-coins"></i><p>No token activity yet</p></div>') +
      '</div></div>';
  });

  function tokenForm(email) {
    var users = getUsers();
    return '<div style="padding:2rem;min-width:380px"><h3 style="margin:0 0 1rem;font-family:var(--font-heading)">Grant Tokens</h3>' +
      '<div class="portal-field"><label>Recipient</label><select id="token-user" style="width:100%">' +
        users.map(function(u) { return '<option value="' + esc(u.email) + '"' + (u.email === email ? ' selected' : '') + '>' + esc(u.name) + ' (' + esc(u.email) + ')</option>'; }).join('') +
      '</select></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="portal-field"><label>Amount</label><input type="number" id="token-amount" min="1" value="10" style="width:100%"></div>' +
      '<div class="portal-field"><label>Reason</label><input type="text" id="token-reason" placeholder="e.g. 5 scans submitted" style="width:100%"></div></div>' +
      '<button class="portal-btn portal-btn-primary" onclick="window._grantTokens()"><i class="fas fa-coins"></i> Grant</button></div>';
  }
  window._grantTokens = function() {
    var userSel = document.getElementById('token-user');
    var amountEl = document.getElementById('token-amount');
    var reasonEl = document.getElementById('token-reason');
    if (!userSel || !amountEl || !amountEl.value) { notify('Recipient and amount are required', 'error'); return; }
    var amount = parseInt(amountEl.value, 10);
    if (!amount) { notify('Invalid amount', 'error'); return; }
    var ledger = getLedger();
    ledger.unshift({ id: 'tok_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), user: userSel.value, amount: amount, reason: (reasonEl && reasonEl.value.trim()) || 'Admin grant', time: new Date().toISOString() });
    write(K.TOKENS, ledger);
    logAct('tokens_granted', (amount > 0 ? '+' : '') + amount + ' tokens to ' + userSel.value + ' (' + (reasonEl && reasonEl.value.trim() || '') + ')');
    if (typeof window.sendUserNotification === 'function') {
      window.sendUserNotification(userSel.value, { type: 'reward', title: 'Tokens Received 🪙', message: (amount > 0 ? 'You received ' + amount + ' WildGuard tokens.' : amount + ' tokens were adjusted on your account.') + (reasonEl && reasonEl.value.trim() ? ' Reason: ' + reasonEl.value.trim() : '') });
    }
    var overlay = document.querySelector('.portal-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    notify((amount > 0 ? '+' : '') + amount + ' tokens granted', 'success');
    if (currentSection === 'tokens') show('tokens');
    renderUsersList();
  };

  // ============ SPECIES DATABASE ============
  var dbSearch = '';
  var dbCategory = 'all';
  var dbOnlyFeatured = false;
  reg('database', function() {
    var categories = ['Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Insect', 'Arachnid', 'Mollusk', 'Cnidarian', 'Annelid', 'Plant', 'Fungi', 'Protist', 'Bacteria', 'Archaea', 'Virus'];
    var total = window.WildGuardSpeciesDB && window.WildGuardSpeciesDB.isReady() ? window.WildGuardSpeciesDB.count() : '…';
    return '<div><h2 style="font-family:var(--font-heading)"><i class="fas fa-database"></i> Species Database</h2>' +
      '<p style="opacity:0.6;margin-bottom:1.5rem">Full control over the species catalog — add, edit, delete, and swap images. Changes apply across the site instantly.</p>' +
      '<div class="portal-card" style="margin-bottom:1rem"><div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center">' +
        '<input type="text" id="db-search" placeholder="Search species..." style="flex:1;min-width:220px;padding:0.7rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter)">' +
        '<select id="db-cat" style="padding:0.7rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter)"><option value="all">All categories</option>' +
        categories.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') + '</select>' +
        '<button class="portal-btn portal-btn-primary" onclick="window._addSpecies()"><i class="fas fa-plus"></i> Add Species</button>' +
      '</div></div>' +
      '<div id="db-stats" style="font-size:0.8rem;opacity:0.6;margin-bottom:0.75rem">' + total + ' species in database</div>' +
      '<div id="db-list"></div></div>';
  });

  function renderDatabase() {
    var container = document.getElementById('db-list');
    if (!container) return;
    if (!window.WildGuardSpeciesDB || !window.WildGuardSpeciesDB.isReady()) {
      container.innerHTML = '<div class="portal-empty"><i class="fas fa-database"></i><p>Loading species database...</p></div>';
      return;
    }
    var q = (document.getElementById('db-search') || {}).value || '';
    var cat = (document.getElementById('db-cat') || {}).value || 'all';
    q = q.toLowerCase().trim();
    var all = window.WildGuardSpeciesDB.list();
    var filtered = all.filter(function(s) {
      if (q && !(s.name || '').toLowerCase().includes(q) && !(s.scientificName || '').toLowerCase().includes(q) && !(s.key || '').toLowerCase().includes(q)) return false;
      if (cat !== 'all' && s.category !== cat) return false;
      return true;
    });
    container.innerHTML = filtered.length ? '<div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Image</th><th>Species</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
      filtered.map(function(s) {
        var img = window.WildGuardSpeciesDB.image(s.image || '');
        return '<tr>' +
          '<td>' + (img ? '<div style="width:52px;height:52px;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.05)"><img src="' + img + '" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'"></div>' : '<div style="width:52px;height:52px;border-radius:8px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;color:var(--accent)"><i class="fas fa-paw"></i></div>') + '</td>' +
          '<td><div style="font-weight:600">' + esc(s.name || s.key) + '</div><div style="font-size:0.75rem;opacity:0.5;font-style:italic">' + esc(s.scientificName || '') + '</div></td>' +
          '<td><span class="portal-badge" style="background:rgba(27,94,64,0.2);color:var(--primary-light)">' + esc(s.category || '') + '</span></td>' +
          '<td><span class="portal-badge" style="background:rgba(244, 162, 97,0.15);color:var(--accent)">' + esc(s.status || '') + '</span></td>' +
          '<td><div style="display:flex;gap:0.4rem;flex-wrap:wrap"><button class="portal-btn portal-btn-sm portal-btn-secondary" onclick="window._editSpecies(\'' + esc(s.key) + '\')"><i class="fas fa-edit"></i> Edit</button>' +
          '<button class="portal-btn portal-btn-sm portal-btn-secondary" onclick="window._swapImage(\'' + esc(s.key) + '\')"><i class="fas fa-image"></i> Image</button>' +
          '<button class="portal-btn portal-btn-sm portal-btn-danger" onclick="window._deleteSpecies(\'' + esc(s.key) + '\')"><i class="fas fa-trash"></i></button></div></td></tr>';
      }).join('') + '</tbody></table></div>' :
      '<div class="portal-empty"><i class="fas fa-magnifying-glass"></i><p>No species match your filters</p></div>';
  }

  function initDatabase() {
    var search = document.getElementById('db-search');
    if (search && !search._wired) {
      search._wired = true;
      search.addEventListener('input', renderDatabase);
    }
    var cat = document.getElementById('db-cat');
    if (cat && !cat._wired) {
      cat._wired = true;
      cat.addEventListener('change', renderDatabase);
    }
    renderDatabase();
  }

  function speciesForm(key) {
    var isNew = !key;
    var s = key ? window.WildGuardSpeciesDB.get(key) : null;
    var images = window.WildGuardSpeciesDB.availableImages();
    var cats = ['Mammal', 'Bird', 'Reptile', 'Amphibian', 'Fish', 'Insect', 'Arachnid', 'Mollusk', 'Cnidarian', 'Annelid', 'Plant', 'Fungi', 'Protist', 'Bacteria', 'Archaea', 'Virus'];
    var statuses = ['N/A', 'Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Extinct in the Wild', 'Extinct'];
    var stMap = { 'N/A': 'least-concern', 'Least Concern': 'least-concern', 'Near Threatened': 'near-threatened', 'Vulnerable': 'vulnerable', 'Endangered': 'endangered', 'Critically Endangered': 'endangered', 'Extinct in the Wild': 'endangered', 'Extinct': 'endangered' };
    return '<div style="padding:2rem;max-width:640px;max-height:82vh;overflow-y:auto"><h3 style="margin:0 0 1rem;font-family:var(--font-heading)">' + (isNew ? 'Add Species' : 'Edit: ' + esc(s.name || key)) + '</h3>' +
      '<div class="portal-field"><label>Database Key</label><input type="text" id="sp-key" value="' + (isNew ? '' : esc(key)) + '" ' + (isNew ? 'placeholder="e.g. african_elephant"' : 'readonly style="opacity:0.6"') + ' style="width:100%"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="portal-field"><label>Common Name</label><input type="text" id="sp-name" value="' + (s ? esc(s.name || '') : '') + '" style="width:100%"></div>' +
      '<div class="portal-field"><label>Scientific Name</label><input type="text" id="sp-sci" value="' + (s ? esc(s.scientificName || '') : '') + '" style="width:100%"></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="portal-field"><label>Category</label><select id="sp-cat" style="width:100%">' +
        cats.map(function(c) { return '<option value="' + c + '"' + (s && s.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="portal-field"><label>Status</label><select id="sp-status" style="width:100%">' +
        statuses.map(function(st) { return '<option value="' + st + '"' + (s && s.status === st ? ' selected' : '') + '>' + st + '</option>'; }).join('') + '</select></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="portal-field"><label>Population</label><input type="text" id="sp-pop" value="' + (s ? esc(s.population || '') : '') + '" placeholder="e.g. 415,000" style="width:100%"></div>' +
      '<div class="portal-field"><label>Habitat</label><input type="text" id="sp-habitat" value="' + (s ? esc(s.habitat || '') : '') + '" style="width:100%"></div></div>' +
      '<div class="portal-field"><label>Diet</label><input type="text" id="sp-diet" value="' + (s ? esc(s.diet || '') : '') + '" style="width:100%"></div>' +
      '<div class="portal-field"><label>Behavior</label><textarea id="sp-behavior" rows="2" style="width:100%">' + (s ? esc(s.behavior || '') : '') + '</textarea></div>' +
      '<div class="portal-field"><label>Threats</label><textarea id="sp-threats" rows="2" style="width:100%">' + (s ? esc(s.threats || '') : '') + '</textarea></div>' +
      '<div class="portal-field"><label>Description</label><textarea id="sp-desc" rows="2" style="width:100%">' + (s ? esc(s.desc || '') : '') + '</textarea></div>' +
      '<div class="portal-field"><label>Tags (comma separated)</label><input type="text" id="sp-tags" value="' + (s && s.tags ? esc(s.tags.join(', ')) : '') + '" style="width:100%"></div>' +
      '<div class="portal-field"><label>Image</label><select id="sp-image" style="width:100%" onchange="window._onSpeciesImagePick()">' +
        '<option value="">No image</option>' +
        images.map(function(i) { return '<option value="' + i + '"' + (s && (s.image === i || s.image === 'assets/images/' + i) ? ' selected' : '') + '>' + i + '</option>'; }).join('') +
        '<option value="__custom__"' + (s && s.image && !images.some(function(i) { return i === s.image || 'assets/images/' + i === s.image; }) ? ' selected' : '') + '>Custom URL...</option>' +
      '</select>' + (s && s.image && !images.some(function(i) { return i === s.image || 'assets/images/' + i === s.image; }) ? '<input type="text" id="sp-image-url" value="' + esc(s.image) + '" style="width:100%;margin-top:0.5rem">' : '') + '</div>' +
      '<div id="sp-image-preview" style="margin:0.75rem 0"></div>' +
      '<div style="display:flex;gap:0.75rem;margin-top:1rem"><button class="portal-btn portal-btn-primary" onclick="window._saveSpecies(\'' + esc(key || '') + '\')"><i class="fas fa-save"></i> Save</button>' +
      '<button class="portal-btn portal-btn-secondary" onclick="document.querySelector(\'.portal-modal-overlay\').classList.remove(\'open\')">Cancel</button></div></div>';
  }

  window._onSpeciesImagePick = function() {
    var sel = document.getElementById('sp-image');
    var custom = document.getElementById('sp-image-url');
    if (sel.value === '__custom__' && !custom) {
      var wrap = sel.parentNode;
      var input = document.createElement('input');
      input.type = 'text'; input.id = 'sp-image-url'; input.placeholder = 'Paste image URL or path'; input.style.cssText = 'width:100%;margin-top:0.5rem;padding:0.7rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter)';
      wrap.appendChild(input);
    } else if (sel.value !== '__custom__' && custom) {
      custom.remove();
    }
    updateImagePreview();
  };
  function updateImagePreview() {
    var preview = document.getElementById('sp-image-preview');
    if (!preview) return;
    var sel = document.getElementById('sp-image');
    var url = document.getElementById('sp-image-url');
    var src = url ? url.value.trim() : sel.value;
    if (!src) { preview.innerHTML = ''; return; }
    src = window.WildGuardSpeciesDB.image(src);
    src = safeImgSrc(src);
    preview.innerHTML = src ? '<div style="font-size:0.72rem;opacity:0.5;margin-bottom:0.35rem">Preview</div><img src="' + src + '" alt="" style="max-width:180px;max-height:120px;border-radius:8px;object-fit:cover;border:1px solid rgba(244, 162, 97,0.3)" onerror="this.outerHTML=\'<div style=color:#ef4444;font-size:0.75rem>Image failed to load</div>\'">' : '<div style="font-size:0.72rem;opacity:0.5;margin-bottom:0.35rem">Preview</div><span style="color:#ef4444;font-size:0.75rem">Image failed to load</span>';
  }

  window._addSpecies = function() { showModal(speciesForm(null)); setTimeout(updateImagePreview, 100); };
  window._editSpecies = function(key) { showModal(speciesForm(key)); setTimeout(updateImagePreview, 100); };
  window._swapImage = function(key) {
    var s = window.WildGuardSpeciesDB.get(key);
    if (!s) return;
    var images = window.WildGuardSpeciesDB.availableImages();
    return showModal('<div style="padding:2rem;max-width:520px"><h3 style="margin:0 0 1rem;font-family:var(--font-heading)"><i class="fas fa-image"></i> Swap Image — ' + esc(s.name || key) + '</h3>' +
      '<div class="portal-field"><label>Choose an image from the library</label><select id="swap-image" style="width:100%" onchange="window._onSwapPick()">' +
        '<option value="">No image</option>' +
        images.map(function(i) { return '<option value="' + i + '"' + (s.image === i || s.image === 'assets/images/' + i ? ' selected' : '') + '>' + i + '</option>'; }).join('') +
        '<option value="__custom__">Custom URL...</option></select>' +
      (s.image && !images.some(function(i) { return i === s.image || 'assets/images/' + i === s.image; }) ? '<input type="text" id="swap-image-url" value="' + esc(s.image) + '" style="width:100%;margin-top:0.5rem">' : '') + '</div>' +
      '<div id="swap-preview" style="margin:1rem 0;display:flex;justify-content:center"></div>' +
      '<div style="display:flex;gap:0.75rem"><button class="portal-btn portal-btn-primary" onclick="window._applySwap(\'' + esc(key) + '\')"><i class="fas fa-check"></i> Apply Image</button>' +
      '<button class="portal-btn portal-btn-secondary" onclick="document.querySelector(\'.portal-modal-overlay\').classList.remove(\'open\')">Cancel</button></div></div>');
  };
  window._onSwapPick = function() {
    var sel = document.getElementById('swap-image');
    var custom = document.getElementById('swap-image-url');
    if (sel.value === '__custom__' && !custom) {
      var input = document.createElement('input');
      input.type = 'text'; input.id = 'swap-image-url'; input.placeholder = 'Paste image URL or path'; input.style.cssText = 'width:100%;margin-top:0.5rem;padding:0.7rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--lighter)';
      sel.parentNode.appendChild(input);
    } else if (sel.value !== '__custom__' && custom) { custom.remove(); }
    var preview = document.getElementById('swap-preview');
    var src = custom ? custom.value.trim() : sel.value;
    if (!src) { preview.innerHTML = '<span style="font-size:0.8rem;opacity:0.5">No image selected</span>'; return; }
    src = window.WildGuardSpeciesDB.image(src);
    src = safeImgSrc(src);
    preview.innerHTML = src ? '<img src="' + src + '" alt="" style="max-width:200px;max-height:140px;border-radius:10px;object-fit:cover;border:1px solid rgba(244, 162, 97,0.35)">' : '<span style="font-size:0.8rem;color:#ef4444">Image failed to load</span>';
  };
  window._applySwap = function(key) {
    var sel = document.getElementById('swap-image');
    if (!sel) return;
    var custom = document.getElementById('swap-image-url');
    var value = sel.value === '__custom__' ? (custom ? custom.value.trim() : '') : sel.value;
    window.WildGuardSpeciesDB.save(key, { image: value });
    logAct('image_swapped', 'Updated image for ' + key);
    var overlay = document.querySelector('.portal-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    notify('Image updated for ' + key, 'success');
    renderDatabase();
  };
  window._saveSpecies = function(key) {
    var k = key || (document.getElementById('sp-key') || {}).value;
    if (!k) { notify('Database key is required', 'error'); return; }
    k = k.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    var name = document.getElementById('sp-name').value.trim();
    if (!name) { notify('Common name is required', 'error'); return; }
    var cat = document.getElementById('sp-cat').value;
    var status = document.getElementById('sp-status').value;
    var stMap = { 'N/A': 'least-concern', 'Least Concern': 'least-concern', 'Near Threatened': 'near-threatened', 'Vulnerable': 'vulnerable', 'Endangered': 'endangered', 'Critically Endangered': 'endangered', 'Extinct in the Wild': 'endangered', 'Extinct': 'endangered' };
    var sel = document.getElementById('sp-image');
    var custom = document.getElementById('sp-image-url');
    var image = sel.value === '__custom__' ? (custom ? custom.value.trim() : '') : sel.value;
    var tags = (document.getElementById('sp-tags').value || '').split(',').map(function(t) { return t.trim(); }).filter(Boolean);
    var data = {
      name: name,
      scientificName: document.getElementById('sp-sci').value.trim(),
      category: cat,
      status: status,
      statusClass: stMap[status] || 'least-concern',
      population: document.getElementById('sp-pop').value.trim(),
      habitat: document.getElementById('sp-habitat').value.trim(),
      diet: document.getElementById('sp-diet').value.trim(),
      behavior: document.getElementById('sp-behavior').value.trim(),
      threats: document.getElementById('sp-threats').value.trim(),
      desc: document.getElementById('sp-desc').value.trim(),
      tags: tags,
      image: image
    };
    window.WildGuardSpeciesDB.add(k, data);
    logAct(key ? 'species_updated' : 'species_added', (key ? 'Updated ' : 'Added ') + k + ' (' + name + ')');
    var overlay = document.querySelector('.portal-modal-overlay');
    if (overlay) overlay.classList.remove('open');
    notify('Species saved', 'success');
    renderDatabase();
  };
  window._deleteSpecies = async function(key) {
    if (!(await WGConfirm({ title: 'Delete "' + key + '"?', message: 'This species record will be permanently removed from the database.', confirmText: 'Delete', danger: true }))) return;
    window.WildGuardSpeciesDB.remove(key);
    logAct('species_deleted', 'Deleted species ' + key);
    notify('Species deleted', 'info');
    renderDatabase();
  };

  // ============ ACTIVITY LOG ============
  reg('logs', function() {
    var logs = read(K.LOG, []);
    return '<div><h2 style="font-family:var(--font-heading)"><i class="fas fa-clipboard-list"></i> Activity Log</h2>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">' +
      '<span style="opacity:0.6;font-size:0.85rem">' + logs.length + ' recorded events</span>' +
      '<button class="portal-btn portal-btn-danger" onclick="window.portalClearLog()"><i class="fas fa-trash"></i> Clear Log</button></div>' +
      '<div class="portal-card">' +
      (logs.length ? '<div class="portal-table-wrap"><table class="portal-table"><thead><tr><th>Time</th><th>Event</th><th>Details</th><th>User</th></tr></thead><tbody>' +
        logs.map(function(l) {
          var detail = typeof l.details === 'string' ? l.details : (l.details ? JSON.stringify(l.details) : '');
          return '<tr><td style="white-space:nowrap">' + fmt(l.timestamp) + '</td><td><strong>' + esc(l.event || l.action || '') + '</strong></td><td style="max-width:340px;overflow:hidden;text-overflow:ellipsis">' + esc(detail) + '</td><td>' + esc(l.user || 'System') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="portal-empty"><i class="fas fa-clipboard"></i><p>No activity logged</p></div>') +
      '</div></div>';
  });
  window.portalClearLog = async function() {
    if (!(await WGConfirm({ title: 'Clear all activity logs?', message: 'All recorded events will be permanently erased.', confirmText: 'Clear log', danger: true }))) return;
    write(K.LOG, []);
    notify('Activity log cleared', 'success');
    show('logs');
  };

  // ============ SETTINGS ============
  reg('settings', function() {
    return '<div><h2 style="font-family:var(--font-heading)"><i class="fas fa-cog"></i> Settings</h2>' +
      '<div class="portal-grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));">' +
        '<div class="portal-card"><h3 style="margin:0 0 1.5rem"><i class="fas fa-envelope" style="color:var(--accent)"></i> Email Configuration</h3>' +
        '<div class="portal-field"><label>Gmail SMTP Host</label><input type="text" value="smtp.gmail.com" readonly style="width:100%"></div>' +
        '<div class="portal-field"><label>Gmail SMTP Port</label><input type="number" value="587" readonly style="width:100%"></div>' +
        '<div class="portal-field"><label>Sender Email</label><input type="email" id="smtp-email" placeholder="your@gmail.com" value="wildguardsociety@gmail.com" style="width:100%"></div>' +
        '<div class="portal-field"><label>App Password</label><input type="password" id="smtp-password" placeholder="Gmail App Password" style="width:100%"></div>' +
        '<div class="portal-field"><small style="opacity:0.5">Configure in Gmail: Security > 2-Step Verification > App Passwords</small></div>' +
        '<button class="portal-btn portal-btn-primary" style="margin-top:1rem" onclick="window.portalTestEmail()"><i class="fas fa-paper-plane"></i> Test Email</button></div>' +
        '<div class="portal-card"><h3 style="margin:0 0 1.5rem"><i class="fas fa-database" style="color:var(--accent)"></i> Data Management</h3>' +
        '<div class="portal-field"><label>Auto-refresh Interval</label><select id="refresh-interval" style="width:100%"><option value="15000">15 seconds</option><option value="30000" selected>30 seconds</option><option value="60000">1 minute</option><option value="300000">5 minutes</option></select></div>' +
        '<button class="portal-btn portal-btn-secondary" style="margin-top:1rem" onclick="window.portalResetDB()"><i class="fas fa-rotate"></i> Reset Species Database</button>' +
        '<button class="portal-btn portal-btn-danger" style="margin-top:0.75rem" onclick="window.portalClearAll()"><i class="fas fa-trash"></i> Clear All Local Data</button></div>' +
      '</div></div>';
  });
  window.portalTestEmail = function() { notify('Email test sent to configured address', 'info'); };
  window.portalResetDB = async function() {
    if (!(await WGConfirm({ title: 'Reset the species database?', message: 'Your custom species and images will be removed and replaced with the defaults.', confirmText: 'Reset', danger: true }))) return;
    window.WildGuardSpeciesDB.reset();
    notify('Species database reset', 'success');
    setTimeout(function() { show('database'); }, 300);
  };
  window.portalClearAll = async function() {
    if (!(await WGConfirm({ title: 'Clear ALL local data?', message: 'Every WildGuard record on this device — users, scans, messages, settings and more — will be permanently erased. This cannot be undone.', confirmText: 'Clear everything', danger: true }))) return;
    Object.keys(localStorage).filter(function(k) { return k.indexOf('wildguard_') === 0 || k.indexOf('wildlife_') === 0; }).forEach(function(key) { localStorage.removeItem(key); });
    notify('All local data cleared', 'success');
    setTimeout(function() { location.reload(); }, 1000);
  };

  // ============ MODAL HELPER ============
  function showModal(html) {
    var overlay = document.getElementById('portal-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'portal-modal-overlay';
      overlay.className = 'portal-modal-overlay';
      overlay.innerHTML = '<div class="portal-modal" id="portal-modal-inner"></div>';
      document.body.appendChild(overlay);
    }
    var inner = overlay.querySelector('.portal-modal');
    inner.innerHTML = html;
    overlay.classList.add('open');
    overlay.onclick = function(e) { if (e.target === overlay) overlay.classList.remove('open'); };
  }

  // ============ REFRESH ============
  function refreshAllData() {
    if (socket && socket.connected) { try { socket.emit('request_stats_update'); } catch (e) {} }
    updateUnreadBadge();
    updateScansBadge();
    updateUsersBadge();
    updateNotificationBadge();
    if (currentSection === 'dashboard' && sections.dashboard) {
      var el = document.getElementById('portal-content');
      if (el) { try { el.innerHTML = sections.dashboard(); } catch (e) {} }
    }
    if (currentSection === 'database') renderDatabase();
    if (currentSection === 'users') renderUsersList();
    if (currentSection === 'messages') renderMessagesList();
    if (currentSection === 'scans') renderScansList();
  }

  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', function() {
    var nav = document.querySelector('.portal-sidebar');
    if (nav) {
      nav.querySelectorAll('.portal-nav-item').forEach(function(el) {
        el.addEventListener('click', function() { show(el.dataset.section); closeMobileNav(); });
      });
    }
    // Mobile menu toggle
    var menuToggle = document.getElementById('portal-menu-toggle');
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', function() { nav.classList.toggle('open'); });
    }
    function closeMobileNav() {
      if (nav) nav.classList.remove('open');
    }
    // Show default or hash
    show(window.location.hash.replace('#', '') || 'dashboard');

    // Wire nav badges
    updateUnreadBadge();
    updateScansBadge();
    updateUsersBadge();

    // Wire header notification bell
    initNotificationBell();

    // Start SocketIO (optional)
    initSocket();

    // Device online/offline adaptation (browser-level connectivity)
    initConnectivity();

    // Species DB ready -> re-render database section if active
    if (window.WildGuardSpeciesDB) {
      window.WildGuardSpeciesDB.onChange(function() {
        if (currentSection === 'database') renderDatabase();
      });
    }

    // Live cross-tab updates (new registrations, messages, scans)
    window.addEventListener('storage', function(e) {
      if (!e.key) return;
      if (e.key === K.USERS || e.key === K.USER_LIST) { updateUsersBadge(); if (currentSection === 'users') renderUsersList(); if (currentSection === 'dashboard') { var el = document.getElementById('portal-content'); if (el) el.innerHTML = sections.dashboard(); } }
      if (e.key === K.MESSAGES) { updateUnreadBadge(); if (currentSection === 'messages') renderMessagesList(); if (currentSection === 'dashboard') { var el2 = document.getElementById('portal-content'); if (el2) el2.innerHTML = sections.dashboard(); } }
      if (e.key === K.SCANS) { updateScansBadge(); if (currentSection === 'scans') renderScansList(); }
      if (e.key === K.ADMIN_NOTIFS) { updateNotificationBadge(); }
      if (e.key === K.LOG && currentSection === 'logs') { var el3 = document.getElementById('portal-content'); if (el3) el3.innerHTML = sections.logs(); }
    });

    // Auto-refresh
    setInterval(function() {
      if (document.visibilityState === 'visible') refreshAllData();
    }, REFRESH_INTERVAL);
  });

  // ============ EXPORTS ============
  window.portalNotify = notify;
  window.portalShow = show;
  window.portalRefresh = refreshAllData;
  window.loadMessages = function() { show('messages'); };
  window.loadScans = function() { show('scans'); };
  window.loadUsers = function() { show('users'); };
  window.loadAdmins = function() { show('admins'); };
  window.loadLogs = function() { show('logs'); };
  window.loadSettings = function() { show('settings'); };
  window.showModal = showModal;
  window.notify = notify;
  window.logAct = logAct;
})();
