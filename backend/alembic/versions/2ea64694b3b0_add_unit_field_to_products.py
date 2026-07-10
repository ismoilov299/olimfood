"""add unit field to products

Revision ID: 2ea64694b3b0
Revises: bf4884981bdc
Create Date: 2026-07-09 03:27:28.239236

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ea64694b3b0'
down_revision: Union[str, None] = 'bf4884981bdc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(sa.Column('unit', sa.String(length=10), nullable=True, server_default='dona'))


def downgrade() -> None:
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('unit')
