/*
 * WildGuard Society - Health Monitor & System Coordinator
 */
(function() {
    'use strict';

    window.WildGuardMonitor = {
        version: '1.0.0',
        components: {},
        errors: [],

        register(component, status) {
            this.components[component] = status;
            console.log('[WildGuard] ' + component + ' component: ' + (status ? 'OK' : 'FAILED'));
        },

        logError(error, context) {
            var errorEntry = {
                timestamp: new Date().toISOString(),
                message: error.message || String(error),
                context: context || 'unknown',
                stack: error.stack || 'No stack trace'
            };
            this.errors.push(errorEntry);
            console.error('[WildGuard ERROR] ' + context + ':', errorEntry);
        },

        runDiagnostics() {
            console.log('%c[WildGuard] Running system diagnostics...', 'color:#F4A261;font-weight:bold;');
            try {
                var test = 'wildguard_test_' + Date.now();
                localStorage.setItem(test, 'ok');
                localStorage.removeItem(test);
                this.register('storage', true);
            } catch(e) {
                this.register('storage', false);
            }
            if (typeof window.isLoggedIn === 'function') {
                this.register('auth', true);
            } else {
                this.register('auth', false);
            }
            var slides = document.querySelectorAll('.page-slide');
            this.register('slideshow', slides.length > 0);
            var nav = document.querySelector('.desktop-nav');
            this.register('navigation', !!nav);
            console.log('%c[WildGuard] Diagnostics complete.', 'color:#22c55e;font-weight:bold;');
        }
    };

    window.addEventListener('error', function(e) {
        if (window.WildGuardMonitor) {
            window.WildGuardMonitor.logError(e.error || e.message, 'global');
        }
    });

    window.addEventListener('unhandledrejection', function(e) {
        if (window.WildGuardMonitor) {
            window.WildGuardMonitor.logError(e.reason, 'promise');
        }
    });

    function syncAuthState() {
        try {
            var user = JSON.parse(localStorage.getItem('wildguard_user') || 'null');
            var signinBtn = document.getElementById('signin-btn');
            var userMenu = document.getElementById('user-menu');
            if (user && user.email) {
                if (signinBtn) signinBtn.style.display = 'none';
                if (userMenu) userMenu.style.display = 'block';
                var emailSpan = document.getElementById('user-email');
                if (emailSpan) emailSpan.textContent = user.email.split('@')[0];
                document.body.classList.add('user-logged-in');
            } else {
                if (signinBtn) signinBtn.style.display = '';
                if (userMenu) userMenu.style.display = 'none';
                document.body.classList.remove('user-logged-in');
            }
        } catch(e) {
            console.error('[WildGuard] Auth sync failed:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (window.WildGuardMonitor) window.WildGuardMonitor.runDiagnostics();
            syncAuthState();
        });
    } else {
        if (window.WildGuardMonitor) window.WildGuardMonitor.runDiagnostics();
        syncAuthState();
    }

    window.addEventListener('storage', function(e) {
        if (e.key === 'wildguard_user') {
            syncAuthState();
        }
    });

    window.syncAuthState = syncAuthState;
})();