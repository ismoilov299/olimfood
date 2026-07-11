"""add feedback

Revision ID: faea6468809b
Revises: a3771ee72f0e
Create Date: 2026-07-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'faea6468809b'
down_revision: Union[str, None] = 'a3771ee72f0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('feedback',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('order_id', sa.Integer(), nullable=False),
    sa.Column('delivery_rating', sa.Integer(), nullable=False),
    sa.Column('product_rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('order_id')
    )
    with op.batch_alter_table('feedback', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_feedback_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_feedback_order_id'), ['order_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('feedback', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_feedback_order_id'))
        batch_op.drop_index(batch_op.f('ix_feedback_id'))

    op.drop_table('feedback')
