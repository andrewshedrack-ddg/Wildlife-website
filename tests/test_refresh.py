"""Tests for JWT refresh-token session management (/api/auth/refresh, /api/logout)."""

from .conftest import register_user, login_user


def _refresh_cookie(resp):
    """Extract the refresh_token cookie from a login response."""
    for header in resp.headers.getlist('Set-Cookie'):
        if 'refresh_token=' in header:
            return header.split(';', 1)[0].split('=', 1)[1]
    return None


class TestRefresh:
    def test_login_sets_both_cookies(self, client):
        register_user(client)
        resp = login_user(client)
        cookies = resp.headers.getlist('Set-Cookie')
        joined = '; '.join(cookies)
        assert 'auth_token=' in joined
        assert 'refresh_token=' in joined
        assert 'HttpOnly' in joined
        assert 'SameSite=Strict' in joined

    def test_refresh_success(self, client):
        register_user(client)
        login_resp = login_user(client)
        refresh = _refresh_cookie(login_resp)
        assert refresh
        resp = client.post('/api/auth/refresh')
        assert resp.status_code == 200
        joined = '; '.join(resp.headers.getlist('Set-Cookie'))
        assert 'auth_token=' in joined
        assert 'refresh_token=' in joined

    def test_refresh_rotates_old_token(self, client):
        register_user(client)
        login_resp = login_user(client)
        old_refresh = _refresh_cookie(login_resp)
        client.post('/api/auth/refresh')
        new_refresh = _refresh_cookie(client.post('/api/auth/refresh'))
        assert old_refresh and new_refresh and old_refresh != new_refresh

    def test_refresh_rejects_reuse_after_rotation(self, client):
        register_user(client)
        login_resp = login_user(client)
        old_refresh = _refresh_cookie(login_resp)
        assert client.post('/api/auth/refresh').status_code == 200
        # Re-presenting the rotated (now revoked) token must be rejected.
        client.set_cookie('refresh_token', old_refresh)
        resp = client.post('/api/auth/refresh')
        assert resp.status_code == 401

    def test_refresh_without_cookie(self, client):
        resp = client.post('/api/auth/refresh')
        assert resp.status_code == 401

    def test_refresh_with_garbage_cookie(self, client):
        client.set_cookie('refresh_token', 'garbage.token.value')
        assert client.post('/api/auth/refresh').status_code == 401


class TestLogout:
    def test_logout_clears_cookies_and_revokes(self, client):
        register_user(client)
        login_user(client)
        resp = client.post('/api/logout')
        assert resp.status_code == 200
        joined = '; '.join(resp.headers.getlist('Set-Cookie'))
        assert 'refresh_token=' in joined and 'auth_token=' in joined
        # Access token is now useless (refresh family revoked).
        assert client.get('/api/me').status_code == 401

    def test_logout_requires_auth(self, client):
        assert client.post('/api/logout').status_code == 401

    def test_password_change_revokes_refresh(self, client):
        register_user(client)
        login_user(client)
        client.post('/api/user/change-password', json={
            'current_password': 'Password123!',
            'new_password': 'NewPass123!',
        })
        assert client.post('/api/auth/refresh').status_code == 401

    def test_admin_logout(self, seeded_client):
        resp = seeded_client.post('/api/admin/login', json={
            'email': 'admin@test.org',
            'password': 'AdminPass123!',
        })
        assert resp.status_code == 200
        joined = '; '.join(resp.headers.getlist('Set-Cookie'))
        assert 'refresh_token=' in joined
        out = seeded_client.post('/api/admin/logout')
        assert out.status_code == 200
