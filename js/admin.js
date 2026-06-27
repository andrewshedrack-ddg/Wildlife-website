// admin.js - Fetches real data from backend and populates admin dashboard
(function() {
  const API_BASE = window.location.origin.includes('localhost') && !window.location.origin.includes(':5000')
    ? 'http://localhost:5000'
    : '';

  async function fetchData(path) {
    try {
      const resp = await fetch(API_BASE + path, { credentials: 'include' });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) { return null; }
  }

  function updateStats(data) {
    if (!data) return;
    const elPending = document.getElementById('statPending');
    const elTotal = document.getElementById('statTotal');
    const elToday = document.getElementById('statToday');
    const elUsers = document.getElementById('statUsers');
    if (elPending && data.total_messages != null) elPending.textContent = data.total_messages;
    if (elTotal && data.total_species != null) elTotal.textContent = data.total_species;
    if (elToday && data.total_species != null) elToday.textContent = data.total_species;
    if (elUsers && data.total_users != null) elUsers.textContent = data.total_users;
  }

  async function loadAdminData() {
    const stats = await fetchData('/api/admin/stats');
    updateStats(stats);
  }

  if (document.getElementById('statPending')) {
    loadAdminData();
  }
})();
