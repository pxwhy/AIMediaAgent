"""
实现逻辑：
1. 调用腾讯体育 feed 接口聚合体育热点。
2. 详情接口返回结构化内容，区分文字段落和图片 URL。
3. 将体育热点统一输出为 HotItem。
"""

import json
import re
from datetime import datetime

import requests

from packages.collector.contracts import CollectorSource, HotItem


class TencentSportsSource:
    key = "tencent_sports"
    name = "腾讯体育"
    headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    }
    scenes = ["pc_208", "pc_100000", "pc_100000"]

    def source(self) -> CollectorSource:
        return CollectorSource(
            key=self.key,
            name=self.name,
            categories=[{"key": "hot", "name": "体育热点"}],
        )

    def fetch_list(self, category: str = "hot", limit: int = 20) -> list[HotItem]:
        data = []
        seen_ids = set()
        for scene in self.scenes:
            page_id, type_key = self._scene_config(scene)
            response = requests.get(
                "https://matchweb.sports.qq.com/feeds/areaInfo",
                params={"sceneFlag": scene},
                headers=self.headers,
                timeout=15,
            )
            for item in response.json().get("data", {}).get("topItem", []):
                if item.get("id") != page_id:
                    continue
                for entry in item.get(type_key, {}).get("list", []):
                    title = entry.get("title", "").strip()
                    article_id = entry.get("id", "")
                    if not title or not article_id:
                        continue
                    if article_id in seen_ids:
                        continue
                    seen_ids.add(article_id)
                    data.append(
                        HotItem(
                            source=self.key,
                            category=category,
                            title=title,
                            url=f"https://shequweb.sports.qq.com/reply/listCite?tid={article_id}&page=1",
                            published_at=datetime.fromtimestamp(int(entry.get("createTime", 0))),
                            images=[entry.get("pic")] if entry.get("pic") else [],
                            raw={"id": article_id},
                        )
                    )
        data.sort(key=lambda item: item.published_at or datetime.min, reverse=True)
        return data[:limit]

    def fetch_detail(self, item: HotItem) -> HotItem:
        article_id = item.raw.get("id") or item.url.split("tid=")[-1].split("&")[0]
        response = requests.get(
            "https://shequweb.sports.qq.com/reply/listCite",
            params={"tid": article_id, "page": "1"},
            headers=self.headers,
            timeout=15,
        )
        data = self._parse_response(response.text)
        content = data.get("data", {}).get("topic", {}).get("content", [])
        text_parts = []
        images = []
        for piece in content:
            value = piece.get("info", "")
            if "https://sports3.gtimg.com/community" in value:
                images.append(value)
            elif value:
                text_parts.append(value)
        body = "\n".join(text_parts)
        if body and "不得转载" not in body:
            item.content = body
            item.summary = body[:140]
        if images:
            item.images = list(dict.fromkeys(images))
        return item

    def _scene_config(self, scene: str) -> tuple[str, str]:
        if scene == "pc_100008":
            return "pc_100008_1502_0_88674", "type1502"
        if scene == "pc_100000":
            return "pc_100000_1507_0_88605", "type1507"
        return "pc_208_1502_0_88675", "type1502"

    def _parse_response(self, text: str) -> dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\(({.*})\)", text)
            return json.loads(match.group(1)) if match else {}
