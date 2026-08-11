import os
import tempfile
import pytest

# Must be set before importing app, otherwise app.py raises at import time.
os.environ.setdefault('SECRET_KEY', 'test-secret-key-not-for-production')
os.environ.setdefault('COOKIE_SECURE', 'false')

# Use a throwaway SQLite database so tests never touch the real data.
_test_db_fd, _test_db_path = tempfile.mkstemp(suffix='.db')
os.close(_test_db_fd)
os.environ['DATABASE_URL'] = f'sqlite:///{_test_db_path}'

import app as app_module
from app import db, bcrypt, User, Species, Message


@pytest.fixture()
def app():
    app_module.app.config.update(
        TESTING=True,
        SECRET_KEY='test-secret-key-not-for-production',
        SQLALCHEMY_DATABASE_URI=f'sqlite:///{_test_db_path}',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    with app_module.app.app_context():
        db.drop_all()
        db.create_all()
        yield app_module.app
        db.session.remove()
        db.drop_all()


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """Clear the in-process rate limiter so tests do not trip each other's
    login/register limits."""
    with app_module._rate_lock:
        app_module._rate_limits.clear()
    yield
    with app_module._rate_lock:
        app_module._rate_limits.clear()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def seeded_client(app, client):
    """A client with an admin user, a regular user, and sample species."""
    with app.app_context():
        admin = User(email='admin@test.org', password_hash=bcrypt.generate_password_hash('AdminPass123!').decode('utf-8'), role='admin')
        user = User(email='user@test.org', password_hash=bcrypt.generate_password_hash('UserPass123!').decode('utf-8'), role='user')
        db.session.add_all([admin, user])
        db.session.commit()
        for s in [Species(name='African Elephant', status='Endangered', description='Big', image_url=None)]:
            db.session.add(s)
        db.session.commit()
    return client


def register_user(client, email='test@example.com', password='Password123!'):
    return client.post('/api/register', json={'email': email, 'password': password})


def login_user(client, email='test@example.com', password='Password123!'):
    return client.post('/api/login', json={'email': email, 'password': password})
