import os
import sys

# Set environment variables BEFORE importing app
os.environ['SECRET_KEY'] = 'super-secret-wildguard-key-2026-change-in-production'
# Use absolute path for SQLite
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'wildguard.db')
os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from app import app, db

migrate = Migrate(app, db)

if __name__ == '__main__':
    with app.app_context():
        from flask_migrate import init, migrate as migrate_cmd, upgrade
        
        # Check if migrations directory exists
        if not os.path.exists('migrations'):
            print("Initializing migrations...")
            init()
            print("Creating initial migration...")
            migrate_cmd(message="Initial migration")
        else:
            print("Migrations directory exists, creating new migration...")
            migrate_cmd(message="Auto migration")
        
        print("Upgrading database...")
        upgrade()
        print("Done!")