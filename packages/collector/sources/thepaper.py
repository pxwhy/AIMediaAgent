"""
实现逻辑：
1. 调用澎湃新闻节点接口获取热点列表。
2. 将澎湃返回的标题、链接、发布时间和图片转成 HotItem。
3. 详情页解析正文和图片，解析失败时保留列表预览数据。
"""

import time
from datetime import datetime
from urllib.parse import quote

import requests
from lxml import etree

from packages.collector.contracts import CollectorSource, HotItem


class ThePaperSource:
    key = "thepaper"
    name = "澎湃新闻"
    api_url = "https://api.thepaper.cn/contentapi/nodeCont/getByNodeIdPortal"
    headers = {
        "accept": "application/json",
        "client-type": "1",
        "content-type": "application/json",
        "origin": "https://www.thepaper.cn",
        "referer": "https://www.thepaper.cn/",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    }
    categories = [
        {"key": "25462", "name": "中国政库"},
        {"key": "25489", "name": "舆论场"},
        {"key": "25490", "name": "打虎记"},
        {"key": "25423", "name": "人事风向"},
        {"key": "25426", "name": "法治中国"},
        {"key": "25424", "name": "一号专案"},
        {"key": "25463", "name": "港台来信"},
        {"key": "25491", "name": "长三角政商"},
        {"key": "25428", "name": "直击现场"},
        {"key": "68750", "name": "公益湃"},
        {"key": "25464", "name": "澎湃质量观"},
        {"key": "25425", "name": "绿政公署"},
        {"key": "137534", "name": "国防聚焦"},
        {"key": "25427", "name": "澎湃人物"},
        {"key": "143036", "name": "画外"},
        {"key": "25422", "name": "浦江头条"},
        {"key": "127425", "name": "上海大调研"},
        {"key": "25487", "name": "教育家"},
        {"key": "25634", "name": "全景现场"},
        {"key": "25635", "name": "美数课"},
        {"key": "138033", "name": "对齐Lab"},
        {"key": "25600", "name": "快看"},
        {"key": "25429", "name": "全球速报"},
        {"key": "122903", "name": "澎湃世界观"},
        {"key": "122904", "name": "澎湃明查"},
        {"key": "25430", "name": "澎湃防务"},
        {"key": "25481", "name": "外交学人"},
        {"key": "25678", "name": "唐人街"},
        {"key": "122905", "name": "大国外交"},
        {"key": "122906", "name": "World全知道"},
        {"key": "122907", "name": "寰宇开放麦"},
        {"key": "25434", "name": "10%公司"},
        {"key": "25436", "name": "能见度"},
        {"key": "25433", "name": "地产界"},
        {"key": "25438", "name": "财经上下游"},
        {"key": "124129", "name": "区域经纬"},
        {"key": "25435", "name": "金改实验室"},
        {"key": "25437", "name": "牛市点线面"},
        {"key": "119963", "name": "IPO最前线"},
        {"key": "25485", "name": "澎湃商学院"},
        {"key": "25432", "name": "自贸区连线"},
        {"key": "145902", "name": "新引擎"},
        {"key": "37978", "name": "进博会在线"},
        {"key": "27234", "name": "科学湃"},
        {"key": "119445", "name": "生命科学"},
        {"key": "119447", "name": "未来2%"},
        {"key": "119446", "name": "元宇宙观察"},
        {"key": "119448", "name": "科创101"},
        {"key": "119449", "name": "科学城邦"},
        {"key": "25445", "name": "澎湃研究所"},
        {"key": "25446", "name": "全球智库"},
        {"key": "26915", "name": "城市漫步"},
        {"key": "25456", "name": "市政厅"},
        {"key": "104191", "name": "世界会客厅"},
        {"key": "25444", "name": "社论"},
        {"key": "27224", "name": "澎湃评论"},
        {"key": "26525", "name": "思想湃"},
        {"key": "26878", "name": "上海书评"},
        {"key": "25483", "name": "思想市场"},
        {"key": "25457", "name": "私家历史"},
        {"key": "135619", "name": "上海文艺"},
        {"key": "25574", "name": "翻书党"},
        {"key": "25455", "name": "艺术评论"},
        {"key": "26937", "name": "古代艺术"},
        {"key": "25450", "name": "文化课"},
        {"key": "25482", "name": "逝者"},
        {"key": "25536", "name": "专栏"},
        {"key": "26506", "name": "异次元"},
        {"key": "97313", "name": "海平面"},
        {"key": "103076", "name": "一问三知"},
        {"key": "25448", "name": "有戏"},
        {"key": "26609", "name": "文艺范"},
        {"key": "25942", "name": "身体"},
        {"key": "26015", "name": "私·奔"},
        {"key": "25599", "name": "运动家"},
        {"key": "80623", "name": "非常品"},
        {"key": "26862", "name": "城势"},
        {"key": "25769", "name": "生活方式"},
        {"key": "25990", "name": "澎湃联播"},
        {"key": "26173", "name": "视界"},
        {"key": "26202", "name": "亲子学堂"},
        {"key": "26404", "name": "赢家"},
        {"key": "26490", "name": "汽车圈"},
        {"key": "115327", "name": "IP SH"},
        {"key": "117340", "name": "酒业"},
    ]

    def source(self) -> CollectorSource:
        return CollectorSource(key=self.key, name=self.name, categories=self.categories)

    def fetch_list(self, category: str = "25462", limit: int = 20) -> list[HotItem]:
        payload = {
            "nodeId": category,
            "excludeContIds": [],
            "pageSize": limit,
            "startTime": int(time.time() * 1000),
            "pageNum": 1,
        }
        response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=15)
        data = response.json().get("data", {}).get("list", [])
        items: list[HotItem] = []
        for entry in data:
            if entry.get("link"):
                continue
            title = entry.get("name", "").strip()
            cont_id = entry.get("contId")
            if not title or not cont_id:
                continue
            published_at = datetime.fromtimestamp(entry.get("pubTimeLong", 0) / 1000)
            url = f"https://www.thepaper.cn/newsDetail_forward_{quote(str(cont_id))}"
            images = [entry.get("pic")] if entry.get("pic") else []
            items.append(
                HotItem(
                    source=self.key,
                    category=category,
                    title=title,
                    url=url,
                    published_at=published_at,
                    images=images,
                    raw={"contId": cont_id},
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

        text_parts = clean_text_parts(html.xpath('//*[@id="__next"]//main//p//text()'))
        images = [
            src.strip()
            for src in html.xpath('//*[@id="__next"]//main//img/@src')
            if src.strip()
        ]
        content = "\n".join(text_parts)
        if content:
            item.content = content
            item.summary = content[:140]
        if images:
            item.images = list(dict.fromkeys(images))
        return item


def clean_text_parts(values: list[str]) -> list[str]:
    noise = {"登录", "注册", "下载客户端", "澎湃新闻", "分享"}
    return [value.strip() for value in values if value.strip() and value.strip() not in noise]
