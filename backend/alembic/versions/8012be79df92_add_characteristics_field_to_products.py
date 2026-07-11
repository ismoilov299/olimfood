"""add characteristics field to products

Revision ID: 8012be79df92
Revises: 2ea64694b3b0
Create Date: 2026-07-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8012be79df92'
down_revision: Union[str, None] = '2ea64694b3b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(sa.Column('characteristics_uz', sa.Text(), nullable=True, server_default=''))
        batch_op.add_column(sa.Column('characteristics_uzl', sa.Text(), nullable=True, server_default=''))
        batch_op.add_column(sa.Column('characteristics_ru', sa.Text(), nullable=True, server_default=''))


def downgrade() -> None:
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('characteristics_ru')
        batch_op.drop_column('characteristics_uzl')
        batch_op.drop_column('characteristics_uz')
