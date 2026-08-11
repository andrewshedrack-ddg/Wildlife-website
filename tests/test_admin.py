"""Tests for admin-only endpoints: stats, users, species CRUD, messages, broadcasts."""

import pytest

from .conftest import register_user, login_user


@pytest.fixture()
def admin_client(seeded_client):
    resp = seeded_client.post('/api/admin/login', json={
        'email': 'admin@test.org',
        'password': 'AdminPass123!',
    })
    assert resp.status_code == 200
    return seeded_client


@pytest.fixture()
def regular_client(seeded_client):
    resp = seeded_client.post('/api/login', json={
        'email': 'user@test.org',
        'password': 'UserPass123!',
    })
    assert resp.status_code == 200
    return seeded_client


class TestAdminAuth:
    def test_admin_login_rejects_non_admin(self, seeded_client):
        resp = seeded_client.post('/api/admin/login', json={
            'email': 'user@test.org',
            'password': 'UserPass123!',
        })
        assert resp.status_code == 403

    def test_admin_login_wrong_password(self, seeded_client):
        resp = seeded_client.post('/api/admin/login', json={
            'email': 'admin@test.org',
            'password': 'WrongPass!',
        })
        assert resp.status_code == 401

    def test_admin_verify(self, admin_client):
        resp = admin_client.post('/api/admin/verify')
        assert resp.status_code == 200
        assert resp.get_json()['role'] == 'admin'

    def test_regular_user_cannot_verify(self, regular_client):
        resp = regular_client.post('/api/admin/verify')
        assert resp.status_code == 403


class TestAdminStats:
    def test_stats(self, admin_client):
        resp = admin_client.get('/api/admin/stats')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total_users'] == 2
        assert data['total_species'] == 1

    def test_stats_requires_admin(self, regular_client):
        resp = regular_client.get('/api/admin/stats')
        assert resp.status_code == 403


class TestAdminUsers:
    def test_list_users(self, admin_client):
        resp = admin_client.get('/api/admin/users')
        assert resp.status_code == 200
        users = resp.get_json()['users']
        emails = {u['email'] for u in users}
        assert 'admin@test.org' in emails
        assert 'user@test.org' in emails


class TestAdminSpecies:
    def test_create_species(self, admin_client):
        resp = admin_client.post('/api/admin/species', json={
            'name': 'Cheetah',
            'status': 'Vulnerable',
            'description': 'Fastest land animal.',
        })
        assert resp.status_code == 201
        species = admin_client.get('/api/species').get_json()['species']
        assert any(s['name'] == 'Cheetah' for s in species)

    def test_create_species_missing_fields(self, admin_client):
        resp = admin_client.post('/api/admin/species', json={'name': 'Cheetah'})
        assert resp.status_code == 400

    def test_create_species_requires_admin(self, regular_client):
        resp = regular_client.post('/api/admin/species', json={
            'name': 'Cheetah',
            'status': 'Vulnerable',
            'description': 'x',
        })
        assert resp.status_code == 403

    def test_update_species(self, admin_client):
        species_id = admin_client.get('/api/species').get_json()['species'][0]['id']
        resp = admin_client.put(f'/api/admin/species/{species_id}', json={'status': 'Critically Endangered'})
        assert resp.status_code == 200
        updated = admin_client.get('/api/species').get_json()['species'][0]
        assert updated['status'] == 'Critically Endangered'

    def test_delete_species(self, admin_client):
        species_id = admin_client.get('/api/species').get_json()['species'][0]['id']
        resp = admin_client.delete(f'/api/admin/species/{species_id}')
        assert resp.status_code == 200
        species = admin_client.get('/api/species').get_json()['species']
        assert species == []


class TestAdminMessages:
    def test_list_and_delete_messages(self, admin_client, seeded_client):
        seeded_client.post('/api/contact', json={
            'name': 'Visitor',
            'email': 'visitor@example.com',
            'subject': 'Question',
            'content': 'How can I volunteer?',
        })
        messages = admin_client.get('/api/admin/messages').get_json()['messages']
        assert len(messages) == 1
        assert messages[0]['subject'] == 'Question'

        msg_id = messages[0]['id']
        resp = admin_client.delete(f'/api/admin/messages/{msg_id}')
        assert resp.status_code == 200
        messages = admin_client.get('/api/admin/messages').get_json()['messages']
        assert messages == []

    def test_messages_requires_admin(self, regular_client):
        resp = regular_client.get('/api/admin/messages')
        assert resp.status_code == 403


class TestBroadcast:
    def test_broadcast_valid(self, admin_client):
        resp = admin_client.post('/api/admin/broadcast', json={
            'recipients': ['user@test.org'],
            'subject': 'Update',
            'body': 'Hello users',
        })
        assert resp.status_code == 200
        assert resp.get_json()['recipients'] == 1

    def test_broadcast_missing_fields(self, admin_client):
        resp = admin_client.post('/api/admin/broadcast', json={'recipients': []})
        assert resp.status_code == 400

    def test_broadcast_empty_recipients(self, admin_client):
        resp = admin_client.post('/api/admin/broadcast', json={
            'recipients': [],
            'subject': 'Update',
            'body': 'Hello',
        })
        assert resp.status_code == 400


class TestAiScan:
    def test_scan_no_image(self, client):
        resp = client.post('/api/scan', json={})
        assert resp.status_code == 400

    def test_scan_unconfigured_returns_available_false(self, client, monkeypatch):
        monkeypatch.delenv('AZURE_VISION_ENDPOINT', raising=False)
        monkeypatch.delenv('AZURE_VISION_KEY', raising=False)
        resp = client.post('/api/scan', json={'image': 'aGVsbG8='})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['available'] is False

    def test_scan_oversized_rejected(self, client):
        big = 'A' * (8 * 1024 * 1024)
        resp = client.post('/api/scan', json={'image': big})
        assert resp.status_code == 413
