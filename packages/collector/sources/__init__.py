"""
实现逻辑：
1. 暴露采集源适配器注册表。
2. 每个采集源只负责预览列表和详情解析。
3. 新增来源时只需要添加适配器并注册到这里。
"""

from packages.collector.sources.ithome import ITHomeSource
from packages.collector.sources.china_daily import ChinaDailySource
from packages.collector.sources.netease import NeteaseSource
from packages.collector.sources.sina_world import SinaWorldSource
from packages.collector.sources.sohu import SohuSource
from packages.collector.sources.tencent_news import TencentNewsSource
from packages.collector.sources.tencent_sports import TencentSportsSource
from packages.collector.sources.thepaper import ThePaperSource


SOURCE_ADAPTERS = {
    "ithome": ITHomeSource(),
    "thepaper": ThePaperSource(),
    "netease": NeteaseSource(),
    "sohu": SohuSource(),
    "tencent_news": TencentNewsSource(),
    "tencent_sports": TencentSportsSource(),
    "sina_world": SinaWorldSource(),
    "china_daily": ChinaDailySource(),
}
