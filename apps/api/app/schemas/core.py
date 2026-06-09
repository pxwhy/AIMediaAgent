"""
实现逻辑：
1. 定义 API 输入输出结构，和数据库模型解耦。
2. MVP 覆盖账号、账号作品、模型配置与测试、采集内容、草稿、发布任务和发布诊断的创建与展示。
3. 前端只依赖这些 schema，不直接理解数据库字段和运行目录细节。
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


class AccountWorkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int
    platform: str
    platform_work_id: str
    title: str
    content: str = ""
    url: str
    status: str
    metrics: dict[str, Any] = {}
    raw: dict[str, Any] = {}
    published_at: datetime | None = None
    synced_at: datetime
    created_at: datetime
    updated_at: datetime


class AccountWorkSyncRead(BaseModel):
    account_id: int
    platform: str
    synced_count: int
    total_count: int
    message: str = ""


class ModelConfigRead(BaseModel):
    provider: str = "deepseek"
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    deepseek_api_key_configured: bool = False
    other_base_url: str = ""
    other_model: str = ""
    other_api_key_configured: bool = False
    temperature: float = 0.7
    timeout_seconds: int = 60


class ModelConfigUpdate(BaseModel):
    provider: str = "deepseek"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    other_api_key: str = ""
    other_base_url: str = ""
    other_model: str = ""
    temperature: float = 0.7
    timeout_seconds: int = 60


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


class PublishResultDiagnosticRead(BaseModel):
    success: bool = False
    platform_url: str = ""
    error_message: str = ""
    raw_response: dict[str, Any] = {}
    published_at: datetime | None = None


class PublishTaskDiagnosticRead(BaseModel):
    task_id: int
    status: str
    result: PublishResultDiagnosticRead | None = None
    run_dir: str
    logs: str = ""
    screenshots: list[str] = []


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


class ModelTestRequest(BaseModel):
    prompt: str = ""


class ModelTestRead(BaseModel):
    provider: str
    model: str
    content: str
    usage: dict[str, Any] = {}
