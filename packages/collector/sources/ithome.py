"""
实现逻辑：
1. 使用轻量 HTTP 请求抓取 IT之家首页热点。
2. 将列表和详情转换为统一 HotItem，不依赖旧 PySide 组件。
3. 解析失败时返回有限结果，避免采集页因为单条内容异常而不可用。
"""

import re
from datetime import datetime
from urllib.parse import urljoin

import requests
from lxml import etree

from packages.collector.contracts import CollectorSource, HotItem


class ITHomeSource:
    key = "ithome"
    name = "IT之家"
    home_url = "https://www.ithome.com/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
        )
    }

    def source(self) -> CollectorSource:
        return CollectorSource(
            key=self.key,
            name=self.name,
            categories=[{"key": "home", "name": "首页热点"}],
        )

    def fetch_list(self, category: str = "home", limit: int = 20) -> list[HotItem]:
        response = requests.get(self.home_url, headers=self.headers, timeout=12)
        response.encoding = response.apparent_encoding
        html = etree.HTML(response.text)
        if html is None:
            return []

        items: list[HotItem] = []
        for node in html.xpath('//*[@id="nnews"]/div[3]/ul/li'):
            title_nodes = node.xpath(".//a")
            if not title_nodes:
                continue

            title = "".join(title_nodes[0].xpath(".//text()")).strip()
            href = title_nodes[0].get("href") or ""
            time_text = "".join(node.xpath("./b//text()")).strip()
            published_at = self._parse_time(time_text)
            url = urljoin(self.home_url, href.strip())
            if not title or not url:
                continue

            items.append(
                HotItem(
                    source=self.key,
                    category=category,
                    title=title,
                    url=url,
                    published_at=published_at,
                    raw={"list_time": time_text},
                )
            )
            if len(items) >= limit:
                break
        return items

    def fetch_detail(self, item: HotItem) -> HotItem:
        response = requests.get(item.url, headers=self.headers, timeout=12)
        response.encoding = response.apparent_encoding
        html = etree.HTML(response.text)
        if html is None:
            return item

        content_nodes = html.xpath('//*[@id="paragraph"]')
        if not content_nodes:
            return item

        content_node = content_nodes[0]
        text_parts = [
            text.strip()
            for text in content_node.xpath('.//p[not(@class="ad-tips")]//text()')
            if text.strip()
        ]
        images = []
        for src in content_node.xpath('.//p[not(@class="ad-tips")]//img/@data-original | .//p[not(@class="ad-tips")]//img/@src'):
            image_url = src.strip()
            if image_url.startswith("//"):
                image_url = f"https:{image_url}"
            elif image_url.startswith("/"):
                image_url = urljoin(item.url, image_url)
            if image_url and image_url not in images:
                images.append(image_url)

        content = "\n".join(text_parts).replace("\u3000", "").replace("\xa0", "")
        item.content = content
        item.summary = content[:140]
        item.images = images
        return item

    def _parse_time(self, value: str) -> datetime | None:
        normalized = re.sub(r"\s+", "", value.strip())
        match = re.match(r"^(\d{1,2})[:：](\d{1,2})$", normalized)
        if not match:
            return None

        now = datetime.now()
        try:
            return now.replace(
                hour=int(match.group(1)),
                minute=int(match.group(2)),
                second=0,
                microsecond=0,
            )
        except ValueError:
            return None
