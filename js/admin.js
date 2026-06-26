// WildGuard Admin Dashboard - Functional
(function() {
  "use strict";

  const STORAGE_KEYS = {
    SPECIES: "wildguard_admin_species",
    MESSAGES: "wildguard_admin_messages",
    SETTINGS: "wildguard_admin_settings",
    ADMIN_USERS: "wildguard_admin_users",
    CURRENT_ADMIN: "wildguard_admin_current",
    USER_LIST: "wildguard_user_list",
    VERIFIED_EMAILS: "wildguard_verified_emails"
  };

  function _get(k, d) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch(e) { return d; }
  }
  function _set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function initStorage() {
    if (!_get(STORAGE_KEYS.SPECIES)) _set(STORAGE_KEYS.SPECIES, []);
    if (!_get(STORAGE_KEYS.MESSAGES)) _set(STORAGE_KEYS.MESSAGES, []);
    if (!_get(STORAGE_KEYS.ADMIN_USERS)) _set(STORAGE_KEYS.ADMIN_USERS, {});
    if (!_get(STORAGE_KEYS.SETTINGS)) _set(STORAGE_KEYS.SETTINGS, { siteName: "WildGuard Society", contactEmail: "wildguardsociety@gmail.com", heroTitle: "Protecting Wildlife", heroSubtitle: "Conservation through technology and community" });
    if (!_get(STORAGE_KEYS.CURRENT_ADMIN)) { const admin = _get("wildguard_user"); if (admin) _set(STORAGE_KEYS.CURRENT_ADMIN, admin); }
  }

  function showToast(msg, type) {
    const c = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = "toast " + (type || "success");
    t.innerHTML = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
  function openModal(id) { document.getElementById(id).classList.add("open"); }
  function closeModal(id) { document.getElementById(id).classList.remove("open"); }
  function escapeHtml(t) { const d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

  function getSpecies() { return _get(STORAGE_KEYS.SPECIES, []); }
  function saveSpecies(data) { _set(STORAGE_KEYS.SPECIES, data); }
  function getSpeciesById(id) { return getSpecies().find(s => s.id === id); }
  function addSpecies(s) { const data = getSpecies(); s.id = Date.now().toString(); s.createdAt = new Date().toISOString(); data.push(s); saveSpecies(data); }
  function updateSpecies(id, updates) { const data = getSpecies(); const idx = data.findIndex(s => s.id === id); if (idx >= 0) { data[idx] = { ...data[idx], ...updates }; saveSpecies(data); } }
  function deleteSpecies(id) { const data = getSpecies().filter(s => s.id !== id); saveSpecies(data); }

  function getMessages() { return _get(STORAGE_KEYS.MESSAGES, []); }
  function saveMessages(data) { _set(STORAGE_KEYS.MESSAGES, data); }
  function addMessage(m) { const data = getMessages(); m.id = Date.now().toString(); m.createdAt = new Date().toISOString(); m.status = m.status || "unread"; data.push(m); saveMessages(data); }
  function updateMessage(id, updates) { const data = getMessages(); const idx = data.findIndex(m => m.id === id); if (idx >= 0) { data[idx] = { ...data[idx], ...updates }; saveMessages(data); } }
  function deleteMessage(id) { const data = getMessages().filter(m => m.id !== id); saveMessages(data); }

  function getSettings() { return _get(STORAGE_KEYS.SETTINGS, {}); }
  function saveSettings(s) { _set(STORAGE_KEYS.SETTINGS, s); }

  // User tracking
  function getRegisteredUsers() { return _get(STORAGE_KEYS.USER_LIST, []); }
  function saveRegisteredUsers(users) { _set(STORAGE_KEYS.USER_LIST, users); }
  function trackUserLogin(email, name) {
    var users = getRegisteredUsers();
    var idx = users.findIndex(function(u) { return u.email === email; });
    var now = new Date().toISOString();
    if (idx >= 0) {
      users[idx].lastLogin = now;
      users[idx].loginCount = (users[idx].loginCount || 0) + 1;
      users[idx].name = name || users[idx].name;
    } else {
      users.push({ email: email, name: name || email.split("@")[0], registeredAt: now, lastLogin: now, loginCount: 1, status: "offline" });
    }
    saveRegisteredUsers(users);
  }
  function setUserOnline(email) {
    var users = getRegisteredUsers();
    var idx = users.findIndex(function(u) { return u.email === email; });
    if (idx >= 0) { users[idx].status = "online"; users[idx].lastActive = new Date().toISOString(); saveRegisteredUsers(users); }
  }
  function setUserOffline(email) {
    var users = getRegisteredUsers();
    var idx = users.findIndex(function(u) { return u.email === email; });
    if (idx >= 0) { users[idx].status = "offline"; users[idx].lastActive = new Date().toISOString(); saveRegisteredUsers(users); }
  }
  function getOnlineUserCount() {
    return getRegisteredUsers().filter(function(u) { return u.status === "online"; }).length;
  }
  function getActivitySummary() {
    var users = getRegisteredUsers();
    var now = Date.now();
    return users.map(function(u) {
      var lastActive = u.lastActive ? new Date(u.lastActive).getTime() : 0;
      var isOnline = u.status === "online" && (now - lastActive) < 5 * 60 * 1000;
      return { email: u.email, name: u.name, status: isOnline ? "online" : "offline", lastLogin: u.lastLogin, loginCount: u.loginCount || 0, registeredAt: u.registeredAt };
    });
  }

  // Admin user functions (original)
  function getAdminUsers() { return _get(STORAGE_KEYS.ADMIN_USERS, {}); }
  function saveAdminUsers(users) { _set(STORAGE_KEYS.ADMIN_USERS, users); }
  function addAdminUser(email, name, password, role) {
    const users = getAdminUsers();
    users[email.toLowerCase()] = { name: name, password: password, role: role || "admin", createdAt: new Date().toISOString() };
    saveAdminUsers(users);
  }
  function deleteAdminUser(email) { const users = getAdminUsers(); delete users[email.toLowerCase()]; saveAdminUsers(users); }

  // Email Verification
  function isVerified(email) {
    var verified = _get(STORAGE_KEYS.VERIFIED_EMAILS, []);
    return verified.indexOf(email.toLowerCase()) >= 0;
  }
  function verifyEmail(email) {
    var verified = _get(STORAGE_KEYS.VERIFIED_EMAILS, []);
    if (verified.indexOf(email.toLowerCase()) < 0) {
      verified.push(email.toLowerCase());
      _set(STORAGE_KEYS.VERIFIED_EMAILS, verified);
    }
  }
  function getVerifiedCount() {
    return _get(STORAGE_KEYS.VERIFIED_EMAILS, []).length;
  }
  function getUnverifiedUsers() {
    var users = getRegisteredUsers();
    var verified = _get(STORAGE_KEYS.VERIFIED_EMAILS, []);
    return users.filter(function(u) { return verified.indexOf(u.email.toLowerCase()) < 0; }); }

  // Avatar & Profile
  function getAvatar() { return _get(\"wildguard_admin_avatar\", null); }
  function saveAvatar(data) { _set(\"wildguard_admin_avatar\", data); }

  function updateProfileInfo() {
    var user = _get(\"wildguard_user\") || {};
    var nameEl = document.getElementById(\"admin-name\");
    var emailEl = document.getElementById(\"admin-email\");
    var avatarEl = document.getElementById(\"admin-avatar\");
    if (nameEl) nameEl.textContent = user.name || \"Administrator\";
    if (emailEl) emailEl.textContent = user.email || \"admin@wildguardsociety.org\";
    if (avatarEl) {
      var av = getAvatar();
      if (av) { avatarEl.innerHTML = '<img src=\"' + av + '\">'; }
      else { avatarEl.textContent = (user.name || \"A\").charAt(0).toUpperCase(); }
    }
  }

  function setupAvatarUpload() {
    var upload = document.getElementById(\"avatar-upload\");
    if (!upload) return;
    upload.addEventListener(\"change\", function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(evt) {
        saveAvatar(evt.target.result);
        updateProfileInfo();
        showToast(\"Profile photo updated\", \"success\");
      };
      reader.readAsDataURL(file);
    });
  }

  function renderUsers() {
    var users = getActivitySummary();
    var onlineCount = users.filter(function(u) { return u.status === "online"; }).length;
    var html = '<div class="page-header"><h1>User Management</h1><p>View registered users and their activity status</p></div>' +
      '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-value">' + users.length + '</div><div class="stat-label">Total Users</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + onlineCount + '</div><div class="stat-label">Online Now</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + (users.length - onlineCount) + '</div><div class="stat-label">Offline</div></div>' +
      '</div>';
    if (users.length === 0) {
      html += '<div class="content-section"><div class="empty-state"><div class="empty-state-icon">&#x1F465;</div><h3>No registered users</h3><p>Users will appear here after they log in.</p></div></div>';
    } else {
      html += '<div class="content-section"><h2><i class="fas fa-user-friends"></i> Registered Users</h2><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Logins</th><th>Last Login</th><th>Registered</th><th>Actions</th></tr></thead><tbody>';
      users.forEach(function(u) {
        html += '<tr><td>' + escapeHtml(u.name) + '</td><td>' + escapeHtml(u.email) + '</td><td><span class="badge badge-' + (u.status === "online" ? "success" : "danger") + '">' + (u.status === "online" ? "Online" : "Offline") + '</span></td><td>' + u.loginCount + '</td><td>' + (u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never") + '</td><td>' + (u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : "Unknown") + '</td><td class="actions-cell"><button class="btn btn-sm btn-primary" onclick="viewUserDetails('' + u.email + '')"><i class="fas fa-eye"></i></button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    return html;
  }

  function viewUserDetails(email) {
    var users = getRegisteredUsers();
    var u = users.find(function(user) { return user.email === email; });
    if (!u) return;
    var body = document.getElementById("user-detail-body");
    if (body) {
      body.innerHTML = '<div class="form-row"><div class="form-group"><label>Name</label><p>' + escapeHtml(u.name || "Unknown") + '</p></div><div class="form-group"><label>Email</label><p>' + escapeHtml(u.email) + '</p></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Status</label><p><span class="badge badge-' + (u.status === "online" ? "success" : "danger") + '">' + (u.status === "online" ? "Online" : "Offline") + '</span></p></div><div class="form-group"><label>Total Logins</label><p>' + (u.loginCount || 0) + '</p></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Registered</label><p>' + (u.registeredAt ? new Date(u.registeredAt).toLocaleString() : "Unknown") + '</p></div><div class="form-group"><label>Last Login</label><p>' + (u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never") + '</p></div></div>';
    }
    openModal("modal-user-detail");
  }

  function renderDashboard() {
    const species = getSpecies();
    const messages = getMessages();
    const unread = messages.filter(m => m.status === "unread").length;
    return '<div class="page-header"><h1>Dashboard</h1><p>Overview of your wildlife conservation platform</p></div>' +
      '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-value">' + species.length + '</div><div class="stat-label">Species Catalogued</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + messages.length + '</div><div class="stat-label">Messages Received</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + unread + '</div><div class="stat-label">Unread Messages</div></div>' +
      '<div class="stat-card"><div class="stat-value">Online</div><div class="stat-label">System Status</div></div>' +
      '</div>' +
      '<div class="content-section"><h2><i class="fas fa-bolt"></i> Quick Actions</h2>' +
      '<button class="btn btn-accent" onclick="openModal(\'modal-add-species\')"><i class="fas fa-plus"></i> Add Species</button> ' +
      '<button class="btn btn-info" onclick="openModal(\'modal-add-message\')"><i class="fas fa-envelope"></i> Send Message</button> ' +
      '<button class="btn btn-primary" onclick="loadSection(\'admins\')"><i class="fas fa-user-plus"></i> Add Admin</button>' +
      '</div>' +
      '<div class="content-section"><h2><i class="fas fa-chart-line"></i> Recent Activity</h2><p>Welcome to the WildGuard Admin Dashboard.</p></div>';
  }

  function renderSpecies() {
    const species = getSpecies();
    let html = '<div class="page-header"><h1>Species Management</h1><p>Manage wildlife species in your database</p></div>' +
      '<div style="margin-bottom:1rem;"><button class="btn btn-accent" onclick="openModal(\'modal-add-species\')"><i class="fas fa-plus"></i> Add New Species</button></div>';
    if (species.length === 0) {
      html += '<div class="content-section"><div class="empty-state"><div class="empty-state-icon">&#x1F43E;</div><h3>No species found</h3><p>Add your first species using the button above.</p></div></div>';
    } else {
      html += '<div class="content-section"><h2><i class="fas fa-paw"></i> Species List</h2><table class="data-table"><thead><tr><th>Name</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
      species.forEach(s => {
        html += '<tr data-id="' + s.id + '"><td>' + escapeHtml(s.name) + '</td><td><span class="badge badge-' + (s.status === "Endangered" ? "danger" : "success") + '">' + escapeHtml(s.status) + '</span></td><td class="actions-cell"><button class="btn btn-sm btn-primary" onclick="editSpecies(\'' + s.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="removeSpecies(\'' + s.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    return html;
  }

  function renderMessages() {
    const messages = getMessages();
    let html = '<div class="page-header"><h1>Messages</h1><p>View and manage messages from visitors and staff</p></div>' +
      '<div style="margin-bottom:1rem;"><button class="btn btn-accent" onclick="openModal(\'modal-add-message\')"><i class="fas fa-plus"></i> Compose Message</button></div>';
    if (messages.length === 0) {
      html += '<div class="content-section"><div class="empty-state"><div class="empty-state-icon">&#x1F4ED;</div><h3>No messages found</h3><p>Messages will appear here.</p></div></div>';
    } else {
      html += '<div class="content-section"><h2><i class="fas fa-envelope"></i> Message List</h2><table class="data-table"><thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
      messages.slice().reverse().forEach(m => {
        html += '<tr data-id="' + m.id + '"><td>' + escapeHtml(m.name || m.from || "Unknown") + '</td><td>' + escapeHtml(m.subject) + '</td><td><span class="badge badge-' + (m.status === "read" ? "success" : "warning") + '">' + (m.status === "read" ? "Read" : "Unread") + '</span></td><td>' + new Date(m.createdAt).toLocaleString() + '</td><td class="actions-cell"><button class="btn btn-sm btn-primary" onclick="viewMessage(\'' + m.id + '\')"><i class="fas fa-eye"></i></button> <button class="btn btn-sm btn-danger" onclick="removeMessage(\'' + m.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    return html;
  }

  function renderSettings() {
    const s = getSettings();
    return '<div class="page-header"><h1>Site Settings</h1><p>Configure global settings for your website</p></div>' +
      '<div class="content-section"><h2><i class="fas fa-cog"></i> General Settings</h2>' +
      '<form id="settings-form">' +
      '<div class="form-row">' +
      '<div class="form-group"><label>Site Name</label><input type="text" id="siteName" value="' + escapeHtml(s.siteName) + '"></div>' +
      '<div class="form-group"><label>Contact Email</label><input type="email" id="contactEmail" value="' + escapeHtml(s.contactEmail) + '"></div>' +
      '<div class="form-group"><label>Hero Title</label><input type="text" id="heroTitle" value="' + escapeHtml(s.heroTitle) + '"></div>' +
      '<div class="form-group"><label>Hero Subtitle</label><input type="text" id="heroSubtitle" value="' + escapeHtml(s.heroSubtitle) + '"></div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary">Save Settings</button>' +
      '</form></div>' +
      '<div class="content-section"><h2><i class="fas fa-lock"></i> Change Password</h2>' +
      '<form id="password-form">' +
      '<div class="form-group"><label>Current Password</label><input type="password" id="currentPassword" required></div>' +
      '<div class="form-row">' +
      '<div class="form-group"><label>New Password</label><input type="password" id="newPassword" required></div>' +
      '<div class="form-group"><label>Confirm New Password</label><input type="password" id="confirmPassword" required></div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary">Change Password</button>' +
      '</form></div>';
  }

  function renderAdmins() {
    const users = Object.entries(getAdminUsers());
    let html = '<div class="page-header"><h1>Admin Users</h1><p>Manage administrator accounts</p></div>' +
      '<div style="margin-bottom:1rem;"><button class="btn btn-accent" onclick="openModal(\'modal-add-admin\')"><i class="fas fa-user-plus"></i> Add New Admin</button></div>';
    if (users.length === 0) {
      html += '<div class="content-section"><div class="empty-state"><div class="empty-state-icon">&#x1F464;</div><h3>No admin users</h3><p>Add admin users using the button above.</p></div></div>';
    } else {
      html += '<div class="content-section"><h2><i class="fas fa-users"></i> Admin List</h2><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>';
      users.forEach(([email, u]) => {
        html += '<tr><td>' + escapeHtml(u.name || email) + '</td><td>' + escapeHtml(email) + '</td><td><span class="badge badge-info">' + escapeHtml(u.role) + '</span></td><td class="actions-cell"><button class="btn btn-sm btn-danger" onclick="removeAdmin(\'' + email + '\')"><i class="fas fa-trash"></i></button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    return html;
  }

  function removeSpecies(id) { if (!confirm("Are you sure you want to delete this species?")) return; deleteSpecies(id); showToast("Species deleted", "success"); loadSection("species"); }
  function editSpecies(id) { const s = getSpeciesById(id); if (!s) return; const name = prompt("Species name:", s.name); const status = prompt("Status (e.g. Endangered, Vulnerable):", s.status); if (!name || !status) return; updateSpecies(id, {name, status}); showToast("Species updated", "success"); loadSection("species"); }
  function removeMessage(id) { if (!confirm("Delete this message?")) return; deleteMessage(id); showToast("Message deleted", "success"); loadSection("messages"); }
  function viewMessage(id) { const m = getMessages().find(msg => msg.id === id); if (!m) return; updateMessage(id, {status: "read"}); alert("From: " + (m.name || m.from) + "\nSubject: " + m.subject + "\n\n" + m.body); loadSection("messages"); }
  function removeAdmin(email) { if (!confirm("Remove admin " + email + "?")) return; if (email === "admin@wildguardsociety.org") { showToast("Cannot remove default admin", "error"); return; } deleteAdminUser(email); showToast("Admin removed", "success"); loadSection("admins"); }

  function setupFormHandlers() {
    document.getElementById("form-add-species").addEventListener("submit", function(e) {
      e.preventDefault();
      const name = document.getElementById("sp-name").value;
      const status = document.getElementById("sp-status").value;
      const description = document.getElementById("sp-desc").value;
      addSpecies({name, status, description});
      closeModal("modal-add-species"); document.getElementById("form-add-species").reset(); showToast("Species added", "success"); loadSection("species");
    });
    document.getElementById("form-add-message").addEventListener("submit", function(e) {
      e.preventDefault();
      const from = document.getElementById("msg-from").value;
      const subject = document.getElementById("msg-subject").value;
      const body = document.getElementById("msg-body").value;
      addMessage({from, subject, body, name: from, status: "read"});
      closeModal("modal-add-message"); document.getElementById("form-add-message").reset(); showToast("Message sent", "success"); loadSection("messages");
    });
    document.getElementById("form-add-admin").addEventListener("submit", function(e) {
      e.preventDefault();
      const name = document.getElementById("adm-name").value;
      const email = document.getElementById("adm-email").value;
      const password = document.getElementById("adm-password").value;
      const role = document.getElementById("adm-role").value;
      addAdminUser(email, name, password, role);
      closeModal("modal-add-admin"); document.getElementById("form-add-admin").reset(); showToast("Admin added", "success"); loadSection("admins");
    }); document.body.addEventListener("submit", function(e) {
      if (e.target.id === "settings-form") { e.preventDefault(); const s = getSettings(); s.siteName = document.getElementById("siteName").value; s.contactEmail = document.getElementById("contactEmail").value; s.heroTitle = document.getElementById("heroTitle").value; s.heroSubtitle = document.getElementById("heroSubtitle").value; saveSettings(s); showToast("Settings saved", "success"); }
      if (e.target.id === "password-form") { e.preventDefault(); const p = document.getElementById("newPassword").value; const c = document.getElementById("confirmPassword").value; const cur = document.getElementById("currentPassword").value; const a = _get(STORAGE_KEYS.CURRENT_ADMIN); const u = _get(STORAGE_KEYS.ADMIN_USERS, {}); const target = (a && a.email) ? u[a.email.toLowerCase()] : null; if (!target && a && a.email === "admin@wildguardsociety.org") { if (cur !== "admin123") { showToast("Incorrect current password", "error"); return; } u["admin@wildguardsociety.org"] = {name: "Administrator", password: "admin123", role: "admin"}; u[a.email.toLowerCase()] = u["admin@wildguardsociety.org"]; saveAdminUsers(u); } else if (!target) { showToast("Current admin not found", "error"); return; } else if (target.password !== cur) { showToast("Incorrect current password", "error"); return; } if (p !== c) { showToast("Passwords do not match", "error"); return; } if (p.length < 6) { showToast("Password too short", "error"); return; } target.password = p; saveAdminUsers(u); showToast("Password changed", "success"); document.getElementById("password-form").reset(); }
    });
  }

  function loadSection(section) {
    const contentArea = document.getElementById("content-area");
    contentArea.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading...</p></div>';
    let html = "";
    switch(section) {
      case "dashboard": html = renderDashboard(); break;
      case "species": html = renderSpecies(); break;
      case "messages": html = renderMessages(); break;
      case "settings": html = renderSettings(); break;
      case "users": html = renderUsers(); break;
      case "admins": html = renderAdmins(); break;
      default: html = "<p>Section not found</p>";
    }
    contentArea.innerHTML = html;
    setupFormHandlers();
  }

  function checkAuth() {
    var user = _get("wildguard_user");
    if (!user || (user.role !== "admin" && user.email !== "admin@wildguardsociety.org")) { window.location.href = "admin-login.html"; return false; }
    _set(STORAGE_KEYS.CURRENT_ADMIN, user);
    if (user.email) { trackUserLogin(user.email, user.name); setUserOnline(user.email); }
    return true;
  }

  window.addEventListener("beforeunload", function() {
    var user = _get("wildguard_user");
    if (user && user.email) { setUserOffline(user.email); }
  });

  document.addEventListener("DOMContentLoaded", function() {
    if (!checkAuth()) return;
    initStorage();
    const links = document.querySelectorAll(".nav-item[data-section]");
    links.forEach(l => { l.addEventListener("click", function(e) { e.preventDefault(); const section = this.dataset.section; links.forEach(x => x.classList.remove("active")); this.classList.add("active"); loadSection(section); }); });
    loadSection("dashboard");
    // Top navigation handlers
    const topLinks = document.querySelectorAll(".nav-link[data-section]");
    topLinks.forEach(function(l) {
      l.addEventListener("click", function(e) {
        e.preventDefault();
        var section = this.dataset.section;
        topLinks.forEach(function(x) { x.classList.remove("active"); });
        this.classList.add("active");
        document.querySelectorAll(".nav-item[data-section]").forEach(function(x) { x.classList.remove("active"); });
        var matching = document.querySelector('.nav-item[data-section="' + section + '"]');
        if (matching) matching.classList.add("active");
        loadSection(section);
      });
    });
    const sidebarLogout = document.getElementById("sidebar-logout-link");
    const topLogout = document.getElementById("top-logout");
    if (sidebarLogout) sidebarLogout.addEventListener("click", function(e) { e.preventDefault(); localStorage.removeItem("wildguard_user"); window.location.href = "admin-login.html"; });
    if (topLogout) topLogout.addEventListener("click", function(e) { e.preventDefault(); localStorage.removeItem("wildguard_user"); window.location.href = "admin-login.html"; });
  });

})();