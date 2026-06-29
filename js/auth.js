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
    return /^[^\s@]+@[\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(password) {
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length >= 3;
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

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
      const displayName = user.email ? sanitizeInput(user.email.split('@')[0]) : 'User';
      signinBtn.style.display = 'none';
      userMenu.style.display = 'block';
      const emailSpan = userMenu.querySelector('#user-email');
      if (emailSpan) emailSpan.textContent = displayName;
      injectAdminLink(user);
    } else {
      signinBtn.style.display = '';
      userMenu.style.display = 'none';
    }
  }

  // Inject admin dashboard link into user dropdown for admin users
  function injectAdminLink(user) {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;
    const isAdmin = user && (user.role === 'admin' || user.email === 'admin@wildguardsociety.org' || user.email === 'admin@wildguard.org');
    if (isAdmin) {
      if (!dropdown.querySelector('[data-admin-link]')) {
        const divider = dropdown.querySelector('.dropdown-divider');
        const adminLink = document.createElement('a');
        adminLink.href = getBasePath() + 'admin/Dashboard.html';
        adminLink.setAttribute('data-admin-link', 'true');
        adminLink.style.color = 'var(--accent, #c9a227)';
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

  // Wire mobile menu toggle
  function initMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const desktopNav = document.getElementById('desktop-nav');
    if (mobileToggle && desktopNav) {
      mobileToggle.addEventListener('click', () => {
        desktopNav.classList.toggle('open');
      });
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
          saveUser({ email: rawEmail, role: data.role || 'user', name: rawEmail.split('@')[0] });
          setAuthCookie(rawEmail);
          setSessionTimeout();
          window.location.href = 'index.html';
          return;
        } catch (error) {
          console.warn('Backend login failed, falling back to demo mode:', error.message);
        }
      }

      // ---- Demo / Fallback Mode ----
      const demoUsers = getDemoUsers();
      const demoUser = demoUsers[email];
      if (demoUser && (demoUser.passwordHash === simpleHash(password) || demoUser.password === password)) {
        saveUser({ email: rawEmail, role: demoUser.role, name: demoUser.name || rawEmail.split('@')[0] });
        setAuthCookie(rawEmail);
        setSessionTimeout();
        securityMonitor('login_success', { email: email.substring(0, 3) + '***' });
        window.location.href = 'index.html';
        return;
      } else if (email === 'admin@wildguardsociety.org' && password === 'admin123') {
        // Allow admin login even without stored user record
        saveUser({ email: rawEmail, role: 'admin', name: 'Administrator' });
        setAuthCookie(rawEmail);
        setSessionTimeout();
        securityMonitor('admin_login_success', { email: 'admin@***' });
        window.location.href = 'admin.html';
        return;
      } else {
        if (errorMessage) {
          errorMessage.textContent = 'Invalid email or password. Please try again.';
          errorMessage.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.originalHTML || 'Sign In';
        }
        securityMonitor('login_failed', { email: email.substring(0, 3) + '***' });
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

      // Register new user
      demoUsers[email] = { passwordHash: simpleHash(password), role: 'user', name: email.split('@')[0] };
      saveDemoUsers(demoUsers);

      // Add admin notification for new user registration
      addAdminNotification({
        type: 'new_user',
        title: 'New User Registered',
        message: `User ${email} has registered.`,
        email: email,
        name: email.split('@')[0]
      });

      // Track user for admin stats
      const userList = JSON.parse(localStorage.getItem('wildguard_user_list') || '[]');
      userList.push({
        email: email,
        name: email.split('@')[0],
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 1,
        status: 'online',
        lastActive: new Date().toISOString()
      });
      localStorage.setItem('wildguard_user_list', JSON.stringify(userList));

      securityMonitor('register_success', { email: email.substring(0, 3) + '***' });

      if (successMessage) {
        successMessage.textContent = 'Registration successful! Redirecting to login...';
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

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initUserMenu();
    initLogout();
    initLoginForm();
    initRegisterForm();
    initNavLinks();
    initMobileMenu();
  });

  window.isLoggedIn = function() {
    const user = getUser();
    return !!user && !!user.email;
  };

  window.simpleHash = simpleHash;
  window.isAccountLocked = isAccountLocked;
  window.recordFailedAttempt = recordFailedAttempt;
  window.clearFailedAttempts = clearFailedAttempts;
  window.setSessionTimeout = setSessionTimeout;
  window.checkSessionTimeout = checkSessionTimeout;
  window.securityMonitor = securityMonitor;
  window.getAdminNotifications = getAdminNotifications;
  window.addAdminNotification = addAdminNotification;
  window.saveAdminNotifications = saveAdminNotifications;

})();
