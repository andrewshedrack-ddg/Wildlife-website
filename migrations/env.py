import logging
import os
import sys
from logging.config import fileConfig

# Add the current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from alembic import context

# Import the app and db from the main app module
from app import app, db

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')


def get_engine():
    return db.engine


def get_engine_url():
    return str(get_engine().url).replace('%', '%%')


# Set the SQLAlchemy URL from the Flask app config
config.set_main_option('sqlalchemy.url', get_engine_url())
target_db = db


def get_metadata():
    if hasattr(target_db, 'metadatas'):
        return target_db.metadatas[None]
    return target_db.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=get_metadata(), literal_binds=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""

    # this callback is used to prevent an auto-migration from being generated
    # when there are no changes to the schema
    def process_revision_directives(context, revision, directives):
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No changes in schema detected.')

    conf_args = {"process_revision_directives": process_revision_directives}

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            **conf_args
        )

        with context.begin_transaction():
            context.run_migrations()


# Run migrations within Flask app context
with app.app_context():
    if context.is_offline_mode():
        run_migrations_offline()
    else:
        run_migrations_online()
