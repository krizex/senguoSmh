"""test

Revision ID: 3cf6e18ce53
Revises: 1aef8997d4a
Create Date: 2014-11-11 21:54:06.230912

"""

# revision identifiers, used by Alembic.
revision = '3cf6e18ce53'
down_revision = '1aef8997d4a'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table("test_alembic", sa.Column("text", sa.String(12)))

def downgrade():
    op.drop_table("test_alembic")
