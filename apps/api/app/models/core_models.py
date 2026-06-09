"""
实现逻辑：
1. 定义账号、账号作品、模型配置、Agent 配置、Skill 配置、复盘报告、账号肖像、采集内容、发布草稿、发布任务、发布结果和系统日志核心表。
2. 用状态字段表达完整业务流转，避免模块之间直接互相调用。
3. 保留 JSON 字段存平台扩展数据，方便先跑 MVP 再逐步规范。
"""

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
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


class ModelProvider(StrEnum):
    DEEPSEEK = "deepseek"
    OTHER = "other"


class AgentType(StrEnum):
    ACCOUNT_REVIEW = "account_review"
    CONTENT_SELECTION = "content_selection"
    ACCOUNT_PROFILE = "account_profile"


class SkillType(StrEnum):
    PROMPT = "prompt"


class ModelSetting(Base):
    __tablename__ = "model_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), default="默认模型")
    provider: Mapped[ModelProvider] = mapped_column(Enum(ModelProvider), default=ModelProvider.DEEPSEEK)
    api_key: Mapped[str] = mapped_column(Text, default="")
    base_url: Mapped[str] = mapped_column(String(500), default="https://api.deepseek.com")
    model: Mapped[str] = mapped_column(String(100), default="deepseek-chat")
    is_default: Mapped[int] = mapped_column(Integer, default=0)
    deepseek_api_key: Mapped[str] = mapped_column(Text, default="")
    deepseek_base_url: Mapped[str] = mapped_column(String(500), default="https://api.deepseek.com")
    deepseek_model: Mapped[str] = mapped_column(String(100), default="deepseek-chat")
    other_api_key: Mapped[str] = mapped_column(Text, default="")
    other_base_url: Mapped[str] = mapped_column(String(500), default="")
    other_model: Mapped[str] = mapped_column(String(100), default="")
    temperature: Mapped[str] = mapped_column(String(20), default="0.7")
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class AgentSetting(Base):
    __tablename__ = "agent_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), default="账号复盘默认 Agent")
    agent_type: Mapped[AgentType] = mapped_column(Enum(AgentType), default=AgentType.ACCOUNT_REVIEW)
    model_config_id: Mapped[int | None] = mapped_column(ForeignKey("model_settings.id"), nullable=True)
    system_prompt: Mapped[str] = mapped_column(Text, default="")
    user_prompt_template: Mapped[str] = mapped_column(Text, default="")
    skill_ids: Mapped[list] = mapped_column(JSON, default=list)
    skill_paths: Mapped[list] = mapped_column(JSON, default=list)
    enabled: Mapped[int] = mapped_column(Integer, default=1)
    is_default: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class SkillSetting(Base):
    __tablename__ = "skill_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), default="")
    skill_type: Mapped[SkillType] = mapped_column(Enum(SkillType), default=SkillType.PROMPT)
    description: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    enabled: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class AccountReviewReport(Base):
    __tablename__ = "account_review_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), index=True)
    agent_id: Mapped[int | None] = mapped_column(ForeignKey("agent_settings.id"), nullable=True)
    model_config_id: Mapped[int | None] = mapped_column(ForeignKey("model_settings.id"), nullable=True)
    provider: Mapped[str] = mapped_column(String(50), default="")
    model: Mapped[str] = mapped_column(String(100), default="")
    report: Mapped[dict] = mapped_column(JSON, default=dict)
    raw_report: Mapped[str] = mapped_column(Text, default="")
    works_count: Mapped[int] = mapped_column(Integer, default=0)
    usage: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AccountProfileReport(Base):
    __tablename__ = "account_profile_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), index=True)
    review_report_id: Mapped[int | None] = mapped_column(ForeignKey("account_review_reports.id"), nullable=True)
    agent_id: Mapped[int | None] = mapped_column(ForeignKey("agent_settings.id"), nullable=True)
    model_config_id: Mapped[int | None] = mapped_column(ForeignKey("model_settings.id"), nullable=True)
    provider: Mapped[str] = mapped_column(String(50), default="")
    model: Mapped[str] = mapped_column(String(100), default="")
    profile: Mapped[dict] = mapped_column(JSON, default=dict)
    raw_report: Mapped[str] = mapped_column(Text, default="")
    works_count: Mapped[int] = mapped_column(Integer, default=0)
    usage: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContentSelectionRun(Base):
    __tablename__ = "content_selection_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id"), nullable=True, index=True)
    profile_report_id: Mapped[int | None] = mapped_column(ForeignKey("account_profile_reports.id"), nullable=True)
    review_report_id: Mapped[int | None] = mapped_column(ForeignKey("account_review_reports.id"), nullable=True)
    agent_id: Mapped[int | None] = mapped_column(ForeignKey("agent_settings.id"), nullable=True)
    model_config_id: Mapped[int | None] = mapped_column(ForeignKey("model_settings.id"), nullable=True)
    agent_name: Mapped[str] = mapped_column(String(100), default="")
    provider: Mapped[str] = mapped_column(String(50), default="")
    model: Mapped[str] = mapped_column(String(100), default="")
    basis: Mapped[str] = mapped_column(String(50), default="")
    targets: Mapped[str] = mapped_column(Text, default="")
    candidates_count: Mapped[int] = mapped_column(Integer, default=0)
    recommended_count: Mapped[int] = mapped_column(Integer, default=0)
    raw_report: Mapped[str] = mapped_column(Text, default="")
    usage: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    items: Mapped[list["ContentSelectionItem"]] = relationship(
        back_populates="run", cascade="all, delete-orphan"
    )


class ContentSelectionItem(Base):
    __tablename__ = "content_selection_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("content_selection_runs.id"), index=True)
    raw_content_id: Mapped[int] = mapped_column(ForeignKey("raw_contents.id"), index=True)
    selected: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[int] = mapped_column(Integer, default=0)
    reason: Mapped[str] = mapped_column(Text, default="")
    risk: Mapped[str] = mapped_column(String(20), default="medium")
    suggested_angle: Mapped[str] = mapped_column(Text, default="")
    suggested_title: Mapped[str] = mapped_column(String(255), default="")
    data_limits: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    run: Mapped[ContentSelectionRun] = relationship(back_populates="items")
    raw_content: Mapped["RawContent"] = relationship()


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
    works: Mapped[list["AccountWork"]] = relationship(back_populates="account")


class AccountWork(Base):
    __tablename__ = "account_works"
    __table_args__ = (
        UniqueConstraint("platform", "platform_work_id", name="uq_account_works_platform_work"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), index=True)
    platform: Mapped[str] = mapped_column(String(32), index=True)
    platform_work_id: Mapped[str] = mapped_column(String(255), default="", index=True)
    title: Mapped[str] = mapped_column(String(255), default="")
    content: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[str] = mapped_column(String(50), default="")
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    raw: Mapped[dict] = mapped_column(JSON, default=dict)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    account: Mapped[Account] = relationship(back_populates="works")


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
