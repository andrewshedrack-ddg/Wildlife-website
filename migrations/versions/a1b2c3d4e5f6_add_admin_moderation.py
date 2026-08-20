"""Add user.is_active and scan.status (admin moderation)

Adds the columns that power the admin dashboard moderation features:
- user.is_active  -> accounts can be banned/restored without deletion
- scan.status     -> scan review queue (pending -> approved/rejected)

Revision ID: a1b2c3d4e5f6
Revises: 3f8c1a2d4e6b
Create Date: 2026-08-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '3f8c1a2d4e6b'
branch_labels = None
depends_on = None


def upgrade():
    # server_default keeps the migration portable (SQLite cannot ALTER/DROP
    # defaults); the application also sets these values explicitly on insert.
    op.add_column('user', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('scan', sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'))


def downgrade():
    op.drop_column('scan', 'status')
    op.drop_column('user', 'is_active')