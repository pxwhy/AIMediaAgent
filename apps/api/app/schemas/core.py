"""
实现逻辑：
1. 定义 API 输入输出结构，和数据库模型解耦。
2. MVP 覆盖账号、账号作品、模型配置、Agent 配置、Skill 配置与测试、采集内容、草稿、发布任务和发布诊断的创建与展示。
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
    id: int
    name: str
    provider: str = "deepseek"
    base_url: str = "https://api.deepseek.com"
    model: str = "deepseek-chat"
    api_key_configured: bool = False
    temperature: float = 0.7
    timeout_seconds: int = 60
    is_default: bool = False


class ModelConfigUpdate(BaseModel):
    name: str = "默认模型"
    provider: str = "deepseek"
    api_key: str = ""
    base_url: str = "https://api.deepseek.com"
    model: str = "deepseek-chat"
    temperature: float = 0.7
    timeout_seconds: int = 60
    is_default: bool = False


class AgentConfigRead(BaseModel):
    id: int
    name: str
    agent_type: str = "account_review"
    model_config_id: int | None = None
    model_config_name: str = "全局默认模型"
    system_prompt: str = ""
    user_prompt_template: str = ""
    skill_ids: list[int] = []
    skill_paths: list[str] = []
    skill_names: list[str] = []
    enabled: bool = True
    is_default: bool = False


class AgentConfigUpdate(BaseModel):
    name: str = "账号复盘默认 Agent"
    agent_type: str = "account_review"
    model_config_id: int | None = None
    system_prompt: str = ""
    user_prompt_template: str = ""
    skill_ids: list[int] = []
    skill_paths: list[str] = []
    enabled: bool = True
    is_default: bool = False


class SkillConfigRead(BaseModel):
    id: int
    name: str
    skill_type: str = "prompt"
    description: str = ""
    content: str = ""
    enabled: bool = True


class SkillConfigUpdate(BaseModel):
    name: str = ""
    skill_type: str = "prompt"
    description: str = ""
    content: str = ""
    enabled: bool = True


class LocalSkillRead(BaseModel):
    name: str
    description: str = ""
    relative_path: str
    path: str
    content: str = ""


class LocalSkillListRead(BaseModel):
    root: str
    skills: list[LocalSkillRead]


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
    model_config_id: int | None = None


class ModelTestRead(BaseModel):
    provider: str
    model: str
    content: str
    usage: dict[str, Any] = {}


class ReviewPositioning(BaseModel):
    current_direction: str = ""
    strengths: list[str] = []
    risks: list[str] = []


class ReviewTopWork(BaseModel):
    title: str = ""
    reason: str = ""
    evidence: str = ""


class ReviewTitleAnalysis(BaseModel):
    patterns: list[str] = []
    problems: list[str] = []
    formulas: list[str] = []


class ReviewContentStructure(BaseModel):
    strengths: list[str] = []
    problems: list[str] = []
    template: str = ""


class ReviewAudience(BaseModel):
    profile: str = ""
    interests: list[str] = []
    unmet_needs: list[str] = []


class ReviewTopicSuggestion(BaseModel):
    topic: str = ""
    title_direction: str = ""
    reason: str = ""
    angle: str = ""
    metric: str = ""


class ReviewActionItem(BaseModel):
    action: str = ""
    priority: str = "medium"
    metric: str = ""
    cycle: str = ""


class ReviewReport(BaseModel):
    summary: str = ""
    positioning: ReviewPositioning = ReviewPositioning()
    top_works: list[ReviewTopWork] = []
    title_analysis: ReviewTitleAnalysis = ReviewTitleAnalysis()
    content_structure: ReviewContentStructure = ReviewContentStructure()
    audience: ReviewAudience = ReviewAudience()
    topic_suggestions: list[ReviewTopicSuggestion] = []
    actions: list[ReviewActionItem] = []
    data_limits: list[str] = []


class ContentSelectionRequest(BaseModel):
    raw_content_ids: list[int]
    agent_id: int | None = None
    model_config_id: int | None = None


class ContentSelectionItemRead(BaseModel):
    raw_content_id: int
    selected: bool = False
    score: int = 0
    reason: str = ""
    risk: str = "medium"
    suggested_angle: str = ""
    suggested_title: str = ""
    data_limits: list[str] = []


class ContentSelectionRead(BaseModel):
    agent_id: int | None = None
    agent_name: str = ""
    model_config_id: int | None = None
    provider: str
    model: str
    results: list[ContentSelectionItemRead]
    raw_report: str = ""
    usage: dict[str, Any] = {}


class ProfileSourcePreference(BaseModel):
    source: str = ""
    category: str = ""
    reason: str = ""
    keywords: list[str] = []
    priority: str = "medium"


class AccountProfileReport(BaseModel):
    summary: str = ""
    positioning: str = ""
    audience_profile: str = ""
    content_tracks: list[str] = []
    title_style: list[str] = []
    source_preferences: list[ProfileSourcePreference] = []
    forbidden_topics: list[str] = []
    risk_boundaries: list[str] = []
    topic_keywords: list[str] = []
    publishing_advice: list[str] = []
    data_limits: list[str] = []


class AccountProfileRequest(BaseModel):
    account_id: int
    review_report_id: int | None = None
    agent_id: int | None = None
    model_config_id: int | None = None


class AccountProfileRead(BaseModel):
    account_id: int
    review_report_id: int | None = None
    agent_id: int | None = None
    agent_name: str = ""
    model_config_id: int | None = None
    provider: str
    model: str
    profile: AccountProfileReport
    raw_report: str = ""
    works_count: int = 0
    usage: dict[str, Any] = {}


class AccountProfileReportRead(AccountProfileRead):
    id: int
    created_at: datetime


class AccountReviewRequest(BaseModel):
    account_id: int
    agent_id: int | None = None
    model_config_id: int | None = None


class AccountReviewRead(BaseModel):
    account_id: int
    agent_id: int | None = None
    agent_name: str = ""
    model_config_id: int | None = None
    provider: str
    model: str
    report: ReviewReport
    raw_report: str = ""
    works_count: int
    usage: dict[str, Any] = {}


class AccountReviewReportRead(AccountReviewRead):
    id: int
    created_at: datetime
