"""
实现逻辑：
1. 读取网易新闻各频道 JS callback 数据。
2. 将列表数据转换为 HotItem，并过滤视频内容。
3. 详情页解析正文和图片，避免转载限制内容进入素材库。
"""

import json
import re
from datetime import datetime

import requests
from lxml import etree

from packages.collector.contracts import CollectorSource, HotItem


class NeteaseSource:
    key = "netease"
    name = "网易新闻"
    headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    }
    categories = [
        {"key": "https://news.163.com/special/cm_yaowen20200213/?callback=data_callback", "name": "时事热点"},
        {"key": "https://news.163.com/special/cm_war/?callback=data_callback", "name": "军事"},
        {"key": "https://news.163.com/special/cm_guonei/?callback=data_callback", "name": "社会"},
        {"key": "https://tech.163.com/special/00097UHL/tech_datalist.js?callback=data_callback", "name": "科技"},
        {"key": "https://ent.163.com/special/000381Q1/newsdata_movieidx.js?callback=data_callback", "name": "娱乐"},
        {"key": "https://money.163.com/special/00259K2L/data_stock_redian.js?callback=data_callback", "name": "经济"},
        {"key": "https://edu.163.com/special/002987KB/newsdata_edu_hot.js?callback=data_callback", "name": "教育"},
        {"key": "https://baby.163.com/special/003687OS/newsdata_hot.js?callback=data_callback", "name": "生活"},
    ]

    def source(self) -> CollectorSource:
        return CollectorSource(key=self.key, name=self.name, categories=self.categories)

    def fetch_list(self, category: str | None = None, limit: int = 20) -> list[HotItem]:
        url = category or self.categories[0]["key"]
        response = requests.get(url, headers=self.headers, timeout=15)
        data = self._parse_callback(response.text)
        items: list[HotItem] = []
        for entry in data[:limit]:
            article_url = entry.get("docurl", "")
            if "video" in article_url:
                continue
            title = entry.get("title", "").strip()
            if not title or not article_url:
                continue
            published_at = self._parse_time(entry.get("time", ""))
            images = [entry.get("imgurl")] if entry.get("imgurl") else []
            items.append(
                HotItem(
                    source=self.key,
                    category=url,
                    title=title,
                    url=article_url,
                    published_at=published_at,
                    images=images,
                    raw={"time": entry.get("time", "")},
                )
            )
        return items

    def fetch_detail(self, item: HotItem) -> HotItem:
        response = requests.get(item.url, headers=self.headers, timeout=15)
        html = etree.HTML(response.text)
        if html is None:
            return item

        text_parts = clean_text_parts(html.xpath('//*[@id="content"]//p//text()'))
        content = "\n".join(text_parts)
        if "不得转载" in content:
            return item
        images = [
            src.strip()
            for src in html.xpath('//*[@id="content"]//p//img/@src')
            if src.strip()
        ]
        if content:
            item.content = content
            item.summary = content[:140]
        if images:
            item.images = list(dict.fromkeys(images))
        return item

    def _parse_callback(self, text: str) -> list[dict]:
        cleaned = text.strip()
        cleaned = re.sub(r"^data_callback\(", "", cleaned)
        cleaned = cleaned.rstrip("); \n")
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return json.loads(cleaned.rstrip(",\n ]").strip() + "]")

    def _parse_time(self, value: str) -> datetime | None:
        try:
            return datetime.strptime(value, "%m/%d/%Y %H:%M:%S")
        except ValueError:
            return None


def clean_text_parts(values: list[str]) -> list[str]:
    noise = {"用微信扫码二维码", "分享至好友和朋友圈", "打开微信，点击底部的“发现”，"}
    return [value.strip() for value in values if value.strip() and value.strip() not in noise]
