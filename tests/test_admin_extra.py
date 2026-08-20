"""Tests for admin endpoints not covered elsewhere: settings, activity log,
email sending, user listing details, and notification flows."""

import pytest


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


class TestAdminSettings:
    def test_update_settings(self, admin_client):
        resp = admin_client.put('/api/admin/settings', json={'site_name': 'WildGuard'})
        assert resp.status_code == 200
        settings = admin_client.get('/api/settings').get_json()
        assert settings.get('site_name') == 'WildGuard'

    def test_update_settings_requires_admin(self, regular_client):
        resp = regular_client.put('/api/admin/settings', json={'site_name': 'Hacked'})
        assert resp.status_code == 403


class TestAdminActivity:
    def test_activity_after_admin_login(self, admin_client):
        # Admin login itself writes an activity log entry.
        activity = admin_client.get('/api/admin/activity').get_json()['activity']
        assert len(activity) == 1
        assert activity[0]['action'] == 'admin_login'

    def test_activity_logs_login(self, admin_client):
        # The admin login above should have written an ActivityLog entry.
        activity = admin_client.get('/api/admin/activity').get_json()['activity']
        assert len(activity) >= 1
        assert any('login' in a['action'] for a in activity)

    def test_activity_requires_admin(self, regular_client):
        resp = regular_client.get('/api/admin/activity')
        assert resp.status_code == 403


class TestAdminSendEmail:
    def test_send_email_valid(self, admin_client):
        resp = admin_client.post('/api/admin/send-email', json={
            'to': 'user@test.org',
            'subject': 'Welcome',
            'body': 'Hello there',
        })
        assert resp.status_code == 200
        assert resp.get_json()['email'] == 'user@test.org'

    def test_send_email_missing_fields(self, admin_client):
        resp = admin_client.post('/api/admin/send-email', json={'to': 'user@test.org'})
        assert resp.status_code == 400

    def test_send_email_requires_admin(self, regular_client):
        resp = regular_client.post('/api/admin/send-email', json={
            'to': 'user@test.org', 'subject': 'x', 'body': 'y',
        })
        assert resp.status_code == 403


class TestAdminUsersDetail:
    def test_user_fields(self, admin_client):
        users = admin_client.get('/api/admin/users').get_json()['users']
        assert len(users) == 2
        for u in users:
            assert set(u) >= {'id', 'email', 'role', 'created_at', 'is_online', 'last_seen'}


class TestBroadcastNotification:
    def test_broadcast_creates_notification(self, admin_client):
        resp = admin_client.post('/api/admin/broadcast', json={
            'recipients': ['user@test.org'],
            'subject': 'Site update',
            'body': 'We added new species',
        })
        assert resp.status_code == 200
        assert resp.get_json()['recipients'] == 1

        # The target user should now see the notification.
        resp = admin_client.post('/api/login', json={
            'email': 'user@test.org',
            'password': 'UserPass123!',
        })
        assert resp.status_code == 200
        notes = admin_client.get('/api/user/notifications').get_json()['notifications']
        assert len(notes) == 1
        assert notes[0]['title'] == 'Site update'
        assert notes[0]['read'] is False

    def test_mark_notification_read_success(self, admin_client):
        admin_client.post('/api/admin/broadcast', json={
            'recipients': ['user@test.org'],
            'subject': 'Hello',
            'body': 'Body',
        })
        admin_client.post('/api/login', json={
            'email': 'user@test.org',
            'password': 'UserPass123!',
        })
        note_id = admin_client.get('/api/user/notifications').get_json()['notifications'][0]['id']
        resp = admin_client.post(f'/api/user/notifications/{note_id}/read')
        assert resp.status_code == 200
        notes = admin_client.get('/api/user/notifications').get_json()['notifications']
        assert notes[0]['read'] is True

    def test_broadcast_unknown_recipient_does_not_error(self, admin_client):
        resp = admin_client.post('/api/admin/broadcast', json={
            'recipients': ['ghost@test.org'],
            'subject': 'Hello',
            'body': 'Body',
        })
        assert resp.status_code == 200


