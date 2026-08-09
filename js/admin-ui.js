// Admin dashboard static content for demo
(function() {
  'use strict';

  // Default content for each section
  const sections = {
    dashboard: {
      title: 'Dashboard Overview',
      content: `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.5rem; margin-bottom:2rem;">
          <div style="background: linear-gradient(135deg, #1b5e40, #143d2a); padding: 1.5rem; border-radius: 12px; color: #fff; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🐾</div>
            <div style="font-size: 2rem; font-weight: 700;">0</div>
            <div style="font-size: 0.9rem; opacity: 0.8;">Pending Scans</div>
          </div>
          <div style="background: linear-gradient(135deg, #1e3a2f, #0f2a20); padding: 1.5rem; border-radius: 12px; color: #fff; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
            <div style="font-size: 2rem; font-weight: 700;">0</div>
            <div style="font-size: 0.9rem; opacity: 0.8;">Species</div>
          </div>
          <div style="background: linear-gradient(135deg, #2d8a5e, #1b5e40); padding: 1.5rem; border-radius: 12px; color: #fff; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
            <div style="font-size: 2rem; font-weight: 700;">0</div>
            <div style="font-size: 0.9rem; opacity: 0.8;">Users</div>
          </div>
          <div style="background: linear-gradient(135deg, #c9a227, #b8941d); padding: 1.5rem; border-radius: 12px; color: #1a1a1a; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📬</div>
            <div style="font-size: 2rem; font-weight: 700;">0</div>
            <div style="font-size: 0.9rem; opacity: 0.8;">Messages</div>
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
          <h2 style="margin-bottom: 1rem;">Admin Dashboard</h2>
          <p style="opacity: 0.7; margin-bottom: 1.5rem;">Welcome to the WildGuard Society admin dashboard. Backend services are not connected yet, but you can use the interface to see how the dashboard works.</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
            <a href="admin/Dashboard.html" style="display: block; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.5rem; text-align: center; transition: 0.3s; color: inherit; text-decoration: none;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
              <h3 style="margin: 0 0 0.5rem; font-size: 1rem;">Modern Dashboard</h3>
              <p style="font-size: 0.85rem; opacity: 0.6;">Access the upgraded admin panel</p>
            </a>
            <a href="admin/manage-animals.html" style="display: block; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.5rem; text-align: center; transition: 0.3s; color: inherit; text-decoration: none;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">🦁</div>
              <h3 style="margin: 0 0 0.5rem; font-size: 1rem;">Manage Animals</h3>
              <p style="font-size: 0.85rem; opacity: 0.6;">Add or edit species data</p>
            </a>
            <a href="admin/upload.html" style="display: block; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.5rem; text-align: center; transition: 0.3s; color: inherit; text-decoration: none;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">☁️</div>
              <h3 style="margin: 0 0 0.5rem; font-size: 1rem;">Upload Content</h3>
              <p style="font-size: 0.85rem; opacity: 0.6;">Upload images and resources</p>
            </a>
          </div>
        </div>`
    },
    species: {
      title: 'Species Management',
      content: '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem;"><h2>Species Management</h2><p style="opacity:0.7; margin-top:1rem;">This section would display and manage wildlife species data. Backend integration is required for full functionality.</p></div>'
    },
    messages: {
      title: 'Messages',
      content: '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem;"><h2>Contact Messages</h2><p style="opacity:0.7; margin-top:1rem;">This section would display user contact messages. Backend integration is required for full functionality.</p></div>'
    },
    users: {
      title: 'User Management',
      content: '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem;"><h2>User Management</h2><p style="opacity:0.7; margin-top:1rem;">This section would display and manage registered users. Backend integration is required for full functionality.</p></div>'
    },
    admins: {
      title: 'Admin Users',
      content: '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem;"><h2>Admin Users</h2><p style="opacity:0.7; margin-top:1rem;">This section would display and manage admin users. Backend integration is required for full functionality.</p></div>'
    },
    settings: {
      title: 'Settings',
      content: '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 2rem;"><h2>Settings</h2><p style="opacity:0.7; margin-top:1rem;">This section would allow configuration of admin panel settings. Backend integration is required for full functionality.</p></div>'
    }
  };

  // Wait for DOM
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function loadSection(sectionId) {
    const area = document.getElementById('content-area');
    if (!area || !sections[sectionId]) return;

    // Fade out
    area.style.opacity = '0';
    area.style.transition = 'opacity 0.2s ease';

    setTimeout(() => {  area.innerHTML = sections[sectionId].content;  area.style.opacity = '1'; }, 200);

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-section') === sectionId) {
        item.classList.add('active');
      }
    });
  }

  ready(() => {
    // Load default section
    loadSection('dashboard');

    // Add click handlers to sidebar nav items
    document.querySelectorAll('.sidebar-nav .nav-item[data-section]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        loadSection(section);
      });
    });

    // Logout link
    const logoutLink = document.getElementById('sidebar-logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          window.location.href = 'index.html';
        }
      });
    }
  });
})();