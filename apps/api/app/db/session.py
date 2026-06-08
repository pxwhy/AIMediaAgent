"""
实现逻辑：
1. 创建 SQLAlchemy Engine 和 SessionLocal。
2. 提供数据库会话依赖，供 API 路由使用。
3. MVP 阶段启动时自动建表。
"""

from collections.abc import Generator

from sqlalchemy import create_engine
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

