"""
实现逻辑：
1. 定义账号、采集内容、发布草稿、发布任务、发布结果和系统日志核心表。
2. 用状态字段表达完整业务流转，避免模块之间直接互相调用。
3. 保留 JSON 字段存平台扩展数据，方便先跑 MVP 再逐步规范。
"""

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class AccountStatus(StrEnum):
    ACTIVE = "active"
    EXPIRED = "expired"
    INVALID = "invalid"
    DISABLED = "disabled"


class RawContentStatus(StrEnum):
    COLLECTED = "collected"
    SELECTED = "selected"
    DISCARDED = "discarded"


class DraftStatus(StrEnum):
    PENDING = "pending"
    GENERATED = "generated"
    APPROVED = "approved"
    REJECTED = "rejected"


class PublishTaskStatus(StrEnum):
    PENDING = "pending"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELED = "canceled"


class LoginSessionStatus(StrEnum):
    OPENED = "opened"
    CONFIRMING = "confirming"
    COMPLETED = "completed"
    FAILED = "failed"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(32), index=True)
    nickname: Mapped[str] = mapped_column(String(100), default="")
    uid: Mapped[str] = mapped_column(String(128), default="", index=True)
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus), default=AccountStatus.ACTIVE
    )
    session_data: Mapped[dict] = mapped_column(JSON, default=dict)
    daily_publish_limit: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    drafts: Mapped[list["PublishDraft"]] = relationship(back_populates="account")


class RawContent(Base):
    __tablename__ = "raw_contents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(50), index=True)
    category: Mapped[str] = mapped_column(String(50), default="")
    title: Mapped[str] = mapped_column(String(255), index=True)
    content: Mapped[str] = mapped_column(Text)
    source_url: Mapped[str] = mapped_column(String(500), default="")
    images: Mapped[list] = mapped_column(JSON, default=list)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[RawContentStatus] = mapped_column(
        Enum(RawContentStatus), default=RawContentStatus.COLLECTED
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    drafts: Mapped[list["PublishDraft"]] = relationship(back_populates="raw_content")


class PublishDraft(Base):
    __tablename__ = "publish_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    raw_content_id: Mapped[int | None] = mapped_column(ForeignKey("raw_contents.id"), nullable=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    images: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[DraftStatus] = mapped_column(Enum(DraftStatus), default=DraftStatus.PENDING)
    agent_notes: Mapped[dict] = mapped_column(JSON, default=dict)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    raw_content: Mapped[RawContent | None] = relationship(back_populates="drafts")
    account: Mapped[Account | None] = relationship(back_populates="drafts")
    tasks: Mapped[list["PublishTask"]] = relationship(back_populates="draft")


class PublishTask(Base):
    __tablename__ = "publish_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    draft_id: Mapped[int] = mapped_column(ForeignKey("publish_drafts.id"))
    platform: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[PublishTaskStatus] = mapped_column(
        Enum(PublishTaskStatus), default=PublishTaskStatus.PENDING
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    draft: Mapped[PublishDraft] = relationship(back_populates="tasks")
    result: Mapped["PublishResult | None"] = relationship(back_populates="task")


class PublishResult(Base):
    __tablename__ = "publish_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("publish_tasks.id"), unique=True)
    success: Mapped[int] = mapped_column(Integer, default=0)
    platform_url: Mapped[str] = mapped_column(String(500), default="")
    error_message: Mapped[str] = mapped_column(Text, default="")
    raw_response: Mapped[dict] = mapped_column(JSON, default=dict)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped[PublishTask] = relationship(back_populates="result")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    module: Mapped[str] = mapped_column(String(50), index=True)
    level: Mapped[str] = mapped_column(String(20), default="info")
    message: Mapped[str] = mapped_column(Text)
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LoginSession(Base):
    __tablename__ = "login_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[LoginSessionStatus] = mapped_column(
        Enum(LoginSessionStatus), default=LoginSessionStatus.OPENED
    )
    login_url: Mapped[str] = mapped_column(String(500), default="")
    state_path: Mapped[str] = mapped_column(String(500), default="")
    account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
