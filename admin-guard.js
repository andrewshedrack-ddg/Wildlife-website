async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/verify', { method: 'POST' });
        if (!response.ok) throw new Error("Unauthorized");
        
        // Admin is verified, boot up the dashboard view smoothly
        document.getElementById('admin-dashboard').classList.remove('hidden');
    } catch (error) {
        // Soft redirect unauthorized guests back to home page
        window.location.href = '/index.html';
    }
}