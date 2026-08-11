"""Tests for authenticated user data endpoints: scans, favourites, profile."""

import pytest

from .conftest import register_user, login_user


@pytest.fixture()
def authed_client(client):
    register_user(client)
    login_user(client)
    return client


class TestScans:
    def test_list_scans_empty(self, authed_client):
        resp = authed_client.get('/api/user/scans')
        assert resp.status_code == 200
        assert resp.get_json() == {'scans': []}

    def test_add_scan(self, authed_client):
        resp = authed_client.post('/api/user/scans', json={
            'species_name': 'Lion',
            'confidence': 87,
        })
        assert resp.status_code == 201
        scans = authed_client.get('/api/user/scans').get_json()['scans']
        assert len(scans) == 1
        assert scans[0]['species_name'] == 'Lion'
        assert scans[0]['confidence'] == 87

    def test_add_scan_missing_fields(self, authed_client):
        resp = authed_client.post('/api/user/scans', json={'species_name': 'Lion'})
        assert resp.status_code == 400

    def test_add_scan_clamps_confidence(self, authed_client):
        resp = authed_client.post('/api/user/scans', json={
            'species_name': 'Lion',
            'confidence': 999,
        })
        assert resp.status_code == 201
        scans = authed_client.get('/api/user/scans').get_json()['scans']
        assert scans[0]['confidence'] == 100

    def test_add_scan_requires_auth(self, client):
        resp = client.post('/api/user/scans', json={'species_name': 'Lion', 'confidence': 50})
        assert resp.status_code == 401


class TestFavourites:
    def test_add_and_list(self, authed_client):
        resp = authed_client.post('/api/user/favourites', json={'species_name': 'Giraffe'})
        assert resp.status_code == 201
        favs = authed_client.get('/api/user/favourites').get_json()['favourites']
        assert len(favs) == 1
        assert favs[0]['species_name'] == 'Giraffe'

    def test_duplicate_favourite_rejected(self, authed_client):
        authed_client.post('/api/user/favourites', json={'species_name': 'Giraffe'})
        resp = authed_client.post('/api/user/favourites', json={'species_name': 'Giraffe'})
        assert resp.status_code == 400
        assert resp.get_json()['message'] == 'Already in favourites'

    def test_delete_favourite(self, authed_client):
        add = authed_client.post('/api/user/favourites', json={'species_name': 'Giraffe'})
        fav_id = add.get_json()['id']
        resp = authed_client.delete(f'/api/user/favourites/{fav_id}')
        assert resp.status_code == 200
        favs = authed_client.get('/api/user/favourites').get_json()['favourites']
        assert favs == []

    def test_delete_other_users_favourite_404(self, authed_client):
        add = authed_client.post('/api/user/favourites', json={'species_name': 'Giraffe'})
        fav_id = add.get_json()['id']
        # A different user should not be able to delete it
        register_user(authed_client, email='other@example.com')
        login_user(authed_client, email='other@example.com')
        resp = authed_client.delete(f'/api/user/favourites/{fav_id}')
        assert resp.status_code == 404


class TestProfile:
    def test_profile_requires_auth(self, client):
        resp = client.get('/api/user/profile')
        assert resp.status_code == 401

    def test_profile_counts(self, authed_client):
        authed_client.post('/api/user/scans', json={'species_name': 'Lion', 'confidence': 90})
        authed_client.post('/api/user/favourites', json={'species_name': 'Lion'})
        resp = authed_client.get('/api/user/profile')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['scans_count'] == 1
        assert data['favourites_count'] == 1
        assert data['email'] == 'test@example.com'

    def test_profile_update(self, authed_client):
        resp = authed_client.put('/api/user/profile', json={
            'firstName': 'Ada',
            'lastName': 'Lovelace',
            'bio': 'Conservationist',
            'country': 'kenya',
            'emailNotifications': True,
        })
        assert resp.status_code == 200
        profile = authed_client.get('/api/user/profile').get_json()
        assert profile['firstName'] == 'Ada'
        assert profile['lastName'] == 'Lovelace'
        assert profile['bio'] == 'Conservationist'
        assert profile['prefs'] == {'emailNotifications': True}

    def test_profile_update_requires_auth(self, client):
        resp = client.put('/api/user/profile', json={'firstName': 'Ada'})
        assert resp.status_code == 401


class TestChangePassword:
    def test_change_password_success(self, authed_client):
        resp = authed_client.post('/api/user/change-password', json={
            'current_password': 'Password123!',
            'new_password': 'NewPassword456!',
        })
        assert resp.status_code == 200
        # Old password should no longer work
        authed_client.delete_cookie('auth_token')
        resp = login_user(authed_client, password='NewPassword456!')
        assert resp.status_code == 200

    def test_change_password_wrong_current(self, authed_client):
        resp = authed_client.post('/api/user/change-password', json={
            'current_password': 'WrongCurrent!',
            'new_password': 'NewPassword456!',
        })
        assert resp.status_code == 401

    def test_change_password_short_new(self, authed_client):
        resp = authed_client.post('/api/user/change-password', json={
            'current_password': 'Password123!',
            'new_password': 'short',
        })
        assert resp.status_code == 400


class TestNotifications:
    def test_list_notifications_empty(self, authed_client):
        resp = authed_client.get('/api/user/notifications')
        assert resp.status_code == 200
        assert resp.get_json() == {'notifications': []}

    def test_mark_read_not_found(self, authed_client):
        resp = authed_client.post('/api/user/notifications/999/read')
        assert resp.status_code == 404

    def test_requires_auth(self, client):
        resp = client.get('/api/user/notifications')
        assert resp.status_code == 401
