"""
实现逻辑：
1. 定义采集模块内部使用的热点预览结构。
2. 预览结构只描述外部素材，不直接绑定数据库模型。
3. 后端导入时再转换成 RawContent，保持采集模块轻量可替换。
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class CollectorSource:
    key: str
    name: str
    categories: list[dict[str, str]]


@dataclass
class HotItem:
    source: str
    category: str
    title: str
    url: str
    published_at: datetime | None = None
    summary: str = ""
    content: str = ""
    images: list[str] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)
