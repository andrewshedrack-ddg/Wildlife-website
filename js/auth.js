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

  function getUser() {
    try {
      const data = localStorage.getItem('wildguard_user');
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

    const errorMessage = document.getElementById('error-message');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
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

      try {
        const response = await fetch('/api/register', {
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
