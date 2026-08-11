/* WildGuard Society - User Data API Module
 * Provides backend-backed access to a user's scans, favourites, profile and
 * notifications. When no Flask backend is reachable (static/GitHub Pages
 * hosting) every function falls back to the equivalent localStorage store so
 * the site remains fully functional as a demo.
 *
 * All public methods return Promises that resolve to data (or null on failure)
 * and never throw, matching the site's graceful-degradation philosophy.
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
      if (resp.status === 401) return null;
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return Object.assign({ ok: false, message: data.message || 'Request failed' }, data);
      }
      return Object.assign({ ok: true }, data);
    } catch (e) {
      return null;
    }
  }

  function currentSession() {
    try { return JSON.parse(localStorage.getItem('wildguard_user') || 'null'); } catch (e) { return null; }
  }

  // ---------- Scans ----------
  async function getScans() {
    const backend = await request('/api/user/scans');
    if (backend && backend.ok && Array.isArray(backend.scans)) {
      // Normalise backend records to the shape the UI expects.
      return backend.scans.map(function (s) {
        return {
          id: s.id,
          species: { name: s.species_name },
          label: s.species_name,
          confidence: s.confidence,
          imageData: s.image_data || '',
          timestamp: s.created_at,
          source: 'backend'
        };
      });
    }
    if (typeof window.getUserScans === 'function') return window.getUserScans();
    try { return JSON.parse(localStorage.getItem('wildlife_scans') || '[]'); } catch (e) { return []; }
  }

  async function addScan(payload) {
    const backend = await request('/api/user/scans', {
      method: 'POST',
      body: {
        species_name: payload.species_name,
        confidence: payload.confidence,
        image_data: payload.image_data || ''
      }
    });
    if (backend && backend.ok) return { success: true, id: backend.id };
    return { success: false, message: 'Could not save scan. Demo mode: scan stored locally.' };
  }

  // ---------- Favourites ----------
  async function getFavourites() {
    const backend = await request('/api/user/favourites');
    if (backend && backend.ok && Array.isArray(backend.favourites)) {
      return backend.favourites.map(function (f) {
        return {
          id: f.id,
          speciesKey: f.species_name,
          name: f.species_name,
          addedAt: f.created_at,
          source: 'backend'
        };
      });
    }
    if (typeof window.getUserFavourites === 'function') return window.getUserFavourites();
    try { return JSON.parse(localStorage.getItem('wildguard_favourites') || '[]'); } catch (e) { return []; }
  }

  async function addFavourite(speciesName) {
    const backend = await request('/api/user/favourites', {
      method: 'POST',
      body: { species_name: speciesName }
    });
    if (backend && backend.ok) return { success: true, id: backend.id };
    return { success: false, message: 'Could not save favourite.' };
  }

  async function removeFavourite(idOrKey) {
    if (idOrKey === undefined || idOrKey === null) return { success: false, message: 'Missing id' };
    const backend = await request('/api/user/favourites/' + encodeURIComponent(idOrKey), {
      method: 'DELETE'
    });
    if (backend && backend.ok) return { success: true };
    return { success: false, message: 'Could not remove favourite.' };
  }

  // ---------- Profile ----------
  async function getProfile() {
    const backend = await request('/api/user/profile');
    if (backend && backend.ok) return backend;
    if (typeof window.getCurrentUser === 'function') {
      const u = window.getCurrentUser();
      if (u) return u;
    }
    return null;
  }

  async function updateProfile(profile) {
    const backend = await request('/api/user/profile', {
      method: 'PUT',
      body: profile
    });
    if (backend && backend.ok) return { success: true, profile: backend.profile };
    // Fall back to the local session store.
    if (typeof window.updateUserProfile === 'function') return window.updateUserProfile(profile);
    return { success: false, message: 'Could not save profile.' };
  }

  async function changePassword(currentPassword, newPassword) {
    const backend = await request('/api/user/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword }
    });
    if (backend && backend.ok) return { success: true, message: backend.message || 'Password updated' };
    if (backend) return { success: false, message: backend.message || 'Password change failed' };
    return { success: false, message: 'Password changes require the backend. Demo mode does not store passwords.' };
  }

  // ---------- Notifications (Inbox) ----------
  async function getNotifications() {
    const backend = await request('/api/user/notifications');
    if (backend && backend.ok && Array.isArray(backend.notifications)) {
      return backend.notifications.map(function (n) {
        return {
          id: n.id,
          type: n.type,
          subject: n.title,
          body: n.body,
          from: n.from || 'WildGuard Admin',
          read: n.read,
          timestamp: n.timestamp
        };
      });
    }
    // localStorage inbox store
    try { return JSON.parse(localStorage.getItem('wildguard_emails') || '[]'); } catch (e) { return []; }
  }

  async function markNotificationRead(id) {
    await request('/api/user/notifications/' + encodeURIComponent(id) + '/read', { method: 'POST' });
  }

  var UserAPI = {
    apiBase: apiBase,
    backendAvailable: backendAvailable,
    getScans: getScans,
    addScan: addScan,
    getFavourites: getFavourites,
    addFavourite: addFavourite,
    removeFavourite: removeFavourite,
    getProfile: getProfile,
    updateProfile: updateProfile,
    changePassword: changePassword,
    getNotifications: getNotifications,
    markNotificationRead: markNotificationRead
  };
  window.UserAPI = UserAPI;
})();
