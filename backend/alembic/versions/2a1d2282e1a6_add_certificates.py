"""add certificates

Revision ID: 2a1d2282e1a6
Revises: 8012be79df92
Create Date: 2026-07-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a1d2282e1a6'
down_revision: Union[str, None] = '8012be79df92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('certificates',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name_uz', sa.String(length=150), nullable=False),
    sa.Column('name_uzl', sa.String(length=150), nullable=True),
    sa.Column('name_ru', sa.String(length=150), nullable=True),
    sa.Column('logo_url', sa.String(length=500), nullable=True),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('certificates', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_certificates_id'), ['id'], unique=False)

    op.create_table('certificate_categories',
    sa.Column('certificate_id', sa.Integer(), nullable=False),
    sa.Column('category_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
    sa.ForeignKeyConstraint(['certificate_id'], ['certificates.id'], ),
    sa.PrimaryKeyConstraint('certificate_id', 'category_id')
    )


def downgrade() -> None:
    op.drop_table('certificate_categories')
    with op.batch_alter_table('certificates', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_certificates_id'))

    op.drop_table('certificates')
