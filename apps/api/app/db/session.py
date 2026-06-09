"""
实现逻辑：
1. 创建 SQLAlchemy Engine 和 SessionLocal。
2. 提供数据库会话依赖，供 API 路由使用。
3. MVP 阶段启动时自动建表，并补齐 SQLite 老库新增字段。
"""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import core_models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()


def _ensure_sqlite_columns() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as connection:
        tables = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).scalars()
        if "account_works" not in set(tables):
            return
        columns = {
            row[1]
            for row in connection.execute(text("PRAGMA table_info(account_works)")).fetchall()
        }
        if "content" not in columns:
            connection.execute(text("ALTER TABLE account_works ADD COLUMN content TEXT DEFAULT ''"))
