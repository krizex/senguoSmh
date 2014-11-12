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
    op.drop_column('info', sa.Column('create_date_timestamp'))
    op.add_column('info', sa.Column('create_date', sa.DateTime, default=sa.func.now()))
def downgrade():
    op.drop_column('feedback', "test")
