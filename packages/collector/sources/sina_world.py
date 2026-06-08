"""
实现逻辑：
1. 抓取新浪国际频道新闻列表。
2. 将中文时间转换为 datetime，详情页解析正文和图片。
3. 保持单一国际分类，后续可扩展新浪其他频道。
"""

import re
from datetime import datetime

import requests
from lxml import etree

from packages.collector.contracts import CollectorSource, HotItem


class SinaWorldSource:
    key = "sina_world"
    name = "新浪国际"
    url = "https://news.sina.com.cn/world/"
    headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    }

    def source(self) -> CollectorSource:
        return CollectorSource(
            key=self.key,
            name=self.name,
            categories=[{"key": self.url, "name": "国际新闻"}],
        )

    def fetch_list(self, category: str | None = None, limit: int = 20) -> list[HotItem]:
        response = requests.get(category or self.url, headers=self.headers, timeout=15)
        response.encoding = response.apparent_encoding
        html = etree.HTML(response.text)
        if html is None:
            return []
        items = []
        for node in html.xpath('//div[contains(@class, "news-item")]'):
            title_nodes = node.xpath(".//h2/a")
            time_nodes = node.xpath('.//div[contains(@class, "time")]/text()')
            if not title_nodes or not time_nodes:
                continue
            title = title_nodes[0].text.strip()
            url = title_nodes[0].get("href", "").strip()
            if not title or not url:
                continue
            items.append(
                HotItem(
                    source=self.key,
                    category=category or self.url,
                    title=title,
                    url=url,
                    published_at=self._parse_time(time_nodes[0].strip()),
                )
            )
            if len(items) >= limit:
                break
        return items

    def fetch_detail(self, item: HotItem) -> HotItem:
        response = requests.get(item.url, headers=self.headers, timeout=15)
        response.encoding = response.apparent_encoding
        html = etree.HTML(response.text)
        if html is None:
            return item
        nodes = html.xpath('//*[@id="article"]')
        if not nodes:
            return item
        article = nodes[0]
        text_parts = [
            text.strip()
            for text in article.xpath('.//p[not(@class="show_author")]/text()')
            if text.strip()
        ]
        images = []
        for src in article.xpath('.//div[@class="img_wrapper"]//img/@src'):
            image = src.strip()
            if image.startswith("//"):
                image = f"https:{image}"
            if image:
                images.append(image)
        content = "\n".join(text_parts).replace("\u3000", "").replace("\xa0", "")
        if content:
            item.content = content
            item.summary = content[:140]
        if images:
            item.images = images
        return item

    def _parse_time(self, value: str) -> datetime | None:
        match = re.match(r"(?P<month>\d{1,2})月(?P<day>\d{1,2})日\s+(?P<hour>\d{1,2}):(?P<minute>\d{2})", value)
        if not match:
            return None
        now = datetime.now()
        return datetime(
            year=now.year,
            month=int(match.group("month")),
            day=int(match.group("day")),
            hour=int(match.group("hour")),
            minute=int(match.group("minute")),
        )
