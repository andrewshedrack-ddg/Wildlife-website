"""Tests for authentication endpoints (/api/register, /api/login, /api/me)."""

from .conftest import register_user, login_user


class TestRegister:
    def test_register_success(self, client):
        resp = register_user(client)
        assert resp.status_code == 201
        assert resp.get_json()['message'] == 'User registered successfully'

    def test_register_missing_fields(self, client):
        resp = client.post('/api/register', json={'email': 'a@b.com'})
        assert resp.status_code == 400

    def test_register_invalid_email(self, client):
        resp = register_user(client, email='not-an-email')
        assert resp.status_code == 400

    def test_register_short_password(self, client):
        resp = register_user(client, password='short')
        assert resp.status_code == 400

    def test_register_duplicate_email(self, client):
        register_user(client)
        resp = register_user(client)
        assert resp.status_code == 400
        assert resp.get_json()['message'] == 'Email already registered'


class TestLogin:
    def test_login_success_sets_cookie(self, client):
        register_user(client)
        resp = login_user(client)
        assert resp.status_code == 200
        assert resp.get_json()['role'] == 'user'
        assert resp.headers.get('Set-Cookie')
        assert 'auth_token=' in resp.headers.get('Set-Cookie', '')

    def test_login_wrong_password(self, client):
        register_user(client)
        resp = login_user(client, password='WrongPass123!')
        assert resp.status_code == 401

    def test_login_unknown_user(self, client):
        resp = login_user(client, email='nobody@example.com')
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        resp = client.post('/api/login', json={})
        assert resp.status_code == 400


class TestMe:
    def test_me_requires_token(self, client):
        resp = client.get('/api/me')
        assert resp.status_code == 401

    def test_me_with_valid_token(self, client):
        register_user(client)
        login_user(client)
        resp = client.get('/api/me')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['email'] == 'test@example.com'
        assert data['role'] == 'user'

    def test_me_with_invalid_token(self, client):
        client.set_cookie('auth_token', 'garbage.token.value')
        resp = client.get('/api/me')
        assert resp.status_code == 401
