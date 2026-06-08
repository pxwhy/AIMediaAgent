"""
实现逻辑：
1. 统一调度采集源适配器，给 API 提供来源、预览和详情能力。
2. 采集服务只返回数据契约，不直接写数据库。
3. 通过 source key 隔离不同平台实现，方便后续扩展更多来源。
"""

from packages.collector.contracts import CollectorSource, HotItem
from packages.collector.sources import SOURCE_ADAPTERS


def list_sources() -> list[CollectorSource]:
    return [adapter.source() for adapter in SOURCE_ADAPTERS.values()]


def preview(source: str, category: str = "home", limit: int = 20, with_detail: bool = False) -> list[HotItem]:
    adapter = SOURCE_ADAPTERS.get(source)
    if not adapter:
        raise ValueError("采集源不存在")

    items = adapter.fetch_list(category=category, limit=limit)
    if not with_detail:
        return items

    detailed_items = []
    for item in items:
        detailed_items.append(adapter.fetch_detail(item))
    return detailed_items


def fetch_detail(source: str, category: str, url: str, title: str = "") -> HotItem:
    adapter = SOURCE_ADAPTERS.get(source)
    if not adapter:
        raise ValueError("采集源不存在")

    item = HotItem(source=source, category=category, title=title or url, url=url)
    return adapter.fetch_detail(item)
