"""
实现逻辑：
1. 定义 API 输入输出结构，和数据库模型解耦。
2. MVP 先覆盖账号、采集内容、草稿和发布任务的创建与展示。
3. 前端只依赖这些 schema，不直接理解数据库字段细节。
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AccountCreate(BaseModel):
    platform: str
    nickname: str = ""
    uid: str = ""
    session_data: dict[str, Any] = {}
    daily_publish_limit: int = 5


class AccountRead(AccountCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime


class RawContentCreate(BaseModel):
    source: str
    category: str = ""
    title: str
    content: str
    source_url: str = ""
    images: list[str] = []
    metrics: dict[str, Any] = {}


class RawContentRead(RawContentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime


class CollectorCategoryRead(BaseModel):
    key: str
    name: str


class CollectorSourceRead(BaseModel):
    key: str
    name: str
    categories: list[CollectorCategoryRead]


class CollectorPreviewRequest(BaseModel):
    source: str
    category: str = "home"
    limit: int = 20
    with_detail: bool = False


class CollectorImportRequest(BaseModel):
    source: str
    category: str = "home"
    title: str
    url: str


class CollectorItemRead(BaseModel):
    source: str
    category: str
    title: str
    url: str
    published_at: datetime | None = None
    summary: str = ""
    content: str = ""
    images: list[str] = []
    raw: dict[str, Any] = {}


class PublishDraftCreate(BaseModel):
    raw_content_id: int | None = None
    account_id: int | None = None
    title: str
    content: str
    images: list[str] = []
    agent_notes: dict[str, Any] = {}
    risk_score: int = 0


class DraftFromRawContentCreate(BaseModel):
    raw_content_id: int
    account_id: int | None = None
    title: str = ""
    content: str = ""
    images: list[str] | None = None


class PublishDraftRead(PublishDraftCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    updated_at: datetime


class PublishTaskCreate(BaseModel):
    draft_id: int
    platform: str
    scheduled_at: datetime | None = None


class PublishTaskRead(PublishTaskCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    updated_at: datetime


class PublishTaskStatusUpdate(BaseModel):
    error_message: str = ""


class LoginSessionCreate(BaseModel):
    platform: str


class LoginSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    platform: str
    status: str
    login_url: str
    state_path: str
    account_id: int | None
    error_message: str
    created_at: datetime
    updated_at: datetime
