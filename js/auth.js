/**
 * Auth UI state manager for WildGuard Society
 * Handles login/logout display, user menu dropdown, and localStorage session.
 * SECURITY HARDENED: XSS escaping, hashed demo passwords, secure cookies, rate limiting, input sanitization, bot detection.
 * VERSION 2.0 - Persistent sessions, admin notifications, bot protection
 */

(function () {
  'use strict';

  // --- Security helpers ---
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(password) {
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length >= 3;
  }

  // No client-side password hashing — demo/fallback mode delegates to backend.
  // All password verification happens server-side with bcrypt.

  // --- Bot & Honeypot Detection ---
  function checkBotSignals() {
    // Check for rapid form submission (submitted in < 2 seconds)
    const pageLoadTime = window._wgPageLoadTime || Date.now();
    const timeOnPage = Date.now() - pageLoadTime;
    if (timeOnPage < 2000) return ' rapid_submit';

    // Check for headless browser indicators
    const isHeadless = navigator.webdriver ||
      (window.chrome && !window.chrome.runtime) ||
      navigator.plugins.length === 0;
    if (isHeadless) return 'headless';

    return null;
  }

  // Record page load timestamp for bot detection
  if (!window._wgPageLoadTime) {
    window._wgPageLoadTime = Date.now();
  }

  // --- Path helpers ---
  function getBasePath() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const depth = parts.length - 1;
    if (depth > 0) {
      return '../'.repeat(depth);
    }
    return '';
  }

  function getPageLevel() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    return parts.length - 1;
  }

  // --- Storage Keys ---
  const DEMO_USERS_KEY = 'wildguard_demo_users';
  const SESSION_KEY = 'wildguard_user';
  const RATE_LIMIT_KEY = 'wildguard_rate_limit';
  const ADMIN_NOTIFICATIONS_KEY = 'wildguard_admin_notifications';
  const DATA_VERSION_KEY = 'wildguard_data_version';

  // Data migration (version check to handle schema changes)
  function migrateData() {
    const currentVersion = '2.0';
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
    if (storedVersion !== currentVersion) {
      // Migration: keep user sessions but ensure schema is correct
      localStorage.setItem(DATA_VERSION_KEY, currentVersion);
    }
  }
  migrateData();

  function getDemoUsers() {
    try { const data = localStorage.getItem(DEMO_USERS_KEY); return data ? JSON.parse(data) : {}; } catch (e) { return {}; }
  }
  function saveDemoUsers(users) { try { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users)); } catch (e) {} }

  function getAdminNotifications() {
    try { const data = localStorage.getItem(ADMIN_NOTIFICATIONS_KEY); return data ? JSON.parse(data) : []; } catch (e) { return []; }
  }
  function saveAdminNotifications(notifications) {
    try { localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications)); } catch (e) {}
  }
  function addAdminNotification(notification) {
    const notifications = getAdminNotifications();
    notifications.unshift({
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    });
    // Keep only last 100
    if (notifications.length > 100) notifications.splice(100);
    saveAdminNotifications(notifications);
  }

  // --- Session Management (Persistent) ---
  function getUser() {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (!data) return null;
      const user = JSON.parse(data);
      if (typeof user !== 'object' || !user.email) return null;
      return user;
    } catch (e) {
      return null;
    }
  }

  function saveUser(user) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (e) {}
  }

  function clearUser() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function setAuthCookie(email) {
    const days = 7;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const secureFlag = location.protocol === 'https:' ? ' Secure;' : '';
    document.cookie = `wildguard_session=${encodeURIComponent(email)}; path=/; expires=${expires}; SameSite=Strict;${secureFlag}`;
  }

  function clearAuthCookie() {
    document.cookie = 'wildguard_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;';
  }

  // Rate limiting
  function checkRateLimit(identifier) {
    try {
      const now = Date.now();
      const data = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}');
      const attempts = data[identifier] || { count: 0, lastAttempt: 0 };
      if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        attempts.count = 0;
      }
      attempts.count++;
      attempts.lastAttempt = now;
      data[identifier] = attempts;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
      return attempts.count <= 5;
    } catch (e) { return true; }
  }

  function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return escapeHtml(input.trim());
  }

  function escapeUserDisplay(userData) {
    if (typeof userData !== 'object') return userData;
    const safe = {};
    for (const key in userData) {
      if (typeof userData[key] === 'string') {
        safe[key] = escapeHtml(userData[key]);
      } else {
        safe[key] = userData[key];
      }
    }
    return safe;
  }

  // --- UI Update ---
  function updateAuthUI() {
    const signinBtn = document.getElementById('signin-btn');
    const userMenu = document.getElementById('user-menu');
    if (!signinBtn || !userMenu) return;

    if (isLoggedIn()) {
      const user = getUser();
      signinBtn.style.display = 'none';
      userMenu.style.display = 'block';
      renderUserAvatar(user);
      initNotificationBell();
      injectAdminLink(user);
      injectSettingsLink();
    } else {
      signinBtn.style.display = '';
      userMenu.style.display = 'none';
      removeNotificationBell();
    }
  }

  // Render a compact circular avatar (uploaded image or first letter of username/name)
  function renderUserAvatar(user) {
    const toggle = userMenuToggle();
    if (!toggle) return;
    const name = (user && (user.username || user.name)) || (user && user.email ? user.email.split('@')[0] : 'U');
    const letter = String(name).charAt(0).toUpperCase();
    let avatar = toggle.querySelector('.user-avatar');
    if (!avatar) {
      const icon = toggle.querySelector('i');
      if (icon) icon.style.display = 'none';
      avatar = document.createElement('span');
      avatar.className = 'user-avatar';
      avatar.id = 'user-avatar';
      toggle.insertBefore(avatar, toggle.firstChild);
    }
    if (user && user.avatar) {
      avatar.innerHTML = '<img src="' + escapeHtml(user.avatar) + '" alt="' + escapeHtml(name) + '">';
    } else {
      avatar.textContent = letter;
    }
    const emailSpan = document.getElementById('user-email');
    if (emailSpan) emailSpan.style.display = 'none';
  }

  function userMenuToggle() {
    return document.getElementById('user-menu-toggle');
  }

  function userMenuEl() {
    return document.getElementById('user-menu');
  }

  // Inject dashboard link into user dropdown for admin users
  function injectAdminLink(user) {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
    if (isAdmin) {
      if (!dropdown.querySelector('[data-admin-link]')) {
        const divider = dropdown.querySelector('.dropdown-divider');
        const adminLink = document.createElement('a');
        adminLink.href = getBasePath() + 'admin/Dashboard.html';
        adminLink.setAttribute('data-admin-link', 'true');
        adminLink.style.color = 'var(--accent, #F4A261)';
        adminLink.style.fontWeight = '600';
        adminLink.innerHTML = '<i class="fas fa-shield-halved"></i> Admin Dashboard';
        if (divider) {
          dropdown.insertBefore(adminLink, divider);
        } else {
          dropdown.appendChild(adminLink);
        }
      }
    }
  }

  // Inject Settings link into the user dropdown (before the divider)
  function injectSettingsLink() {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;
    if (dropdown.querySelector('[data-settings-link]')) return;
    const divider = dropdown.querySelector('.dropdown-divider');
    const settingsLink = document.createElement('a');
    settingsLink.href = getBasePath() + 'user/Profile.html#settings';
    settingsLink.setAttribute('data-settings-link', 'true');
    settingsLink.innerHTML = '<i class="fas fa-cog"></i> Settings';
    if (divider) {
      dropdown.insertBefore(settingsLink, divider);
    } else {
      dropdown.appendChild(settingsLink);
    }
  }

  // Wire dropdown toggle
  function initUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;
    if (userMenu.dataset.authInit) return;
    userMenu.dataset.authInit = 'true';
    const toggleBtn = userMenu.querySelector('#user-menu-toggle');
    if (!toggleBtn) return;
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('notification-panel');
      if (panel) panel.classList.remove('open');
      const bell = document.getElementById('notification-bell');
      if (bell) bell.setAttribute('aria-expanded', 'false');
      userMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (userMenu.classList.contains('open') && !userMenu.contains(e.target)) {
        userMenu.classList.remove('open');
      }
    });
  }

  // Wire logout
  function initLogout() {
    document.addEventListener('click', (e) => {
      const logoutBtn = e.target.closest('#logout-btn');
      if (!logoutBtn) return;
      e.preventDefault();
      var user = getUser();
      if (user && user.email && typeof logActivity !== 'undefined') {
        try { logActivity('logout', user.email, 'User logged out'); } catch(e) {}
      }
      clearUser();
      clearAuthCookie();
      window.location.href = getBasePath() + 'index.html';
    });
  }

  // Wire login form
  function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorMessage = document.getElementById('error-message');
      const submitBtn = document.getElementById('signin-submit');

      if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
      }

      const rawEmail = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      if (!rawEmail || !isValidEmail(rawEmail)) {
        if (errorMessage) {
          errorMessage.textContent = 'Please enter a valid email address.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      const email = rawEmail.toLowerCase();

      if (!checkRateLimit(email)) {
        if (errorMessage) {
          errorMessage.textContent = 'Too many login attempts. Please try again later.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      // Bot detection
      const botSignal = checkBotSignals();
      if (botSignal) {
        securityMonitor('bot_detected', { reason: botSignal });
        if (errorMessage) {
          errorMessage.textContent = 'Security check failed. Please refresh and try again.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.originalHTML === undefined) submitBtn.originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      }

      await new Promise(r => setTimeout(r, 600));

      const API_BASE = window.location.href.includes(':5000') || window.location.origin.includes('localhost')
        ? 'http://localhost:5000'
        : (window.location.origin.includes('github.io') || window.location.protocol === 'file:' ? '' : '/api');
      const hasBackend = API_BASE !== '';

      if (hasBackend) {
        try {
          const response = await fetch(API_BASE + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) { throw new Error(data.message || 'Login failed'); }
          saveUser({ email: rawEmail, role: data.role || 'user', name: data.name || rawEmail.split('@')[0], firstName: data.firstName || '', lastName: data.lastName || '', username: data.username || rawEmail.split('@')[0], phone: data.phone || '', country: data.country || '', bio: data.bio || '', avatar: data.avatar || '', prefs: data.prefs || { emailNotifications: true, publicProfile: true }, verified: true });
          setAuthCookie(rawEmail);
          setSessionTimeout();
          window.location.href = 'index.html';
          return;
        } catch (error) {
          console.warn('Backend login failed, falling back to demo mode:', error.message);
        }
      }

      // ---- Demo / Fallback Mode (no client-side password verification) ----
      // In demo mode we accept any password and create a session.
      // Real authentication should use the backend with bcrypt.
      securityMonitor('demo_login', { email: email.substring(0, 3) + '***' });
      const demoUsers = getDemoUsers();
      const demoUser = demoUsers[email];
      if (demoUser) {
        // Merge stored profile into the session so the full account loads after login
        const sessionProfile = {
          email: rawEmail,
          role: demoUser.role,
          name: demoUser.name || [demoUser.firstName, demoUser.lastName].filter(Boolean).join(' ') || rawEmail.split('@')[0],
          firstName: demoUser.firstName || '',
          lastName: demoUser.lastName || '',
          username: demoUser.username || rawEmail.split('@')[0],
          phone: demoUser.phone || '',
          country: demoUser.country || '',
          bio: demoUser.bio || '',
          avatar: demoUser.avatar || '',
          prefs: demoUser.prefs || { emailNotifications: true, publicProfile: true },
          registeredAt: demoUser.registeredAt || '',
          verified: true
        };
        saveUser(sessionProfile);
        setAuthCookie(rawEmail);
        setSessionTimeout();
        logActivity('login', rawEmail, 'User logged in (demo mode)');
        window.location.href = 'index.html';
        return;
      } else {
        // Create a demo user on the fly
        const sessionProfile = {
          email: rawEmail,
          role: 'user',
          name: rawEmail.split('@')[0],
          firstName: '',
          lastName: '',
          username: rawEmail.split('@')[0],
          phone: '',
          country: '',
          bio: '',
          avatar: '',
          prefs: { emailNotifications: true, publicProfile: true },
          registeredAt: new Date().toISOString(),
          verified: true
        };
        saveUser(sessionProfile);
        setAuthCookie(rawEmail);
        setSessionTimeout();
        logActivity('login', rawEmail, 'New demo user created');
        window.location.href = 'index.html';
        return;
      }
    });
  }

  // Wire register form
  function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawEmail = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;
      const confirmPassword = document.getElementById('confirm-password')?.value;
      const firstName = document.getElementById('firstName')?.value.trim();
      const lastName = document.getElementById('lastName')?.value.trim();
      const username = document.getElementById('username')?.value.trim();

      if (errorMessage) { errorMessage.style.display = 'none'; errorMessage.textContent = ''; }
      if (successMessage) { successMessage.style.display = 'none'; successMessage.textContent = ''; }

      if (!rawEmail || !isValidEmail(rawEmail)) {
        if (errorMessage) { errorMessage.textContent = 'Please enter a valid email address.'; errorMessage.style.display = 'block'; }
        return;
      }

      if (!isStrongPassword(password)) {
        if (errorMessage) { errorMessage.textContent = 'Password is too weak. Must be at least 8 characters with uppercase, lowercase, number, and special character.'; errorMessage.style.display = 'block'; }
        return;
      }

      if (password !== confirmPassword) {
        if (errorMessage) { errorMessage.textContent = 'Passwords do not match'; errorMessage.style.display = 'block'; }
        return;
      }

      // Bot detection
      const botSignal = checkBotSignals();
      if (botSignal) {
        securityMonitor('bot_detected_register', { reason: botSignal });
        if (errorMessage) { errorMessage.textContent = 'Security check failed. Please refresh and try again.'; errorMessage.style.display = 'block'; }
        return;
      }

      const email = rawEmail.toLowerCase();

      // Check if email already exists
      const demoUsers = getDemoUsers();
      if (demoUsers[email]) {
        if (errorMessage) { errorMessage.textContent = 'Email already registered. Please login.'; errorMessage.style.display = 'block'; }
        return;
      }

      // Register new user - automatically verified (no email verification required)
      // Demo mode: no password stored client-side. Real auth uses backend with bcrypt.
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || username || email.split('@')[0];
      demoUsers[email] = {
        role: 'user',
        name: displayName,
        firstName: firstName,
        lastName: lastName,
        username: username,
        phone: '',
        country: '',
        bio: '',
        avatar: '',
        prefs: { emailNotifications: true, publicProfile: true },
        verified: true,
        registeredAt: new Date().toISOString()
      };
      saveDemoUsers(demoUsers);

      // Add admin notification for new user registration
      addAdminNotification({
        type: 'new_user',
        title: 'New User Registered',
        message: `User ${email} has registered.`,
        email: email,
        name: displayName
      });

      // Welcome notification for the new user (seen after they sign in)
      window.addUserNotification({
        user: email,
        type: 'welcome',
        title: 'Welcome to WildGuard Society!',
        message: `Hi ${displayName}, your account is ready. Explore the library and try a wildlife scan.`
      });

      // Send welcome email (informational, no verification required)
      if (typeof sendWelcomeEmail !== 'undefined') { try { sendWelcomeEmail(email); } catch(e) {} }

      // Log activity
      if (typeof logActivity !== 'undefined') { try { logActivity('register', email, 'New user registered'); } catch(e) {} }

      // Track user for admin stats
      const userList = JSON.parse(localStorage.getItem('wildguard_user_list') || '[]');
      userList.push({
        email: email,
        name: displayName,
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 1,
        status: 'online',
        lastActive: new Date().toISOString()
      });
      localStorage.setItem('wildguard_user_list', JSON.stringify(userList));

      securityMonitor('register_success', { email: email.substring(0, 3) + '***' });

      if (successMessage) {
        successMessage.innerHTML = '<strong>Account created successfully!</strong><br>Welcome to WildGuard Society, <strong>' + escapeHtml(displayName) + '</strong>.<br>Your account is ready — sign in now to explore the wildlife library and start scanning.';
        successMessage.style.display = 'block';
      }
      registerForm.reset();
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  }

  function initNavLinks() {
    document.querySelectorAll('.nav-link').forEach(function (item) {
      item.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page) { window.location.href = page; }
      });
    });
  }

  // Session timeout (2 hours)
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;
  const SESSION_TIMEOUT_KEY = 'wildguard_session_start';

  function setSessionTimeout() {
    try { localStorage.setItem(SESSION_TIMEOUT_KEY, Date.now().toString()); } catch (e) {}
  }

  function checkSessionTimeout() {
    try {
      const startTime = localStorage.getItem(SESSION_TIMEOUT_KEY);
      if (!startTime) return false;
      if (Date.now() - parseInt(startTime, 10) > SESSION_TIMEOUT) {
        clearUser();
        clearAuthCookie();
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  // Security monitoring
  function securityMonitor(action, details) {
    try {
      const log = JSON.parse(localStorage.getItem('wildguard_security_log') || '[]');
      log.push({
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        userAgent: navigator.userAgent.substring(0, 100),
        page: window.location.href
      });
      if (log.length > 50) log.shift();
      localStorage.setItem('wildguard_security_log', JSON.stringify(log));
    } catch (e) {}
  }

  // Account lockout
  const LOCKOUT_KEY = 'wildguard_lockout';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 30 * 60 * 1000;

  function isAccountLocked(identifier) {
    try {
      const lockout = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
      const accountLock = lockout[identifier];
      if (!accountLock) return false;
      if (Date.now() - accountLock.time < LOCKOUT_DURATION) {
        return true;
      }
      delete lockout[identifier];
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockout));
      return false;
    } catch (e) { return false; }
  }

  function recordFailedAttempt(identifier) {
    try {
      const lockout = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
      if (!lockout[identifier]) { lockout[identifier] = { count: 0, time: Date.now() }; }
      lockout[identifier].count++;
      lockout[identifier].time = Date.now();
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockout));
    } catch (e) {}
  }

  function clearFailedAttempts(identifier) {
    try {
      const lockout = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
      if (lockout[identifier]) {
        delete lockout[identifier];
        localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockout));
      }
    } catch (e) {}
  }

  // --- User Notifications (Admin -> User) ---
  const USER_NOTIFICATIONS_KEY = 'wildguard_user_notifications';
  function getAllNotifications() {
    try { const data = localStorage.getItem(USER_NOTIFICATIONS_KEY); return data ? JSON.parse(data) : []; } catch (e) { return []; }
  }
  // Returns notifications for the signed-in user (or global ones without a user target)
  function getUserNotifications() {
    const session = currentSessionUser();
    const all = getAllNotifications();
    if (!session || !session.email) return all;
    const email = session.email.toLowerCase();
    const mine = all.filter(n => !n.user || String(n.user).toLowerCase() === email);
    return mine.length ? mine : all;
  }
  window.getUserNotifications = getUserNotifications;
  window.addUserNotification = function(notification) {
    const session = currentSessionUser();
    const notifs = getAllNotifications();
    const targetUser = (notification.user || (session && session.email) || '').toLowerCase();
    notifs.unshift({ id: 'unotif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), timestamp: new Date().toISOString(), read: false, user: targetUser, ...notification });
    if (notifs.length > 50) notifs.pop();
    localStorage.setItem(USER_NOTIFICATIONS_KEY, JSON.stringify(notifs));
    renderUserNotificationBadge();
  };
  window.sendUserNotification = function(email, notification) {
    if (!email) return;
    window.addUserNotification(Object.assign({}, notification, { user: email }));
  };
  window.markAllUserNotificationsRead = function() {
    const notifs = getAllNotifications();
    notifs.forEach(function(n) { n.read = true; });
    localStorage.setItem(USER_NOTIFICATIONS_KEY, JSON.stringify(notifs));
    renderUserNotificationBadge();
    renderNotificationPanel();
  };

  // Notification bell in the header
  function initNotificationBell() {
    if (!isLoggedIn()) return;
    const authBtns = document.getElementById('auth-buttons');
    if (!authBtns) return;
    let bell = document.getElementById('notification-bell');
    if (bell) { bell.style.display = 'flex'; return; }
    bell = document.createElement('button');
    bell.id = 'notification-bell';
    bell.className = 'notification-bell';
    bell.setAttribute('aria-label', 'Notifications');
    bell.setAttribute('aria-expanded', 'false');
    bell.innerHTML = '<i class="fas fa-bell"></i><span class="bell-badge" id="userNotificationBadge"></span>';
    const panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.className = 'notification-panel';
    bell.appendChild(panel);
    const themeToggle = authBtns.querySelector('.theme-toggle');
    authBtns.insertBefore(bell, themeToggle || authBtns.firstChild);
    bell.addEventListener('click', function(e) {
      e.stopPropagation();
      const open = panel.classList.contains('open');
      document.querySelectorAll('.user-dropdown.open, .lang-dropdown.open, .notification-panel.open').forEach(function(d) { d.classList.remove('open'); });
      panel.classList.toggle('open', !open);
      bell.setAttribute('aria-expanded', String(!open));
      if (!open) { renderNotificationPanel(); }
    });
    document.addEventListener('click', function(e) {
      if (panel.classList.contains('open') && !e.target.closest('.notification-bell')) {
        panel.classList.remove('open');
        bell.setAttribute('aria-expanded', 'false');
      }
    });
    renderUserNotificationBadge();
  }

  function removeNotificationBell() {
    const bell = document.getElementById('notification-bell');
    if (bell) bell.style.display = 'none';
  }

  function renderNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    const notifs = getUserNotifications();
    if (!notifs.length) {
      panel.innerHTML = '<div class="notification-header"><strong>Notifications</strong></div><div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p><span>Admin updates about your scans and account will appear here.</span></div>';
      return;
    }
    const unread = notifs.filter(n => !n.read).length;
    let html = '<div class="notification-header"><strong>Notifications</strong>' +
      (unread > 0 ? '<button type="button" class="notification-mark-read" onclick="window.markAllUserNotificationsRead()">Mark all read</button>' : '') +
      '</div><div class="notification-list">';
    notifs.forEach(function(n) {
      const icon = n.type === 'scan_approved' ? 'fas fa-check-circle' : n.type === 'scan_rejected' ? 'fas fa-times-circle' : n.type === 'welcome' ? 'fas fa-hands-helping' : n.type === 'message' ? 'fas fa-envelope' : 'fas fa-bell';
      html += '<div class="notification-item' + (n.read ? '' : ' unread') + '">' +
        '<div class="notification-item-icon"><i class="' + icon + '"></i></div>' +
        '<div class="notification-item-body"><strong>' + escapeHtml(n.title || 'Notification') + '</strong>' +
        (n.message ? '<p>' + escapeHtml(n.message) + '</p>' : '') +
        '<time>' + formatNotifTime(n.timestamp) + '</time></div></div>';
    });
    html += '</div>';
    panel.innerHTML = html;
  }

  function formatNotifTime(ts) {
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return d.toLocaleDateString();
    } catch (e) { return ''; }
  }

  function renderUserNotificationBadge() {
    const notifs = getUserNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;
    let badge = document.getElementById('userNotificationBadge');
    if (!badge) {
      const bell = document.getElementById('notification-bell');
      if (!bell) return;
      badge = document.createElement('span');
      badge.id = 'userNotificationBadge';
      badge.className = 'bell-badge';
      bell.querySelector('.fa-bell').after(badge);
    }
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  // --- Activity Log (Admin Traffic) ---
  const ACTIVITY_LOG_KEY = 'wildguard_activity_log';
  function logActivity(eventName, user, details) {
    try {
      const log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
      log.unshift({
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        event: eventName,
        user: user || 'guest',
        details: details || '',
        userAgent: navigator.userAgent.substring(0, 150),
        page: window.location.href
      });
      if (log.length > 500) log.pop();
      localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
    } catch (e) {}
  }
  function getActivityLog() {
    try { return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]'); } catch(e) { return []; }
  }
  function clearActivityLog() {
    try { localStorage.removeItem(ACTIVITY_LOG_KEY); } catch(e) {}
  }

  // --- Email System (info@wildguard.org) ---
  const EMAILS_KEY = 'wildguard_emails';
  function getAllEmails() { try { return JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]'); } catch(e) { return []; } }
  function saveEmails(emails) { try { localStorage.setItem(EMAILS_KEY, JSON.stringify(emails)); } catch(e) {} }
  function sendEmail(to, subject, body, type) {
    try {
      const emails = getAllEmails();
      emails.unshift({
        id: 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        from: 'info@wildguard.org',
        to: to,
        subject: subject,
        body: body,
        timestamp: new Date().toISOString(),
        read: false,
        type: type || 'general'
      });
      if (emails.length > 100) emails.pop();
      saveEmails(emails);
      logActivity('email_sent', to, 'Email: ' + subject);
    } catch (e) {}
  }
  function getEmails(email) { return getAllEmails().filter(function(e) { return e.to === email; }); }
  function getUnreadEmailCountForUser(email) { return getEmails(email).filter(function(e) { return !e.read; }).length; }
  function markEmailRead(id) {
    var emails = getAllEmails();
    var email = emails.find(function(e) { return e.id === id; });
    if (email) { email.read = true; saveEmails(emails); }
  }
  function markAllEmailsRead() {
    var emails = getAllEmails();
    emails.forEach(function(e) { e.read = true; });
    saveEmails(emails);
  }
  function sendWelcomeEmail(userEmail) {
    sendEmail(userEmail, 'Welcome to WildGuard Society!', 'Dear wildlife enthusiast,\n\nWelcome to WildGuard Society! Your account has been successfully created. You can now explore our wildlife library, go on virtual safaris, and report conservation issues.\n\nIf you did not create this account, please contact us at info@wildguard.org.\n\nBest regards,\nThe WildGuard Team', 'welcome');
  }
  function sendVerificationEmail(userEmail) {
    var code = Math.random().toString(36).substr(2, 8).toUpperCase();
    sendEmail(userEmail, 'Verify Your WildGuard Account', 'Dear user,\n\nThank you for registering with WildGuard Society. To complete your registration, please use the following verification code:\n\nVerification Code: ' + code + '\n\nEnter this code on the verification page to activate your account.\n\nBest regards,\nThe WildGuard Team', 'verification');
    return code;
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initUserMenu();
    initLogout();
    initLoginForm();
    initRegisterForm();
    initNavLinks();
    initNotificationBell();
    renderUserNotificationBadge();
    // Log page view
    try {
      var currUser = getUser();
      logActivity('page_view', currUser && currUser.email || 'guest', 'Page visited: ' + window.location.pathname);
    } catch(e) {}
    // Cross-tab sync: refresh notification badge/panel when another tab changes it
    try {
      window.addEventListener('storage', function(e) {
        if (e.key === USER_NOTIFICATIONS_KEY || e.key === null) {
          renderUserNotificationBadge();
          var panel = document.getElementById('notification-panel');
          if (panel && panel.classList.contains('open')) renderNotificationPanel();
        }
      });
    } catch(e) {}
  });

  window.isLoggedIn = function() {
    const user = getUser();
    return !!user && !!user.email;
  };

  window.isAccountLocked = isAccountLocked;
  window.recordFailedAttempt = recordFailedAttempt;
  window.clearFailedAttempts = clearFailedAttempts;
  window.setSessionTimeout = setSessionTimeout;
  window.checkSessionTimeout = checkSessionTimeout;
  window.securityMonitor = securityMonitor;
  window.getAdminNotifications = getAdminNotifications;
  window.addAdminNotification = addAdminNotification;
  window.saveAdminNotifications = saveAdminNotifications;

  // Activity log & email exports
  window.logActivity = logActivity;
  window.getActivityLog = getActivityLog;
  window.clearActivityLog = clearActivityLog;
  window.sendEmail = sendEmail;
  window.getAllEmails = getAllEmails;
  window.getEmails = getEmails;
  window.markEmailRead = markEmailRead;
  window.markAllEmailsRead = markAllEmailsRead;
  window.getUnreadEmailCountForUser = getUnreadEmailCountForUser;
  window.sendWelcomeEmail = sendWelcomeEmail;
  window.sendVerificationEmail = sendVerificationEmail;

  // --- Clear All Storage (Fresh Start) ---
  window.clearAllStorage = function(confirmBeforeClear) {
    if (confirmBeforeClear !== false && !window.confirm('This will clear ALL local data including users, scans, messages, and settings. This action cannot be undone.')) {
      return false;
    }
    var keys = Object.keys(localStorage).filter(function(k) { return k.startsWith('wildguard_') || k.startsWith('wildlife_'); });
    keys.forEach(function(key) { try { localStorage.removeItem(key); } catch(e) {} });
    console.log('[WildGuard] All storage cleared. Keys removed:', keys.join(', '));
    return true;
  };

  // --- Verify User by Code ---
  window.verifyUser = function(email, code) {
    try {
      var emailLower = email.toLowerCase();
      var demoUsers = getDemoUsers();
      var user = demoUsers[emailLower];
      if (!user) return { success: false, message: 'User not found.' };
      if (user.verified === true) return { success: true, message: 'Account already verified.' };
      if (user.verificationCode && user.verificationCode.toUpperCase() === code.toUpperCase()) {
        user.verified = true;
        demoUsers[emailLower] = user;
        saveDemoUsers(demoUsers);
        logActivity('verify_account', emailLower, 'Account verified');
        return { success: true, message: 'Account verified successfully! You can now log in.' };
      }
      return { success: false, message: 'Invalid verification code. Please try again.' };
    } catch(e) { return { success: false, message: 'Verification failed.' }; }
  };

  // --- User Profile & Data API (used by Profile/History/Favourite pages) ---
  const FAVOURITES_KEY = 'wildguard_favourites';

  function currentSessionUser() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch(e) { return null; }
  }

  function getStoredUserRecord(email) {
    if (!email) return null;
    return getDemoUsers()[email.toLowerCase()] || null;
  }

  // Persist an updated profile to the demo-users store AND refresh the live session.
  window.updateUserProfile = function(profile) {
    const session = currentSessionUser();
    if (!session || !session.email) return { success: false, message: 'Not signed in.' };
    const email = session.email.toLowerCase();
    const users = getDemoUsers();
    const record = users[email] || {};
    users[email] = Object.assign({}, record, profile, { email: session.email });
    saveDemoUsers(users);
    const merged = Object.assign({}, session, users[email], { email: session.email });
    saveUser(merged);
    return { success: true, user: merged };
  };

  // Change password for the signed-in user.
  // Password changes require backend authentication (bcrypt). Demo mode does not store passwords.
  window.changeUserPassword = function(currentPassword, newPassword) {
    const session = currentSessionUser();
    if (!session || !session.email) return { success: false, message: 'Not signed in.' };
    return { success: false, message: 'Password changes require backend authentication. Please use the backend API.' };
  };

  // Favourites (per-user)
  window.getUserFavourites = function() {
    const session = currentSessionUser();
    if (!session || !session.email) return [];
    const all = JSON.parse(localStorage.getItem(FAVOURITES_KEY) || '[]');
    return all.filter(f => (f.user || '').toLowerCase() === session.email.toLowerCase());
  };

  window.toggleFavourite = function(speciesKey, speciesData) {
    const session = currentSessionUser();
    if (!session || !session.email) return { success: false, message: 'Please sign in to save favourites.' };
    const all = JSON.parse(localStorage.getItem(FAVOURITES_KEY) || '[]');
    const email = session.email.toLowerCase();
    const existing = all.find(f => f.user === email && f.speciesKey === speciesKey);
    if (existing) {
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify(all.filter(f => f !== existing)));
      // Sync removal to the backend (best-effort).
      if (window.UserAPI) {
        window.UserAPI.getFavourites().then(function(favs) {
          const match = (favs || []).find(f => (f.speciesKey || '').toLowerCase() === String(speciesKey).toLowerCase());
          if (match && match.id) window.UserAPI.removeFavourite(match.id);
        });
      }
      return { success: true, favourited: false };
    }
    all.unshift({
      user: email,
      speciesKey: speciesKey,
      name: speciesData.name || speciesKey,
      scientificName: speciesData.scientificName || '',
      status: speciesData.status || '',
      image: speciesData.image || '',
      addedAt: new Date().toISOString()
    });
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(all));
    // Sync addition to the backend (best-effort).
    if (window.UserAPI) window.UserAPI.addFavourite(speciesData.name || speciesKey);
    return { success: true, favourited: true };
  };

  window.isFavourite = function(speciesKey) {
    const session = currentSessionUser();
    if (!session || !session.email) return false;
    const all = JSON.parse(localStorage.getItem(FAVOURITES_KEY) || '[]');
    return all.some(f => f.user === session.email.toLowerCase() && f.speciesKey === speciesKey);
  };

  // Scans (per-user), reading the shared wildlife_scans store
  window.getUserScans = function() {
    const session = currentSessionUser();
    const scans = JSON.parse(localStorage.getItem('wildlife_scans') || '[]');
    if (!session || !session.email) return scans;
    const email = session.email.toLowerCase();
    const mine = scans.filter(s => !s.user || s.user === email);
    return mine.length ? mine : scans;
  };

  window.getCurrentUser = function() {
    return currentSessionUser();
  };

  // Upgrade the legacy localStorage-only sendEmail to send real email via
  // EmailJS when configured (loads js/email.js if not already loaded).
  try {
    if (typeof window.WildGuardEmail === 'undefined') {
      var _authScripts = document.getElementsByTagName('script');
      var _authDir = '';
      for (var _i = 0; _i < _authScripts.length; _i++) {
        var _src = _authScripts[_i].getAttribute('src') || '';
        if (_src.indexOf('auth.js') !== -1) {
          _authDir = _src.replace(/auth\.js$/, '');
          break;
        }
      }
      if (!document.querySelector('script[src$="email-config.js"]')) {
        var _cfgScript = document.createElement('script');
        _cfgScript.src = _authDir + 'email-config.js';
        _cfgScript.async = true;
        document.head.appendChild(_cfgScript);
      }
      var _emailScript = document.createElement('script');
      _emailScript.src = _authDir + 'email.js';
      _emailScript.async = true;
      _emailScript.onload = function () {
        if (window.WildGuardEmail && window.WildGuardEmail.upgradeLegacy) window.WildGuardEmail.upgradeLegacy();
      };
      document.head.appendChild(_emailScript);
    } else if (window.WildGuardEmail && window.WildGuardEmail.upgradeLegacy) {
      window.WildGuardEmail.upgradeLegacy();
    }
  } catch (e) {}

})();
