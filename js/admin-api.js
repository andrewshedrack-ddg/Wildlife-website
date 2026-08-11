/* WildGuard Society - Admin Data API Module
 * Backend-backed access to admin dashboard data (stats, users, messages,
 * activity, broadcasts). Falls back to localStorage when no Flask backend is
 * reachable so the admin portal remains fully functional in demo/static mode.
 *
 * All public methods return Promises and never throw.
 */
(function () {
  'use strict';

  function apiBase() {
    try {
      if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
        return 'http://localhost:5000';
      }
      if (window.location.origin.includes('github.io') || window.location.protocol === 'file:') {
        return '';
      }
      return '/api';
    } catch (e) {
      return '';
    }
  }

  function backendAvailable() {
    return apiBase() !== '';
  }

  async function request(path, options) {
    const base = apiBase();
    if (!base) return null;
    options = options || {};
    options.credentials = 'include';
    if (options.body && typeof options.body !== 'string') {
      options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
      options.body = JSON.stringify(options.body);
    }
    try {
      const resp = await fetch(base + path, options);
      if (resp.status === 401 || resp.status === 403) return null;
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return Object.assign({ ok: false, message: data.message || 'Request failed' }, data);
      return Object.assign({ ok: true }, data);
    } catch (e) {
      return null;
    }
  }

  function getItem(key, def) {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch (e) { return def; }
  }

  // ---------- Stats ----------
  async function getStats() {
    const backend = await request('/api/admin/stats');
    if (backend && backend.ok) {
      return {
        pending_scans: backend.pending_scans || 0,
        total_species: backend.total_species || 0,
        total_users: backend.total_users || 0,
        total_messages: backend.total_messages || 0
      };
    }
    const scans = getItem('wildlife_scans', []);
    const pending = getItem('wildlife_pending_admin', []);
    const users = getItem('wildguard_user_list', []).concat(Object.keys(getItem('wildguard_demo_users', {})).length ? [getItem('wildguard_demo_users', {})] : []);
    const messages = getItem('wildguard_admin_messages', []);
    return {
      pending_scans: pending.length,
      total_species: scans.length,
      total_users: users.length,
      total_messages: messages.length
    };
  }

  // ---------- Users ----------
  async function getUsers() {
    const backend = await request('/api/admin/users');
    if (backend && backend.ok && Array.isArray(backend.users)) {
      return backend.users.map(function (u) {
        return {
          id: u.id, email: u.email, role: u.role,
          registeredAt: u.created_at, is_online: u.is_online, last_seen: u.last_seen,
          source: 'backend'
        };
      });
    }
    const list = getItem('wildguard_user_list', []);
    const demo = Object.entries(getItem('wildguard_demo_users', {}))
      .map(function (entry) { return { email: entry[0], ...entry[1], registeredAt: entry[1].registeredAt || new Date().toISOString() }; });
    const merged = list.concat(demo).filter(function (v, i, a) {
      return a.findIndex(function (t) { return t.email === v.email; }) === i;
    });
    return merged;
  }

  // ---------- Messages ----------
  async function getMessages() {
    const backend = await request('/api/admin/messages');
    if (backend && backend.ok && Array.isArray(backend.messages)) {
      return backend.messages.map(function (m) {
        return {
          id: m.id, name: m.name, email: m.email, subject: m.subject,
          body: m.content, message: m.content, createdAt: m.created_at,
          read: m.read, status: m.read ? 'read' : 'unread',
          source: 'backend'
        };
      });
    }
    return getItem('wildguard_admin_messages', []);
  }

  async function deleteMessage(id) {
    const backend = await request('/api/admin/messages/' + encodeURIComponent(id), { method: 'DELETE' });
    if (backend && backend.ok) return { success: true };
    return { success: false, message: 'Could not delete message.' };
  }

  // ---------- Activity ----------
  async function getActivity() {
    const backend = await request('/api/admin/activity');
    if (backend && backend.ok && Array.isArray(backend.activity)) {
      return backend.activity.map(function (l) {
        return {
          id: l.id, event: l.action, details: l.details || '', user: String(l.user_id || ''),
          timestamp: l.timestamp, source: 'backend'
        };
      });
    }
    return getItem('wildguard_activity_log', []);
  }

  // ---------- Species ----------
  async function getSpecies() {
    const backend = await request('/api/species');
    if (backend && backend.ok && Array.isArray(backend.species)) {
      return backend.species.map(function (s) {
        return { id: s.id, name: s.name, status: s.status, description: s.description, image_url: s.image_url, source: 'backend' };
      });
    }
    return getItem('wildguard_species', []);
  }

  async function createSpecies(data) {
    const backend = await request('/api/admin/species', { method: 'POST', body: data });
    if (backend && backend.ok) return { success: true, id: backend.id };
    return { success: false, message: backend && backend.message ? backend.message : 'Could not add species.' };
  }

  async function updateSpecies(id, data) {
    const backend = await request('/api/admin/species/' + encodeURIComponent(id), { method: 'PUT', body: data });
    if (backend && backend.ok) return { success: true };
    return { success: false, message: backend && backend.message ? backend.message : 'Could not update species.' };
  }

  async function deleteSpecies(id) {
    const backend = await request('/api/admin/species/' + encodeURIComponent(id), { method: 'DELETE' });
    if (backend && backend.ok) return { success: true };
    return { success: false, message: backend && backend.message ? backend.message : 'Could not delete species.' };
  }

  // ---------- Broadcast ----------
  async function broadcast(recipients, subject, body) {
    const backend = await request('/api/admin/broadcast', {
      method: 'POST',
      body: { recipients: recipients, subject: subject, body: body }
    });
    if (backend && backend.ok) {
      return { success: true, recipients: backend.recipients || recipients.length, message: backend.message };
    }
    return { success: false, message: backend && backend.message ? backend.message : 'Could not send broadcast.' };
  }

  var AdminAPI = {
    apiBase: apiBase,
    backendAvailable: backendAvailable,
    getStats: getStats,
    getUsers: getUsers,
    getMessages: getMessages,
    deleteMessage: deleteMessage,
    getActivity: getActivity,
    getSpecies: getSpecies,
    createSpecies: createSpecies,
    updateSpecies: updateSpecies,
    deleteSpecies: deleteSpecies,
    broadcast: broadcast
  };
  window.AdminAPI = AdminAPI;
})();
