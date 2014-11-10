"""Add a Column

Revision ID: 1aef8997d4a
Revises: None
Create Date: 2014-11-10 11:55:39.016412

"""

# revision identifiers, used by Alembic.
revision = '1aef8997d4a'
down_revision = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('feedback', sa.Column('test', sa.Integer,default=1))


def downgrade():
    pass
