import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine
from alembic import context

# Make the backend package importable (parent dir of this alembic/ folder).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base, SQLALCHEMY_DATABASE_URL  # noqa: E402
import models  # noqa: F401,E402  (registers all tables on Base.metadata)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ALEMBIC_DB_URL lets us point at a different DB (e.g. an empty one for
# autogenerate) without touching the app's real database path.
DB_URL = os.environ.get("ALEMBIC_DB_URL", SQLALCHEMY_DATABASE_URL)

target_metadata = Base.metadata

_connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}


def run_migrations_offline() -> None:
    context.configure(
        url=DB_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,   # SQLite needs batch mode to ALTER tables
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(DB_URL, connect_args=_connect_args)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,   # SQLite needs batch mode to ALTER tables
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
