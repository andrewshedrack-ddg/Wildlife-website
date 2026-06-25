/**
 * Auth UI state manager for WildGuard Society
 * Handles login/logout display, user menu dropdown, and localStorage session.
 */

(function () {
  'use strict';

  // ─── Helpers ───
  function getBasePath() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    const depth = parts.length - 1;
    // If we're in a subfolder (library/, user/, etc.), prefix links with ../
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

  // ─── Session helpers (cookie-based, mirrors backend session) ───
  function isLoggedIn() {
    const user = getUser();
    return !!user && !!user.email;
  }

  // ─── Demo mode (localStorage fallback for static hosting) ───
  const DEMO_USERS_KEY = 'wildguard_demo_users';
  const SESSION_KEY = 'wildguard_user';

  function getDemoUsers() {
    try { const data = localStorage.getItem(DEMO_USERS_KEY); return data ? JSON.parse(data) : {}; } catch (e) { return {}; }
  }
  function saveDemoUsers(users) { try { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users)); } catch (e) {} }
  function seedDemoUsers() {
    const users = getDemoUsers();
    if (!users['wildguardsociety@gmail.com']) {
      users['wildguardsociety@gmail.com'] = { password: 'password123', role: 'user' };
      saveDemoUsers(users);
    }
  }
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

  function setAuthCookie(email) {
    const days = 7;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `wildguard_session=${encodeURIComponent(email)}; path=/; expires=${expires}; SameSite=Lax`;
  }

  function clearAuthCookie() {
    document.cookie = 'wildguard_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // ─── UI update ───
  function updateAuthUI() {
    const signinBtn = document.getElementById('signin-btn');
    const userMenu = document.getElementById('user-menu');
    if (!signinBtn || !userMenu) return;

    if (isLoggedIn()) {
      const user = getUser();
      const displayName = user.email ? user.email.split('@')[0] : 'User';
      signinBtn.style.display = 'none';
      userMenu.style.display = 'block';
      const emailSpan = userMenu.querySelector('#user-email');
      if (emailSpan) emailSpan.textContent = displayName;
    } else {
      signinBtn.style.display = '';
      userMenu.style.display = 'none';
    }
  }

  // ─── Wire dropdown toggle ───
  function initUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;

    // Prevent duplicate listeners by using a flag
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

  // ─── Wire logout ───
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

  // ─── Wire login form on login.html ───
  function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
平时很难
    const errorMessage = document.getElementById('error-message');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
      }

      // If no backend (static hosting), use demo mode
      const isStatic = window.location.origin.includes('github.io') || window.location.protocol === 'file:';
      if (isStatic) {
        fallbackToDemoLogin(email, password, errorMessage);
        return;
      }

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Login failed');
        }

        const data = await response.json().catch(() => ({}));
        const user = data.user || { email };
        saveUser(user);
        setAuthCookie(email);
        window.location.href = 'index.html';
      } catch (err) {
        if (errorMessage) {
          errorMessage.textContent = err.message;
          errorMessage.style.display = 'block';
        }
      }
    });
  }

  // ─── Demo login fallback ───
  function fallbackToDemoLogin(email, password, errorMessage) {
    const users = getDemoUsers();
    const user = users[email];
    if (user && user.password === password) {
      saveUser({ email, role: user.role });
      window.location.href = 'index.html';
    } else {
      if (errorMessage) { errorMessage.textContent = 'Invalid credentials (demo mode)'; errorMessage.style.display = 'block'; }
    }
  }

  // ─── Demo register fallback ───
  function fallbackToDemoRegister(email, password, errorMessage, successMessage) {
    const users = getDemoUsers();
    if (users[email]) {
      if (errorMessage) { errorMessage.textContent = 'Email already registered'; errorMessage.style.display = 'block'; }
      return;
    }
    users[email] = { password, role: 'user' };
    saveDemoUsers(users);
    if (successMessage) { successMessage.textContent = 'Registration successful! Please login.'; successMessage.style.display = 'block'; }
    document.getElementById('register-form').reset();
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  }

  // ─── Wire register form on register.html ───
  function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value.trim();
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

      if (password !== confirmPassword) {
        if (errorMessage) {
          errorMessage.textContent = 'Passwords do not match';
          errorMessage.style.display = 'block';
        }
        return;
      }

      // If no backend (static hosting), use demo mode
      const isStatic = window.location.origin.includes('github.io') || window.location.protocol === 'file:';
      if (isStatic) {
        fallbackToDemoRegister(email, password, errorMessage, successMessage);
        return;
      }

      try {
        const response = await fetch('/api/register/L1NhbWFydCBIb21lIC0g', {
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
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } catch (err) {
        if (errorMessage) {
          errorMessage.textContent = err.message;
          errorMessage.style.display = 'block';
        }
      }
    });
  }

  // ─── Wire nav links ───
  function initNavLinks() {
    document.querySelectorAll('.nav-link').forEach(function (item) {
      item.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page) {
          window.location.href = page;
        }
      });
    });

    // Support new nav-item-group clickables
    document.querySelectorAll('.nav-item-group[data-page]').forEach(function (item) {
      item.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page) {
          window.location.href = page;
        }
      });
    });
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initUserMenu();
    initLogout();
    initLoginForm();
    initRegisterForm();
    initNavLinks();
  });

})();
