"""
实现逻辑：
1. 抓取中国日报中文频道列表页。
2. 解析标题、封面、发布时间和详情正文图片。
3. 为多个频道提供统一 HotItem 输出。
"""

from datetime import datetime

import requests
from lxml import etree

from packages.collector.contracts import CollectorSource, HotItem


class ChinaDailySource:
    key = "china_daily"
    name = "中国日报"
    headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    }
    categories = [
        {"key": "https://china.chinadaily.com.cn/5bd5639ca3101a87ca8ff636", "name": "时政要闻"},
        {"key": "https://china.chinadaily.com.cn/5e1ea9f6a3107bb6b579a144", "name": "台海动态"},
        {"key": "https://china.chinadaily.com.cn/5e1ea9f6a3107bb6b579a147", "name": "台湾政策"},
        {"key": "https://china.chinadaily.com.cn/5e23b3dea3107bb6b579ab68", "name": "两岸人生"},
        {"key": "https://china.chinadaily.com.cn/5bd55927a3101a87ca8ff618", "name": "国际资讯"},
        {"key": "https://cn.chinadaily.com.cn/5b753f9fa310030f813cf408/5bd54dd6a3101a87ca8ff5f8/5bd54e59a3101a87ca8ff606", "name": "中国日报专稿"},
        {"key": "https://cn.chinadaily.com.cn/5b753f9fa310030f813cf408/5bd549f1a3101a87ca8ff5e0", "name": "传媒动态"},
        {"key": "https://caijing.chinadaily.com.cn/stock/5f646b7fa3101e7ce97253d3", "name": "财经大事"},
        {"key": "https://caijing.chinadaily.com.cn/stock/5f646b7fa3101e7ce97253d6", "name": "权威发布"},
        {"key": "https://caijing.chinadaily.com.cn/stock/5f646b7fa3101e7ce97253d9", "name": "公告解读"},
        {"key": "https://caijing.chinadaily.com.cn/stock/5f646b7fa3101e7ce97253dc", "name": "深度报道"},
        {"key": "https://caijing.chinadaily.com.cn/stock/5f646b7fa3101e7ce97253df", "name": "信息披露"},
        {"key": "https://cn.chinadaily.com.cn/wenlv/5b7628dfa310030f813cf495", "name": "文旅头条"},
        {"key": "https://cn.chinadaily.com.cn/wenlv/5b7628c6a310030f813cf48f", "name": "旅游要闻"},
        {"key": "https://cn.chinadaily.com.cn/wenlv/5b7628c6a310030f813cf48b", "name": "酒店"},
        {"key": "https://cn.chinadaily.com.cn/wenlv/5b7628c6a310030f813cf492", "name": "旅游原创"},
        {"key": "https://cn.chinadaily.com.cn/wenlv/5b7628c6a310030f813cf493", "name": "业界资讯"},
        {"key": "https://fashion.chinadaily.com.cn/5b762404a310030f813cf467", "name": "时尚"},
        {"key": "https://cn.chinadaily.com.cn/jiankang", "name": "健康频道"},
        {"key": "https://fashion.chinadaily.com.cn/5b762404a310030f813cf461", "name": "教育"},
        {"key": "https://fashion.chinadaily.com.cn/5b762404a310030f813cf462", "name": "体育"},
    ]

    def source(self) -> CollectorSource:
        return CollectorSource(key=self.key, name=self.name, categories=self.categories)

    def fetch_list(self, category: str | None = None, limit: int = 20) -> list[HotItem]:
        url = category or self.categories[0]["key"]
        response = requests.get(url, headers=self.headers, timeout=15)
        html = etree.HTML(response.text)
        if html is None:
            return []
        items: list[HotItem] = []
        for node in html.xpath("//html/body/div[3]/div[1]/div/div[.//h3 and .//p/b]"):
            title = first(node.xpath(".//h3/a/text()"))
            article_url = normalize_url(first(node.xpath(".//h3/a/@href")))
            cover_url = normalize_url(first(node.xpath('.//div[contains(@class, "mr10")]/a/img/@src')))
            date_text = first(node.xpath(".//p/b/text()"))
            if not title or not article_url:
                continue
            items.append(
                HotItem(
                    source=self.key,
                    category=url,
                    title=title,
                    url=article_url,
                    published_at=self._parse_time(date_text),
                    images=[cover_url] if cover_url else [],
                    raw={"time": date_text},
                )
            )
            if len(items) >= limit:
                break
        items.sort(key=lambda item: item.published_at or datetime.min, reverse=True)
        return items

    def fetch_detail(self, item: HotItem) -> HotItem:
        response = requests.get(item.url, headers=self.headers, timeout=15)
        html = etree.HTML(response.text)
        if html is None:
            return item
        nodes = html.xpath('//div[@id="Content"]') or html.xpath('//div[@class="article"]') or html.xpath('//div[@class="content"]')
        if not nodes:
            return item
        content_node = nodes[0]
        text_parts = [
            text.strip()
            for text in content_node.xpath(".//p/text()")
            if text.strip()
        ]
        images = [normalize_url(src) for src in content_node.xpath(".//img/@src")]
        images = [src for src in images if src]
        content = "\n".join(text_parts)
        if content:
            item.content = content
            item.summary = content[:140]
        if images:
            item.images = images
        return item

    def _parse_time(self, value: str) -> datetime | None:
        try:
            return datetime.strptime(value, "%Y-%m-%d %H:%M")
        except ValueError:
            return None


def first(values: list[str]) -> str:
    return values[0].strip() if values else ""


def normalize_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        return f"https:{url}"
    return url
