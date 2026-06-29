/**
 * Auth UI state manager for WildGuard Society
 * Handles login/logout display, user menu dropdown, and localStorage session.
 * SECURITY HARDENED: XSS escaping, hashed demo passwords, secure cookies, rate limiting, input sanitization.
 */

(function () {
  'use strict';

  // --- Security helpers ---

  /**
   * Escape HTML to prevent XSS injection.
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Validate email format.
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Basic password strength check.
   */
  function isStrongPassword(password) {
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length >= 3;
  }

  /**
   * Simple hash-like function for demo mode (NOT cryptographically secure, but prevents casual plaintext exposure).
   */
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'hash_' + Math.abs(hash).toString(16);
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

  // --- Session helpers ---
  const DEMO_USERS_KEY = 'wildguard_demo_users';
  const SESSION_KEY = 'wildguard_user';
  const RATE_LIMIT_KEY = 'wildguard_rate_limit';

  function getDemoUsers() {
    try { const data = localStorage.getItem(DEMO_USERS_KEY); return data ? JSON.parse(data) : {}; } catch (e) { return {}; }
  }
  function saveDemoUsers(users) { try { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users)); } catch (e) {} }
  function clearAllStorage() {
    // Clear all wildguard related storage
    const keysToRemove = [
      'wildguard_demo_users',
      'wildguard_user',
      'wildguard_rate_limit',
      'wildguard_user_list',
      'wildguard_admin_messages',
      'wildlife_scans',
      'wildlife_pending_admin',
      'wildguard_admin_session',
      'wildguard_admin_token',
      'wildguard_admin_user',
      'wildguard_cache',
      'wildguard_lastClear'
    ];
    keysToRemove.forEach(key => {
      try { localStorage.removeItem(key); } catch (e) {}
    });
  }

  function seedDemoUsers() {
    // Demo users cleared - no seeded accounts
    const users = {};
    saveDemoUsers(users);
  }
  // Clear all existing data on load
  clearAllStorage();
  seedDemoUsers();

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
      localStorage.setItem('wildguard_user', JSON.stringify(user));
    } catch (e) {
      // Ignore write errors (e.g. private mode)
    }
  }

  function clearUser() {
    try {
      localStorage.removeItem('wildguard_user');
    } catch (e) {
      // Ignore
    }
  }

  // Use SameSite=Strict and Secure (when HTTPS)
  function setAuthCookie(email) {
    const days = 7;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const secureFlag = location.protocol === 'https:' ? ' Secure;' : '';
    document.cookie = `wildguard_session=${encodeURIComponent(email)}; path=/; expires=${expires}; SameSite=Strict;${secureFlag}`;
  }

  function clearAuthCookie() {
    document.cookie = 'wildguard_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;';
  }

  // Rate limiting helper
  function checkRateLimit(identifier) {
    try {
      const now = Date.now();
      const data = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}');
      const attempts = data[identifier] || { count: 0, lastAttempt: 0 };
      
      // Reset count after 15 minutes
      if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        attempts.count = 0;
      }
      
      attempts.count++;
      attempts.lastAttempt = now;
      data[identifier] = attempts;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
      
      // Allow up to 5 attempts in 15 minutes
      return attempts.count <= 5;
    } catch (e) {
      return true; // If rate limiting fails, allow
    }
  }

  // Sanitize input for display / validation
  function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return escapeHtml(input.trim());
  }

  // Escape user data before displaying
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

  // UI update with sanitization
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
    } else {
      signinBtn.style.display = '';
      userMenu.style.display = 'none';
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

      // Validate email
      if (!rawEmail || !isValidEmail(rawEmail)) {
        if (errorMessage) {
          errorMessage.textContent = 'Please enter a valid email address.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      const email = rawEmail.toLowerCase();

      // Check rate limit by email
      if (!checkRateLimit(email)) {
        if (errorMessage) {
          errorMessage.textContent = 'Too many login attempts. Please try again later.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.originalHTML === undefined) submitBtn.originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      }

      // Simulate small delay for UX
      await new Promise(r => setTimeout(r, 600));

      // Check if backend is running (port 5000) via config, or use localStorage for static hosting
      // We'll try the backend first, then fall back gracefully if it's not available
      const API_BASE = window.location.href.includes(':5000') || window.location.origin.includes('localhost')
        ? 'http://localhost:5000'
        : (window.location.origin.includes('github.io') || window.location.protocol === 'file:' ? '' : '/api');
      const hasBackend = API_BASE !== '';
      // Try backend first, fall back to localStorage demo mode only if backend unavailable
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
          // Backend login succeeded - store user info in localStorage for UI
          saveUser({ email: rawEmail, role: data.role || 'user', name: rawEmail.split('@')[0] });
          window.location.href = 'index.html';
          return;
        } catch (error) {
          // If fetch failed (backend down), fall through to demo mode below
          console.warn('Backend login failed, falling back to demo mode:', error.message);
        }
      }

      // ---- Demo / Fallback Mode (no backend available) ----
      const demoUsers = JSON.parse(localStorage.getItem('wildguard_demo_users') || '{}');
      const demoUser = demoUsers[email];
      if (demoUser && demoUser.passwordHash === simpleHash(password)) {
        saveUser({ email: rawEmail, role: demoUser.role, name: demoUser.name || rawEmail.split('@')[0] });
        setAuthCookie(rawEmail);
        // Track user login for admin dashboard
        try {
          var userList = JSON.parse(localStorage.getItem("wildguard_user_list") || "[]");
          var idx = userList.findIndex(function(u) { return u.email === rawEmail; });
          var now = new Date().toISOString();
          if (idx >= 0) {
            userList[idx].lastLogin = now;
            userList[idx].loginCount = (userList[idx].loginCount || 0) + 1;
            userList[idx].name = demoUser.name || rawEmail.split('@')[0];
            userList[idx].status = "online";
            userList[idx].lastActive = now;
          } else {
            userList.push({ email: rawEmail, name: demoUser.name || rawEmail.split('@')[0], registeredAt: now, lastLogin: now, loginCount: 1, status: "online", lastActive: now });
          }
          localStorage.setItem("wildguard_user_list", JSON.stringify(userList));
        } catch(e) {}
        window.location.href = 'index.html';
        return;
      } else if (demoUser && demoUser.password === password) {
        // Legacy plaintext password - upgrade to hash on login
        demoUser.passwordHash = simpleHash(password);
        delete demoUser.password;
        demoUsers[email] = demoUser;
        localStorage.setItem('wildguard_demo_users', JSON.stringify(demoUsers));
        saveUser({ email: rawEmail, role: demoUser.role, name: demoUser.name || rawEmail.split('@')[0] });
        setAuthCookie(rawEmail);
        // Track user login for admin dashboard
        try {
          var userList = JSON.parse(localStorage.getItem("wildguard_user_list") || "[]");
          var idx = userList.findIndex(function(u) { return u.email === rawEmail; });
          var now = new Date().toISOString();
          if (idx >= 0) {
            userList[idx].lastLogin = now;
            userList[idx].loginCount = (userList[idx].loginCount || 0) + 1;
            userList[idx].name = demoUser.name || rawEmail.split('@')[0];
            userList[idx].status = "online";
            userList[idx].lastActive = now;
          } else {
            userList.push({ email: rawEmail, name: demoUser.name || rawEmail.split('@')[0], registeredAt: now, lastLogin: now, loginCount: 1, status: "online", lastActive: now });
          }
          localStorage.setItem("wildguard_user_list", JSON.stringify(userList));
        } catch(e) {}
        window.location.href = 'index.html';
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
        return;
      }
    });
  }

  // Demo login fallback (kept for compatibility)
  function fallbackToDemoLogin(email, password, errorMessage) {
    // This function is deprecated; login logic is now in initLoginForm.
    // Kept for backward compatibility if any external script calls it.
    const users = getDemoUsers();
    const user = users[email];
    if (user && (user.password === password || user.passwordHash === simpleHash(password))) {
      saveUser({ email, role: user.role, name: user.name || email.split('@')[0] });
      setAuthCookie(email);
      window.location.href = 'index.html';
    } else {
      if (errorMessage) { errorMessage.textContent = 'Invalid credentials (demo mode)'; errorMessage.style.display = 'block'; }
    }
  }

  // Demo register fallback
  function fallbackToDemoRegister(email, password, errorMessage, successMessage) {
    const users = getDemoUsers();
    if (users[email]) {
      if (errorMessage) { errorMessage.textContent = 'Email already registered'; errorMessage.style.display = 'block'; }
      return;
    }
    users[email] = { password: password, role: 'user' };
    saveDemoUsers(users);
    if (successMessage) { successMessage.textContent = 'Registration successful! Please login.'; successMessage.style.display = 'block'; }
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.reset();
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
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

      if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
      }
      if (successMessage) {
        successMessage.style.display = 'none';
        successMessage.textContent = '';
      }

      // Validate email
      if (!rawEmail || !isValidEmail(rawEmail)) {
        if (errorMessage) { errorMessage.textContent = 'Please enter a valid email address.'; errorMessage.style.display = 'block'; }
        return;
      }

      // Validate password strength
      if (!isStrongPassword(password)) {
        if (errorMessage) { errorMessage.textContent = 'Password is too weak. Must be at least 8 characters with uppercase, lowercase, number, and special character.'; errorMessage.style.display = 'block'; }
        return;
      }

      if (password !== confirmPassword) {
        if (errorMessage) { errorMessage.textContent = 'Passwords do not match'; errorMessage.style.display = 'block'; }
        return;
      }

      const email = rawEmail.toLowerCase();

      // Try backend first, fall back to demo mode
      const API_BASE = window.location.href.includes(':5000') || window.location.origin.includes('localhost')
        ? 'http://localhost:5000'
        : (window.location.origin.includes('github.io') || window.location.protocol === 'file:' ? '' : '/api');
      const hasBackend = API_BASE !== '';

      if (hasBackend) {
        try {
          const response = await fetch(API_BASE + '/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Registration failed');
          }

          if (successMessage) {
            successMessage.textContent = 'Registration successful! Please login.';
            successMessage.style.display = 'block';
          }
          registerForm.reset();
          setTimeout(() => { window.location.href = 'login.html'; }, 1500);
          return;
        } catch (err) {
          // Backend failed, try demo mode
          console.warn('Backend register failed, falling back to demo mode:', err.message);
        }
      }

      // ---- Demo / Fallback Mode ----
      const demoUsers = getDemoUsers();
      if (demoUsers[email]) {
        if (errorMessage) { errorMessage.textContent = 'Email already registered'; errorMessage.style.display = 'block'; }
        return;
      }
      demoUsers[email] = { passwordHash: simpleHash(password), role: 'user', name: email.split('@')[0] };
      saveDemoUsers(demoUsers);
      // Track new user registration
      try {
        var userList = JSON.parse(localStorage.getItem("wildguard_user_list") || "[]");
        var now = new Date().toISOString();
        userList.push({ email: email, name: email.split('@')[0], registeredAt: now, lastLogin: now, loginCount: 1, status: "online", lastActive: now });
        localStorage.setItem("wildguard_user_list", JSON.stringify(userList));
      } catch(e) {}
      if (successMessage) { successMessage.textContent = 'Registration successful! Please login.'; successMessage.style.display = 'block'; }
      registerForm.reset();
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  }

  // Wire nav links
  function initNavLinks() {
    document.querySelectorAll('.nav-link').forEach(function (item) {
      item.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page) {
          window.location.href = page;
        }
      });
    });

    document.querySelectorAll('.nav-item-group[data-page]').forEach(function (item) {
      item.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page) {
          window.location.href = page;
        }
      });
    });
  }

  // Session cache to prevent exceeding localStorage
  function cleanupOldSessions() {
    try {
      const data = localStorage.getItem(DEMO_USERS_KEY);
      if (data && data.length > 50000) {
        // Clean up if localStorage is getting full
        localStorage.removeItem(RATE_LIMIT_KEY);
      }
    } catch (e) {}
  }
  cleanupOldSessions();

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

  // Expose simpleHash for demo mode password handling across pages
  window.simpleHash = simpleHash;

})();
