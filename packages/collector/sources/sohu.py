"""
实现逻辑：
1. 调用搜狐 Odin feed 接口获取频道热点。
2. 将相对时间转换为 datetime，并过滤图片集和视频条目。
3. 详情页解析正文和 imgsList 图片数据，统一输出 HotItem。
"""

import ast
import re
from datetime import datetime, timedelta

import requests
from lxml import etree

from packages.collector.contracts import CollectorSource, HotItem


class SohuSource:
    key = "sohu"
    name = "搜狐新闻"
    api_url = "https://odin.sohu.com/odin/api/blockdata"
    headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    }
    categories = [
        {"key": "438647_15", "name": "时政"},
        {"key": "1649_13", "name": "国际"},
        {"key": "54401_15", "name": "财经"},
        {"key": "55955_15", "name": "明星新闻"},
        {"key": "438682_15", "name": "综艺新闻"},
        {"key": "55968_15", "name": "影视音乐"},
        {"key": "55962_15", "name": "网红"},
        {"key": "659_13", "name": "幼儿教育"},
        {"key": "657_13", "name": "中小学"},
        {"key": "653_13", "name": "高考"},
        {"key": "656_13", "name": "高校"},
        {"key": "978_13", "name": "考研考公"},
        {"key": "979_13", "name": "教资法考"},
        {"key": "661_13", "name": "留学"},
        {"key": "977_13", "name": "学习资料"},
        {"key": "55103_15", "name": "时尚"},
        {"key": "55105_15", "name": "明星"},
        {"key": "57749_15", "name": "格调生活"},
        {"key": "55107_15", "name": "美容"},
        {"key": "54954_15", "name": "奢品"},
        {"key": "723_13", "name": "男士"},
        {"key": "1510_13", "name": "生活方式"},
        {"key": "667_13", "name": "通讯"},
        {"key": "672_13", "name": "数码"},
        {"key": "56306_15", "name": "手机"},
        {"key": "666_13", "name": "互联网"},
        {"key": "677_13", "name": "5G"},
        {"key": "676_13", "name": "智能硬件"},
        {"key": "1107_13", "name": "宇宙发现"},
        {"key": "53812_15", "name": "世界未解之谜"},
        {"key": "1108_13", "name": "科学发现"},
        {"key": "52796_15", "name": "物理帝国"},
        {"key": "52990_15", "name": "搜狐科学feed流"},
        {"key": "706_13", "name": "经济解码"},
        {"key": "707_13", "name": "股票"},
        {"key": "1351_13", "name": "基金"},
        {"key": "46857_15", "name": "IPO"},
        {"key": "52519_15", "name": "新赛道"},
        {"key": "7176_13", "name": "搜狐酒业"},
        {"key": "879_13", "name": "备孕指南"},
        {"key": "880_13", "name": "怀胎十月"},
        {"key": "881_13", "name": "生产必备"},
        {"key": "882_13", "name": "月子"},
        {"key": "883_13", "name": "新生儿"},
        {"key": "396_13", "name": "历史"},
        {"key": "2027_13", "name": "国内资讯"},
        {"key": "2028_13", "name": "国际资讯"},
        {"key": "2036_13", "name": "风云人物"},
        {"key": "2037_13", "name": "战争历史"},
        {"key": "275_13", "name": "军情纵横"},
        {"key": "2085_13", "name": "网红餐厅"},
        {"key": "2099_13", "name": "行业聚焦"},
        {"key": "2100_13", "name": "餐饮界"},
        {"key": "474_13", "name": "休闲食品"},
        {"key": "455_13", "name": "流行餐单"},
        {"key": "419_13", "name": "读书"},
        {"key": "420_13", "name": "人物"},
        {"key": "423_13", "name": "收藏"},
        {"key": "422_13", "name": "影视"},
        {"key": "421_13", "name": "艺术"},
        {"key": "43827_15", "name": "运势"},
        {"key": "46018_15", "name": "情感"},
        {"key": "53716_15", "name": "性格解读"},
        {"key": "53710_15", "name": "生肖风水"},
        {"key": "53709_15", "name": "心理测试"},
        {"key": "57629_15", "name": "电竞"},
        {"key": "56214_15", "name": "手游"},
        {"key": "56215_15", "name": "单机"},
        {"key": "56216_15", "name": "网游"},
        {"key": "56217_15", "name": "攻略"},
        {"key": "56211_15", "name": "赛事追踪"},
        {"key": "56212_15", "name": "职业选手"},
        {"key": "56213_15", "name": "赛圈八卦"},
        {"key": "51219_15", "name": "搞笑feed流"},
        {"key": "51228_15", "name": "搞笑美女"},
        {"key": "947_13", "name": "国漫推荐"},
        {"key": "948_13", "name": "日漫推荐"},
        {"key": "949_13", "name": "美漫推荐"},
        {"key": "303_13", "name": "养宠经验"},
        {"key": "304_13", "name": "喵星人"},
        {"key": "305_13", "name": "汪星人"},
    ]

    def source(self) -> CollectorSource:
        return CollectorSource(key=self.key, name=self.name, categories=self.categories)

    def fetch_list(self, category: str = "438647_15", limit: int = 20) -> list[HotItem]:
        product_id, product_type = category.split("_")
        payload = {
            "mainContent": {
                "productType": "13",
                "productId": "1524",
                "secureScore": "50",
                "categoryId": "47",
            },
            "resourceList": [
                {
                    "tplCompKey": "TPLFeedMul_2_9_feedData",
                    "isServerRender": False,
                    "isSingleAd": False,
                    "configSource": "mp",
                    "content": {
                        "productId": product_id,
                        "productType": product_type,
                        "size": limit,
                        "pro": "0,1",
                        "feedType": "XTOPIC_LATEST",
                        "view": "feedMode",
                        "innerTag": "channel",
                        "spm": "smpc.channel_114.block3_77_O0F7zf_1_fd",
                        "page": 1,
                        "requestId": "aimedia-agent",
                    },
                }
            ],
        }
        response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=15)
        entries = response.json().get("data", {}).get("TPLFeedMul_2_9_feedData", {}).get("list", [])
        items: list[HotItem] = []
        for entry in entries:
            if entry.get("icon") in {"images", "video"}:
                continue
            title = entry.get("title", "").strip()
            path = entry.get("url", "")
            if not title or not path:
                continue
            cover = entry.get("cover", [""])[0] if entry.get("cover") else ""
            if cover.startswith("//"):
                cover = f"https:{cover}"
            time_text = entry.get("extraInfoList", [{}, {"text": ""}])[1].get("text", "")
            items.append(
                HotItem(
                    source=self.key,
                    category=category,
                    title=title,
                    url=f"https://www.sohu.com{path}",
                    published_at=self._parse_relative_time(time_text),
                    images=[cover] if cover else [],
                    raw={"time_text": time_text},
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

        article_nodes = html.xpath('//article[@id="mp-editor"]')
        if not article_nodes:
            return item
        article = article_nodes[0]
        for node in article.xpath('.//a[@id="backsohucom"]'):
            node.getparent().remove(node)

        text_parts = [
            p.xpath("string(.)").strip()
            for p in article.xpath('.//p[not(contains(., "责任编辑"))]')
            if p.xpath("string(.)").strip()
        ]
        images = self._parse_images(response.text)
        content = "\n".join(text_parts)
        if content:
            item.content = content
            item.summary = content[:140]
        if images:
            item.images = images
        return item

    def _parse_images(self, html_text: str) -> list[str]:
        match = re.search(r"imgsList:\s*(\[[^\]]+\])", html_text, re.DOTALL)
        if not match:
            return []
        try:
            raw_images = ast.literal_eval(match.group(1))
        except Exception:
            return []
        images = []
        for raw in raw_images:
            url = raw.get("url", "")
            if url.startswith("//"):
                url = f"https:{url}"
            if url:
                images.append(url)
        return images

    def _parse_relative_time(self, value: str) -> datetime | None:
        now = datetime.now()
        if match := re.match(r"(\d+)秒前", value):
            return now - timedelta(seconds=int(match.group(1)))
        if match := re.match(r"(\d+)分钟前", value):
            return now - timedelta(minutes=int(match.group(1)))
        if match := re.match(r"(\d+)小时前", value):
            return now - timedelta(hours=int(match.group(1)))
        if match := re.match(r"昨天(\d{2}):(\d{2})", value):
            return (now - timedelta(days=1)).replace(hour=int(match.group(1)), minute=int(match.group(2)), second=0, microsecond=0)
        if match := re.match(r"前天(\d{2}):(\d{2})", value):
            return (now - timedelta(days=2)).replace(hour=int(match.group(1)), minute=int(match.group(2)), second=0, microsecond=0)
        if match := re.match(r"(\d+)天前", value):
            return now - timedelta(days=int(match.group(1)))
        return None
