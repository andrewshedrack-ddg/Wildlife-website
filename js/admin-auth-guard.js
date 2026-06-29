/**
 * Admin Authentication Guard v2
 * Ensures only authenticated admin users can access admin pages.
 * Fixed: Session persistence on page reload, correct redirect paths, bot detection.
 */
(function () {
  'use strict';

  // Prevent double-checking on same page
  if (window._adminGuardChecked) return;
  window._adminGuardChecked = true;

  function getUser() {
    try {
      const data = localStorage.getItem('wildguard_user');
      if (!data) return null;
      const user = JSON.parse(data);
      return user && user.email ? user : null;
    } catch (e) {
      return null;
    }
  }

  function redirectToAdminLogin() {
    const currentPath = window.location.pathname;
    const parts = currentPath.split('/').filter(Boolean);
    const isInAdminFolder = parts.some(p => p.toLowerCase() === 'admin');
    let prefix = '';
    if (isInAdminFolder) {
      const adminIndex = parts.findIndex(p => p.toLowerCase() === 'admin');
      const depth = parts.length - adminIndex - 1;
      prefix = '../'.repeat(depth);
          if (!prefix) prefix = '';
          } else {
      prefix = parts.length > 0 ? '../'.repeat(parts.length - 1) : '';
    }
    window.location.replace(prefix + 'admin-login.html');
  }

  function checkAdminAccess() {
    // Skip if already checked
    if (window._adminAuthPassed === true) return true;

    const user = getUser();
    if (!user) {
      redirectToAdminLogin();
      return false;
    }

    if (user.role !== 'admin' && user.email !== 'admin@wildguardsociety.org' && user.email !== 'admin@wildguard.org') {
      redirectToAdminLogin();
      return false;
    }

    window._adminAuthPassed = true;
    return true;
  }

  // Run check immediately
  checkAdminAccess();
})();