class TestAdminUserModeration:
    def _user_id(self, admin_client, email):
        users = admin_client.get('/api/admin/users').get_json()['users']
        return next(u['id'] for u in users if u['email'] == email)

    def test_promote_user_to_admin(self, admin_client):
        uid = self._user_id(admin_client, 'user@test.org')
        resp = admin_client.put(f'/api/admin/users/{uid}', json={'role': 'admin'})
        assert resp.status_code == 200
        users = admin_client.get('/api/admin/users').get_json()['users']
        target = next(u for u in users if u['id'] == uid)
        assert target['role'] == 'admin'

    def test_ban_user(self, admin_client):
        uid = self._user_id(admin_client, 'user@test.org')
        resp = admin_client.put(f'/api/admin/users/{uid}', json={'is_active': False})
        assert resp.status_code == 200
        users = admin_client.get('/api/admin/users').get_json()['users']
        assert next(u for u in users if u['id'] == uid)['is_active'] is False

    def test_banned_user_cannot_login(self, admin_client):
        uid = self._user_id(admin_client, 'user@test.org')
        admin_client.put(f'/api/admin/users/{uid}', json={'is_active': False})
        resp = admin_client.post('/api/login', json={
            'email': 'user@test.org',
            'password': 'UserPass123!',
        })
        assert resp.status_code == 401

    def test_cannot_modify_own_account(self, admin_client):
        uid = self._user_id(admin_client, 'admin@test.org')
        resp = admin_client.put(f'/api/admin/users/{uid}', json={'is_active': False})
        assert resp.status_code == 400

    def test_invalid_role_rejected(self, admin_client):
        uid = self._user_id(admin_client, 'user@test.org')
        resp = admin_client.put(f'/api/admin/users/{uid}', json={'role': 'superuser'})
        assert resp.status_code == 400

    def test_moderation_requires_admin(self, regular_client):
        resp = regular_client.put('/api/admin/users/2', json={'role': 'admin'})
        assert resp.status_code == 403


class TestScanReviewQueue:
    def _add_pending_scan(self, admin_client):
        resp = admin_client.post('/api/user/scans', json={'species_name': 'Lion', 'confidence': 90})
        assert resp.status_code == 201
        return resp.get_json()['id']

    def test_pending_list_empty(self, admin_client):
        scans = admin_client.get('/api/admin/scans/pending').get_json()['scans']
        assert scans == []

    def test_pending_list_shows_user_scan(self, admin_client):
        scan_id = self._add_pending_scan(admin_client)
        scans = admin_client.get('/api/admin/scans/pending').get_json()['scans']
        assert len(scans) == 1
        assert scans[0]['id'] == scan_id

    def test_approve_scan(self, admin_client):
        scan_id = self._add_pending_scan(admin_client)
        resp = admin_client.put(f'/api/admin/scans/{scan_id}/review', json={'status': 'approved'})
        assert resp.status_code == 200
        assert resp.get_json()['status'] == 'approved'
        assert admin_client.get('/api/admin/scans/pending').get_json()['scans'] == []

    def test_reject_scan(self, admin_client):
        scan_id = self._add_pending_scan(admin_client)
        resp = admin_client.put(f'/api/admin/scans/{scan_id}/review', json={'status': 'rejected'})
        assert resp.status_code == 200
        assert admin_client.get('/api/admin/scans/pending').get_json()['scans'] == []

    def test_review_invalid_status(self, admin_client):
        scan_id = self._add_pending_scan(admin_client)
        resp = admin_client.put(f'/api/admin/scans/{scan_id}/review', json={'status': 'maybe'})
        assert resp.status_code == 400

    def test_review_missing_scan_404(self, admin_client):
        resp = admin_client.put('/api/admin/scans/999/review', json={'status': 'approved'})
        assert resp.status_code == 404

    def test_stats_pending_counts_only_pending(self, admin_client):
        self._add_pending_scan(admin_client)
        stats = admin_client.get('/api/admin/stats').get_json()
        assert stats['pending_scans'] == 1