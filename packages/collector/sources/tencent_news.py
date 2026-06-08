"""
实现逻辑：
1. 调用腾讯新闻 PC feed 接口获取频道列表。
2. 将 feed 数据转换为统一 HotItem，详情页解析正文和图片。
3. 接口异常时返回空列表，避免单个源影响采集页。
"""

import json
import re
from datetime import datetime

import requests
from lxml import etree

from packages.collector.contracts import CollectorSource, HotItem


class TencentNewsSource:
    key = "tencent_news"
    name = "腾讯新闻"
    api_url = "https://i.news.qq.com/web_feed/getPCList"
    headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    }
    categories = [
        {"key": "news_news_finance", "name": "经济"},
        {"key": "news_news_tech", "name": "科技"},
        {"key": "news_news_ent", "name": "娱乐"},
        {"key": "news_news_world", "name": "国际"},
        {"key": "news_news_mil", "name": "军事"},
        {"key": "news_news_game", "name": "游戏"},
        {"key": "news_news_auto", "name": "汽车"},
        {"key": "news_news_house", "name": "房地产"},
        {"key": "news_news_antip", "name": "健康"},
        {"key": "news_news_edu", "name": "教育"},
        {"key": "news_news_history", "name": "文化"},
        {"key": "news_news_baby", "name": "生活"},
    ]

    def source(self) -> CollectorSource:
        return CollectorSource(key=self.key, name=self.name, categories=self.categories)

    def fetch_list(self, category: str = "news_news_finance", limit: int = 20) -> list[HotItem]:
        payload = {
            "base_req": {"from": "pc"},
            "forward": "2",
            "qimei36": "0_C47K1MESdC7T6",
            "device_id": "0_C47K1MESdC7T6",
            "flush_num": 1,
            "channel_id": category,
            "item_count": limit,
            "is_local_chlid": "0",
        }
        response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=15)
        entries = response.json().get("data", [])
        items: list[HotItem] = []
        for entry in entries:
            if entry.get("sub_item"):
                continue
            title = entry.get("title", "").strip()
            article_id = entry.get("id", "")
            if not title or not article_id:
                continue
            images = normalize_images(entry.get("pic_info", {}).get("big_img", ""))
            items.append(
                HotItem(
                    source=self.key,
                    category=category,
                    title=title,
                    url=f"https://news.qq.com/rain/a/{article_id}",
                    published_at=self._parse_time(entry.get("publish_time", "")),
                    images=images,
                    raw={"id": article_id},
                )
            )
            if len(items) >= limit:
                break
        return items

    def fetch_detail(self, item: HotItem) -> HotItem:
        response = requests.get(item.url, headers=self.headers, timeout=15)
        html = etree.HTML(response.text)
        if html is None:
            return item
        nodes = html.xpath('//*[@id="article-content"]//p')
        text_parts = []
        images = []
        for node in nodes:
            text_parts.extend([text.strip() for text in node.xpath(".//text()") if text.strip()])
            images.extend([src.strip() for src in node.xpath(".//img/@src") if src.strip()])
        content = "\n".join(text_parts)
        if not content:
            content = self._parse_meta_description(response.text)
        if content:
            item.content = content
            item.summary = content[:140]
        if images:
            item.images = list(dict.fromkeys(images))
        return item

    def _parse_time(self, value: str) -> datetime | None:
        try:
            return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None

    def _parse_meta_description(self, html_text: str) -> str:
        match = re.search(r"window\.DATA\s*=\s*(\{.*?\});", html_text, re.S)
        if match:
            try:
                return json.loads(match.group(1)).get("desc", "")
            except json.JSONDecodeError:
                pass
        meta = re.search(r'<meta name="description" content="([^"]+)"', html_text)
        return meta.group(1) if meta else ""


def normalize_images(value: str | list[str] | list[list[str]]) -> list[str]:
    if isinstance(value, str):
        return [value] if value else []
    images: list[str] = []
    for item in value:
        if isinstance(item, str) and item:
            images.append(item)
        elif isinstance(item, list):
            images.extend([url for url in item if isinstance(url, str) and url])
    return list(dict.fromkeys(images))
