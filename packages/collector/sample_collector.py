"""
实现逻辑：
1. 提供采集模块样例，返回统一 RawContentContract。
2. 后续迁移旧项目爬虫时，只需要适配这个输出结构。
3. 采集模块不生成文章，也不发布内容。
"""

from packages.shared.contracts import RawContentContract


def collect_sample() -> RawContentContract:
    return RawContentContract(
        source="sample",
        category="科技",
        title="示例热点标题",
        content="这是一段用于验证采集模块边界的示例内容。",
        source_url="https://example.com/news/1",
        images=[],
    )

