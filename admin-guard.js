async function checkAdminAuth() {
    const adminDashboard = document.getElementById('admin-dashboard');
    console.log('[WildGuard] Checking admin auth...');

    // Check localStorage session first (for static hosting / no backend).
    // Role must be admin/super_admin — no hardcoded email bypass.
    let localUser = null;
    try {
        localUser = JSON.parse(localStorage.getItem('wildguard_user') || 'null');
    } catch (e) { }

    const isLocalAdmin = localUser && (localUser.role === 'admin' || localUser.role === 'super_admin');

    if (isLocalAdmin) {
        if (adminDashboard) adminDashboard.classList.remove('hidden');
        console.log('[WildGuard] Admin authenticated via localStorage.');
        return;
    }

    // Attempt backend verification (works when API is live)
    try {
        const response = await fetch('/api/admin/verify', { method: 'POST', credentials: 'include' });
        if (response.ok) {
            if (adminDashboard) adminDashboard.classList.remove('hidden');
            console.log('[WildGuard] Admin authenticated via backend.');
            return;
        }
    } catch (error) {
        console.warn('[WildGuard] Admin verify endpoint unavailable, using localStorage fallback.');
    }

    // Unauthorized: redirect to admin login
    console.warn('[WildGuard] Admin not authenticated. Redirecting...');
    const currentPath = window.location.pathname;
    const depth = currentPath.split('/').filter(Boolean).length;
    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    window.location.replace(prefix + 'admin-login.html');
}