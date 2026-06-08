"""
实现逻辑：
1. 定义跨模块共享的数据契约。
2. Collector、Agent、Publisher 通过这些结构传递数据。
3. 防止模块之间直接依赖彼此内部实现。
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class RawContentContract:
    source: str
    title: str
    content: str
    category: str = ""
    source_url: str = ""
    images: list[str] = field(default_factory=list)
    metrics: dict[str, Any] = field(default_factory=dict)
    published_at: datetime | None = None


@dataclass
class PublishDraftContract:
    title: str
    content: str
    account_id: int | None = None
    raw_content_id: int | None = None
    images: list[str] = field(default_factory=list)
    agent_notes: dict[str, Any] = field(default_factory=dict)
    risk_score: int = 0


@dataclass
class PublishTaskContract:
    draft_id: int
    platform: str
    scheduled_at: datetime | None = None

